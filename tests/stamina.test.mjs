// Stamina attrition: the falling ceiling.
// Spec: docs/design/38_stamina_attrition.md
//
// Stamina used to be a resource that always came back. Recovery refilled to 100 between
// rounds, so body work drained a fighter who then breathed it off, and nothing a fight did
// to a fighter's engine survived the interval. The ceiling is what makes attrition real.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {RULES, newMatch, makePlan, resolveTurn} from '../dist/engine.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const cfg = definitions.configs.combat_prototype;
const ceiling = cfg.staminaCeiling;
const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });
const start = (seed = 5) => newMatch('pressure', seed, { player: evenly(60), opponent: evenly(60) });
const play = (mine, theirs, { seed = 5, turns = 12 } = {}) => {
  let match = start(seed);
  const caps = [];
  for (let t = 0; t < turns && !match.finished; t++) {
    const r = resolveTurn(match, makePlan(mine), makePlan(theirs));
    caps.push(r.frames.map(f => f.fighters.map(x => x.staminaCap)));
    match = r.match;
  }
  return { match, caps };
};

test('a fighter starts at the full ceiling and the ceiling is what recovery clamps to', () => {
  const match = start();
  for (const fighter of match.fighters) assert.equal(fighter.staminaCap, RULES.maxStamina);
  assert.ok(ceiling.min < RULES.maxStamina, '바닥이 시작 상한과 같으면 소모가 일어나지 않습니다');
});

test('the ceiling only ever falls', () => {
  // Monotonicity is the whole point: a ceiling that can rise is just stamina with extra steps.
  const { caps } = play(['body', 'body', 'body'], ['body', 'body', 'body']);
  const flat = caps.flat();
  for (let i = 1; i < flat.length; i++) {
    for (let side = 0; side < 2; side++) {
      assert.ok(flat[i][side] <= flat[i - 1][side],
        `상한이 올라갔습니다: ${flat[i - 1][side]} → ${flat[i][side]}`);
    }
  }
});

test('no recovery of any kind takes a fighter past their ceiling', () => {
  // Three separate paths refill stamina — the rest card, the between-turn tick, and the
  // between-round interval. All three have to respect the ceiling or attrition leaks away.
  const { match } = play(['rest', 'rest', 'rest', 'rest'], ['body', 'body', 'body'], { turns: 12 });
  assert.ok(match.roundResults.length > 0, '라운드 경계를 지나지 않았습니다');
  for (const fighter of match.fighters) {
    assert.ok(fighter.stamina <= fighter.staminaCap,
      `상한을 넘겨 회복했습니다: ${fighter.stamina} > ${fighter.staminaCap}`);
  }
  const worn = match.fighters[0];
  assert.ok(worn.staminaCap < RULES.maxStamina, '바디를 계속 맞았는데 상한이 그대로입니다');
});

test('body damage takes the ceiling with it; head damage does not', () => {
  const body = play(['body', 'body', 'body'], ['rest'], { turns: 4 }).match.fighters[1];
  const head = play(['jab', 'cross', 'hook'], ['rest'], { turns: 4 }).match.fighters[1];
  assert.ok(body.staminaCap < RULES.maxStamina, '바디를 맞았는데 상한이 그대로입니다');
  assert.equal(head.staminaCap, RULES.maxStamina, '머리 공격이 회복 상한을 깎았습니다');
  // Head work is still the damage path, so the two are not redundant.
  assert.ok(head.damage.head > body.damage.head);
});

test('working while gassed costs the ceiling, working while fresh does not', () => {
  // The fighter is only gassed once the cheap slots have been spent, so this reads the events
  // rather than comparing two contrived starting states.
  let match = start(11);
  // Eight slots of attack with no rest in them, or the padded rests refill what was spent.
  const relentless = makePlan(['cross', 'cross', 'cross', 'cross']);
  const ceilingEvents = [];
  let sawFreshAttack = false;
  for (let t = 0; t < 8 && !match.finished; t++) {
    const r = resolveTurn(match, relentless, makePlan(['rest']));
    for (const frame of r.frames) {
      for (const event of frame.events) {
        if (event.type === 'ceiling' && event.actor === 0) ceilingEvents.push({ turn: t, ...event });
      }
      const self = frame.fighters[0];
      if (self.stamina >= self.staminaCap * ceiling.lowThreshold && self.staminaCap === RULES.maxStamina) sawFreshAttack = true;
    }
    match = r.match;
  }
  assert.ok(sawFreshAttack, '지치지 않은 구간이 없었습니다');
  assert.ok(ceilingEvents.length > 0, '지친 채로 계속 공격했는데 상한이 깎이지 않았습니다');
  assert.ok(ceilingEvents[0].turn > 0, '첫 턴부터 지친 것으로 판정됐습니다');
});

test('the ceiling never falls through the floor', () => {
  // Without a floor the loop feeds itself: a lower ceiling means gassing sooner, which lowers
  // it again. A worn fighter has to stay dangerous rather than become helpless.
  const { match, caps } = play(['body', 'heavy'], ['body', 'heavy'], { seed: 3, turns: 12 });
  for (const frame of caps.flat()) {
    for (const cap of frame) assert.ok(cap >= ceiling.min, `바닥을 뚫었습니다: ${cap}`);
  }
  for (const fighter of match.fighters) assert.ok(fighter.staminaCap >= ceiling.min);
});

test('a gassed fighter absorbs worse than a fresh one', () => {
  const hit = (stamina) => {
    const match = start(21);
    match.fighters[1].stamina = stamina;
    const r = resolveTurn(match, makePlan(['cross']), makePlan(['rest']));
    return r.frames.flatMap(f => f.events).find(e => e.type === 'hit' && e.actor === 0);
  };
  const fresh = hit(RULES.maxStamina);
  const gassed = hit(20);
  assert.ok(fresh && gassed, '타격이 발생하지 않았습니다');
  assert.ok(gassed.power > fresh.power,
    `지친 상대가 더 아프게 맞지 않습니다: ${gassed.power} vs ${fresh.power}`);
  const vulnerability = cfg.modifiers.staminaVulnerability;
  assert.ok(vulnerability > 0 && vulnerability < 1, '취약도 계수가 범위를 벗어났습니다');
});

test('the drop is reported as an event so it can be shown, not inferred', () => {
  const r = resolveTurn(start(), makePlan(['body', 'body', 'body']), makePlan(['rest']));
  const dropped = r.frames.flatMap(f => f.events).filter(e => e.type === 'ceiling');
  assert.ok(dropped.length > 0, '상한 저하가 이벤트로 보고되지 않습니다');
  for (const event of dropped) {
    assert.equal(event.actor, 1);
    assert.ok(event.lost > 0);
    assert.ok(event.cap < RULES.maxStamina);
  }
});

test('attrition stays deterministic', () => {
  const trace = () => play(['body', 'heavy'], ['jab', 'body'], { seed: 17 })
    .match.fighters.map(f => [f.stamina, f.staminaCap, f.damage.body]);
  assert.deepEqual(trace(), trace());
});

test('a mirror match is exactly symmetric, not merely a draw on points', () => {
  // Impact variance used to be keyed by actor, so the two corners drew different rolls and a
  // mirror was never truly even. The payoff matrix hid it by negating the upper triangle,
  // which meant "the game value is zero" could not have caught a real left/right asymmetry.
  const plan = makePlan(['jab', 'cross', 'body']);
  let match = start(9);
  while (!match.finished) {
    const r = resolveTurn(match, plan, plan);
    for (const frame of r.frames) {
      const [a, b] = frame.fighters;
      assert.equal(a.stamina, b.stamina, '스태미너가 좌우로 갈립니다');
      assert.equal(a.staminaCap, b.staminaCap, '회복 상한이 좌우로 갈립니다');
      assert.equal(a.score, b.score, '점수가 좌우로 갈립니다');
      assert.deepEqual(a.damage, b.damage, '손상이 좌우로 갈립니다');
    }
    match = r.match;
  }
  assert.equal(match.winner, null, '거울 대결에 승자가 나왔습니다');
});
