// Part 1 underground club, fight offers and ticket power. Roadmap Phase 7.
// Spec: docs/design/17_part1_part2_progression_and_completion.md, docs/design/15 sections 6 and 7.
// Exactly one club is visible to the player. Ticket power is public entertainment value and
// never a combat stat.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function createClub(definitions, rng, { size = null } = {}) {
  const cfg = definitions.configs.world.club;
  const count = size ?? cfg.pool_size;
  const roster = [];
  for (let i = 0; i < count; i++) {
    const level = 35 + Math.floor(rng.next() * 45);
    roster.push({
      id: `club_${i}`,
      name: `클럽 파이터 ${i + 1}`,
      level,
      rung: cfg.ladder[Math.min(cfg.ladder.length - 1, Math.floor(level / 20))],
      ticket_power: definitions.configs.world.ticket_power.start + Math.floor(rng.next() * 20),
      record: { wins: 0, losses: 0 },
      career_need: 'prospect',
      // Club fighters fight differently. A single profile would make one matchup decide
      // every card on the calendar.
      profile: ['pressure', 'tricky', 'turtle'][i % 3],
      base: { punch_technique: level }
    });
  }
  roster[0] = { ...roster[0], rung: 'champion', level: 82, name: '클럽 챔피언', profile: 'tricky' };
  return { definitions, roster, ladder: cfg.ladder, championId: roster[0].id, week: 0 };
}

export function rungIndex(club, rung) { return club.ladder.indexOf(rung); }

// Opponents come from the rung around the fighter: the ladder is what gates difficulty.
export function availableOpponents(club, fighterRung, { spread = 1 } = {}) {
  const index = rungIndex(club, fighterRung);
  // The generated roster may have no fighter on an adjacent rung. Widen until someone is
  // available rather than returning an empty card: a club always has a next opponent.
  for (let reach = spread; reach <= club.ladder.length; reach++) {
    const found = club.roster.filter(f => Math.abs(rungIndex(club, f.rung) - index) <= reach);
    if (found.length) return found;
  }
  return club.roster;
}

export function makeOffer(club, opponent, { week = 0, shortNotice = false, titleFight = false } = {}) {
  const cfg = club.definitions.configs.world.fight_offer;
  const tp = opponent.ticket_power ?? 0;
  let purse = cfg.base_purse + tp * cfg.purse_per_ticket_power;
  if (shortNotice) purse *= 1 + cfg.short_notice_purse_bonus;
  const risk = clamp(
    (opponent.level / 100) * cfg.risk_weights.opponent_level
    + (shortNotice ? cfg.risk_weights.short_notice : 0), 0, 2);
  return {
    opponent_id: opponent.id,
    opponent_level: opponent.level,
    week,
    purse: Math.round(purse),
    win_bonus: Math.round(purse * cfg.win_bonus_ratio),
    finish_bonus: Math.round(purse * cfg.finish_bonus_ratio),
    short_notice: shortNotice,
    title_fight: titleFight || opponent.id === club.championId,
    risk,
    opponent_ticket_power: tp
  };
}

// Ladder movement is earned by results, not bought.
export function applyResult(club, fighterState, { won, finished, upset, greatFight, offer }) {
  const cfg = club.definitions.configs.world;
  const ladder = club.ladder;
  const state = { ...fighterState, record: { ...fighterState.record } };
  if (won) { state.record.wins++; state.streak = (state.streak ?? 0) >= 0 ? (state.streak ?? 0) + 1 : 1; }
  else { state.record.losses++; state.streak = (state.streak ?? 0) <= 0 ? (state.streak ?? 0) - 1 : -1; }

  let index = rungIndex(club, state.rung);
  if (won && state.streak >= cfg.club.promotion_wins_required && index < ladder.length - 1) {
    if (!(ladder[index + 1] === 'champion' && !offer?.title_fight)) { index++; state.streak = 0; }
  }
  if (!won && -state.streak >= cfg.club.demotion_losses && index > 0) { index--; state.streak = 0; }
  state.rung = ladder[index];

  state.ticket_power = nextTicketPower(club.definitions, state.ticket_power ?? cfg.ticket_power.start, { won, finished, upset, greatFight });
  if (state.rung === 'champion' && won && offer?.title_fight) state.isChampion = true;
  return state;
}

// What matters is the story, not the result: a great loss can still raise ticket power,
// and a dull win can raise none at all.
export function nextTicketPower(definitions, current, { won, finished, upset, greatFight, title, performanceAward, weeksInactive = 0 }) {
  const cfg = definitions.configs.world.ticket_power;
  let value = current;
  if (won) value += finished ? cfg.finish_gain : greatFight ? cfg.win_gain + cfg.great_loss_gain : cfg.win_gain;
  else if (greatFight) value += cfg.great_loss_gain;
  if (!won && !greatFight) value += 0;
  if (won && !finished && !greatFight) value += cfg.dull_win_gain;
  if (upset) value += cfg.upset_gain;
  if (title) value += cfg.title_gain;
  if (performanceAward) value += cfg.performance_award_gain;
  value -= cfg.inactivity_decay_per_week * weeksInactive;
  return clamp(value, 0, cfg.max);
}

// Rivalry emerges from history. There is no button that creates one.
export function updateRivalry(rivalries, a, b, { closeFight, controversial, rematch, title }) {
  const key = [a, b].sort().join('|');
  const current = rivalries[key] ?? { fighter_a: a, fighter_b: b, progress: 0, sources: [] };
  let gain = 0;
  if (closeFight) { gain += 20; current.sources.push('close_fight'); }
  if (controversial) { gain += 25; current.sources.push('controversial_decision'); }
  if (rematch) { gain += 15; current.sources.push('rematch'); }
  if (title) { gain += 20; current.sources.push('title'); }
  current.progress = clamp(current.progress + gain, 0, 100);
  rivalries[key] = current;
  return current;
}

// Part 1 ends when the player's fighter becomes club champion and then faces an outside champion.
export function part1Gate(fighterState) {
  return {
    club_champion: fighterState.isChampion === true,
    reveal_fight_available: fighterState.isChampion === true,
    note: '외부 클럽 챔피언 특별전으로 더 넓은 세계가 드러난다'
  };
}
