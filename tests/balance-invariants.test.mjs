// Balance invariants. These pin the structural properties tuning must not break,
// not specific numbers. Retune with tools/balance.mjs; these stay true across retunes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, RULES, newMatch, makePlan, opponentPlan, resolveTurn} from '../dist/engine.js';
import {createRngSet} from '../dist/rng.js';
import {createWorld, simulateWeek} from '../dist/world.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });

test('no single plan dominates the calibrated opponent', async () => {
  // Measured against the solved mixture, which is what real play faces. The hand-written
  // patterns are exploitable by construction, so dominance against them says nothing about
  // whether a plan is actually too strong.
  const { readFile } = await import('node:fs/promises');
  const { configureStrategies } = await import('../dist/engine.js');
  const document = JSON.parse(await readFile(new URL('../config/ai_strategies.json', import.meta.url), 'utf8'));
  const plans = {
    jabbing: ['jab', 'jab', 'cross', 'jab', 'rest'],
    bodywork: ['body', 'body', 'body'],
    shelled: ['shell', 'cross', 'guard', 'rest'],
    patient: ['guard', 'jab', 'guard', 'cross', 'rest'],
    mixed: ['sway', 'body', 'cross', 'rest']
  };
  try {
    configureStrategies(document, 'standard');
    for (const [name, plan] of Object.entries(plans)) {
      let wins = 0;
      for (let seed = 1; seed <= 24; seed++) {
        let m = newMatch('pressure', seed, { player: evenly(60), opponent: evenly(60) });
        while (!m.finished) m = resolveTurn(m, makePlan(plan), opponentPlan(m)).match;
        if (m.winner === 0) wins++;
      }
      assert.ok(wins < 24, `${name}이 보정된 AI를 상대로 전승합니다`);
    }
  } finally {
    configureStrategies(null);
  }
});

test('the calibrated tiers form a real difficulty gradient', async () => {
  const { readFile } = await import('node:fs/promises');
  const { configureStrategies } = await import('../dist/engine.js');
  const document = JSON.parse(await readFile(new URL('../config/ai_strategies.json', import.meta.url), 'utf8'));
  const plan = ['jab', 'jab', 'cross', 'jab', 'rest'];
  const rate = tier => {
    configureStrategies(document, tier);
    let wins = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let m = newMatch('pressure', seed, { player: evenly(60), opponent: evenly(60) });
      while (!m.finished) m = resolveTurn(m, makePlan(plan), opponentPlan(m)).match;
      if (m.winner === 0) wins++;
    }
    return wins / 30;
  };
  try {
    const easy = rate('apprentice'), hard = rate('brutal');
    assert.ok(easy > hard, `입문이 가혹보다 쉽지 않습니다: ${easy} vs ${hard}`);
    // Exploitability is the dial, so it must order the tiers the same way.
    const order = ['apprentice', 'standard', 'contender', 'brutal'].map(t => document.tiers[t].exploitability);
    for (let i = 1; i < order.length; i++) {
      assert.ok(order[i] <= order[i - 1] + 1e-9, `등급 순서가 뒤집혔습니다: ${order.join(' -> ')}`);
    }
  } finally {
    configureStrategies(null);
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

test('body work is the attrition path: neglecting body defence costs you the ability to act', () => {
  // Head attacks carry damage and the KO; body attacks take stamina. A fighter who ignores
  // body defence must gradually run out of the resource that pays for actions.
  const drain = enemy => {
    let m = newMatch('pressure', 3, { player: evenly(60), opponent: evenly(60) });
    let failures = 0;
    for (let t = 0; t < 6 && !m.finished; t++) {
      const r = resolveTurn(m, makePlan(['flicker', 'body', 'body']), makePlan(enemy));
      failures += r.frames.flatMap(f => f.events).filter(e => e.type === 'exhausted' && e.actor === 1).length;
      m = r.match;
    }
    return { stamina: m.fighters[1].stamina, cap: m.fighters[1].staminaCap, failures };
  };
  const ignored = drain(['shell', 'shell']);
  // Body guard means guarding the body. The previous plan spent two of its four covered slots
  // on a head guard, so body shots kept landing and it measured half-guarding, not guarding.
  const guarded = drain(['lowguard', 'lowguard']);
  assert.ok(ignored.stamina < guarded.stamina - 20,
    `바디를 무시해도 스태미너가 버팁니다: ${ignored.stamina} vs ${guarded.stamina}`);
  assert.ok(guarded.stamina > 60, `바디 가드가 소모를 막지 못합니다: ${guarded.stamina}`);
  // The ceiling is the part that does not come back. Six turns is a short window, so the gap
  // is modest by design; what matters is that it opens at all and favours the guard.
  assert.ok(ignored.cap < guarded.cap - 5,
    `바디를 무시해도 회복 상한이 남아 있습니다: ${ignored.cap} vs ${guarded.cap}`);
  assert.ok(ignored.cap < RULES.maxStamina - 15,
    `상한이 의미 있게 깎이지 않았습니다: ${ignored.cap}`);
});

test('head work still outscores body work, so body is not simply better', () => {
  const byTarget = definitions.configs.combat_prototype.modifiers.scoreByTarget;
  assert.ok(byTarget.body < byTarget.head, '몸통이 머리보다 높은 배점을 받습니다');
});
