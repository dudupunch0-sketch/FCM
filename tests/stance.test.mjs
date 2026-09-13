// Stance as live combat state, and the open-guard matchup.
// Spec: docs/design/22_combat_range_model.md
//
// Two fighters in opposite stances are in open guard: their lead hands meet across the line
// and lose their bite, while the rear hands find a straight path home. It applies to both of
// them, so it is not an edge for either — it changes which punch is worth throwing.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, SKILLS, newMatch, makePlan, resolveTurn, observe, sideOfHand} from '../dist/engine.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const cfg = definitions.configs.combat_prototype;
const matchup = cfg.stanceMatchup;
const fighterAt = stance => ({
  base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 60])),
  body: { stance }
});
const hits = r => r.frames.flatMap(f => f.events).filter(e => e.type === 'hit');
// Same seed and same plans on both sides of every comparison: only the stances differ.
const land = (card, mine, theirs, { seed = 5, actor = 0 } = {}) => {
  const match = newMatch('pressure', seed, { player: fighterAt(mine), opponent: fighterAt(theirs) });
  const plans = actor === 0 ? [[card], ['rest']] : [['rest'], [card]];
  const hit = hits(resolveTurn(match, makePlan(plans[0]), makePlan(plans[1]))).find(e => e.actor === actor);
  assert.ok(hit, `${card}가 맞지 않았습니다`);
  return hit.power;
};
const LEAD = Object.keys(CARDS).find(id => CARDS[id].kind === 'attack' && CARDS[id].hand === 'lead');
const REAR = Object.keys(CARDS).find(id => CARDS[id].kind === 'attack' && CARDS[id].hand === 'rear');

test('every punch declares a hand, because every punch is thrown by one', () => {
  for (const [id, card] of Object.entries(CARDS)) {
    if (card.kind !== 'attack') continue;
    assert.ok(['lead', 'rear'].includes(card.hand), `${id}에 손이 없습니다`);
  }
  // Both hands have to exist or one stance is strictly better, and one side step is free.
  const hands = new Set(Object.values(CARDS).filter(c => c.kind === 'attack').map(c => c.hand));
  assert.equal(hands.size, 2, '한쪽 손으로만 치는 카드 목록입니다');
});

test('open guard blunts the lead hand and sharpens the rear', () => {
  assert.ok(matchup.openGuard.lead < 1, '오픈 가드에서 앞손이 약해지지 않습니다');
  assert.ok(matchup.openGuard.rear > 1, '오픈 가드에서 뒷손이 강해지지 않습니다');
  const closedLead = land(LEAD, 'orthodox', 'orthodox');
  const openLead = land(LEAD, 'orthodox', 'southpaw');
  assert.ok(openLead < closedLead, `오픈 가드에서 앞손이 약해지지 않았습니다: ${openLead} vs ${closedLead}`);
  const closedRear = land(REAR, 'orthodox', 'orthodox');
  const openRear = land(REAR, 'orthodox', 'southpaw');
  assert.ok(openRear > closedRear, `오픈 가드에서 뒷손이 강해지지 않았습니다: ${openRear} vs ${closedRear}`);
});

test('the same stance is the baseline, whichever stance both fighters share', () => {
  // Two southpaws are in closed guard exactly as two orthodox fighters are. Stance is a
  // relationship, not a bonus: nothing here may favour one stance over the other.
  assert.equal(matchup.closedGuard.lead, 1);
  assert.equal(matchup.closedGuard.rear, 1);
  for (const card of [LEAD, REAR]) {
    assert.equal(land(card, 'southpaw', 'southpaw'), land(card, 'orthodox', 'orthodox'),
      `${card}가 스탠스 자체로 유불리를 가집니다`);
  }
});

test('open guard is not an edge for either fighter', () => {
  // Both sides get the same treatment, so the matchup decides which punch to throw rather
  // than who wins. Measured from both corners of the same fight.
  for (const card of [LEAD, REAR]) {
    const mine = land(card, 'orthodox', 'southpaw', { actor: 0 });
    const theirs = land(card, 'southpaw', 'orthodox', { actor: 1 });
    assert.equal(mine, theirs, `${card}가 한쪽에만 유리하게 적용됩니다`);
  }
});

test('the lead hand buys less for the same stamina, which is the point', () => {
  // Cost is untouched. The lead hand does not get more expensive; it stops being worth what
  // it costs, and that is what pushes both fighters onto the rear hand.
  const perStamina = (card, theirs) => land(card, 'orthodox', theirs) / CARDS[card].cost;
  assert.ok(perStamina(LEAD, 'southpaw') < perStamina(LEAD, 'orthodox'),
    '오픈 가드에서 앞손의 스태미너 대비 성능이 그대로입니다');
  assert.ok(perStamina(REAR, 'southpaw') > perStamina(REAR, 'orthodox'),
    '오픈 가드에서 뒷손의 스태미너 대비 성능이 그대로입니다');
  assert.equal(CARDS[LEAD].cost, CARDS[LEAD].cost, '비용은 매치업으로 바뀌지 않습니다');
});

test('the rear counter is the exchange open guard is really about', () => {
  // The counter multiplier and the open-guard bonus land on the same punch, so the rear
  // counter gains more from open guard than a rear lead-off does.
  const counter = (theirs) => {
    const match = newMatch('pressure', 12, { player: fighterAt('orthodox'), opponent: fighterAt(theirs) });
    // Sway slips the jab, then the rear hand lands inside the counter window.
    const r = resolveTurn(match, makePlan(['sway', REAR]), makePlan(['jab', 'jab', 'jab']));
    const hit = hits(r).find(e => e.actor === 0 && e.counter);
    assert.ok(hit, '카운터가 성립하지 않았습니다');
    return hit.power;
  };
  const closed = counter('orthodox');
  const open = counter('southpaw');
  assert.ok(open > closed, `오픈 가드에서 뒷손 카운터가 더 아프지 않습니다: ${open} vs ${closed}`);
  const plainGain = land(REAR, 'orthodox', 'southpaw') - land(REAR, 'orthodox', 'orthodox');
  assert.ok(open - closed > plainGain,
    `카운터와 오픈 가드가 겹쳐서 커지지 않습니다: ${(open - closed).toFixed(2)} vs ${plainGain.toFixed(2)}`);
});

test('switching opens the guard mid-fight, for both fighters at once', () => {
  // A switch is not only a side step answer: against a same-stance opponent it converts the
  // whole fight to open guard, which rewrites what both fighters should be throwing.
  const match = newMatch('pressure', 5, { player: fighterAt('orthodox'), opponent: fighterAt('orthodox') });
  const after = resolveTurn(match, makePlan(['switch']), makePlan(['rest'])).match;
  assert.equal(after.fighters[0].stance, 'southpaw');
  assert.equal(after.fighters[1].stance, 'orthodox', '상대 스탠스까지 바뀌었습니다');
  const before = resolveTurn(match, makePlan([REAR]), makePlan(['rest']));
  const opened = resolveTurn(after, makePlan([REAR]), makePlan(['rest']));
  const power = r => hits(r).find(e => e.actor === 0).power;
  assert.ok(power(opened) > power(before), '스위치로 오픈 가드가 되지 않았습니다');
  // And the opponent's rear hand gains just as much, so it is a shared change of terms.
  const theirsBefore = hits(resolveTurn(match, makePlan(['rest']), makePlan([REAR]))).find(e => e.actor === 1);
  const theirsAfter = hits(resolveTurn(after, makePlan(['rest']), makePlan([REAR]))).find(e => e.actor === 1);
  assert.ok(theirsAfter.power > theirsBefore.power, '상대의 뒷손은 이득을 못 봅니다');
});

test('the hand a step walks into follows stance, not the card text', () => {
  // sideOfHand is the single mapping both the matchup and the side step read, so the two
  // systems cannot drift apart.
  assert.equal(sideOfHand('orthodox', 'lead'), 'left');
  assert.equal(sideOfHand('southpaw', 'lead'), 'right');
  assert.equal(sideOfHand('orthodox', 'rear'), 'right');
  assert.equal(sideOfHand('southpaw', 'rear'), 'left');
});

test('the matchup stays deterministic', () => {
  const trace = () => {
    let match = newMatch('pressure', 23, { player: fighterAt('orthodox'), opponent: fighterAt('southpaw') });
    const out = [];
    while (!match.finished) {
      const r = resolveTurn(match, makePlan([LEAD, REAR]), makePlan(['switch', REAR]));
      out.push([...r.match.fighters.map(f => [f.stance, f.score]), ...hits(r).map(e => e.power)]);
      match = r.match;
    }
    return out;
  };
  assert.deepEqual(trace(), trace());
});

test('the hand read names the side a hook will arrive from', () => {
  // A side step is a read on which hand is coming. Without a way to make that read it is a
  // coin flip priced like a commitment, which is why it left the equilibrium entirely.
  assert.ok(SKILLS.hand, '손 읽기 카드가 없습니다');
  const orthodox = newMatch('pressure', 5, { player: fighterAt('orthodox'), opponent: fighterAt('orthodox') });
  const plan = makePlan(['hook', 'heavy']);
  const cues = observe(plan, 'hand', orthodox);
  assert.ok(cues.length >= 2, `훅 두 개를 예고하지 않았습니다: ${cues.length}`);
  for (const cue of cues) {
    assert.equal(cue.kind, 'cue', '손 읽기는 확정 공개가 아니라 예고입니다');
    assert.ok(['left', 'right'].includes(cue.side));
    assert.ok(cue.label.length > 0);
  }
  // hook is the lead hand, heavy the rear, so an orthodox opponent throws them from
  // opposite sides. The card has to say which, not merely that a hook is coming.
  assert.deepEqual([...cues].sort((a, b) => a.start - b.start).map(c => c.side), ['left', 'right']);
});

test('the hand read follows stance, so switching invalidates it', () => {
  const southpaw = newMatch('pressure', 5, { player: fighterAt('orthodox'), opponent: fighterAt('southpaw') });
  const orthodox = newMatch('pressure', 5, { player: fighterAt('orthodox'), opponent: fighterAt('orthodox') });
  const plan = makePlan(['hook']);
  assert.equal(observe(plan, 'hand', orthodox)[0].side, sideOfHand('orthodox', 'lead'));
  assert.equal(observe(plan, 'hand', southpaw)[0].side, sideOfHand('southpaw', 'lead'));
  assert.notEqual(observe(plan, 'hand', orthodox)[0].side, observe(plan, 'hand', southpaw)[0].side);
});

test('open guard makes the lead hook a cheaper mistake to step into', () => {
  // The reason a side step should come alive in open guard: the lead hook is weakened, so the
  // opponent throws it less AND it punishes a wrong step less. Both sides of the read improve
  // at once, and nothing had to be written to say so — it falls out of the impact modifier.
  const steppedInto = (theirs) => {
    const match = newMatch('pressure', 5, { player: fighterAt('orthodox'), opponent: fighterAt(theirs) });
    // Their lead hand comes from sideOfHand(theirs,'lead'); stepping toward it is the mistake.
    const wrong = sideOfHand(theirs, 'lead') === 'left' ? 'sidestep_right' : 'sidestep_left';
    const hit = hits(resolveTurn(match, makePlan([wrong]), makePlan(['hook']))).find(e => e.actor === 1);
    assert.ok(hit && hit.steppedInto, `${wrong}이 앞손 훅에 응징되지 않았습니다`);
    return hit.power;
  };
  assert.ok(steppedInto('southpaw') < steppedInto('orthodox'),
    '오픈 가드에서 앞손 훅으로 인한 응징이 더 싸지지 않습니다');
});
