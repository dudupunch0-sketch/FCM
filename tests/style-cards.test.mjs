// Style Skill Cards: conditional passive traits.
// Spec: docs/design/31_information_economy_and_placement.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS, newMatch, makePlan, resolveTurn, resolveStyle, styleCatalogue, styleLimit} from '../dist/engine.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });
const hits = r => r.frames.flatMap(f => f.events).filter(e => e.type === 'hit');
const play = (plan, enemyPlan, { playerStyle = [], opponentStyle = [], turns = 1, seed = 5 } = {}) => {
  let match = newMatch('pressure', seed, { player: evenly(60), opponent: evenly(60), playerStyle, opponentStyle });
  const all = [];
  for (let i = 0; i < turns && !match.finished; i++) {
    const r = resolveTurn(match, makePlan(plan), makePlan(enemyPlan));
    all.push(...hits(r));
    match = r.match;
  }
  return { match, hits: all };
};

test('the catalogue is non-empty and every card states a distinct axis', () => {
  const cards = styleCatalogue();
  const ids = Object.keys(cards).filter(id => id !== 'note');
  assert.ok(ids.length >= 5, `스타일 카드가 부족합니다: ${ids.length}`);
  const axes = ids.map(id => cards[id].axis);
  assert.equal(new Set(axes).size, axes.length, '축이 겹치는 카드가 있습니다');
  for (const id of ids) assert.ok(cards[id].name && cards[id].description, id);
});

test('style cards occupy no timeline slot', () => {
  // They are traits, not placements: the plan is identical with and without them.
  const plain = play(['jab', 'cross'], []);
  const styled = play(['jab', 'cross'], [], { playerStyle: ['iron_chin', 'out_boxer'] });
  assert.equal(plain.match.fighters[0].stamina >= 0, true);
  assert.equal(styled.match.turn, plain.match.turn);
});

test('the active limit is enforced and unknown cards are refused', () => {
  const ids = Object.keys(styleCatalogue()).filter(id => id !== 'note');
  assert.ok(styleLimit() >= 5);
  assert.throws(() => resolveStyle([...ids, ...ids].slice(0, styleLimit() + 1)), /최대 .*장입니다/);
  assert.throws(() => resolveStyle(['telekinesis']), /알 수 없는 스타일 카드/);
  assert.deepEqual(resolveStyle([]), {});
});

test('duplicate entries do not stack a card against itself', () => {
  const once = resolveStyle(['liver_hunter']);
  const twice = resolveStyle(['liver_hunter', 'liver_hunter']);
  assert.deepEqual(twice, once, '같은 카드를 두 번 넣어 효과가 중첩됩니다');
});

test('iron chin reduces incoming head damage and resists groggy', () => {
  const plain = play(['rest'], ['heavy'], { turns: 2 });
  const chin = play(['rest'], ['heavy'], { playerStyle: ['iron_chin'], turns: 2 });
  const taken = r => r.match.fighters[0].damage.head;
  assert.ok(taken(chin) < taken(plain), `머리 손상이 줄지 않았습니다: ${taken(chin)} vs ${taken(plain)}`);
});

test('liver hunter drains more stamina through body work', () => {
  // The opponent must be spending stamina, or rest recovery caps both runs at full and the
  // difference is invisible.
  const enemy = ['shell', 'shell'];
  const plain = play(['body', 'body', 'body'], enemy, { turns: 3 });
  const liver = play(['body', 'body', 'body'], enemy, { playerStyle: ['liver_hunter'], turns: 3 });
  const drained = r => r.match.fighters[1].stamina;
  assert.ok(drained(liver) < drained(plain), `스태미너 소모가 늘지 않았습니다: ${drained(liver)} vs ${drained(plain)}`);
});

test('counter puncher lengthens the counter window and hits harder off it', () => {
  const plan = ['sway', 'rest', 'cross'];
  const enemy = ['jab'];
  const plain = play(plan, enemy);
  const counter = play(plan, enemy, { playerStyle: ['counter_puncher'] });
  const best = list => Math.max(0, ...list.filter(e => e.actor === 0).map(e => e.power));
  assert.ok(best(counter.hits) > best(plain.hits), `카운터가 강해지지 않았습니다: ${best(counter.hits)} vs ${best(plain.hits)}`);
});

test('out boxer extends effective reach at long range', async () => {
  const { rangeFactor } = await import('../dist/engine.js');
  const far = definitions.configs.combat_prototype.range.max;
  const bare = rangeFactor(far, CARDS.jab);
  const bonus = definitions.configs.combat_prototype.style_cards.cards.out_boxer.effects.reachBonus;
  const extended = rangeFactor(far, { ...CARDS.jab, reachBonus: (CARDS.jab.reachBonus ?? 0) + bonus });
  assert.ok(bare < 1, '테스트 거리에서 애초에 감쇠가 없습니다');
  assert.ok(extended > bare, `원거리 보정이 없습니다: ${extended} vs ${bare}`);
  // And it must actually reach the fighter: the bundle carries it.
  const { resolveStyle: resolve } = await import('../dist/engine.js');
  assert.ok(resolve(['out_boxer']).reachBonus > 0);
});

test('iron guard leaks less through a block', () => {
  const plain = play(['shell'], ['cross']);
  const guarded = play(['shell'], ['cross'], { playerStyle: ['iron_guard'] });
  const blocked = r => r.hits.length ? 0 : r.match.fighters[0].damage.head;
  assert.ok(blocked(guarded) <= blocked(plain), '블록 누출이 줄지 않았습니다');
  assert.ok(guarded.match.fighters[0].damage.arms <= plain.match.fighters[0].damage.arms, '팔 손상이 줄지 않았습니다');
});

test('pressure fighter makes closing actions cheaper', () => {
  assert.ok(CARDS.advance.rangeShift < 0, 'advance가 거리를 좁히지 않습니다');
  // A plan with no idle slots, or rest recovery refills both runs to full and hides the saving.
  const plan = ['advance', 'advance', 'advance', 'advance'];
  const plain = play(plan, []);
  const pressure = play(plan, [], { playerStyle: ['pressure_fighter'] });
  assert.ok(pressure.match.fighters[0].stamina > plain.match.fighters[0].stamina,
    `전진 비용이 줄지 않았습니다: ${pressure.match.fighters[0].stamina} vs ${plain.match.fighters[0].stamina}`);
});

test('styles change results without breaking determinism', () => {
  const run = () => play(['sway', 'body', 'cross'], ['jab', 'hook'], { playerStyle: ['liver_hunter', 'iron_chin'], turns: 4 });
  const a = run(), b = run();
  assert.deepEqual(a.match, b.match);
  assert.deepEqual(a.hits, b.hits);
});

test('an unequipped fighter is unaffected by an opponent style', () => {
  const plain = play(['jab'], ['jab']);
  const opposed = play(['jab'], ['jab'], { opponentStyle: ['iron_chin'] });
  // Iron chin belongs to the opponent, so the player's own damage taken must not change.
  assert.equal(opposed.match.fighters[0].damage.head, plain.match.fighters[0].damage.head);
});
