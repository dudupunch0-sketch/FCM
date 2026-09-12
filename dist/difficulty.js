// Difficulty tiers.
// Spec: docs/design/33_difficulty.md.
// Difficulty adjusts the world you face and how clearly you can see it. It never touches
// combat resolution, randomness or judging, so the same fighters with the same plans and
// seed resolve identically on every tier.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function tierNames(definitions) {
  return Object.keys(definitions.configs.difficulty.tiers);
}

export function resolveDifficulty(definitions, tier = null) {
  const cfg = definitions.configs.difficulty;
  const name = tier ?? cfg.default_tier;
  const spec = cfg.tiers[name];
  if (!spec) throw Error(`알 수 없는 난이도: ${name}. 사용 가능: ${tierNames(definitions).join(', ')}`);
  return Object.freeze({ id: name, ...spec });
}

// Club opponents. Offset moves the whole field; spread widens or narrows it around the middle.
export function adjustOpponentLevel(level, difficulty, { midpoint = 57 } = {}) {
  const spread = midpoint + (level - midpoint) * difficulty.opponent_level_spread;
  return clamp(Math.round(spread + difficulty.opponent_level_offset), 1, 100);
}

export function adjustChampionLevel(level, difficulty) {
  return clamp(Math.round(level + difficulty.champion_level_offset), 1, 100);
}

// Information quality. A generous tier does not invent truth; it raises the quality of the
// interpreter and how much evidence a scouting action yields, which is the honest lever.
export function adjustInterpreterSkill(skill, difficulty) {
  return clamp(Math.max(skill, difficulty.interpreter_skill_floor), 0, 1);
}

export function adjustReach(reach, difficulty) {
  return clamp(reach * difficulty.scouting_reach_multiplier, 0, 1);
}

export function adjustEvidenceStrength(strength, difficulty) {
  return clamp(strength * difficulty.evidence_strength_multiplier, 0, 1);
}

export function adjustStartCash(cash, difficulty) {
  return Math.round(cash * difficulty.start_cash_multiplier);
}

export function adjustOverhead(cost, difficulty) {
  return Math.round(cost * difficulty.overhead_multiplier);
}

export function adjustIntake(count, difficulty) {
  return Math.max(1, Math.round(count * difficulty.prospect_intake_multiplier));
}
