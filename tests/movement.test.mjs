// Movement cards and the side step's angle advantage.
// Spec: docs/design/22_combat_range_model.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, RULES, newMatch, makePlan, resolveTurn, isRoundEnd, sideOfHand} from '../dist/engine.js';
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

test('a side step beats straights either way, and the hook depends on the hand', () => {
  // Stepping off the line makes a straight miss whichever way you went. A hook is a read: the
  // one from the hand you stepped away from passes by, the one you stepped into follows you.
  for (const id of ['sidestep_left', 'sidestep_right']) {
    assert.ok(CARDS[id].dodges.includes('straight'));
    assert.ok(CARDS[id].dodges.includes('hook'), `${id}이 훅을 아예 못 피합니다`);
    const dodged = resolveTurn(start(), makePlan([id]), makePlan(['jab']));
    assert.ok(dodged.frames.flatMap(f => f.events).some(e => e.type === 'evade' && e.actor === 0),
      `${id}이 직선을 못 피합니다`);
  }
  // Facing each other, my left is their right. An orthodox opponent throws the rear hand from
  // their right, so stepping to MY left walks into the rear hook and slips the lead one.
  assert.equal(CARDS.hook.hand, 'lead');
  assert.equal(CARDS.heavy.hand, 'rear');
  assert.equal(sideOfHand('orthodox', 'lead'), 'left');
  const slipped = resolveTurn(start(), makePlan(['sidestep_left']), makePlan(['hook']));
  assert.ok(slipped.frames.flatMap(f => f.events).some(e => e.type === 'evade' && e.actor === 0),
    '반대쪽 손 훅을 피하지 못했습니다');
  const caught = resolveTurn(start(), makePlan(['sidestep_right']), makePlan(['hook']));
  assert.ok(hits(caught).some(e => e.actor === 1), '스텝한 쪽 손 훅이 막혔습니다');
});

// Where a hook comes from is the thrower's stance applied to the card's hand, so the answer is
// computed rather than written down: the same table has to hold for a southpaw.
const punisher = (stance, step) =>
  ['hook', 'heavy'].find(id => sideOfHand(stance, CARDS[id].hand) === (step === 'left' ? 'right' : 'left'));

test('stepping into the wrong hand is the cost of choosing a side', () => {
  // Whichever way you go, exactly one of the two hooks answers you. A side step that beat both
  // would be an answer rather than a choice, and the validator refuses that shape.
  for (const step of ['sidestep_left', 'sidestep_right']) {
    const into = punisher('orthodox', CARDS[step].stepToward);
    const away = into === 'hook' ? 'heavy' : 'hook';
    const punished = hits(resolveTurn(start(), makePlan([step]), makePlan([into]))).find(e => e.actor === 1);
    assert.ok(punished, `${step}이 ${into}를 그냥 피했습니다`);
    assert.equal(punished.steppedInto, true, `${step} + ${into}가 스텝한 쪽 훅으로 기록되지 않았습니다`);
    const evaded = resolveTurn(start(), makePlan([step]), makePlan([away]));
    assert.ok(evaded.frames.flatMap(f => f.events).some(e => e.type === 'evade' && e.actor === 0),
      `${step}이 ${away}를 피하지 못했습니다`);
  }
});

test('a southpaw mirrors which hook answers which step', () => {
  // The whole reason sides are physical rather than lead/rear: against a southpaw the same step
  // walks into the other hand, and nothing in the card had to change to say so.
  assert.notEqual(punisher('orthodox', 'left'), punisher('southpaw', 'left'));
  const southpaw = { base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 60])), body: { stance: 'southpaw' } };
  const m = newMatch('pressure', 5, { player: evenly(60), opponent: southpaw });
  assert.equal(m.fighters[1].stance, 'southpaw', '스탠스가 전투 상태로 올라오지 않았습니다');
  // Orthodox punished sidestep_left with heavy; southpaw punishes it with the lead hook.
  const punished = hits(resolveTurn(m, makePlan(['sidestep_left']), makePlan(['hook']))).find(e => e.actor === 1);
  assert.ok(punished, '사우스포의 앞손 훅이 왼쪽 스텝을 따라오지 않았습니다');
  assert.equal(punished.steppedInto, true);
});

test('switching stance changes which hook answers a step, and does not turn the stepper', () => {
  // A fighter commits to moving one way. The opponent switching cannot reach back and spin
  // them around — their left arm is still their left arm. What changes is which hand throws
  // from that side, which is the entire point of switching.
  assert.equal(CARDS.switch.kind, 'stance');
  const switched = resolveTurn(start(), makePlan(['rest']), makePlan(['switch']));
  assert.equal(switched.match.fighters[1].stance, 'southpaw', '스위치가 스탠스를 바꾸지 않았습니다');
  assert.ok(switched.frames.flatMap(f => f.events).some(e => e.type === 'stance' && e.actor === 1));

  // Before switching, the lead hook passes a left step by. After, it follows it in.
  const before = resolveTurn(start(), makePlan(['sidestep_left']), makePlan(['hook']));
  assert.ok(before.frames.flatMap(f => f.events).some(e => e.type === 'evade' && e.actor === 0));
  const after = resolveTurn(switched.match, makePlan(['sidestep_left']), makePlan(['hook']));
  const punished = hits(after).find(e => e.actor === 1);
  assert.ok(punished && punished.steppedInto, '스위치 뒤에도 같은 손 훅이 지나갔습니다');
  assert.equal(CARDS.sidestep_left.stepToward, 'left', '스텝 방향이 상대 스탠스에 따라 바뀝니다');
});

test('the angle is earned only against a committed opponent', () => {
  // Slipping an attack is commitment by definition.
  const slipped = resolveTurn(start(), makePlan(['sidestep_left']), makePlan(['jab']));
  const granted = frame => frame.fighters[1].offAngleCards > 0;
  assert.ok(slipped.frames.some(granted), '공격을 흘렸는데 각을 못 잡습니다');

  // Holding a guard is commitment too: they cannot turn with you while braced.
  const guarded = resolveTurn(start(), makePlan(['sidestep_left']), makePlan(['shell']));
  assert.ok(guarded.frames.some(granted), '가드 중인 상대에게 각을 못 잡습니다');

  // Someone simply breathing just turns with you. Nothing is earned.
  const idle = resolveTurn(start(), makePlan(['sidestep_left']), makePlan([]));
  assert.ok(!idle.frames.some(granted), '가만히 있는 상대에게 각을 잡았습니다');
});

test('a plain evasion gives a counter window, not an angle', () => {
  // Both are short-lived, so they have to be read from the frames rather than after the turn.
  const plain = resolveTurn(start(), makePlan(['sway', 'rest', 'rest']), makePlan(['jab']));
  assert.ok(!plain.frames.some(f => f.fighters[1].offAngleCards > 0), '스웨이가 각도 이점을 줍니다');
  assert.ok(plain.frames.some(f => f.fighters[0].counterUntil >= 0), '스웨이가 카운터 창을 주지 않습니다');
});

test('a hook follows you into the step and lands harder than an ordinary mismatch', () => {
  // A left step slips the lead hook, so the punished pairing is the right step against it.
  const intoHook = resolveTurn(start(), makePlan(['sidestep_right']), makePlan(['hook']));
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
    m.fighters[1].offAngleCards = cfg.angle.actions;
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
  const late = makePlan(['shell', 'rest', 'rest', 'sidestep_left']);
  const lateJab = makePlan(['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'jab']);
  const r = resolveTurn(start(), late, lateJab);
  assert.ok(r.match.fighters[1].offAngleCards > 0, `콤보 경계에서 각도가 잘렸습니다: ${r.match.fighters[1].offAngleCards}`);
  let m = start();
  for (let i = 0; i < cfg.rounds.turnsPerRound - 1; i++) m = resolveTurn(m, makePlan(['body', 'body', 'body']), makePlan([])).match;
  const after = resolveTurn(m, late, lateJab).match;
  assert.equal(after.roundResults.length, 1);
  assert.equal(after.fighters[1].offAngleCards, 0, '라운드 경계에서 각도가 소멸하지 않았습니다');
});

test('movement and the angle stay deterministic', () => {
  const play = () => {
    let m = start(31);
    const trace = [];
    while (!m.finished) {
      const r = resolveTurn(m, makePlan(['backstep', 'sidestep_left', 'cross']), makePlan(['jab', 'hook']));
      trace.push([r.match.gap, r.match.fighters[1].offAngleCards, ...hits(r).map(e => e.power)]);
      m = r.match;
    }
    return trace;
  };
  assert.deepEqual(play(), play());
});

test('the exposure is measured in actions, and they square back up on their own', () => {
  // Nobody stands facing the wrong way for half a combo. Being off angle lasts for the action
  // the opponent is already committed to plus one more, then it is over without anyone
  // spending a card to fix it. Counted through a real grant rather than by poking the field,
  // because the action being committed to at the moment of the grant is part of the window.
  const actions = cfg.angle.actions;
  assert.ok(actions >= 1 && actions <= 2, `노출이 너무 깁니다: ${actions}개 행동`);
  // The opponent holds a guard (commitment, so the angle is earned) and then throws singles.
  const r = resolveTurn(start(9), makePlan(['sidestep_left']), makePlan(['shell', 'jab', 'jab', 'jab', 'jab']));
  const exposedActions = new Set(
    r.frames.filter(f => f.fighters[1].offAngleCards > 0).map(f => `${f.poses[1].id}@${f.tick - f.poses[1].phase}`)
  );
  assert.equal(exposedActions.size, actions,
    `행동 ${actions}개를 넘겨 노출됐습니다: ${[...exposedActions].join(', ')}`);
  assert.equal(r.match.fighters[1].offAngleCards, 0, '스스로 정면을 되찾지 못했습니다');
});

test('a long commitment spends the whole angle on one action', () => {
  // The point of counting actions: a four-slot shell burns the window with a single card,
  // while eight jabs burn it in two. Counting slots had this backwards.
  const holding = start(9);
  holding.fighters[1].offAngleCards = cfg.angle.actions;
  const long = resolveTurn(holding, makePlan(['rest']), makePlan(['shell', 'shell']));
  const quick = start(9);
  quick.fighters[1].offAngleCards = cfg.angle.actions;
  const short = resolveTurn(quick, makePlan(['rest']), makePlan(['jab', 'jab', 'jab', 'jab']));
  const cards = r => new Set(r.frames.filter(f => f.fighters[1].offAngleCards > 0).map(f => f.poses[1].id + f.tick));
  assert.ok(long.frames.filter(f => f.fighters[1].offAngleCards > 0).length
    > short.frames.filter(f => f.fighters[1].offAngleCards > 0).length,
    '긴 동작이 짧은 동작보다 오래 노출되지 않습니다');
  assert.ok(cards(long).size > 0 && cards(short).size > 0);
});

test('stepping around a guard finds the opening, which is what the angle is for', () => {
  // High risk, high reward: the card costs more than any other evasion, a wrong read is
  // punished at hookPunish, and the window is two actions. The payoff has to be decisive when
  // the read lands, or the card is only ever a worse sway. Before the guard leak it was a flat
  // damage multiplier and a shelled opponent blocked every punch anyway.
  const flurry = makePlan(['cross', 'hook', 'cross']);
  const turtling = makePlan(['shell', 'guard', 'guard']);
  const through = (angled) => {
    const m = start(9);
    if (angled) m.fighters[1].offAngleCards = cfg.angle.actions;
    const r = resolveTurn(m, flurry, turtling);
    return r.frames.flatMap(f => f.events)
      .filter(e => (e.type === 'hit' || e.type === 'block') && e.actor === 0)
      .reduce((n, e) => n + e.power, 0);
  };
  assert.ok(cfg.angle.guardLeak > 1, '각을 잃은 가드가 더 새지 않습니다');
  assert.ok(through(true) > through(false) * 1.5,
    `각을 잡고도 가드를 못 뚫습니다: ${through(true).toFixed(1)} vs ${through(false).toFixed(1)}`);
});

test('a leaking guard still beats no guard at all', () => {
  // The reward must not become "the guard stops existing". Blocking is a worse trade off angle,
  // never a pointless one, or the answer to a side step is to stop guarding.
  const worst = Math.max(...Object.values(CARDS).filter(c => c.kind === 'guard')
    .map(c => c.blockLeak ?? definitions.configs.combat_prototype.modifiers.blockLeak));
  assert.ok(worst * cfg.angle.guardLeak < 1,
    `각을 잃으면 막는 것이 무의미해집니다: ${(worst * cfg.angle.guardLeak).toFixed(2)}`);
  const m = start(9);
  m.fighters[1].offAngleCards = cfg.angle.actions;
  const power = (theirs) => {
    const r = resolveTurn(m, makePlan(['cross']), makePlan(theirs));
    const e = r.frames.flatMap(f => f.events).find(x => x.actor === 0 && (x.type === 'hit' || x.type === 'block'));
    assert.ok(e, '타격이 없습니다');
    return e.power;
  };
  // A one-slot guard is not active when a two-slot cross lands, so the comparison needs a
  // guard that actually covers the impact.
  assert.ok(power(['shell']) < power(['rest']),
    `각을 잃은 상태에서 가드가 무방비보다 낫지 않습니다: ${power(['shell'])} vs ${power(['rest'])}`);
});
