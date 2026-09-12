// Weekly calendar, training load and growth. Roadmap Phase 5.
// Spec: docs/design/13_fight_camp_and_weekly_calendar.md, current_decisions sections 12 and 21.
// Training is limited by schedule, load and recovery rather than an arbitrary activity count,
// and the potential ceiling is soft: efficiency collapses near it but never reaches zero.

import { ALL_BASE_PARAMETERS, BASE_PARAMETERS } from './fighter-schema.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

const APTITUDE_OF = {};
for (const [group, names] of Object.entries(BASE_PARAMETERS)) {
  const key = { physical: 'physical_aptitude', striking: 'striking_aptitude', grappling: 'grappling_aptitude', intelligence: 'combat_intelligence_aptitude' }[group];
  for (const name of names) APTITUDE_OF[name] = key;
}

export function createTrainingState(overrides = {}) {
  return {
    week: overrides.week ?? 0,
    recovery_debt: overrides.recovery_debt ?? 0,
    stress: overrides.stress ?? 0,
    sharpness: overrides.sharpness ?? 0,
    technique_exp: { ...(overrides.technique_exp ?? {}) },
    breakthrough_progress: overrides.breakthrough_progress ?? 0
  };
}

// Potential is never a hard cap. Growth efficiency collapses near the ceiling and keeps a
// small floor, so a fighter at the limit crawls rather than stops.
export function proximityFactor(current, ceiling, definitions) {
  const cfg = definitions.configs.training.growth;
  const room = clamp((ceiling - current) / Math.max(ceiling, 1), 0, 1);
  return Math.max(Math.pow(room, cfg.proximity_exponent), 0.02);
}

export function weeklyCapacity(fighter, definitions) {
  const cfg = definitions.configs.training.recovery_debt;
  const cardio = clamp(fighter.base.cardio / 100, 0, 1);
  let capacity = cfg.weekly_capacity_base * (1 - cfg.cardio_weight + cfg.cardio_weight * 2 * cardio);
  const over = Math.max(0, fighter.body.age - cfg.age_threshold);
  capacity *= Math.max(1 - cfg.age_penalty_per_year_over * over, 0.2);
  return capacity;
}

// Applies one week of scheduled activities. Returns the new state plus a cause trace.
export function runWeek(fighter, state, schedule, definitions, { potential } = {}) {
  const cfg = definitions.configs.training;
  if (schedule.length > cfg.week.slots) throw Error(`주간 활동은 최대 ${cfg.week.slots}개입니다`);
  for (const id of schedule) if (!cfg.activities[id]) throw Error(`알 수 없는 활동: ${id}`);

  const next = createTrainingState(state);
  next.week = state.week + 1;

  let load = 0, stress = 0, recovery = 0, growthUnits = 0, techniqueUnits = 0, sharpness = 0, injuryRisk = 0;
  for (const id of schedule) {
    const a = cfg.activities[id];
    load += a.load; stress += a.stress; recovery += a.recovery;
    growthUnits += a.growth; techniqueUnits += a.techniqueExp; sharpness += a.sharpness;
    injuryRisk += a.injuryRisk;
  }

  const capacity = weeklyCapacity(fighter, definitions);
  const debtDelta = load - capacity - recovery;
  next.recovery_debt = clamp(state.recovery_debt + debtDelta, 0, cfg.recovery_debt.max);
  next.stress = clamp(state.stress + stress, 0, 100);
  next.sharpness = clamp(state.sharpness + sharpness, 0, 100);

  // Debt and stress suppress growth, but none of these is allowed to reach zero: the spec's
  // limits are curves, not cliffs. Over-training makes progress crawl, it does not end it.
  const FLOOR = 0.05;
  const debtPenalty = Math.max(FLOOR, 1 - cfg.growth.debt_penalty * next.recovery_debt);
  const stressPenalty = Math.max(FLOOR, 1 - cfg.growth.stress_penalty * (next.stress / 10));
  const ageOver = Math.max(0, fighter.body.age - cfg.growth.age_decline_start);
  const agePenalty = Math.max(1 - cfg.growth.age_decline_per_year * ageOver, FLOOR);

  const gains = {};
  for (const name of ALL_BASE_PARAMETERS) {
    const aptitude = potential?.[APTITUDE_OF[name]] ?? potential?.overall_talent ?? 50;
    const ceiling = potential?.ceilings?.[name] ?? 100;
    const proximity = proximityFactor(fighter.base[name], ceiling, definitions);
    const gain = cfg.growth.base_rate * growthUnits * (aptitude / 100) * cfg.growth.aptitude_weight
      * proximity * debtPenalty * stressPenalty * agePenalty;
    gains[name] = gain;
  }

  next.technique_exp = { ...state.technique_exp };
  const techniqueGain = techniqueUnits * cfg.technique_exp.training_unit;

  return {
    state: next,
    gains,
    techniqueGain,
    trace: { load, capacity, debtDelta, debtPenalty, stressPenalty, agePenalty, injuryRisk }
  };
}

export function applyGains(fighter, gains) {
  const base = { ...fighter.base };
  for (const [name, gain] of Object.entries(gains)) base[name] = clamp(base[name] + gain, 0, 100);
  return { ...fighter, base: Object.freeze(base) };
}

// Real fights teach far more than training, and finishing with a technique teaches most.
export function matchTechniqueExp(usage, definitions, { finishedWith = null } = {}) {
  const cfg = definitions.configs.training.technique_exp;
  const out = {};
  for (const [techniqueId, count] of Object.entries(usage)) {
    out[techniqueId] = count * cfg.training_unit * cfg.match_multiplier;
  }
  if (finishedWith) out[finishedWith] = (out[finishedWith] ?? 0) + cfg.finish_bonus;
  return out;
}

export function addTechniqueExp(state, gains) {
  const merged = { ...state.technique_exp };
  for (const [id, value] of Object.entries(gains)) merged[id] = (merged[id] ?? 0) + value;
  return { ...state, technique_exp: merged };
}

// Breakthrough is tracked internally and never shown as a progress bar.
export function addAdversity(state, definitions, { kind = 'adversity', proximity = 0 } = {}) {
  const cfg = definitions.configs.training.breakthrough;
  if (proximity < cfg.proximity_required) return { state, broke: false };
  const gain = kind === 'upset' ? cfg.upset_gain : cfg.adversity_gain;
  const progress = state.breakthrough_progress + gain;
  if (progress >= cfg.threshold) return { state: { ...state, breakthrough_progress: 0 }, broke: true };
  return { state: { ...state, breakthrough_progress: progress }, broke: false };
}
