// Definition Data Loader. Roadmap Phase 0.
// Reads balance config, validates the invariants each design doc states, and freezes the result.
// Transport-agnostic: callers supply read(name) so Node uses fs and the browser uses fetch.

import { ALL_BASE_PARAMETERS, DERIVED_CAPABILITIES, isBaseParameter, isDerivedCapability, isBodyPart, isPosition, isRuleset, isKnowledgeDomain, STATUS_LEVELS } from './fighter-schema.js';

export const CONFIG_FILES = Object.freeze([
  'derived_capability', 'effective_performance', 'action_resolution',
  'grappling', 'combat_ai', 'knowledge', 'information_cards', 'save', 'combat_prototype', 'training', 'world', 'difficulty'
]);

const EPSILON = 1e-9;

class ConfigError extends Error {
  constructor(file, path, message) {
    super(`${file}.json: ${path} — ${message}`);
    this.name = 'ConfigError';
    this.file = file;
    this.path = path;
  }
}

const fail = (file, path, message) => { throw new ConfigError(file, path, message); };

function requireObject(file, path, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(file, path, '객체가 필요합니다');
  return value;
}

function requireNumber(file, path, value, { min = -Infinity, max = Infinity } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(file, path, '유한한 숫자가 필요합니다');
  if (value < min || value > max) fail(file, path, `${min}~${max} 범위를 벗어났습니다: ${value}`);
  return value;
}

function requireRange(file, path, value) {
  requireObject(file, path, value);
  requireNumber(file, `${path}.min`, value.min);
  requireNumber(file, `${path}.max`, value.max);
  if (value.min > value.max) fail(file, path, `min이 max보다 큽니다: ${value.min} > ${value.max}`);
  return value;
}

// "note" and "note_*" keys are inline documentation, present throughout the configs. Never data.
const isNoteKey = key => key === 'note' || key.startsWith('note_');

export function dataKeys(obj) { return Object.keys(obj).filter(key => !isNoteKey(key)); }

function requireKeysIn(file, path, obj, predicate, label) {
  for (const key of dataKeys(requireObject(file, path, obj))) {
    if (!predicate(key)) fail(file, `${path}.${key}`, `알 수 없는 ${label}`);
  }
  return obj;
}

// --- per-file validators. Each mirrors the "검증 기준" section of its design doc. ---

const validators = {
  // docs/design/24_base_to_derived_mapping.md
  derived_capability(file, cfg) {
    const caps = requireObject(file, 'capabilities', cfg.capabilities);
    const names = dataKeys(caps);
    if (names.length !== DERIVED_CAPABILITIES.length) {
      fail(file, 'capabilities', `${DERIVED_CAPABILITIES.length}개가 필요합니다: ${names.length}개`);
    }
    for (const name of DERIVED_CAPABILITIES) {
      if (!caps[name]) fail(file, `capabilities.${name}`, '누락되었습니다');
    }
    const used = new Set();
    for (const name of names) {
      const spec = caps[name];
      const weights = requireObject(file, `capabilities.${name}.weights`, spec.weights);
      let sum = 0;
      for (const [base, weight] of Object.entries(weights)) {
        if (!isBaseParameter(base)) fail(file, `capabilities.${name}.weights.${base}`, '알 수 없는 Base Parameter');
        sum += requireNumber(file, `capabilities.${name}.weights.${base}`, weight, { min: 0, max: 1 });
        used.add(base);
      }
      if (Math.abs(sum - 1) > EPSILON) fail(file, `capabilities.${name}.weights`, `가중치 합이 1.0이어야 합니다: ${sum}`);
      for (const mod of spec.body_modifiers ?? []) {
        if (!cfg.body_sources?.[mod.source]) fail(file, `capabilities.${name}.body_modifiers`, `알 수 없는 body_source: ${mod.source}`);
        requireNumber(file, `capabilities.${name}.body_modifiers.${mod.source}`, mod.exponent);
      }
    }
    const unused = ALL_BASE_PARAMETERS.filter(b => !used.has(b));
    if (unused.length) fail(file, 'capabilities', `사용되지 않은 Base Parameter: ${unused.join(', ')}`);
    const formula = requireObject(file, 'formula', cfg.formula);
    if (formula.type !== 'weighted_geometric_mean') fail(file, 'formula.type', '가중 기하평균이어야 합니다');
    requireNumber(file, 'formula.base_floor', formula.base_floor, { min: 1, max: 100 });
  },

  // docs/design/25_effective_performance.md
  effective_performance(file, cfg) {
    const stamina = requireObject(file, 'stamina', cfg.stamina);
    requireNumber(file, 'stamina.plateau', stamina.plateau, { min: 1, max: 100 });
    requireNumber(file, 'stamina.curve_exponent', stamina.curve_exponent, { min: 1 });
    const loss = requireObject(file, 'stamina.max_loss', stamina.max_loss);
    for (const cap of DERIVED_CAPABILITIES) {
      requireNumber(file, `stamina.max_loss.${cap}`, loss[cap], { min: 0, max: 1 });
    }
    requireKeysIn(file, 'stamina.max_loss', loss, isDerivedCapability, 'Derived Capability');
    const parts = requireObject(file, 'body_damage.parts', cfg.body_damage?.parts);
    requireKeysIn(file, 'body_damage.parts', parts, isBodyPart, '부위');
    for (const part of dataKeys(parts)) {
      const effects = parts[part];
      requireKeysIn(file, `body_damage.parts.${part}`, effects, isDerivedCapability, 'Derived Capability');
      for (const cap of dataKeys(effects)) requireNumber(file, `body_damage.parts.${part}.${cap}`, effects[cap], { min: 0, max: 1 });
    }
    const interval = requireObject(file, 'interval_recovery', cfg.interval_recovery);
    requireNumber(file, 'interval_recovery.cap_fraction', interval.cap_fraction, { min: 0, max: 1 });
    if (interval.cap_fraction >= 1) fail(file, 'interval_recovery.cap_fraction', '완전 회복은 허용되지 않습니다');
  },

  // docs/design/26_action_result_resolution.md, docs/design/30_combo_boundary_and_sub_beat.md
  action_resolution(file, cfg) {
    const rnd = requireObject(file, 'randomness', cfg.randomness);
    requireNumber(file, 'randomness.impact_variance', rnd.impact_variance, { min: 0, max: 0.5 });
    const forbidden = new Set(rnd.forbidden ?? []);
    for (const roll of ['hit_or_miss_roll', 'block_success_roll', 'evasion_success_roll', 'finish_roll', 'winner_roll']) {
      if (!forbidden.has(roll)) fail(file, 'randomness.forbidden', `금지 목록에 ${roll}이 없습니다`);
    }
    const order = cfg.defense_precedence?.order ?? [];
    if (order.join(',') !== 'evasion_trajectory,guard_coverage,unprotected') {
      fail(file, 'defense_precedence.order', '회피 → 가드 → 무방비 순서여야 합니다');
    }
    const status = requireObject(file, 'status', cfg.status);
    if ((status.levels ?? []).join(',') !== STATUS_LEVELS.join(',')) fail(file, 'status.levels', `${STATUS_LEVELS.join(' → ')} 순서여야 합니다`);
    const th = requireObject(file, 'status.impact_ratio_thresholds', status.impact_ratio_thresholds);
    let previous = 0;
    for (const level of ['stagger', 'groggy', 'knockdown', 'ko']) {
      const v = requireNumber(file, `status.impact_ratio_thresholds.${level}`, th[level], { min: 0 });
      if (v <= previous) fail(file, `status.impact_ratio_thresholds.${level}`, '임계값이 단조 증가해야 합니다');
      previous = v;
    }
    const sub = requireObject(file, 'sub_beat', cfg.sub_beat);
    requireNumber(file, 'sub_beat.nominal_impact_position', sub.nominal_impact_position, { min: 0, max: 1 });
    requireNumber(file, 'sub_beat.speed_shift_max', sub.speed_shift_max, { min: 0, max: 0.5 });
    requireNumber(file, 'sub_beat.simultaneity_tolerance', sub.simultaneity_tolerance, { min: 0, max: 0.5 });
    if (sub.simultaneity_tolerance <= 0) fail(file, 'sub_beat.simultaneity_tolerance', '0이면 동시 KO가 불가능해집니다');
    const carry = requireObject(file, 'turn_carryover', cfg.turn_carryover);
    for (const key of ['status', 'counter_window', 'feint_opening', 'gap']) {
      if (!(carry.carries ?? []).includes(key)) fail(file, 'turn_carryover.carries', `${key}가 이월 목록에 없습니다`);
    }
  },

  // docs/design/27_position_and_grappling.md
  grappling(file, cfg) {
    requireKeysIn(file, 'positions', cfg.positions, isPosition, '포지션');
    const avail = requireKeysIn(file, 'position_availability', cfg.position_availability, isPosition, '포지션');
    for (const position of dataKeys(cfg.positions ?? {})) {
      if (!avail[position]) fail(file, `position_availability.${position}`, '누락되었습니다');
    }
    const demotion = requireObject(file, 'demotion', cfg.demotion);
    requireKeysIn(file, 'demotion.fundamental_by_position', demotion.fundamental_by_position, isPosition, '포지션');
    if (demotion.proficiency_multiplier !== 0) fail(file, 'demotion.proficiency_multiplier', '강등 동작은 숙련도 보너스를 받지 않습니다');
    requireNumber(file, 'demotion.impact_multiplier', demotion.impact_multiplier, { min: 0, max: 1 });
    const gating = requireKeysIn(file, 'ruleset_gating', cfg.ruleset_gating, isRuleset, 'Ruleset');
    for (const ruleset of ['boxing', 'kickboxing']) {
      if (gating[ruleset]?.ground_allowed !== false) fail(file, `ruleset_gating.${ruleset}.ground_allowed`, '그라운드가 금지되어야 합니다');
    }
    const sub = requireObject(file, 'submission', cfg.submission);
    if ((sub.stages ?? []).join(',') !== 'none,threat,locked,tap') fail(file, 'submission.stages', 'none → threat → locked → tap 순서여야 합니다');
    if (requireNumber(file, 'submission.escape_window_slots', sub.escape_window_slots, { min: 1 }) < 1) {
      fail(file, 'submission.escape_window_slots', '탈출 기회가 존재해야 합니다');
    }
  },

  // docs/design/28_fighter_plan_generation.md
  combat_ai(file, cfg) {
    const iq = requireObject(file, 'fight_iq', cfg.fight_iq);
    requireRange(file, 'fight_iq.search_candidates', iq.search_candidates);
    const confidence = requireRange(file, 'fight_iq.prediction_confidence', iq.prediction_confidence);
    if (confidence.max >= 1) fail(file, 'fight_iq.prediction_confidence.max', '완전한 예측은 허용되지 않습니다');
    requireRange(file, 'fight_iq.memory_window_turns', iq.memory_window_turns);
    const te = requireObject(file, 'tactical_execution', cfg.tactical_execution);
    for (const key of ['slot_shift_chance', 'card_substitution_chance', 'order_swap_chance', 'instruction_adoption']) {
      requireRange(file, `tactical_execution.${key}`, te[key]);
    }
    const evaluation = requireObject(file, 'evaluation.terms', cfg.evaluation?.terms);
    if (!(evaluation.pattern_repetition_penalty < 0)) fail(file, 'evaluation.terms.pattern_repetition_penalty', '반복 패널티는 음수여야 합니다');
    if (!(evaluation.expected_damage_taken < 0)) fail(file, 'evaluation.terms.expected_damage_taken', '피격 기대값은 음수여야 합니다');
    const npc = requireObject(file, 'npc_information_cards', cfg.npc_information_cards);
    if (npc.mode !== 'retrospective_only') fail(file, 'npc_information_cards.mode', '회고적으로만 작동해야 합니다');
    for (const key of ['read_current_turn_plan', 'replan_after_reveal']) {
      if (!(npc.forbidden ?? []).includes(key)) fail(file, 'npc_information_cards.forbidden', `금지 목록에 ${key}가 없습니다`);
    }
  },

  // docs/design/29_evidence_and_knowledge.md
  knowledge(file, cfg) {
    const estimate = requireObject(file, 'estimate', cfg.estimate);
    requireNumber(file, 'estimate.min_width', estimate.min_width, { min: 0 });
    if (estimate.min_width <= 0) fail(file, 'estimate.min_width', '추정 범위는 0으로 수렴하지 않습니다');
    if (estimate.min_width > estimate.max_width) fail(file, 'estimate.min_width', 'max_width보다 큽니다');
    const bias = requireObject(file, 'bias', cfg.bias);
    const sources = requireObject(file, 'bias.sources', bias.sources);
    if (!dataKeys(sources).length) fail(file, 'bias.sources', '편향 원천이 비어 있습니다');
    const evidenceSources = requireObject(file, 'evidence_sources', cfg.evidence_sources);
    for (const source of dataKeys(evidenceSources)) {
      const spec = evidenceSources[source];
      requireNumber(file, `evidence_sources.${source}.strength`, spec.strength, { min: 0, max: 1 });
      for (const b of spec.bias_sources ?? []) {
        if (!(b in sources)) fail(file, `evidence_sources.${source}.bias_sources`, `알 수 없는 편향 원천: ${b}`);
      }
    }
    requireKeysIn(file, 'domain_difficulty', cfg.domain_difficulty, isKnowledgeDomain, 'Knowledge Domain');
    const potential = requireObject(file, 'potential', cfg.potential);
    if (potential.expose_ceiling !== false) fail(file, 'potential.expose_ceiling', 'Potential 상한은 노출하지 않습니다');
    if (potential.breakthrough_estimable !== false) fail(file, 'potential.breakthrough_estimable', 'Breakthrough는 추정 불가입니다');
    const calibration = requireRange(file, 'confidence.calibration_by_skill', cfg.confidence?.calibration_by_skill);
    if (calibration.max > 1) fail(file, 'confidence.calibration_by_skill.max', '1을 넘을 수 없습니다');
  },

  // docs/design/31_information_economy_and_placement.md
  information_cards(file, cfg) {
    const limit = requireObject(file, 'active_card_limit', cfg.active_card_limit);
    requireNumber(file, 'active_card_limit.style', limit.style, { min: 1 });
    requireNumber(file, 'active_card_limit.information', limit.information, { min: 1 });
    if (limit.shared_pool !== false) fail(file, 'active_card_limit.shared_pool', '한도는 갈래별로 분리되어 있습니다');
    if (!(limit.merge_back_criteria ?? []).length) fail(file, 'active_card_limit.merge_back_criteria', '되돌리는 조건이 필요합니다');
    const budget = requireObject(file, 'reveal_budget', cfg.reveal_budget);
    requireNumber(file, 'reveal_budget.per_turn_total', budget.per_turn_total, { min: 1 });
    requireNumber(file, 'reveal_budget.cost.exact', budget.cost?.exact, { min: 1 });
    requireNumber(file, 'reveal_budget.cost.cue', budget.cost?.cue, { min: 1 });
    if (budget.cost.cue >= budget.cost.exact) fail(file, 'reveal_budget.cost', '확정 공개가 추정 예고보다 비싸야 합니다');
    // Above a limit of one the budget must bind before the card limit does, otherwise
    // extra cards would buy disclosure instead of trigger coverage.
    if (limit.information > 1 && budget.per_turn_total >= limit.information * budget.cost.exact) {
      fail(file, 'reveal_budget.per_turn_total', '예산이 카드 수를 구속하지 못합니다. 장착한 모든 카드가 확정 공개로 발동 가능합니다');
    }
    if (cfg.card_growth?.raises_budget !== false) fail(file, 'card_growth.raises_budget', '성장은 예산 상한을 올리지 않습니다');
    const baseline = requireObject(file, 'free_baseline', cfg.free_baseline);
    for (const key of ['past_combo_history', 'repeated_habit_markers']) {
      if (baseline[key] !== true) fail(file, `free_baseline.${key}`, '무카드 기준선은 끌 수 없습니다');
    }
    const placement = requireObject(file, 'placement', cfg.placement);
    requireNumber(file, 'placement.slots', placement.slots, { min: 1 });
    const [lo, hi] = placement.card_duration_range ?? [];
    requireNumber(file, 'placement.card_duration_range[0]', lo, { min: 1 });
    requireNumber(file, 'placement.card_duration_range[1]', hi, { min: lo, max: placement.slots });
    if (placement.overflow_policy !== 'reject') fail(file, 'placement.overflow_policy', '초과 배치는 거부해야 합니다');
  },

  // docs/design/14 through 17, roadmap Phases 6 to 11
  world(file, cfg) {
    const recruitment = requireObject(file, 'recruitment', cfg.recruitment);
    if (recruitment.no_single_rating !== true) fail(file, 'recruitment.no_single_rating', '영입 추천을 단일 별점으로 압축하지 않는다');
    if ((recruitment.report_axes ?? []).length < 3) fail(file, 'recruitment.report_axes', '복수 축으로 표현해야 합니다');
    requireObject(file, 'recruitment.career_needs', recruitment.career_needs);
    const contract = requireObject(file, 'contract', cfg.contract);
    const share = requireObject(file, 'contract.management_share', contract.management_share);
    requireNumber(file, 'contract.management_share.min', share.min, { min: 0, max: 1 });
    requireNumber(file, 'contract.management_share.max', share.max, { min: share.min, max: 1 });
    if (contract.promise_broken_loss <= contract.promise_kept_gain) {
      fail(file, 'contract.promise_broken_loss', '약속 위반이 이행보다 크게 작용해야 합니다');
    }
    const club = requireObject(file, 'club', cfg.club);
    if (!(club.ladder ?? []).includes('champion')) fail(file, 'club.ladder', 'champion 단계가 필요합니다');
    requireNumber(file, 'club.pool_size', club.pool_size, { min: 2 });
    requireNumber(file, 'club.fight_interval_weeks', club.fight_interval_weeks, { min: 1 });
    const tp = requireObject(file, 'ticket_power', cfg.ticket_power);
    requireNumber(file, 'ticket_power.max', tp.max, { min: 1 });
    if (!(tp.great_loss_gain > 0)) fail(file, 'ticket_power.great_loss_gain', '명경기 패배로도 흥행이 오를 수 있어야 합니다');
    if (!(tp.great_loss_gain > tp.dull_win_gain)) fail(file, 'ticket_power.dull_win_gain', '결과보다 경기 내용이 중요합니다');
    const economy = requireObject(file, 'economy', cfg.economy);
    if (economy.failure_is_constraint_not_gameover !== true) {
      fail(file, 'economy.failure_is_constraint_not_gameover', '자금난은 즉시 Game Over가 아니라 선택지 축소입니다');
    }
    const staff = requireObject(file, 'staff', cfg.staff);
    requireNumber(file, 'staff.capacity_per_staff', staff.capacity_per_staff, { min: 1 });
    for (const mode of staff.delegation_modes ?? []) {
      requireNumber(file, `staff.delegation_quality.${mode}`, staff.delegation_quality?.[mode], { min: 0, max: 1 });
    }
    if (staff.delegation_quality.manual <= staff.delegation_quality.auto_with_policy) {
      fail(file, 'staff.delegation_quality', '위임은 완벽하지 않습니다. 직접 관리가 더 정밀해야 합니다');
    }
    const facility = requireObject(file, 'facility', cfg.facility);
    requireNumber(file, 'facility.max_level', facility.max_level, { min: 1 });
    requireNumber(file, 'facility.training_quality_per_level', facility.training_quality_per_level, { min: 0, max: 1 });
    const ranking = requireObject(file, 'ranking', cfg.ranking);
    requireNumber(file, 'ranking.size', ranking.size, { min: 1 });
    if (ranking.no_player_facing_points !== true) fail(file, 'ranking.no_player_facing_points', '플레이어용 Ranking Point는 사용하지 않습니다');
    if (ranking.champion_separate_from_first !== true) fail(file, 'ranking.champion_separate_from_first', 'Champion은 #1과 별도 상태입니다');
    const title = requireObject(file, 'title', cfg.title);
    requireNumber(file, 'title.eligibility_min_rank', title.eligibility_min_rank, { min: 1 });
    requireNumber(file, 'title.eligibility_min_recent_wins', title.eligibility_min_recent_wins, { min: 1 });
    const world = requireObject(file, 'world', cfg.world);
    const tiers = requireObject(file, 'world.simulation_tiers', world.simulation_tiers);
    for (const tier of ['A', 'B', 'C']) requireNumber(file, `world.simulation_tiers.${tier}`, tiers[tier], { min: 0, max: 1 });
    if (!(tiers.A > tiers.B && tiers.B > tiers.C)) fail(file, 'world.simulation_tiers', 'Player Relevant일수록 정밀해야 합니다');
    requireNumber(file, 'world.retirement_age', world.retirement_age, { min: 1 });
    requireNumber(file, 'world.weeks_per_year', world.weeks_per_year, { min: 1 });
  },

  // docs/design/13_fight_camp_and_weekly_calendar.md, roadmap Phase 5
  training(file, cfg) {
    requireNumber(file, 'week.slots', cfg.week?.slots, { min: 1 });
    const activities = requireObject(file, 'activities', cfg.activities);
    if (!dataKeys(activities).length) fail(file, 'activities', '활동이 비어 있습니다');
    for (const id of dataKeys(activities)) {
      for (const key of ['load', 'stress', 'recovery', 'growth', 'techniqueExp', 'injuryRisk']) {
        requireNumber(file, `activities.${id}.${key}`, activities[id][key]);
      }
      if (activities[id].load < 0) fail(file, `activities.${id}.load`, '음수 부하는 허용되지 않습니다');
    }
    if (!activities.recovery || activities.recovery.recovery <= 0) fail(file, 'activities.recovery', '회복 활동이 필요합니다');
    const debt = requireObject(file, 'recovery_debt', cfg.recovery_debt);
    requireNumber(file, 'recovery_debt.weekly_capacity_base', debt.weekly_capacity_base, { min: 0.1 });
    requireNumber(file, 'recovery_debt.max', debt.max, { min: 1 });
    const growth = requireObject(file, 'growth', cfg.growth);
    requireNumber(file, 'growth.base_rate', growth.base_rate, { min: 0 });
    requireNumber(file, 'growth.proximity_exponent', growth.proximity_exponent, { min: 1 });
    const exp = requireObject(file, 'technique_exp', cfg.technique_exp);
    requireNumber(file, 'technique_exp.match_multiplier', exp.match_multiplier, { min: 1 });
    if (exp.match_multiplier <= 1) fail(file, 'technique_exp.match_multiplier', '실전이 훈련보다 많이 줘야 합니다');
    requireNumber(file, 'technique_exp.finish_bonus', exp.finish_bonus, { min: 0 });
    const recovery = requireObject(file, 'weekly_recovery', cfg.weekly_recovery);
    requireNumber(file, 'weekly_recovery.damage_healed', recovery.damage_healed, { min: 1 });
    requireNumber(file, 'weekly_recovery.stamina_fraction', recovery.stamina_fraction, { min: 0, max: 1 });
    const breakthrough = requireObject(file, 'breakthrough', cfg.breakthrough);
    requireNumber(file, 'breakthrough.threshold', breakthrough.threshold, { min: 1 });
    requireNumber(file, 'breakthrough.proximity_required', breakthrough.proximity_required, { min: 0, max: 1 });
  },

  // docs/design/19_combat_prototype_implementation.md
  combat_prototype(file, cfg) {
    const rules = requireObject(file, 'rules', cfg.rules);
    for (const key of ['slots', 'maxTurns', 'maxStamina', 'restRecovery', 'counterWindow', 'guardDrain', 'koDamage', 'staggerDamage', 'staggerImpact', 'maxPartDamage', 'bodyKoDamage', 'bodyKoImpact', 'bodyKoStamina']) {
      requireNumber(file, `rules.${key}`, rules[key], { min: 0 });
    }
    if (rules.staggerDamage >= rules.koDamage) fail(file, 'rules.staggerDamage', 'koDamage보다 작아야 합니다');
    if (rules.maxPartDamage < rules.koDamage) fail(file, 'rules.maxPartDamage', 'KO 임계값에 도달할 수 없습니다');
    if (rules.maxPartDamage < rules.bodyKoDamage) fail(file, 'rules.bodyKoDamage', '부위 손상 상한을 넘어 도달할 수 없습니다');
    // A body finish needs real accumulation and a real shot on top of it. Demanding a higher
    // damage total than the head does would double-punish body work, which already hits softer
    // per landed shot; requiring a solid impact is what keeps the finish rare.
    if (rules.bodyKoDamage < rules.koDamage * 0.7) fail(file, 'rules.bodyKoDamage', 'koDamage의 70% 이상이어야 합니다');
    requireNumber(file, 'rules.bodyKoStamina', rules.bodyKoStamina, { min: 1, max: rules.maxStamina });
    // The target must be worn down as well as damaged, or a body finish becomes an impact
    // spike and lands all-or-nothing on whichever side of the threshold late-fight power sits.
    if (rules.bodyKoStamina >= rules.maxStamina * 0.6) {
      fail(file, 'rules.bodyKoStamina', '지치지 않은 상대가 바디로 끝나면 안 됩니다');
    }
    const rounds = requireObject(file, 'rounds', cfg.rounds);
    requireNumber(file, 'rounds.count', rounds.count, { min: 1 });
    requireNumber(file, 'rounds.turnsPerRound', rounds.turnsPerRound, { min: 1 });
    if (rounds.count * rounds.turnsPerRound !== rules.maxTurns) {
      fail(file, 'rounds', `count × turnsPerRound가 maxTurns와 달라서는 안 됩니다: ${rounds.count}×${rounds.turnsPerRound} vs ${rules.maxTurns}`);
    }
    const status = requireObject(file, 'status', cfg.status);
    requireNumber(file, 'status.staggerRatio', status.staggerRatio, { min: 0, max: 1 });
    requireNumber(file, 'status.groggyRecoverySlots', status.groggyRecoverySlots, { min: 1, max: rules.slots });
    requireNumber(file, 'status.staggerRecoverySlots', status.staggerRecoverySlots, { min: 1, max: rules.slots });
    requireNumber(file, 'status.groggyDefensePenalty', status.groggyDefensePenalty, { min: 0, max: 1 });
    if (status.groggyPlanBias !== true) {
      fail(file, 'status.groggyPlanBias', '이월과 그로기 방어 편향은 함께 있어야 합니다. 없으면 이월이 일방적으로 기웁니다');
    }
    const interval = requireObject(file, 'intervalRecovery', cfg.intervalRecovery);
    requireNumber(file, 'intervalRecovery.fraction', interval.fraction, { min: 0, max: 1 });
    requireNumber(file, 'intervalRecovery.cap', interval.cap, { min: 1, max: rules.maxStamina });
    if (interval.cap >= rules.maxStamina) fail(file, 'intervalRecovery.cap', '완전 회복은 허용되지 않습니다');
    const cards = requireObject(file, 'cards', cfg.cards);
    const kinds = new Set(['attack', 'guard', 'evade', 'feint', 'rest']);
    for (const id of dataKeys(cards)) {
      const card = cards[id];
      if (!kinds.has(card.kind)) fail(file, `cards.${id}.kind`, `알 수 없는 종류: ${card.kind}`);
      requireNumber(file, `cards.${id}.duration`, card.duration, { min: 1, max: rules.slots });
      requireNumber(file, `cards.${id}.cost`, card.cost, { min: 0 });
      if (card.kind === 'attack') {
        requireNumber(file, `cards.${id}.power`, card.power, { min: 0 });
        requireNumber(file, `cards.${id}.impact`, card.impact, { min: 0, max: card.duration - 1 });
        if (!card.target || !card.trajectory) fail(file, `cards.${id}`, '공격은 target과 trajectory가 필요합니다');
      }
      if (card.kind === 'guard' && !card.protect) fail(file, `cards.${id}.protect`, '가드는 보호 부위가 필요합니다');
      if (card.blockLeak !== undefined) requireNumber(file, `cards.${id}.blockLeak`, card.blockLeak, { min: 0, max: 1 });
      if (card.kind === 'attack') {
        requireNumber(file, `cards.${id}.subBeat`, card.subBeat, { min: 0, max: 1 });
        requireNumber(file, `cards.${id}.optimalRange`, card.optimalRange, { min: cfg.range.min, max: cfg.range.max });
        requireNumber(file, `cards.${id}.rangeTolerance`, card.rangeTolerance, { min: 0 });
        requireNumber(file, `cards.${id}.reachBonus`, card.reachBonus, { min: 0 });
      }
      requireNumber(file, `cards.${id}.rangeShift`, card.rangeShift ?? 0, { min: -1, max: 1 });
      if (card.kind === 'evade' && !(card.dodges ?? []).length) fail(file, `cards.${id}.dodges`, '회피는 궤도 상성이 필요합니다');
    }
    if (!cards.rest || cards.rest.kind !== 'rest') fail(file, 'cards.rest', '빈칸은 호흡 정리로 처리되므로 rest 카드가 필요합니다');
    // A longer guard must block more coarsely. Otherwise the long guard strictly dominates:
    // it covers more time for less cost per slot with the same protection quality.
    const guards = dataKeys(cards).filter(id => cards[id].kind === 'guard').sort((a, b) => cards[a].duration - cards[b].duration);
    for (let i = 1; i < guards.length; i++) {
      const short = cards[guards[i - 1]], long = cards[guards[i]];
      if (long.duration === short.duration) continue;
      const shortLeak = short.blockLeak ?? cfg.modifiers.blockLeak;
      const longLeak = long.blockLeak ?? cfg.modifiers.blockLeak;
      if (longLeak <= shortLeak) {
        fail(file, `cards.${guards[i]}.blockLeak`, `더 긴 가드는 더 성기게 막아야 합니다: ${guards[i]} ${longLeak} vs ${guards[i - 1]} ${shortLeak}`);
      }
    }
    const profiles = requireObject(file, 'profiles', cfg.profiles);
    const patterns = requireObject(file, 'patterns', cfg.patterns);
    for (const profile of dataKeys(profiles)) {
      const list = patterns[profile];
      if (!Array.isArray(list) || !list.length) fail(file, `patterns.${profile}`, '패턴이 필요합니다');
      list.forEach((ids, index) => {
        let total = 0;
        for (const id of ids) {
          if (!cards[id]) fail(file, `patterns.${profile}[${index}]`, `알 수 없는 카드: ${id}`);
          total += cards[id].duration;
        }
        if (total > rules.slots) fail(file, `patterns.${profile}[${index}]`, `${rules.slots}칸을 초과합니다: ${total}`);
      });
    }
    for (const id of cfg.low_stamina_plan?.actions ?? []) {
      if (!cards[id]) fail(file, 'low_stamina_plan.actions', `알 수 없는 카드: ${id}`);
    }
    const style = requireObject(file, 'style_cards', cfg.style_cards);
    requireNumber(file, 'style_cards.active_limit', style.active_limit, { min: 1 });
    const styleCards = requireObject(file, 'style_cards.cards', style.cards);
    const axes = new Set();
    const knownEffects = new Set(['bodyStaminaDrainMultiplier', 'counterWindowBonus', 'counterMultiplier',
      'incomingHeadMultiplier', 'staggerResistance', 'closingCostMultiplier', 'insideImpactMultiplier',
      'reachBonus', 'outsideImpactMultiplier', 'blockLeakMultiplier', 'armDamageMultiplier']);
    for (const id of dataKeys(styleCards)) {
      const card = styleCards[id];
      if (!card.name) fail(file, `style_cards.cards.${id}.name`, '표시 이름이 필요합니다');
      if (!card.axis) fail(file, `style_cards.cards.${id}.axis`, '어떤 축의 선택인지 밝혀야 합니다');
      // Two cards on the same axis are not a choice; one is simply the better version of the
      // other. Spec: docs/design/31 section 1.
      if (axes.has(card.axis)) fail(file, `style_cards.cards.${id}.axis`, `축이 겹칩니다: ${card.axis}`);
      axes.add(card.axis);
      const effects = requireObject(file, `style_cards.cards.${id}.effects`, card.effects);
      if (!dataKeys(effects).length) fail(file, `style_cards.cards.${id}.effects`, '효과가 비어 있습니다');
      for (const key of dataKeys(effects)) {
        if (!knownEffects.has(key)) fail(file, `style_cards.cards.${id}.effects.${key}`, '엔진이 모르는 효과입니다');
        requireNumber(file, `style_cards.cards.${id}.effects.${key}`, effects[key], { min: 0 });
      }
    }
    const skills = requireObject(file, 'skills', cfg.skills);
    for (const id of dataKeys(skills)) requireNumber(file, `skills.${id}.specificity`, skills[id].specificity, { min: 0 });
    const reveal = requireObject(file, 'reveal', cfg.reveal);
    requireNumber(file, 'reveal.activeLimit', reveal.activeLimit, { min: 1 });
    requireNumber(file, 'reveal.perTurnTotal', reveal.perTurnTotal, { min: 1 });
    requireNumber(file, 'reveal.cost.exact', reveal.cost?.exact, { min: 1 });
    requireNumber(file, 'reveal.cost.cue', reveal.cost?.cue, { min: 1 });
    if (reveal.cost.cue >= reveal.cost.exact) fail(file, 'reveal.cost', '확정 공개가 추정 예고보다 비싸야 합니다');
    if (reveal.activeLimit > 1 && reveal.perTurnTotal >= reveal.activeLimit * reveal.cost.exact) {
      fail(file, 'reveal.perTurnTotal', '예산이 카드 수를 구속하지 못합니다');
    }
    const sub = requireObject(file, 'subBeat', cfg.subBeat);
    requireNumber(file, 'subBeat.nominal', sub.nominal, { min: 0, max: 1 });
    requireNumber(file, 'subBeat.tolerance', sub.tolerance, { min: 0, max: 0.5 });
    if (sub.tolerance <= 0) fail(file, 'subBeat.tolerance', '0이면 동시 KO가 불가능해집니다');
    const range = requireObject(file, 'range', cfg.range);
    for (const key of ['initial', 'min', 'max', 'falloffExponent', 'maxFalloff']) requireNumber(file, `range.${key}`, range[key]);
    if (range.min >= range.max) fail(file, 'range.min', 'max보다 작아야 합니다');
    if (range.initial < range.min || range.initial > range.max) fail(file, 'range.initial', '거리 범위를 벗어났습니다');
    requireNumber(file, 'range.maxFalloff', range.maxFalloff, { min: 0, max: 1 });
    const defaults = requireObject(file, 'fighterDefaults', cfg.fighterDefaults);
    requireObject(file, 'fighterDefaults.base', defaults.base);
    requireNumber(file, 'fighterDefaults.reference', defaults.reference, { min: 1, max: 100 });
    const influence = requireObject(file, 'statInfluence', cfg.statInfluence);
    for (const key of ['impact', 'evasion', 'guard', 'subBeatShift']) {
      const spec = requireObject(file, `statInfluence.${key}`, influence[key]);
      if (!isDerivedCapability(spec.capability)) fail(file, `statInfluence.${key}.capability`, `알 수 없는 Derived Capability: ${spec.capability}`);
    }
    requireNumber(file, 'statInfluence.evasion.failThreshold', influence.evasion.failThreshold, { min: 0, max: 1 });
    requireNumber(file, 'statInfluence.subBeatShift.max', influence.subBeatShift.max, { min: 0, max: 0.5 });
    const modifiers = requireObject(file, 'modifiers', cfg.modifiers);
    for (const key of ['counter', 'exposed']) requireNumber(file, `modifiers.${key}`, modifiers[key], { min: 1, max: 3 });
    requireNumber(file, 'modifiers.staminaFloor', modifiers.staminaFloor, { min: 0, max: 1 });
    for (const key of ['blockLeak', 'bodyStaminaDrain']) requireNumber(file, `modifiers.${key}`, modifiers[key], { min: 0, max: 1 });
    for (const key of ['blockArmScaling', 'armDamageRatio', 'evadeScore', 'blockScore']) requireNumber(file, `modifiers.${key}`, modifiers[key], { min: 0 });
    const byTarget = requireObject(file, 'modifiers.scoreByTarget', modifiers.scoreByTarget);
    for (const key of ['head', 'body']) requireNumber(file, `modifiers.scoreByTarget.${key}`, byTarget[key], { min: 0, max: 1 });
    if (byTarget.body >= byTarget.head) fail(file, 'modifiers.scoreByTarget.body', '몸통 공격은 가드와 회피를 모두 우회하므로 배점이 머리보다 낮아야 합니다');
    const first = requireObject(file, 'firstStrike', cfg.firstStrike);
    for (const key of ['staggerWeakensLater', 'groggyWeakensLater']) {
      const v = requireNumber(file, `firstStrike.${key}`, first[key], { min: 0, max: 1 });
      if (v <= 0) fail(file, `firstStrike.${key}`, '선타는 후속 타격을 약화시킬 뿐 지우지 않습니다');
    }
  },

  // docs/design/33_difficulty.md
  difficulty(file, cfg) {
    const tiers = requireObject(file, 'tiers', cfg.tiers);
    const names = dataKeys(tiers);
    if (!names.length) fail(file, 'tiers', '난이도 등급이 비어 있습니다');
    if (!tiers[cfg.default_tier]) fail(file, 'default_tier', `존재하지 않는 등급입니다: ${cfg.default_tier}`);
    const principle = requireObject(file, 'principle', cfg.principle);
    for (const key of ['combat_resolution', 'randomness', 'judging']) {
      if (!(principle.never_adjusts ?? []).includes(key)) {
        fail(file, 'principle.never_adjusts', `${key}는 난이도로 조절하지 않습니다`);
      }
    }
    const numeric = ['opponent_level_offset', 'opponent_level_spread', 'champion_level_offset',
      'interpreter_skill_floor', 'scouting_reach_multiplier', 'evidence_strength_multiplier',
      'start_cash_multiplier', 'overhead_multiplier', 'prospect_intake_multiplier'];
    for (const name of names) {
      for (const key of numeric) requireNumber(file, `tiers.${name}.${key}`, tiers[name][key]);
      requireNumber(file, `tiers.${name}.interpreter_skill_floor`, tiers[name].interpreter_skill_floor, { min: 0, max: 1 });
      for (const key of ['opponent_level_spread', 'scouting_reach_multiplier', 'evidence_strength_multiplier', 'start_cash_multiplier', 'overhead_multiplier', 'prospect_intake_multiplier']) {
        requireNumber(file, `tiers.${name}.${key}`, tiers[name][key], { min: 0.1 });
      }
      if (!tiers[name].name) fail(file, `tiers.${name}.name`, '표시 이름이 필요합니다');
    }
    // The baseline tier must be neutral, or the measured balance no longer describes any tier.
    const base = tiers[cfg.default_tier];
    if (base.opponent_level_offset !== 0 || base.opponent_level_spread !== 1 || base.start_cash_multiplier !== 1 || base.overhead_multiplier !== 1) {
      fail(file, `tiers.${cfg.default_tier}`, '기준 등급은 중립이어야 합니다. 밸런스 측정이 이 등급에서 이루어집니다');
    }
  },

  // docs/design/32_save_versioning_and_determinism.md
  save(file, cfg) {
    const persistence = requireObject(file, 'persistence', cfg.persistence);
    const persisted = new Set(persistence.persisted ?? []);
    for (const forbidden of persistence.never_persisted ?? []) {
      if (persisted.has(forbidden)) fail(file, 'persistence', `${forbidden}가 양쪽 목록에 있습니다`);
    }
    for (const key of ['derived_capability', 'effective_performance']) {
      if (!(persistence.never_persisted ?? []).includes(key)) fail(file, 'persistence.never_persisted', `${key}는 저장하지 않습니다`);
    }
    const streams = cfg.rng_streams?.streams ?? [];
    if (!streams.includes('combat') || !streams.includes('world_generation')) {
      fail(file, 'rng_streams.streams', 'combat과 world_generation 스트림이 필요합니다');
    }
    if (cfg.rng_streams?.persist_consumption_counters !== true) {
      fail(file, 'rng_streams.persist_consumption_counters', 'Seed만으로는 재현되지 않습니다');
    }
    if (cfg.combat_save?.mode !== 'replay_from_snapshot') fail(file, 'combat_save.mode', '전투는 리플레이로 복원합니다');
    for (const key of ['evidence_source_events']) {
      if (!(cfg.event_history?.never_summarised ?? []).includes(key)) {
        fail(file, 'event_history.never_summarised', `${key}는 축약하지 않습니다`);
      }
    }
  }
};

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function validateConfig(name, data) {
  if (!validators[name]) throw new ConfigError(name, '', '알 수 없는 Config 파일');
  requireObject(name, '', data);
  if (typeof data.config_version !== 'string') fail(name, 'config_version', '문자열이 필요합니다');
  validators[name](name, data);
  return data;
}

// Cross-file invariants that no single file can check on its own.
export function crossValidate(configs) {
  const slots = configs.information_cards.placement.slots;
  if (configs.combat_prototype.rules.slots !== slots) {
    fail('combat_prototype', 'rules.slots', `information_cards.placement.slots와 달라야 하지 않습니다: ${configs.combat_prototype.rules.slots} vs ${slots}`);
  }
  const cards = configs.information_cards;
  if (configs.combat_prototype.reveal.activeLimit !== cards.active_card_limit.information) {
    fail('combat_prototype', 'reveal.activeLimit', `information_cards.active_card_limit.information과 달라서는 안 됩니다: ${configs.combat_prototype.reveal.activeLimit} vs ${cards.active_card_limit.information}`);
  }
  if (configs.combat_prototype.reveal.perTurnTotal !== cards.reveal_budget.per_turn_total) {
    fail('combat_prototype', 'reveal.perTurnTotal', '공개 예산이 information_cards와 어긋납니다');
  }
  const [, maxDuration] = configs.information_cards.placement.card_duration_range;
  for (const id of dataKeys(configs.combat_prototype.cards)) {
    if (configs.combat_prototype.cards[id].duration > maxDuration) {
      fail('combat_prototype', `cards.${id}.duration`, `card_duration_range 상한 ${maxDuration}을 초과합니다`);
    }
  }
  const carryover = configs.action_resolution.turn_carryover;
  if (configs.action_resolution.sub_beat.enabled && slots < 1) {
    fail('action_resolution', 'sub_beat', '타임라인 칸 수가 유효하지 않습니다');
  }
  if (carryover.resets.length) {
    fail('action_resolution', 'turn_carryover.resets', '콤보 경계에서는 리셋하지 않습니다. 라운드 경계 규칙은 별도입니다');
  }
  const grapplePositions = dataKeys(configs.grappling.positions);
  const fundamentals = configs.grappling.demotion.fundamental_by_position;
  for (const position of grapplePositions) {
    if (!fundamentals[position]) fail('grappling', `demotion.fundamental_by_position.${position}`, '강등 대상 동작이 없습니다');
  }
  return configs;
}

export function buildDefinitions(raw) {
  const configs = {};
  for (const name of CONFIG_FILES) {
    if (!(name in raw)) throw new ConfigError(name, '', '설정 파일이 없습니다');
    configs[name] = validateConfig(name, raw[name]);
  }
  crossValidate(configs);
  return deepFreeze({ configs, version: configs.save.config_version, files: [...CONFIG_FILES] });
}

// read(name) -> Promise<object>. Node supplies an fs reader, the browser a fetch reader.
export async function loadDefinitions(read) {
  const raw = {};
  for (const name of CONFIG_FILES) raw[name] = await read(name);
  return buildDefinitions(raw);
}

export { ConfigError };
