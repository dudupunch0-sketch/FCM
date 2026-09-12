// Balance invariants. These pin the structural properties tuning must not break,
// not specific numbers. Retune with tools/balance.mjs; these stay true across retunes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, newMatch, makePlan, opponentPlan, resolveTurn} from '../dist/engine.js';
import {createRngSet} from '../dist/rng.js';
import {createWorld, simulateWeek} from '../dist/world.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });

test('no single plan beats every opponent profile', () => {
  const plans = {
    jabbing: ['jab', 'jab', 'cross', 'jab', 'rest'],
    bodywork: ['body', 'body', 'body'],
    shelled: ['shell', 'cross', 'guard', 'rest'],
    patient: ['guard', 'jab', 'guard', 'cross', 'rest'],
    mixed: ['sway', 'body', 'cross', 'rest']
  };
  for (const [name, plan] of Object.entries(plans)) {
    let beaten = 0;
    for (const profile of ['pressure', 'tricky', 'turtle']) {
      let wins = 0;
      for (let seed = 1; seed <= 12; seed++) {
        let m = newMatch(profile, seed, { player: evenly(60), opponent: evenly(60) });
        while (!m.finished) m = resolveTurn(m, makePlan(plan), opponentPlan(m)).match;
        if (m.winner === 0) wins++;
      }
      if (wins > 6) beaten++;
    }
    assert.ok(beaten < 3, `${name}이 모든 프로필을 이깁니다. 지배 전략입니다`);
  }
});

test('attacking one body part forever does not pay forever', () => {
  // Score follows applied damage, so a saturated target stops rewarding further hits.
  let m = newMatch('pressure', 3, { player: evenly(60), opponent: evenly(60) });
  const plan = makePlan(['body', 'body', 'body']);
  let previous = 0;
  const gains = [];
  for (let i = 0; i < 6 && !m.finished; i++) {
    m = resolveTurn(m, plan, makePlan([])).match;
    gains.push(m.fighters[0].score - previous);
    previous = m.fighters[0].score;
  }
  assert.ok(gains.at(-1) < gains[0] * 0.5, `포화된 부위가 계속 같은 점수를 줍니다: ${gains.join(', ')}`);
});

test('a long guard blocks more coarsely than a short one', () => {
  const guards = Object.entries(CARDS).filter(([, c]) => c.kind === 'guard').sort((a, b) => a[1].duration - b[1].duration);
  const fallback = definitions.configs.combat_prototype.modifiers.blockLeak;
  const leak = c => c.blockLeak ?? fallback;
  for (let i = 1; i < guards.length; i++) {
    if (guards[i][1].duration === guards[i - 1][1].duration) continue;
    assert.ok(leak(guards[i][1]) > leak(guards[i - 1][1]),
      `${guards[i][0]}가 ${guards[i - 1][0]}보다 촘촘히 막습니다. 긴 가드가 지배 전략이 됩니다`);
  }
});

test('the world population survives a decade instead of collapsing', () => {
  const rng = createRngSet(20, definitions).stream('world_generation');
  const world = createWorld(definitions, createRngSet(20, definitions).stream('world_generation'));
  for (let w = 0; w < 520; w++) simulateWeek(world, rng);
  const all = Object.keys(world.fighters).length;
  const active = Object.values(world.fighters).filter(f => f.active).length;
  assert.ok(active / all > 0.4, `10년 뒤 생존 ${active}/${all}. 인구가 붕괴합니다`);
  assert.ok(Object.values(world.fighters).some(f => !f.active), '아무도 은퇴하지 않습니다');
});
