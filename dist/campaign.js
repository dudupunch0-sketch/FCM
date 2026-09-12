// Full Part 1 to Part 2 progression. Roadmap Milestone C.
// Spec: docs/design/17_part1_part2_progression_and_completion.md.
// Part 1 start -> club champion -> outside-champion reveal fight -> international entry ->
// ranking -> contender -> international champion. Narrative completion, then sandbox.

import { startCareer, trainWeek, takeFight, restWeek, fightReadiness } from './career.js';
import { createClub, makeOffer, applyResult, availableOpponents, part1Gate, nextTicketPower } from './club.js';
import { createWorld, applyFightResult, rankOf, isChampion, titleEligibility, titleShotPriority, simulateWeek } from './world.js';
import { createLedger, payPurse, weeklyCosts, createFacilities } from './organisation.js';

export const PART1 = 'part1';
export const PART2 = 'part2';
export const COMPLETE = 'complete';

export function startCampaign(definitions, rng, spec) {
  const club = createClub(definitions, rng);
  return {
    definitions,
    rng,
    part: PART1,
    week: 0,
    career: startCareer(definitions, spec),
    club,
    world: null,
    ledger: createLedger(definitions),
    facilities: createFacilities(definitions),
    fighterState: { rung: 'newcomer', record: { wins: 0, losses: 0 }, ticket_power: definitions.configs.world.ticket_power.start, streak: 0 },
    contractShare: spec.share ?? definitions.configs.world.contract.management_share.default,
    plan: spec.plan ?? DEFAULT_PLAN,
    history: [],
    lastFightWeek: -definitions.configs.world.club.fight_interval_weeks,
    completedWeek: null
  };
}

const camp = ['technical_training', 'sparring', 'tactical_drill', 'recovery'];
// Stands in for the player's tactical choices. A campaign may supply its own.
const DEFAULT_PLAN = ['sway', 'body', 'cross', 'rest'];

function note(campaign, entry) {
  campaign.history.push({ week: campaign.week, part: campaign.part, ...entry });
}

// Part 1: climb the one visible club ladder.
function clubFight(campaign, { titleFight = false } = {}) {
  campaign.lastFightWeek = campaign.week;
  const pool = availableOpponents(campaign.club, campaign.fighterState.rung);
  // Match on ability rather than roster order. Picking the first name on the list made the
  // step between fights arbitrary, so a fighter bounced between trivial and impossible cards.
  const ability = campaign.career.fighter.base.punch_technique;
  const opponent = titleFight
    ? campaign.club.roster.find(f => f.id === campaign.club.championId)
    : pool.filter(f => f.id !== campaign.club.championId)
        .sort((a, b) => Math.abs(a.level - ability) - Math.abs(b.level - ability))[0] ?? pool[0];
  const offer = makeOffer(campaign.club, opponent, { week: campaign.week, titleFight });

  const result = takeFight(campaign.career, { seed: campaign.week + 1, profile: opponent.profile ?? 'pressure', plan: campaign.plan, opponent: { base: { punch_technique: opponent.level } } });
  campaign.career = result.career;
  const won = result.match.winner === 0;
  const finished = result.match.method === 'KO' && won;

  payPurse(campaign.definitions, campaign.ledger, {
    fighterId: campaign.career.fighter.id, purse: offer.purse, share: campaign.contractShare, won, finished, offer
  });
  campaign.fighterState = applyResult(campaign.club, campaign.fighterState, { won, finished, upset: false, greatFight: !won, offer });
  note(campaign, { type: 'club_fight', opponent: opponent.id, won, method: result.match.method, rung: campaign.fighterState.rung });
  return { won, finished };
}

// The reveal fight is what first shows the wider world.
function revealFight(campaign) {
  campaign.lastFightWeek = campaign.week;
  const result = takeFight(campaign.career, { seed: campaign.week + 77, plan: campaign.plan, opponent: { base: { punch_technique: 78 } } });
  campaign.career = result.career;
  const won = result.match.winner === 0;
  note(campaign, { type: 'reveal_fight', won });
  if (won) {
    campaign.part = PART2;
    campaign.world = createWorld(campaign.definitions, campaign.rng);
    campaign.world.fighters[campaign.career.fighter.id] = {
      id: campaign.career.fighter.id, name: campaign.career.fighter.name,
      level: campaign.career.fighter.base.punch_technique, age: campaign.career.fighter.body.age,
      ticket_power: campaign.fighterState.ticket_power, record: { ...campaign.fighterState.record },
      recent: [], damage: 0, active: true, last_fight_week: 0, tier: 'A'
    };
    note(campaign, { type: 'international_entry' });
  } else {
    // A loss never permanently blocks the save; the challenge can be retaken.
    note(campaign, { type: 'reveal_retry_available' });
  }
  return won;
}

// Part 2: ranked fights, then eligibility, then the belt.
function worldFight(campaign, { titleFight = false } = {}) {
  campaign.lastFightWeek = campaign.week;
  const world = campaign.world;
  const me = campaign.career.fighter.id;
  const opponentId = titleFight
    ? world.ranking.champion_id
    : world.ranking.ordered.find(id => id !== me) ?? world.ranking.champion_id;
  const opponent = world.fighters[opponentId];

  const profiles = ['pressure', 'tricky', 'turtle'];
  const result = takeFight(campaign.career, { seed: campaign.week + 31, profile: profiles[opponentId.length % 3], plan: campaign.plan, opponent: { base: { punch_technique: opponent.level } } });
  campaign.career = result.career;
  const won = result.match.winner === 0;
  const finished = result.match.method === 'KO' && won;

  if (!world.fighters[me].recent) world.fighters[me].recent = [];
  applyFightResult(world, { winnerId: won ? me : opponentId, loserId: won ? opponentId : me, finished });
  world.fighters[me].ticket_power = nextTicketPower(campaign.definitions, world.fighters[me].ticket_power,
    { won, finished, title: titleFight && won, greatFight: !won });
  note(campaign, { type: 'world_fight', opponent: opponentId, won, title: titleFight, rank: rankOf(world, me) });

  if (titleFight && won) {
    campaign.part = COMPLETE;
    campaign.completedWeek = campaign.week;
    note(campaign, { type: 'international_champion' });
  }
  return won;
}

export function ladderStage(campaign) {
  if (campaign.part === PART1) return campaign.fighterState.rung;
  if (campaign.part === COMPLETE) return 'international_champion';
  const world = campaign.world;
  const me = campaign.career.fighter.id;
  if (isChampion(world, me)) return 'international_champion';
  const rank = rankOf(world, me);
  if (rank === null) return 'unranked';
  if (rank <= campaign.definitions.configs.world.title.eligibility_min_rank) return 'contender';
  if (rank <= 8) return 'top_rank';
  return 'ranked';
}

// One week of the campaign: prepare, fight when ready, and let the world move regardless.
export function advanceWeek(campaign) {
  campaign.week++;
  campaign.career = trainWeek(campaign.career, camp);
  weeklyCosts(campaign.definitions, campaign.ledger, { facilities: campaign.facilities, inCamp: true });

  const ready = fightReadiness(campaign.career);
  // Fights sit months apart, matching the fight camp. Fighting every week would let damage
  // outrun recovery and turn every career into a slow decline regardless of training.
  const interval = campaign.definitions.configs.world.club.fight_interval_weeks;
  const rested = campaign.week - campaign.lastFightWeek >= interval;
  if (ready.label === 'Poor' || ready.label === 'Not Cleared' || !rested) {
    if (ready.label === 'Poor' || ready.label === 'Not Cleared') {
      campaign.career = restWeek(campaign.career);
      note(campaign, { type: 'rest', reasons: ready.reasons });
    }
  } else if (campaign.part === PART1) {
    const gate = part1Gate(campaign.fighterState);
    if (gate.reveal_fight_available) revealFight(campaign);
    else clubFight(campaign, { titleFight: campaign.fighterState.rung === 'top_challenger' });
  } else if (campaign.part === PART2) {
    const me = campaign.career.fighter.id;
    const eligible = titleEligibility(campaign.world, me).eligible;
    const priority = titleShotPriority(campaign.world, [me, ...campaign.world.ranking.ordered.slice(0, 4)]);
    const first = priority[0]?.id === me;
    worldFight(campaign, { titleFight: eligible && first });
  }

  if (campaign.world) simulateWeek(campaign.world, campaign.rng);
  return campaign;
}

export function runCampaign(campaign, maxWeeks = 400) {
  while (campaign.part !== COMPLETE && campaign.week < maxWeeks) advanceWeek(campaign);
  return campaign;
}

// Narrative completion does not end the save.
export function sandboxAvailable(campaign) {
  return campaign.part === COMPLETE;
}
