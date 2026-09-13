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
  // Score follows applied damage, so a saturated target stops rewarding further hits. Read at
  // saturation rather than after a fixed number of turns: how long saturation takes depends on
  // the card's power, so a turn window silently stops testing the invariant when power changes.
  let m = newMatch('pressure', 3, { player: evenly(60), opponent: evenly(60) });
  const plan = makePlan(['body', 'body', 'body']);
  let previous = 0;
  const gains = [];
  let saturatedAt = -1;
  for (let i = 0; i < RULES.maxTurns && !m.finished; i++) {
    m = resolveTurn(m, plan, makePlan([])).match;
    gains.push(m.fighters[0].score - previous);
    previous = m.fighters[0].score;
    if (saturatedAt < 0 && m.fighters[1].damage.body >= RULES.maxPartDamage) saturatedAt = i;
  }
  assert.ok(saturatedAt >= 0, `부위가 포화되지 않아 불변식을 재지 못했습니다: ${gains.join(', ')}`);
  assert.ok(saturatedAt < gains.length - 1, '포화 이후 턴이 없어 확인할 수 없습니다');
  for (const gain of gains.slice(saturatedAt + 1)) {
    assert.equal(gain, 0, `포화된 부위가 계속 점수를 줍니다: ${gains.join(', ')}`);
  }
  assert.ok(gains[saturatedAt] < gains[0], '포화에 가까워져도 수익이 줄지 않습니다');
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

test('a body shot buys less impact than a head shot, because it buys other things too', () => {
  // A body hit drains stamina, lowers the recovery ceiling, and therefore both weakens what the
  // opponent throws and deepens what they take. Paying head-level impact on top of all that made
  // a body-only plan beat every profile: at power 13 it was dominant whatever the KO threshold
  // was set to, and only cutting the impact moved it.
  const attacks = Object.entries(CARDS).filter(([, c]) => c.kind === 'attack');
  const perSlot = c => c.power / c.duration;
  const body = attacks.filter(([, c]) => c.target === 'body');
  const head = attacks.filter(([, c]) => c.target === 'head');
  assert.ok(body.length && head.length);
  for (const [bodyId, bodyCard] of body) {
    for (const [headId, headCard] of head) {
      assert.ok(perSlot(bodyCard) < perSlot(headCard),
        `${bodyId}이 ${headId}보다 칸당 위력이 높습니다: ${perSlot(bodyCard)} vs ${perSlot(headCard)}`);
    }
  }
});

test('the body finish is the long road, not the short one', () => {
  // Head work finishes through the spike route far more often than by reaching koDamage, so the
  // spike is what a body finish has to be farther than. The stamina half of the body gate adds
  // no difficulty — body work is what produces the low stamina — so the damage number carries it.
  const rules = definitions.configs.combat_prototype.rules;
  assert.ok(rules.bodyKoDamage > rules.staggerDamage,
    `몸통 피니시가 머리의 실질 문턱보다 가깝습니다: ${rules.bodyKoDamage} vs ${rules.staggerDamage}`);
  assert.ok(rules.bodyKoDamage < rules.maxPartDamage, '몸통 피니시가 영원히 성립하지 않습니다');
  // And it still has to be reachable, or body defence has nothing to defend against.
  let m = newMatch('pressure', 3, { player: evenly(60), opponent: evenly(60) });
  const plan = makePlan(['body', 'body', 'body']);
  let finished = false;
  for (let i = 0; i < RULES.maxTurns && !m.finished; i++) {
    m = resolveTurn(m, plan, makePlan([])).match;
    if (m.fighters[1].ko) finished = true;
  }
  assert.ok(m.fighters[1].damage.body >= rules.bodyKoDamage || finished,
    '방치된 상대조차 몸통 피니시 문턱에 닿지 않습니다');
});
