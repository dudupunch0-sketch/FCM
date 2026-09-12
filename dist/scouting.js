// Scouting, recruitment and contracts. Roadmap Phase 6.
// Spec: current_decisions sections 20 and 23, docs/design/29_evidence_and_knowledge.md.
// The world's true fighter database and the player's known database are separate. The player
// never searches the true database; they discover fighters and then estimate them.

import { createKnowledge, addEvidence, estimate, knowledgeWidth } from './knowledge.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function createScoutingState(definitions) {
  return { definitions, known: {}, watchlist: [], actionsSpent: 0 };
}

// Fame is its own discovery channel: a fighter above the visibility threshold needs no effort.
export function isPubliclyVisible(fighter, definitions) {
  return (fighter.ticket_power ?? 0) >= definitions.configs.world.scouting.ticket_power_visibility;
}

export function discover(state, fighter, sourceId, { week = 0, rng = null } = {}) {
  const cfg = state.definitions.configs.world.scouting;
  const source = cfg.discovery_sources[sourceId];
  if (!source) throw Error(`알 수 없는 발견 경로: ${sourceId}`);
  if (!isPubliclyVisible(fighter, state.definitions)) {
    const roll = rng ? rng.next() : 0;
    if (roll > source.reach) return { found: false, cost: source.cost };
  }
  const entry = state.known[fighter.id] ?? { fighter_id: fighter.id, knowledge: createKnowledge(fighter.id, state.definitions), sources: [] };
  if (!entry.sources.includes(sourceId)) entry.sources.push(sourceId);
  addEvidence(entry.knowledge, {
    source_type: source.evidence,
    week,
    target_keys: ['punch_technique', 'potential'],
    observed_value: fighter.base?.punch_technique,
    raw_fact: `${sourceId} 관찰`
  });
  state.known[fighter.id] = entry;
  state.actionsSpent += source.cost;
  return { found: true, cost: source.cost, entry };
}

export function watch(state, fighterId) {
  if (!state.known[fighterId]) throw Error('발견하지 않은 선수는 관찰 목록에 넣을 수 없습니다');
  if (!state.watchlist.includes(fighterId)) state.watchlist.push(fighterId);
  return state.watchlist;
}

// A trial produces strong first-hand evidence before any commitment is made.
export function runTrial(state, fighter, { week = 0 } = {}) {
  const entry = state.known[fighter.id];
  if (!entry) throw Error('발견하지 않은 선수는 트라이얼을 할 수 없습니다');
  addEvidence(entry.knowledge, {
    source_type: 'trial',
    week,
    target_keys: ['punch_technique', 'potential'],
    observed_value: fighter.base?.punch_technique,
    raw_fact: '직접 트라이얼'
  });
  return entry;
}

// Multiple axes, never a single star rating.
export function recruitmentReport(state, fighter, { interpreterSkill = 0.5, week = 0 } = {}) {
  const cfg = state.definitions.configs.world.recruitment;
  const entry = state.known[fighter.id];
  if (!entry) throw Error('발견하지 않은 선수의 보고서는 만들 수 없습니다');
  const level = estimate(entry.knowledge, 'punch_technique', {
    definitions: state.definitions, trueValue: fighter.base.punch_technique, interpreterSkill, currentWeek: week
  });
  const potential = estimate(entry.knowledge, 'potential', {
    definitions: state.definitions, trueValue: fighter.potential?.overall_talent ?? 50,
    interpreterSkill, domain: 'potential', currentWeek: week
  });
  const report = {
    current_level: { low: level.estimated_low, high: level.estimated_high },
    growth_potential: { low: potential.estimated_low, high: potential.estimated_high },
    strategy_fit: entry.sources.includes('scout_report') ? 'evaluated' : 'unknown',
    ruleset_fit: fighter.ruleset ?? 'boxing',
    ticket_power_potential: clamp((fighter.ticket_power ?? 0) + 20, 0, 100),
    confidence: level.confidence,
    acquisition_difficulty: clamp(50 + (fighter.ticket_power ?? 0) / 2, 0, 100)
  };
  for (const axis of cfg.report_axes) if (!(axis in report)) throw Error(`보고서 축 누락: ${axis}`);
  return report;
}

// Join interest is not a hidden personality roll; it is current career need against what is offered.
export function joinInterest(state, fighter, offer, { reputation = 0, facilityQuality = 0, relationship = 0 } = {}) {
  const cfg = state.definitions.configs.world.recruitment;
  const need = cfg.career_needs[fighter.career_need ?? 'prospect'];
  if (!need) throw Error(`알 수 없는 Career Need: ${fighter.career_need}`);
  const purseScore = clamp((offer.purse ?? 0) / 50, 0, 100) * need.purse_weight;
  const opportunityScore = clamp(offer.opportunity ?? 0, 0, 100) * need.opportunity_weight;
  const score = clamp(
    reputation * cfg.join_interest.reputation_weight
    + (purseScore + opportunityScore) * cfg.join_interest.career_need_weight
    + facilityQuality * cfg.join_interest.facility_weight
    + relationship * cfg.join_interest.relationship_weight, 0, 100);
  return { score, wants: need.wants, accepts: score >= cfg.join_interest.accept_threshold };
}

export function signContract(state, fighter, terms) {
  const cfg = state.definitions.configs.world.contract;
  const share = terms.share ?? cfg.management_share.default;
  if (share < cfg.management_share.min || share > cfg.management_share.max) {
    throw Error(`Management Share 범위를 벗어났습니다: ${share}`);
  }
  const duration = terms.duration_weeks ?? cfg.duration_weeks.default;
  if (duration < cfg.duration_weeks.min || duration > cfg.duration_weeks.max) {
    throw Error(`계약 기간 범위를 벗어났습니다: ${duration}`);
  }
  return {
    fighter_id: fighter.id,
    share,
    duration_weeks: duration,
    signed_week: terms.week ?? 0,
    promises: (terms.promises ?? []).map(p => ({ ...p, kept: null })),
    relationship: { ...cfg.relationship }
  };
}

// Staying is the result of history. A broken promise costs more than a kept one gains.
export function resolvePromise(contract, promiseType, kept, definitions) {
  const cfg = definitions.configs.world.contract;
  const promise = contract.promises.find(p => p.type === promiseType && p.kept === null);
  if (!promise) throw Error(`해결할 약속이 없습니다: ${promiseType}`);
  promise.kept = kept;
  const delta = kept ? cfg.promise_kept_gain : -cfg.promise_broken_loss;
  for (const key of ['trust', 'satisfaction']) {
    contract.relationship[key] = clamp(contract.relationship[key] + delta, 0, 100);
  }
  return contract.relationship;
}

export function knowledgeQuality(state, fighterId) {
  const entry = state.known[fighterId];
  if (!entry) return null;
  const record = Object.values(entry.knowledge.records)[0];
  return record ? { width: knowledgeWidth(record), confidence: record.confidence, evidence: entry.knowledge.evidence.length } : null;
}
