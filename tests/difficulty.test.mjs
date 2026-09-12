// Difficulty tiers. Spec: docs/design/33_difficulty.md
// The load-bearing property is what difficulty must NOT touch.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {resolveDifficulty, tierNames, adjustOpponentLevel, adjustInterpreterSkill, adjustReach} from '../dist/difficulty.js';
import {newMatch, makePlan, opponentPlan, resolveTurn} from '../dist/engine.js';
import {createClub} from '../dist/club.js';
import {createScoutingState, discover, recruitmentReport} from '../dist/scouting.js';
import {startCampaign, advanceWeek} from '../dist/campaign.js';
import {createRngSet} from '../dist/rng.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });
const hero = () => ({
  id: 'hero', name: '주인공', base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 62])),
  body: { natural_weight: 75, current_weight: 75, age: 22, stance: 'orthodox' },
  potential: { overall_talent: 85, physical_aptitude: 82, striking_aptitude: 88, grappling_aptitude: 70, combat_intelligence_aptitude: 82 }
});

test('difficulty never changes how a fight resolves', () => {
  // The project's position is that randomness creates variation, not causation. If a tier
  // could touch the fight maths, a result would stop being explainable by the matchup.
  const fight = () => {
    let m = newMatch('pressure', 11, { player: evenly(58), opponent: evenly(63) });
    const trace = [];
    while (!m.finished) {
      const r = resolveTurn(m, makePlan(['sway', 'body', 'cross', 'rest']), opponentPlan(m));
      trace.push(r.frames.flatMap(f => f.events).filter(e => e.type === 'hit').map(e => e.power));
      m = r.match;
    }
    return { trace, winner: m.winner, method: m.method, turn: m.turn };
  };
  const baseline = fight();
  for (const tier of tierNames(definitions)) {
    resolveDifficulty(definitions, tier);
    assert.deepEqual(fight(), baseline, `${tier} 등급이 전투 판정을 바꿨습니다`);
  }
});

test('the config forbids tuning combat, randomness or judging by tier', () => {
  const forbidden = definitions.configs.difficulty.principle.never_adjusts;
  for (const key of ['combat_resolution', 'randomness', 'judging']) assert.ok(forbidden.includes(key), key);
});

test('the baseline tier is neutral, so measured balance describes it', () => {
  const base = resolveDifficulty(definitions, definitions.configs.difficulty.default_tier);
  assert.equal(base.opponent_level_offset, 0);
  assert.equal(base.opponent_level_spread, 1);
  assert.equal(base.start_cash_multiplier, 1);
  assert.equal(base.overhead_multiplier, 1);
});

test('an unknown tier is refused and names the valid ones', () => {
  assert.throws(() => resolveDifficulty(definitions, 'impossible'), /알 수 없는 난이도/);
  assert.throws(() => resolveDifficulty(definitions, 'impossible'), /standard/);
});

test('harder tiers field stronger club opponents', () => {
  const levels = tier => {
    const club = createClub(definitions, createRngSet(5, definitions).stream('world_generation'), { difficulty: resolveDifficulty(definitions, tier) });
    return club.roster.reduce((n, f) => n + f.level, 0) / club.roster.length;
  };
  const easy = levels('apprentice'), base = levels('standard'), hard = levels('brutal');
  assert.ok(easy < base, `입문이 더 쉽지 않습니다: ${easy} vs ${base}`);
  assert.ok(hard > base, `가혹이 더 어렵지 않습니다: ${hard} vs ${base}`);
  assert.ok(base > 0 && hard <= 100);
});

test('opponent levels stay inside the legal range at every tier', () => {
  for (const tier of tierNames(definitions)) {
    const d = resolveDifficulty(definitions, tier);
    for (const raw of [1, 35, 57, 80, 100]) {
      const level = adjustOpponentLevel(raw, d);
      assert.ok(level >= 1 && level <= 100, `${tier}: ${raw} -> ${level}`);
    }
  }
});

test('an easy tier sharpens interpretation rather than inventing facts', () => {
  const report = tier => {
    const state = createScoutingState(definitions, { difficulty: resolveDifficulty(definitions, tier) });
    const fighter = { id: 'f1', name: 'f', ticket_power: 60, base: { punch_technique: 70 }, potential: { overall_talent: 80 } };
    discover(state, fighter, 'scout_report', { week: 0 });
    return recruitmentReport(state, fighter, { interpreterSkill: 0.2, week: 0 });
  };
  const easy = report('apprentice'), hard = report('brutal');
  const width = r => r.current_level.high - r.current_level.low;
  assert.ok(width(easy) < width(hard), `입문에서 추정이 좁아지지 않습니다: ${width(easy)} vs ${width(hard)}`);
  // The true value is untouched; only the estimate around it changes.
  assert.ok(easy.current_level.low <= 70 && easy.current_level.high >= 70, '참값이 추정 범위 밖입니다');
});

test('interpreter floor lifts a weak analyst but never caps a strong one', () => {
  const easy = resolveDifficulty(definitions, 'apprentice');
  assert.ok(adjustInterpreterSkill(0.1, easy) > 0.1, '바닥이 적용되지 않았습니다');
  assert.equal(adjustInterpreterSkill(0.95, easy), 0.95, '유능한 해석자를 깎았습니다');
  const hard = resolveDifficulty(definitions, 'brutal');
  assert.equal(adjustInterpreterSkill(0.5, hard), 0.5, '가혹 등급이 해석자를 직접 깎습니다');
  assert.ok(adjustReach(0.7, hard) < 0.7, '가혹 등급의 탐색 범위가 줄지 않았습니다');
});

test('a campaign records its tier and starts with tier-appropriate money', () => {
  const easy = startCampaign(definitions, createRngSet(3, definitions).stream('world_generation'), hero(), { difficulty: 'apprentice' });
  const hard = startCampaign(definitions, createRngSet(3, definitions).stream('world_generation'), hero(), { difficulty: 'brutal' });
  assert.equal(easy.difficulty.id, 'apprentice');
  assert.ok(easy.ledger.management_cash > hard.ledger.management_cash);
});

test('a harder tier drains money faster over the same weeks', () => {
  const spend = tier => {
    const c = startCampaign(definitions, createRngSet(9, definitions).stream('world_generation'), hero(), { difficulty: tier });
    const start = c.ledger.management_cash;
    for (let i = 0; i < 10; i++) advanceWeek(c);
    return start - c.ledger.management_cash;
  };
  assert.ok(spend('brutal') > spend('apprentice'), '난이도가 운영 압박을 바꾸지 않습니다');
});

test('every tier is playable: none makes the club unreachable or trivial', () => {
  for (const tier of tierNames(definitions)) {
    const club = createClub(definitions, createRngSet(2, definitions).stream('world_generation'), { difficulty: resolveDifficulty(definitions, tier) });
    const levels = club.roster.map(f => f.level);
    assert.ok(Math.min(...levels) < 60, `${tier}: 가장 약한 상대가 너무 강합니다`);
    assert.ok(Math.max(...levels) > 50, `${tier}: 가장 강한 상대가 너무 약합니다`);
  }
});
