// Self-play equilibrium solving. Spec: docs/design/34_ai_equilibrium.md
// These pin the properties the calibration environment must keep as the game changes,
// not the numbers a particular solve produced.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, RULES, span} from '../dist/engine.js';
import {createRngSet} from '../dist/rng.js';
import {samplePlans, enumeratePlans, neighbours, normalisePlan, isLegalPlan, planKey} from '../dist/plan-space.js';
import {duel, payoffMatrix, fictitiousPlay, exploitability, expectedValue, deviateMixture, supportOf, doubleOracle, clearDuelCache} from '../dist/equilibrium.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const MIRROR = { base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 60])) };
const OPTIONS = { stats: MIRROR, seeds: [1], profile: 'pressure' };
const rng = () => createRngSet(4242, definitions).stream('combat');

test('sampled plans always fit the timeline', () => {
  for (const plan of samplePlans(rng(), 300)) {
    assert.ok(isLegalPlan(plan), `불법 계획: ${plan.join('+')}`);
    assert.ok(span(plan) <= RULES.slots, `${span(plan)}칸: ${plan.join('+')}`);
    assert.ok(plan.length > 0);
  }
});

test('enumerated plans are legal, unique and bounded', () => {
  const plans = enumeratePlans({ maxCards: 2, limit: 500 });
  const keys = new Set(plans.map(planKey));
  assert.equal(keys.size, plans.length, '중복 계획이 있습니다');
  for (const plan of plans) assert.ok(span(plan) <= RULES.slots);
});

test('trailing rests do not create a different plan', () => {
  assert.deepEqual(normalisePlan(['jab', 'rest', 'rest']), ['jab']);
  assert.equal(planKey(normalisePlan(['jab', 'rest'])), planKey(['jab']));
});

test('neighbours stay legal and differ from the original', () => {
  const base = ['jab', 'cross', 'sway'];
  const out = neighbours(base, { limit: 120 });
  assert.ok(out.length > 0);
  for (const plan of out) {
    assert.ok(isLegalPlan(plan), plan.join('+'));
    assert.ok(planKey(plan) !== planKey(base) || plan.length !== base.length);
  }
});

test('the payoff matrix is antisymmetric, which is what makes the game zero-sum', () => {
  clearDuelCache();
  const pool = samplePlans(rng(), 8);
  const matrix = payoffMatrix(pool, OPTIONS);
  for (let i = 0; i < pool.length; i++) {
    assert.equal(matrix[i][i], 0, '자기 자신과의 대결이 0이 아닙니다');
    for (let j = 0; j < pool.length; j++) {
      assert.ok(Math.abs(matrix[i][j] + matrix[j][i]) < 1e-9, `반대칭 위반: ${i},${j}`);
    }
  }
});

test('a duel is deterministic and mirrors when the plans swap', () => {
  clearDuelCache();
  const a = ['jab', 'cross'], b = ['shell', 'hook'];
  const first = duel(a, b, OPTIONS);
  clearDuelCache();
  assert.equal(duel(a, b, OPTIONS), first, '같은 입력이 다른 결과를 냈습니다');
  clearDuelCache();
  assert.equal(duel(b, a, OPTIONS), -first, '계획을 바꾸면 부호가 뒤집혀야 합니다');
});

test('identical plans draw: a mirror match has no strategic edge', () => {
  clearDuelCache();
  assert.equal(duel(['jab', 'cross'], ['jab', 'cross'], OPTIONS), 0);
});

test('the equilibrium value of a symmetric zero-sum game is zero', () => {
  // Not a balance target but a correctness check: drift means the payoff stopped being
  // antisymmetric, which would mean combat gained a left/right asymmetry.
  clearDuelCache();
  const matrix = payoffMatrix(samplePlans(rng(), 12), OPTIONS);
  const solution = fictitiousPlay(matrix, { iterations: 2000 });
  assert.ok(Math.abs(solution.value) < 0.05, `게임 값이 0이 아닙니다: ${solution.value}`);
});

test('fictitious play returns a probability distribution', () => {
  clearDuelCache();
  const matrix = payoffMatrix(samplePlans(rng(), 10), OPTIONS);
  const { strategy } = fictitiousPlay(matrix, { iterations: 500 });
  const total = strategy.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `합이 1이 아닙니다: ${total}`);
  for (const p of strategy) assert.ok(p >= 0);
});

test('the equilibrium is less exploitable than a single fixed plan', () => {
  // This is the whole premise: a mixture must beat any one plan played every time.
  clearDuelCache();
  const pool = samplePlans(rng(), 14);
  const matrix = payoffMatrix(pool, OPTIONS);
  const { strategy } = fictitiousPlay(matrix, { iterations: 2000 });
  const mixed = exploitability(matrix, strategy);
  let worstPure = -Infinity;
  for (let j = 0; j < pool.length; j++) {
    const pure = new Array(pool.length).fill(0);
    pure[j] = 1;
    worstPure = Math.max(worstPure, exploitability(matrix, pure));
  }
  assert.ok(mixed < worstPure, `혼합전략이 고정 계획보다 나을 게 없습니다: ${mixed} vs ${worstPure}`);
});

test('deviating from equilibrium raises exploitability, which is the difficulty dial', () => {
  clearDuelCache();
  const pool = samplePlans(rng(), 14);
  const matrix = payoffMatrix(pool, OPTIONS);
  const { strategy } = fictitiousPlay(matrix, { iterations: 2000 });
  const values = [0, 0.25, 0.6, 0.95].map(d => exploitability(matrix, deviateMixture(strategy, d)));
  for (let i = 1; i < values.length; i++) {
    assert.ok(values[i] >= values[i - 1] - 1e-9, `이탈이 커졌는데 더 어려워졌습니다: ${values.join(' -> ')}`);
  }
  assert.ok(values.at(-1) > values[0], '이탈이 난이도를 전혀 바꾸지 않습니다');
});

test('a deviated mixture is still a probability distribution', () => {
  const strategy = [0.5, 0.3, 0.2];
  for (const d of [0, 0.3, 1]) {
    const mixed = deviateMixture(strategy, d);
    const total = mixed.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `${d}: 합 ${total}`);
  }
});

test('double oracle widens the support rather than cycling among three plans', () => {
  // The game is strongly cyclic: adding only the single best response leaves a tiny support
  // that any one plan beats outright. Growth per round is what makes it converge.
  clearDuelCache();
  const stream = rng();
  const result = doubleOracle(samplePlans(stream, 12), stream, {
    rounds: 3, candidatesPerRound: 60, addPerRound: 5, options: OPTIONS
  });
  assert.ok(result.pool.length > 12, '풀이 자라지 않았습니다');
  assert.ok(result.history.length > 0);
  const support = supportOf(result.pool, result.solution.strategy);
  assert.ok(support.length >= 2, `지지집합이 단일 계획입니다: ${support.length}`);
  assert.ok(Math.abs(result.solution.value) < 0.05);
});

test('expected value agrees with the matrix it was computed from', () => {
  const matrix = [new Float64Array([0, 1, -1]), new Float64Array([-1, 0, 1]), new Float64Array([1, -1, 0])];
  const even = [1 / 3, 1 / 3, 1 / 3];
  assert.ok(Math.abs(expectedValue(matrix, even, even)) < 1e-9, '가위바위보 균형값은 0입니다');
  assert.ok(Math.abs(exploitability(matrix, even)) < 1e-9, '가위바위보 균형은 착취 불가입니다');
  assert.ok(exploitability(matrix, [1, 0, 0]) > 0.9, '고정 선택은 완전히 착취 가능해야 합니다');
});

test('a solved mixture replaces the fixed patterns and stays reproducible', async () => {
  const {configureStrategies, activeStrategy, newMatch, opponentPlan} = await import('../dist/engine.js');
  const document = {
    tiers: {
      brutal: { deviation: 0, mixture: [
        { plan: ['jab', 'cross'], weight: 0.5 },
        { plan: ['shell', 'hook'], weight: 0.5 }
      ] }
    }
  };
  assert.equal(activeStrategy(), null, '초기에는 고정 패턴을 씁니다');
  configureStrategies(document, 'brutal');
  assert.equal(activeStrategy().size, 2);
  const plans = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const match = newMatch('pressure', seed, { player: MIRROR, opponent: MIRROR });
    const plan = opponentPlan(match);
    plans.add(plan.map(p => p.id).join('>'));
    assert.deepEqual(opponentPlan(match), plan, '같은 상태가 다른 계획을 냈습니다');
  }
  assert.ok(plans.size > 1, '혼합전략인데 항상 같은 계획만 나옵니다');
  configureStrategies(null);
  assert.equal(activeStrategy(), null);
});

test('a strategy referencing a deleted card is refused at load time', async () => {
  const {configureStrategies} = await import('../dist/engine.js');
  assert.throws(() => configureStrategies({ tiers: { brutal: { mixture: [{ plan: ['telekinesis'], weight: 1 }] } } }, 'brutal'), /사라진 카드/);
  assert.throws(() => configureStrategies({ tiers: {} }, 'brutal'), /등급이 없습니다/);
  configureStrategies(null);
});
