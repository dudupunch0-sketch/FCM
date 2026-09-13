// Canonical names for fighter data. Single source of truth for config validation.
// Spec: docs/spec/current_decisions.md sections 8 and 13.

export const BASE_PARAMETERS = Object.freeze({
  physical: Object.freeze(['strength', 'explosiveness', 'agility', 'cardio', 'durability', 'reflex']),
  striking: Object.freeze(['punch_technique', 'guard_technique', 'kick_technique', 'footwork_technique']),
  grappling: Object.freeze(['takedown_technique', 'takedown_defense_technique', 'clinch_technique', 'ground_bottom_technique', 'ground_top_technique', 'submission_technique']),
  intelligence: Object.freeze(['fight_iq', 'tactical_execution'])
});

export const ALL_BASE_PARAMETERS = Object.freeze(Object.values(BASE_PARAMETERS).flat());

export const DERIVED_CAPABILITIES = Object.freeze([
  'punch_impact', 'punch_execution_speed', 'kick_impact', 'kick_execution_speed',
  'range_control', 'guard_efficiency', 'evasion_capability', 'counter_conversion',
  'feint_execution', 'feint_recognition', 'takedown_capability', 'takedown_defense',
  'clinch_control', 'top_control', 'bottom_escape', 'submission_threat', 'submission_defense'
]);

// Left/right resolve to lead/rear through stance. Spec: docs/design/25_effective_performance.md section 4.
export const BODY_PARTS = Object.freeze(['head', 'body', 'lead_arm', 'rear_arm', 'lead_leg', 'rear_leg']);

export const POSITIONS = Object.freeze(['standing', 'clinch', 'ground_top', 'ground_bottom']);

export const RULESETS = Object.freeze(['mma', 'boxing', 'kickboxing', 'no_rules']);

export const RANGE_BANDS = Object.freeze(['clinch', 'inside', 'mid', 'outside']);

export const KNOWLEDGE_DOMAINS = Object.freeze([
  'physical', 'striking', 'grappling', 'combat_intelligence', 'technique',
  'rule_familiarity', 'weight_adaptation', 'potential', 'market'
]);

export const STATUS_LEVELS = Object.freeze(['normal', 'stagger', 'groggy', 'knockdown', 'ko']);

const sets = {
  base: new Set(ALL_BASE_PARAMETERS),
  derived: new Set(DERIVED_CAPABILITIES),
  part: new Set(BODY_PARTS),
  position: new Set(POSITIONS),
  ruleset: new Set(RULESETS),
  domain: new Set(KNOWLEDGE_DOMAINS)
};

export function isBaseParameter(name) { return sets.base.has(name); }
export function isDerivedCapability(name) { return sets.derived.has(name); }
export function isBodyPart(name) { return sets.part.has(name); }
export function isPosition(name) { return sets.position.has(name); }
export function isRuleset(name) { return sets.ruleset.has(name); }
export function isKnowledgeDomain(name) { return sets.domain.has(name); }
