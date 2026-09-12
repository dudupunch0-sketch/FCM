// Player Knowledge State. Roadmap Phase 1.
// Spec: docs/design/29_evidence_and_knowledge.md.
// The UI never reads FighterTrueState. It reads estimates, which can be wrong in two
// distinct ways: too wide (unknown) or off-centre (confidently wrong). Width and offset
// have different causes and are computed separately.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function createKnowledge(fighterId, definitions) {
  const cfg = definitions.configs.knowledge;
  return {
    fighter_id: fighterId,
    discovered: false,
    records: {},
    evidence: [],
    _initial_width: cfg.estimate.initial_width
  };
}

// Raw evidence is fact and is never modified. Bias applies at interpretation only, which is
// what lets a better analyst re-read the same past evidence and do better.
export function addEvidence(knowledge, evidence) {
  if (!evidence?.source_type) throw Error('evidence source_type이 필요합니다');
  if (!Number.isInteger(evidence.week)) throw Error('evidence week가 필요합니다');
  const stored = Object.freeze({ ...evidence, evidence_id: `ev${knowledge.evidence.length + 1}` });
  knowledge.evidence.push(stored);
  knowledge.discovered = true;
  return stored;
}

function biasOffset(cfg, subjectKey, relevant, interpreterSkill) {
  let offset = 0;
  for (const evidence of relevant) {
    const sourceSpec = cfg.evidence_sources[evidence.source_type];
    for (const name of sourceSpec?.bias_sources ?? []) {
      // Direction comes from the evidence, not from a roll: weak opposition inflates,
      // a favourable matchup reads as ability. Strength scales with how much it applies.
      const magnitude = cfg.bias.sources[name] ?? 0;
      offset += magnitude * (evidence.bias_strength?.[name] ?? 0);
    }
  }
  const reduced = offset * (1 - cfg.bias.interpreter_skill_reduction * clamp(interpreterSkill, 0, 1));
  return clamp(reduced, -cfg.bias.max_offset, cfg.bias.max_offset);
}

function widthFor(cfg, subjectKey, relevant, interpreterSkill, domain, currentWeek) {
  const { initial_width: initial, min_width: min, max_width: max } = cfg.estimate;
  const halving = cfg.width_drivers.evidence_amount_halving;
  const strength = relevant.reduce((sum, e) => sum + (cfg.evidence_sources[e.source_type]?.strength ?? 0), 0);
  let width = min + (initial - min) * Math.pow(0.5, strength / halving);
  width *= 1 - cfg.width_drivers.interpreter_skill_weight * clamp(interpreterSkill, 0, 1);
  // Contradictory evidence widens rather than flipping. Oscillating belief makes the player
  // ignore the information system entirely.
  const values = relevant.map(e => e.observed_value).filter(v => typeof v === 'number');
  if (values.length > 1) {
    const spread = Math.max(...values) - Math.min(...values);
    width *= 1 + cfg.width_drivers.contradiction_widening * clamp(spread / initial, 0, 1);
  }
  const newest = relevant.reduce((best, e) => Math.max(best, e.week), -Infinity);
  const ageWeeks = currentWeek - newest;
  if (Number.isFinite(ageWeeks) && ageWeeks > 0) {
    const halfLives = ageWeeks / cfg.freshness.half_life_weeks;
    width *= 1 + cfg.freshness.stale_widening_per_half_life * halfLives;
  }
  width *= domain;
  return clamp(width, min, max);
}

// Stale knowledge stays anchored to what was actually observed, not to what is true now.
// A fighter who grew since the last observation therefore reads as UNDERVALUED rather than
// unknown, which is the opening a scout is looking for. With no recorded observation the
// current value stands in, which is the fresh-observation case.
function anchor(cfg, relevant, trueValue, currentWeek) {
  const observed = relevant.filter(e => typeof e.observed_value === 'number');
  if (!observed.length) return trueValue;
  let weightSum = 0;
  let valueSum = 0;
  for (const e of observed) {
    const strength = cfg.evidence_sources[e.source_type]?.strength ?? 0.5;
    const halfLives = Math.max(0, currentWeek - e.week) / cfg.freshness.half_life_weeks;
    const weight = strength * Math.pow(0.5, halfLives);
    // Every observation keeps a floor of influence; otherwise very old evidence would
    // silently vanish and the estimate would snap back to present truth.
    const effective = Math.max(weight, strength * 0.05);
    weightSum += effective;
    valueSum += effective * e.observed_value;
  }
  return valueSum / weightSum;
}

// Confidence is what the interpreter believes, not how right they are. A weak interpreter
// reports a narrow band and is wrong — dangerous rather than merely useless.
function confidenceFor(cfg, interpreterSkill, width) {
  const { min, max } = cfg.confidence.calibration_by_skill;
  const calibrated = min + (max - min) * clamp(interpreterSkill, 0, 1);
  const overconfidence = cfg.confidence.overconfidence_at_low_skill * (1 - clamp(interpreterSkill, 0, 1));
  return clamp(calibrated + overconfidence, 0, 1);
}

export function estimate(knowledge, subjectKey, options) {
  const { definitions, trueValue, interpreterSkill = 0.5, domain = 'striking', currentWeek = 0 } = options;
  const cfg = definitions.configs.knowledge;
  const relevant = knowledge.evidence.filter(e => (e.target_keys ?? []).includes(subjectKey));
  const difficulty = cfg.domain_difficulty[domain] ?? 1;
  const isPotential = domain === 'potential';
  const minWidth = isPotential ? Math.max(cfg.potential.min_width, cfg.estimate.min_width) : cfg.estimate.min_width;
  const width = Math.max(widthFor(cfg, subjectKey, relevant, interpreterSkill, difficulty, currentWeek), minWidth);
  const offset = biasOffset(cfg, subjectKey, relevant, interpreterSkill);
  const centre = clamp(anchor(cfg, relevant, trueValue, currentWeek) + offset, 0, 100);
  const record = {
    subject_key: subjectKey,
    estimated_low: clamp(centre - width / 2, 0, 100),
    estimated_high: clamp(centre + width / 2, 0, 100),
    confidence: confidenceFor(cfg, interpreterSkill, width),
    evidence_amount: relevant.length,
    last_observed_week: relevant.length ? Math.max(...relevant.map(e => e.week)) : null,
    interpreter_skill: interpreterSkill
  };
  knowledge.records[subjectKey] = record;
  return record;
}

// Potential never exposes a ceiling number and breakthrough capacity is not estimable at all.
export function estimatePotential(knowledge, options) {
  const cfg = options.definitions.configs.knowledge;
  const record = estimate(knowledge, 'potential', { ...options, domain: 'potential' });
  return Object.freeze({
    estimated_low: record.estimated_low,
    estimated_high: record.estimated_high,
    confidence: record.confidence,
    ceiling: null,
    breakthrough_estimable: cfg.potential.breakthrough_estimable
  });
}

export function knowledgeWidth(record) { return record.estimated_high - record.estimated_low; }
