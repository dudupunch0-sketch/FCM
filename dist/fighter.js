// Fighter True State and the Base -> Derived -> Effective computation. Roadmap Phase 1.
// Spec: docs/design/24_base_to_derived_mapping.md, docs/design/25_effective_performance.md.
// Derived is the baseline ability of an undamaged, unfatigued fighter. Everything about the
// current moment belongs to Effective, and neither is ever persisted.

import { ALL_BASE_PARAMETERS, DERIVED_CAPABILITIES, BODY_PARTS } from './fighter-schema.js';

export const ANATOMICAL_PARTS = Object.freeze(['head', 'body', 'left_arm', 'right_arm', 'left_leg', 'right_leg']);
export const STANCES = Object.freeze(['orthodox', 'southpaw']);

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function createFighter(spec) {
  const base = {};
  for (const name of ALL_BASE_PARAMETERS) {
    const value = spec.base?.[name];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
      throw Error(`Base Parameter ${name}은 0~100 숫자여야 합니다: ${value}`);
    }
    base[name] = value;
  }
  const stance = spec.body?.stance ?? 'orthodox';
  if (!STANCES.includes(stance)) throw Error(`알 수 없는 스탠스: ${stance}`);
  return Object.freeze({
    id: spec.id,
    name: spec.name,
    base: Object.freeze(base),
    body: Object.freeze({
      height: spec.body?.height ?? 180,
      reach: spec.body?.reach ?? 183,
      natural_weight: spec.body?.natural_weight ?? 75,
      current_weight: spec.body?.current_weight ?? spec.body?.natural_weight ?? 75,
      age: spec.body?.age ?? 24,
      stance
    })
  });
}

export function createCondition(overrides = {}) {
  const damage = {};
  for (const part of ANATOMICAL_PARTS) damage[part] = overrides.body_damage?.[part] ?? 0;
  const stance = overrides.stance ?? 'orthodox';
  if (!STANCES.includes(stance)) throw Error(`알 수 없는 스탠스: ${stance}`);
  return {
    stamina: overrides.stamina ?? 100,
    body_damage: damage,
    stance,
    weight_stress: overrides.weight_stress ?? 0,
    rule_familiarity: overrides.rule_familiarity ?? 1,
    head_wear: overrides.head_wear ?? 0
  };
}

// Orthodox leads with the left side; southpaw mirrors it. Stance is a mapping here, not a
// bonus, so it does not conflict with doc 24 excluding stance from Derived.
export function resolveStance(damage, stance) {
  const lead = stance === 'southpaw' ? 'right' : 'left';
  const rear = lead === 'left' ? 'right' : 'left';
  return {
    head: damage.head ?? 0,
    body: damage.body ?? 0,
    lead_arm: damage[`${lead}_arm`] ?? 0,
    rear_arm: damage[`${rear}_arm`] ?? 0,
    lead_leg: damage[`${lead}_leg`] ?? 0,
    rear_leg: damage[`${rear}_leg`] ?? 0
  };
}

function bodySourceValue(source, fighter, context) {
  const spec = context.bodySources[source];
  const [lo, hi] = spec.clamp ?? [0, Infinity];
  if (source === 'mass_ratio') return clamp(fighter.body.current_weight / context.referenceWeight, lo, hi);
  if (source === 'height_ratio') return clamp(fighter.body.height / context.referenceHeight, lo, hi);
  throw Error(`알 수 없는 body_source: ${source}`);
}

// Weighted geometric mean, not a weighted sum. A single weak base drags the whole capability
// down; the two forms agree for a balanced fighter and diverge only under imbalance.
export function computeDerived(fighter, definitions, { referenceWeight = null, referenceHeight = 180 } = {}) {
  const cfg = definitions.configs.derived_capability;
  const { base_floor: floor, base_ceiling: ceiling } = cfg.formula;
  const context = {
    bodySources: cfg.body_sources,
    referenceWeight: referenceWeight ?? fighter.body.natural_weight,
    referenceHeight
  };
  const out = {};
  for (const name of DERIVED_CAPABILITIES) {
    const spec = cfg.capabilities[name];
    let logSum = 0;
    for (const [param, weight] of Object.entries(spec.weights)) {
      logSum += weight * Math.log(clamp(fighter.base[param], floor, ceiling));
    }
    let value = Math.exp(logSum);
    for (const mod of spec.body_modifiers ?? []) {
      value *= Math.pow(bodySourceValue(mod.source, fighter, context), mod.exponent);
    }
    out[name] = value;
  }
  return Object.freeze(out);
}

function staminaFactor(cfg, stamina, maxLoss) {
  const { plateau, floor, curve_exponent } = cfg.stamina;
  const deficit = clamp((plateau - stamina) / (plateau - floor), 0, 1);
  return 1 - maxLoss * Math.pow(deficit, curve_exponent);
}

function damageFactor(cfg, damage, maxLoss) {
  const { scale, curve_exponent } = cfg.body_damage;
  return 1 - maxLoss * Math.pow(clamp(damage / scale, 0, 1), curve_exponent);
}

// Multiplicative per-capability sensitivity. A single global factor would make every ability
// fall at the same rate and erase the cardio-pressure / cardio-defensive distinction.
export function computeEffective(derived, condition, definitions) {
  const cfg = definitions.configs.effective_performance;
  const floor = cfg.formula.factor_floor;
  const parts = resolveStance(condition.body_damage, condition.stance ?? 'orthodox');
  const out = {};
  const traces = {};
  for (const name of DERIVED_CAPABILITIES) {
    const factors = { stamina: staminaFactor(cfg, condition.stamina, cfg.stamina.max_loss[name]) };
    for (const part of BODY_PARTS) {
      const maxLoss = cfg.body_damage.parts[part]?.[name];
      if (maxLoss) factors[part] = damageFactor(cfg, parts[part], maxLoss);
    }
    if (condition.weight_stress) factors.weight = 1 - cfg.weight_stress.global_derived_penalty * clamp(condition.weight_stress, 0, 1);
    if (condition.rule_familiarity < 1) factors.familiarity = 1 - cfg.rule_familiarity.global_derived_penalty * (1 - clamp(condition.rule_familiarity, 0, 1));
    let value = derived[name];
    for (const key of Object.keys(factors)) value *= clamp(factors[key], floor, 1);
    out[name] = value;
    traces[name] = factors;
  }
  return { effective: Object.freeze(out), traces };
}

// Not one of the 17 Derived Capabilities. Produced here and consumed by finish resolution,
// which is how head wear from repeated knockdowns reaches fight results.
export function computeEffectiveDurability(fighter, condition, definitions) {
  const cfg = definitions.configs.effective_performance.effective_durability;
  const parts = resolveStance(condition.body_damage, condition.stance ?? fighter.body.stance);
  let value = fighter.base.durability;
  value *= 1 - cfg.head_wear_penalty * clamp(condition.head_wear, 0, 1);
  value *= 1 - cfg.head_damage_penalty * clamp(parts.head / 100, 0, 1);
  value *= staminaFactor(definitions.configs.effective_performance, condition.stamina, cfg.stamina_max_loss);
  value *= 1 - cfg.weight_stress_penalty * clamp(condition.weight_stress, 0, 1);
  return value;
}

// Between-round recovery, referenced by doc 23. Never reaches full.
export function intervalRecovery(fighter, condition, definitions, { recoveryDebt = 0 } = {}) {
  const cfg = definitions.configs.effective_performance;
  const interval = cfg.interval_recovery;
  const maxStamina = 100 * (1 - cfg.stamina_economy.weight_stress_max_stamina_penalty * clamp(condition.weight_stress, 0, 1));
  const cardioFactor = 1 - interval.cardio_weight * (1 - clamp(fighter.base.cardio / 100, 0, 1));
  const bodyPenalty = 1 - cfg.stamina_economy.body_damage_recovery_penalty * clamp(condition.body_damage.body / 100, 0, 1);
  const debtPenalty = 1 - interval.recovery_debt_penalty * clamp(recoveryDebt, 0, 1);
  const recovered = maxStamina * interval.base_fraction * cardioFactor * bodyPenalty * debtPenalty;
  return Math.min(condition.stamina + recovered, maxStamina * interval.cap_fraction);
}
