// Reactive policies and policy-level equilibrium solving.
// Spec: docs/design/34_ai_equilibrium.md
//
// Solving over fixed plans cannot value a card that exists to answer a read. These tests pin
// the properties the policy layer must keep: it decides per turn, it never sees the plan the
// opponent has committed to this turn, and it stays deterministic.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, RULES, span, newMatch} from '../dist/engine.js';
import {createRngSet} from '../dist/rng.js';
import {ROLES, CONDITIONS, roleNames, observableView, choosePlan, firingRule, policyKey,
  describePolicy, samplePolicies, policyNeighbours, validateRole, thresholdsFor} from '../dist/policy.js';
import {duelPolicies, playPolicies, cardUsage, conditionBaseRates, grammarUsage, payoffMatrix,
  fictitiousPlay, doubleOracle, supportOf, exploitability, clearPolicyDuelCache, POLICY_SPACE} from '../dist/equilibrium.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const MIRROR = { base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 60])) };
const OPTIONS = { stats: MIRROR, seeds: [1, 2], profile: 'pressure' };
const rng = () => createRngSet(4242, definitions).stream('combat');
const constant = role => ({ rules: [], fallback: role });

test('every role is a legal combo and every playable card belongs to one', () => {
  for (const [name, plan] of Object.entries(ROLES)) {
    validateRole(plan);
    assert.ok(span(plan) <= RULES.slots, `${name}이 ${RULES.slots}칸을 넘습니다`);
  }
  // A card no role can express is unreachable by any policy, and would read as dead content
  // for a reason that has nothing to do with balance.
  const covered = new Set(Object.values(ROLES).flat());
  const missing = Object.keys(CARDS).filter(id => !covered.has(id));
  assert.deepEqual(missing, [], `어떤 역할에도 없는 카드: ${missing.join(', ')}`);
});

test('a policy never sees the plan the opponent committed to this turn', () => {
  const match = newMatch('pressure', 3, { player: MIRROR, opponent: MIRROR });
  const view = observableView(match, 0, []);
  for (const key of Object.keys(view)) assert.ok(!/current|committed|enemyPlan/i.test(key));
  assert.equal(view.opponentLastPlan, null, '첫 턴부터 상대 계획이 보입니다');
  assert.ok(!JSON.stringify(view).includes('plans'));
  // The view is built from the pre-resolution snapshot only, so it is a pure function of
  // state the opponent has already revealed.
  assert.equal(JSON.stringify(observableView(match, 0, [])), JSON.stringify(observableView(match, 0, [])));
});

test('the view reports past combos, and repetition needs two of them', () => {
  const match = newMatch('pressure', 3, { player: MIRROR, opponent: MIRROR });
  assert.equal(observableView(match, 0, [['jab']]).opponentRepeatedOpening, false,
    '한 번 본 것으로 반복이라고 판단합니다');
  assert.equal(observableView(match, 0, [['jab'], ['jab', 'cross']]).opponentRepeatedOpening, true);
  assert.equal(observableView(match, 0, [['jab'], ['hook']]).opponentRepeatedOpening, false);
  assert.deepEqual(observableView(match, 0, [['jab'], ['hook']]).opponentLastPlan, ['hook']);
});

test('rules fire in declared order and the fallback catches the rest', () => {
  const policy = { rules: [{ when: 'gapAbove', value: 2, role: 'close' }], fallback: 'shell' };
  assert.deepEqual(choosePlan(policy, { gap: 3, opponentStatus: 'normal' }), ROLES.close);
  assert.deepEqual(choosePlan(policy, { gap: 1, opponentStatus: 'normal' }), ROLES.shell);
  const both = {
    rules: [{ when: 'gapAbove', value: 2, role: 'close' }, { when: 'gapAbove', value: 1, role: 'retreat' }],
    fallback: 'shell'
  };
  assert.deepEqual(choosePlan(both, { gap: 3 }), ROLES.close, '선언 순서가 지켜지지 않습니다');
});

test('an unknown condition is refused rather than silently ignored', () => {
  assert.throws(() => choosePlan({ rules: [{ when: 'weather', role: 'shell' }], fallback: 'shell' }, {}),
    /알 수 없는 조건/);
  const view = { gap: 0, stamina: 100, opponentStatus: 'normal', opponentRepeatedOpening: false };
  for (const when of CONDITIONS) {
    assert.doesNotThrow(() => choosePlan({ rules: [{ when, value: 1, role: 'shell' }], fallback: 'shell' }, view));
  }
});

test('sampled policies are unique, legal and reachable by the neighbour search', () => {
  const pool = samplePolicies(rng(), 60);
  assert.equal(new Set(pool.map(policyKey)).size, pool.length, '중복 정책이 있습니다');
  const names = new Set(roleNames());
  for (const policy of pool) {
    assert.ok(names.has(policy.fallback));
    for (const rule of policy.rules) {
      assert.ok(CONDITIONS.includes(rule.when));
      assert.ok(names.has(rule.role));
    }
    assert.ok(describePolicy(policy).length > 0);
    for (const near of policyNeighbours(policy, { limit: 40 })) {
      assert.ok(names.has(near.fallback));
      assert.notEqual(policyKey(near), policyKey(policy), '이웃이 자기 자신입니다');
    }
  }
});

test('a policy duel actually re-decides, and a fixed policy does not', () => {
  const { thrown } = playPolicies(
    { rules: [{ when: 'gapAbove', value: 1.6, role: 'close' }], fallback: 'retreat' },
    constant('pressure'), { seed: 1, stats: MIRROR });
  const distinct = new Set(thrown[0].map(p => p.join('+')));
  assert.ok(distinct.size > 1, `반응형 정책이 매 턴 같은 것만 던졌습니다: ${[...distinct]}`);
  assert.equal(new Set(thrown[1].map(p => p.join('+'))).size, 1, '고정 정책이 바뀌었습니다');
});

test('policy duels are deterministic and antisymmetric', () => {
  const a = { rules: [{ when: 'gapBelow', value: 1.2, role: 'retreat' }], fallback: 'pressure' };
  const b = constant('bodywork');
  clearPolicyDuelCache();
  const first = duelPolicies(a, b, OPTIONS);
  clearPolicyDuelCache();
  assert.equal(duelPolicies(a, b, OPTIONS), first, '같은 정책 대결이 다른 값을 냈습니다');
  clearPolicyDuelCache();
  assert.equal(duelPolicies(b, a, OPTIONS), -first, '반대칭이 깨졌습니다');
  clearPolicyDuelCache();
  assert.equal(duelPolicies(a, a, OPTIONS), 0, '자기 자신과 겨뤄 이겼습니다');
});

test('the solver works over policies with no change to its own logic', () => {
  const pool = samplePolicies(rng(), 6);
  const matrix = payoffMatrix(pool, OPTIONS, POLICY_SPACE);
  for (let i = 0; i < pool.length; i++) {
    assert.equal(matrix[i][i], 0);
    // Summed rather than negated: a zero payoff is stored as -0 on one side of the diagonal.
    for (let j = 0; j < pool.length; j++) assert.equal(matrix[i][j] + matrix[j][i], 0);
  }
  const solution = fictitiousPlay(matrix, { iterations: 400 });
  // Symmetric zero-sum: the value of the game is zero, and drift means the matrix stopped
  // being antisymmetric.
  assert.ok(Math.abs(solution.value) < 1e-9, `게임 값이 0이 아닙니다: ${solution.value}`);
  assert.ok(exploitability(matrix, solution.strategy) >= -1e-9);
});

test('double oracle over policies grows the pool and keeps it a policy pool', () => {
  const result = doubleOracle(samplePolicies(rng(), 6), rng(), {
    rounds: 2, candidatesPerRound: 24, addPerRound: 2,
    options: { ...OPTIONS, seeds: [1] }, space: POLICY_SPACE
  });
  assert.ok(result.pool.length >= 6);
  assert.equal(new Set(result.pool.map(policyKey)).size, result.pool.length, '풀에 중복 정책이 들어왔습니다');
  for (const policy of result.pool) assert.ok(Array.isArray(policy.rules));
  assert.ok(supportOf(result.pool, result.solution.strategy).length > 0);
});

test('card usage is measured from the timeline, not from the rules', () => {
  // A rule that never fires costs nothing and does nothing, so a policy's card list is not
  // evidence that those cards were played.
  const pool = [
    { rules: [{ when: 'staminaBelow', value: -1, role: 'power' }], fallback: 'bodywork' },
    constant('bodywork')
  ];
  const usage = cardUsage(pool, [0.5, 0.5], { seeds: [1], stats: MIRROR });
  assert.ok(usage.body > 0, '실제로 던진 카드가 집계되지 않았습니다');
  assert.equal(usage.heavy, undefined, '발동하지 않은 규칙의 카드가 집계됐습니다');
  const total = Object.values(usage).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-6, `사용률 합이 1이 아닙니다: ${total}`);
});

test('conditional cards reach the timeline once play is reactive', () => {
  // The reason this layer exists: a policy that answers distance actually steps.
  const stepper = { rules: [
    { when: 'gapAbove', value: 1.6, role: 'close' },
    { when: 'gapBelow', value: 1.4, role: 'retreat' }
  ], fallback: 'angle' };
  const usage = cardUsage([stepper], [1], { seeds: [1, 2], stats: MIRROR });
  const moved = ['stepin', 'backstep', 'sidestep'].filter(id => usage[id] > 0);
  assert.ok(moved.length >= 2, `거리·각 카드가 타임라인에 오르지 않았습니다: ${JSON.stringify(usage)}`);
});

test('every condition is sometimes true and sometimes false', () => {
  // The grammar's health check. A condition almost never true is a rule slot nobody can use;
  // one almost always true is the fallback in disguise. Both inflate the search space without
  // adding strategies. The first grammar failed this: stamina thresholds fired 0-1% of the
  // time and the counter window and the angle fired 0.00%, because both expire inside the
  // combo and are gone by the next turn boundary.
  const rates = conditionBaseRates({ stats: MIRROR, seeds: [1, 2] });
  assert.ok(Object.keys(rates).length >= CONDITIONS.length);
  for (const [label, rate] of Object.entries(rates)) {
    assert.ok(rate > 0.03, `${label}이 거의 발동하지 않습니다: ${(rate * 100).toFixed(2)}%`);
    assert.ok(rate < 0.9, `${label}이 거의 항상 참입니다: ${(rate * 100).toFixed(2)}%`);
  }
});

test('thresholds come from Config, not from magic numbers', () => {
  const bands = definitions.configs.combat_prototype.range.bands;
  assert.deepEqual(thresholdsFor('gapAbove'), [bands.mid]);
  assert.deepEqual(thresholdsFor('gapBelow'), [bands.clinch, bands.inside]);
  assert.deepEqual(thresholdsFor('staminaBelow'), [Math.round(RULES.maxStamina * 0.9)]);
  assert.equal(thresholdsFor('opponentRepeated').length, 0, '조건 없는 값에 임계값이 붙었습니다');
  // Sampling and the neighbour search may only use declared thresholds, or a solved policy
  // could sit on a value the health check never measured.
  for (const policy of samplePolicies(rng(), 80)) {
    for (const rule of policy.rules) {
      const declared = thresholdsFor(rule.when);
      if (!declared.length) assert.equal(rule.value, undefined);
      else assert.ok(declared.includes(rule.value), `${rule.when}에 선언되지 않은 임계값: ${rule.value}`);
    }
    for (const near of policyNeighbours(policy, { limit: 60 })) {
      for (const rule of near.rules) {
        const declared = thresholdsFor(rule.when);
        if (declared.length) assert.ok(declared.includes(rule.value), `이웃이 임계값을 벗어났습니다: ${rule.when}=${rule.value}`);
      }
    }
  }
});

test('grammar usage counts the rule that fired, not the rules written down', () => {
  const never = { rules: [{ when: 'staminaBelow', value: -1, role: 'power' }], fallback: 'bodywork' };
  const usage = grammarUsage([never], [1], { seeds: [1], stats: MIRROR });
  assert.equal(usage.fallbackShare, 1, '발동하지 않은 규칙이 결정한 것으로 집계됐습니다');
  assert.deepEqual(usage.byCondition, {});
  assert.equal(usage.distinctPlansPerMatch, 1, '고정 정책이 여러 콤보를 던졌습니다');

  const always = { rules: [{ when: 'gapBelow', value: 99, role: 'power' }], fallback: 'bodywork' };
  const forced = grammarUsage([always], [1], { seeds: [1], stats: MIRROR });
  assert.equal(forced.fallbackShare, 0);
  assert.ok(forced.byCondition.gapBelow > 0.99);
});
