// Movement cards and the side step's angle advantage.
// Spec: docs/design/22_combat_range_model.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, RULES, newMatch, makePlan, resolveTurn, isRoundEnd} from '../dist/engine.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const cfg = definitions.configs.combat_prototype;
const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });
const start = (seed = 5) => newMatch('pressure', seed, { player: evenly(60), opponent: evenly(60) });
const hits = r => r.frames.flatMap(f => f.events).filter(e => e.type === 'hit');

test('movement cards do nothing but move, and they move in opposite directions', () => {
  assert.equal(CARDS.backstep.kind, 'move');
  assert.equal(CARDS.stepin.kind, 'move');
  assert.ok(CARDS.backstep.rangeShift > 0, '백스텝이 거리를 벌리지 않습니다');
  assert.ok(CARDS.stepin.rangeShift < 0, '스텝인이 거리를 좁히지 않습니다');
  for (const id of ['backstep', 'stepin']) {
    assert.equal(CARDS[id].power, undefined, `${id}가 공격력을 가집니다`);
    assert.equal(CARDS[id].protect, undefined, `${id}가 방어합니다`);
  }
});

test('retreat is now actually possible', () => {
  // Before movement cards the only outward shifts were sway and rest, neither of which
  // exists to move: distance only travelled one way.
  const opened = resolveTurn(start(), makePlan(['backstep', 'backstep', 'backstep']), makePlan([])).match;
  assert.ok(opened.gap > cfg.range.initial, `후퇴가 되지 않습니다: ${opened.gap}`);
  const closed = resolveTurn(start(), makePlan(['stepin', 'stepin', 'stepin']), makePlan([])).match;
  assert.ok(closed.gap < cfg.range.initial, `전진이 되지 않습니다: ${closed.gap}`);
});

test('a move card still costs stamina and stays inside the range bounds', () => {
  let m = start();
  for (let i = 0; i < 4 && !m.finished; i++) {
    m = resolveTurn(m, makePlan(['backstep', 'backstep', 'backstep', 'backstep']), makePlan([])).match;
    assert.ok(m.gap >= cfg.range.min && m.gap <= cfg.range.max, `범위 이탈: ${m.gap}`);
  }
  // No idle slots, or rest recovery refills both runs and hides the cost.
  const plan = ['stepin', 'stepin', 'stepin', 'stepin', 'stepin', 'stepin', 'stepin', 'stepin'];
  const spent = resolveTurn(start(), makePlan(plan), makePlan([])).match;
  assert.ok(spent.fighters[0].stamina < RULES.maxStamina, '이동이 공짜입니다');
});

test('the side step costs more than the other evasions, because its reward lasts', () => {
  const evades = Object.entries(CARDS).filter(([, c]) => c.kind === 'evade');
  const angled = evades.filter(([, c]) => c.grantsAngle);
  assert.ok(angled.length, '각도 이점을 주는 회피가 없습니다');
  for (const [id, card] of angled) {
    for (const [otherId, other] of evades.filter(([, c]) => !c.grantsAngle)) {
      assert.ok(card.cost > other.cost, `${id}가 ${otherId}보다 싸거나 같습니다: ${card.cost} vs ${other.cost}`);
    }
  }
});

test('the side step beats straight lines, not hooks', () => {
  // Stepping off the line makes a straight miss; a hook follows you round.
  assert.ok(CARDS.sidestep.dodges.includes('straight'));
  assert.ok(!CARDS.sidestep.dodges.includes('hook'), '사이드 스텝이 훅까지 피합니다');
  const dodged = resolveTurn(start(), makePlan(['sidestep']), makePlan(['jab']));
  assert.ok(dodged.frames.flatMap(f => f.events).some(e => e.type === 'evade' && e.actor === 0));
  const caught = resolveTurn(start(), makePlan(['sidestep']), makePlan(['hook']));
  assert.ok(hits(caught).some(e => e.actor === 1), '훅이 사이드 스텝에 막혔습니다');
});

test('the angle is earned only against a committed opponent', () => {
  // Slipping an attack is commitment by definition.
  const slipped = resolveTurn(start(), makePlan(['sidestep']), makePlan(['jab']));
  const granted = frame => frame.fighters[1].offAngleUntil >= 0;
  assert.ok(slipped.frames.some(granted), '공격을 흘렸는데 각을 못 잡습니다');

  // Holding a guard is commitment too: they cannot turn with you while braced.
  const guarded = resolveTurn(start(), makePlan(['sidestep']), makePlan(['shell']));
  assert.ok(guarded.frames.some(granted), '가드 중인 상대에게 각을 못 잡습니다');

  // Someone simply breathing just turns with you. Nothing is earned.
  const idle = resolveTurn(start(), makePlan(['sidestep']), makePlan([]));
  assert.ok(!idle.frames.some(granted), '가만히 있는 상대에게 각을 잡았습니다');
});

test('a plain evasion gives a counter window, not an angle', () => {
  // Both are short-lived, so they have to be read from the frames rather than after the turn.
  const plain = resolveTurn(start(), makePlan(['sway', 'rest', 'rest']), makePlan(['jab']));
  assert.ok(!plain.frames.some(f => f.fighters[1].offAngleUntil >= 0), '스웨이가 각도 이점을 줍니다');
  assert.ok(plain.frames.some(f => f.fighters[0].counterUntil >= 0), '스웨이가 카운터 창을 주지 않습니다');
});

test('a hook follows you into the step and lands harder than an ordinary mismatch', () => {
  const intoHook = resolveTurn(start(), makePlan(['sidestep']), makePlan(['hook']));
  const intoStraightMiss = resolveTurn(start(), makePlan(['weave']), makePlan(['cross']));
  const punished = hits(intoHook).find(e => e.actor === 1);
  assert.ok(punished, '훅이 사이드 스텝을 통과하지 못했습니다');
  assert.equal(punished.steppedInto, true, '스텝한 방향의 훅으로 기록되지 않았습니다');
  const ordinary = hits(intoStraightMiss).find(e => e.actor === 1);
  assert.ok(ordinary, '빗나간 회피가 맞지 않았습니다');
  const angle = definitions.configs.combat_prototype.angle;
  assert.ok(angle.hookPunish > 1, '훅 응징 계수가 없습니다');
  assert.ok(punished.power > ordinary.power, `스텝한 방향 훅이 더 아프지 않습니다: ${punished.power} vs ${ordinary.power}`);
});

test('being off angle weakens your attacks and lets the other fighter through', () => {
  const withAngle = () => {
    const m = start(9);
    m.fighters[1].offAngleUntil = RULES.slots;
    return resolveTurn(m, makePlan(['jab', 'cross']), makePlan(['jab', 'cross']));
  };
  const square = () => resolveTurn(start(9), makePlan(['jab', 'cross']), makePlan(['jab', 'cross']));
  const power = (r, actor) => hits(r).filter(e => e.actor === actor).reduce((n, e) => n + e.power, 0);
  assert.ok(power(withAngle(), 1) < power(square(), 1), '각을 잃었는데 공격이 약해지지 않습니다');
  assert.ok(power(withAngle(), 0) > power(square(), 0), '각을 잡았는데 공격이 강해지지 않습니다');
  assert.ok(hits(withAngle()).some(e => e.offAngle), '이벤트에 각도 상태가 기록되지 않습니다');
});

test('the angle carries across a combo boundary and expires at a round boundary', () => {
  // The side step has to still be active late in the combo for its angle to reach the boundary.
  const late = makePlan(['shell', 'rest', 'rest', 'sidestep']);
  const lateJab = makePlan(['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'jab']);
  const r = resolveTurn(start(), late, lateJab);
  assert.ok(r.match.fighters[1].offAngleUntil > 0, `콤보 경계에서 각도가 잘렸습니다: ${r.match.fighters[1].offAngleUntil}`);
  let m = start();
  for (let i = 0; i < cfg.rounds.turnsPerRound - 1; i++) m = resolveTurn(m, makePlan(['body', 'body', 'body']), makePlan([])).match;
  const after = resolveTurn(m, late, lateJab).match;
  assert.equal(after.roundResults.length, 1);
  assert.equal(after.fighters[1].offAngleUntil, -1, '라운드 경계에서 각도가 소멸하지 않았습니다');
});

test('movement and the angle stay deterministic', () => {
  const play = () => {
    let m = start(31);
    const trace = [];
    while (!m.finished) {
      const r = resolveTurn(m, makePlan(['backstep', 'sidestep', 'cross']), makePlan(['jab', 'hook']));
      trace.push([r.match.gap, r.match.fighters[1].offAngleUntil, ...hits(r).map(e => e.power)]);
      m = r.match;
    }
    return trace;
  };
  assert.deepEqual(play(), play());
});
