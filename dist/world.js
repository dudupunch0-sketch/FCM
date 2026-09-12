// International circuit, ranking and world simulation. Roadmap Phases 10 and 11.
// Spec: docs/design/16_international_league_and_world_simulation.md, current_decisions 22 and 31.
// One unified ranking keyed by ruleset and weight division. NPC fighters live their careers
// whether or not the player is looking; simulation tier changes fidelity, never the data model.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function createWorld(definitions, rng, { division = 'middleweight', ruleset = 'boxing' } = {}) {
  const cfg = definitions.configs.world;
  const fighters = {};
  for (let i = 0; i < cfg.world.roster_per_division; i++) {
    const level = 40 + Math.floor(rng.next() * 55);
    fighters[`w${i}`] = {
      id: `w${i}`,
      name: `세계 파이터 ${i + 1}`,
      level,
      age: 22 + Math.floor(rng.next() * 12),
      ticket_power: Math.floor(rng.next() * 60),
      record: { wins: Math.floor(rng.next() * 15), losses: Math.floor(rng.next() * 6) },
      recent: [],
      damage: 0,
      active: true,
      last_fight_week: 0,
      tier: 'C'
    };
  }
  const ordered = Object.values(fighters).sort((a, b) => b.level - a.level).map(f => f.id);
  const promotions = [];
  for (let i = 0; i < cfg.world.promotions; i++) {
    promotions.push({ id: `promo${i}`, prestige: 40 + i * 20, region: ['east', 'west', 'south'][i % 3], budget_tier: i });
  }
  return {
    definitions,
    week: 0,
    ruleset,
    division,
    fighters,
    promotions,
    // Champion is a separate status from being number one.
    ranking: { ruleset, division, champion_id: ordered[0], ordered: ordered.slice(1, cfg.ranking.size + 1) },
    news: []
  };
}

export function rankOf(world, fighterId) {
  const index = world.ranking.ordered.indexOf(fighterId);
  return index === -1 ? null : index + 1;
}

export function isChampion(world, fighterId) { return world.ranking.champion_id === fighterId; }

// Internal score is allowed for ordering; it is never a player-facing resource.
function rankingScore(world, fighterId) {
  const cfg = world.definitions.configs.world.ranking;
  const fighter = world.fighters[fighterId];
  const rank = rankOf(world, fighterId) ?? cfg.size + 1;
  const inactive = world.week - (fighter?.last_fight_week ?? 0);
  return (cfg.size + 1 - rank) * 10 - inactive * cfg.inactivity_decay_per_week;
}

export function applyFightResult(world, { winnerId, loserId, finished = false }) {
  const cfg = world.definitions.configs.world.ranking;
  const winnerRank = rankOf(world, winnerId) ?? cfg.size + 1;
  const loserRank = rankOf(world, loserId) ?? cfg.size + 1;
  for (const id of [winnerId, loserId]) {
    const f = world.fighters[id];
    if (f) { f.last_fight_week = world.week; f.recent = [...f.recent.slice(-4), id === winnerId ? 'W' : 'L']; }
  }
  world.fighters[winnerId] && world.fighters[winnerId].record.wins++;
  world.fighters[loserId] && world.fighters[loserId].record.losses++;
  if (loserId === world.ranking.champion_id) {
    // Beating the champion takes the belt; the previous champion re-enters the ranking.
    world.ranking.champion_id = winnerId;
    world.ranking.ordered = [loserId, ...world.ranking.ordered.filter(id => id !== winnerId)].slice(0, cfg.size);
    world.news.push({ week: world.week, type: 'ChampionshipWon', fighter: winnerId });
    return world;
  }
  // Beating someone ranked above you moves you past them. Past rank is never simply copied.
  // The champion is never inserted into the ranking list: the belt is a separate status.
  if (winnerId !== world.ranking.champion_id && winnerRank > loserRank) {
    const ordered = world.ranking.ordered.filter(id => id !== winnerId);
    const target = Math.max(0, ordered.indexOf(loserId));
    ordered.splice(target, 0, winnerId);
    world.ranking.ordered = ordered.slice(0, cfg.size);
    world.news.push({ week: world.week, type: 'RankingChanged', fighter: winnerId });
  }
  if (finished) world.news.push({ week: world.week, type: 'Finish', fighter: winnerId });
  return world;
}

// Long inactivity drops a fighter down and can eventually remove them entirely.
export function decayInactive(world) {
  const cfg = world.definitions.configs.world.ranking;
  const kept = world.ranking.ordered.filter(id => {
    const f = world.fighters[id];
    if (!f) return false;
    const inactive = world.week - f.last_fight_week;
    if (inactive >= cfg.removal_after_weeks_inactive) {
      world.news.push({ week: world.week, type: 'RankingRemoved', fighter: id });
      return false;
    }
    return true;
  });
  world.ranking.ordered = kept.sort((a, b) => rankingScore(world, b) - rankingScore(world, a));
  return world;
}

// Number one does not automatically get a shot. Competitive eligibility comes first.
export function titleEligibility(world, fighterId) {
  const cfg = world.definitions.configs.world.title;
  const rank = rankOf(world, fighterId);
  const fighter = world.fighters[fighterId];
  const recentWins = (fighter?.recent ?? []).filter(r => r === 'W').length;
  const reasons = [];
  if (rank === null || rank > cfg.eligibility_min_rank) reasons.push(`랭킹 ${cfg.eligibility_min_rank}위 이내 필요`);
  if (recentWins < cfg.eligibility_min_recent_wins) reasons.push(`최근 ${cfg.eligibility_min_recent_wins}승 필요`);
  return { eligible: reasons.length === 0, reasons, rank, recentWins };
}

export function titleShotPriority(world, candidateIds) {
  const cfg = world.definitions.configs.world.title;
  return candidateIds
    .map(id => {
      const fighter = world.fighters[id];
      const rank = rankOf(world, id) ?? world.definitions.configs.world.ranking.size + 1;
      const recentWins = (fighter?.recent ?? []).filter(r => r === 'W').length;
      const score = (world.definitions.configs.world.ranking.size + 1 - rank) * cfg.priority_weights.rank
        + recentWins * cfg.priority_weights.recent_form
        + (fighter?.ticket_power ?? 0) / 10 * cfg.priority_weights.ticket_power
        + (fighter?.rivalry ?? 0) / 10 * cfg.priority_weights.rivalry;
      return { id, score, eligible: titleEligibility(world, id).eligible };
    })
    .filter(c => c.eligible)
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
}

// Tier changes update frequency and precision, never the data model itself.
export function setTier(world, fighterId, tier) {
  if (!(tier in world.definitions.configs.world.world.simulation_tiers)) throw Error(`알 수 없는 Simulation Tier: ${tier}`);
  world.fighters[fighterId].tier = tier;
  return world;
}

// The world moves without the player. NPCs fight, age, decline and retire.
export function simulateWeek(world, rng) {
  const cfg = world.definitions.configs.world;
  world.week++;
  const active = Object.values(world.fighters).filter(f => f.active);
  for (const fighter of active) {
    // Fidelity changes how precisely a tier is simulated, not whether it happens at all.
    // Gating it to near-zero would freeze the background world, which must keep moving.
    const fidelity = cfg.world.simulation_tiers[fighter.tier];
    if (rng.next() > 0.25 * (0.5 + 0.5 * fidelity)) continue;
    const opponent = active[Math.floor(rng.next() * active.length)];
    if (!opponent || opponent.id === fighter.id) continue;
    const winner = fighter.level + rng.next() * 20 >= opponent.level + rng.next() * 20 ? fighter : opponent;
    const loser = winner === fighter ? opponent : fighter;
    applyFightResult(world, { winnerId: winner.id, loserId: loser.id });
    loser.damage = clamp(loser.damage + 4, 0, 100);
  }
  if (world.week % cfg.world.weeks_per_year === 0) {
    for (const fighter of active) fighter.age++;
    intakeProspects(world, rng);
  }
  retireEligible(world);
  decayInactive(world);
  return world;
}

export function retireEligible(world) {
  const cfg = world.definitions.configs.world.world;
  for (const fighter of Object.values(world.fighters)) {
    if (!fighter.active) continue;
    if (fighter.age >= cfg.retirement_age || fighter.damage >= cfg.retirement_damage_threshold) {
      fighter.active = false;
      world.ranking.ordered = world.ranking.ordered.filter(id => id !== fighter.id);
      world.news.push({ week: world.week, type: 'Retirement', fighter: fighter.id });
    }
  }
  return world;
}

// New prospects keep arriving, and they arrive with a history rather than appearing on discovery.
export function intakeProspects(world, rng) {
  const cfg = world.definitions.configs.world.world;
  for (let i = 0; i < cfg.prospect_intake_per_year; i++) {
    const id = `p${world.week}_${i}`;
    const priorFights = Math.floor(rng.next() * 6);
    world.fighters[id] = {
      id, name: `신인 ${id}`, level: 30 + Math.floor(rng.next() * 30),
      age: 19 + Math.floor(rng.next() * 4), ticket_power: Math.floor(rng.next() * 10),
      record: { wins: priorFights, losses: Math.floor(rng.next() * 3) },
      recent: [], damage: 0, active: true, last_fight_week: world.week, tier: 'C'
    };
  }
  return world;
}
