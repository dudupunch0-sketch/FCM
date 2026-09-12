import { test } from 'node:test';
import assert from 'node:assert/strict';
import { definitions } from './helpers/engine-setup.mjs';
import { createFighter, createCondition, computeDerived, computeEffective, computeEffectiveDurability, intervalRecovery, resolveStance } from '../dist/fighter.js';
import { createKnowledge, addEvidence, estimate, estimatePotential, knowledgeWidth } from '../dist/knowledge.js';
import { ALL_BASE_PARAMETERS, DERIVED_CAPABILITIES } from '../dist/fighter-schema.js';

const flat = (value, overrides = {}) => {
  const base = {};
  for (const name of ALL_BASE_PARAMETERS) base[name] = value;
  return createFighter({ id: 'f', name: '테스트', base: { ...base, ...overrides }, body: { natural_weight: 75, current_weight: 75, height: 180 } });
};

test('a balanced fighter makes geometric and arithmetic means agree', () => {
  const derived = computeDerived(flat(57), definitions);
  for (const name of DERIVED_CAPABILITIES) {
    assert.ok(Math.abs(derived[name] - 57) < 1e-9, `${name}=${derived[name]}`);
  }
});

test('imbalance costs: a strong-but-unskilled puncher loses to the weighted sum', () => {
  const fighter = flat(57, { punch_technique: 20, strength: 90, explosiveness: 60 });
  const derived = computeDerived(fighter, definitions);
  const weights = definitions.configs.derived_capability.capabilities.punch_impact.weights;
  const arithmetic = Object.entries(weights).reduce((sum, [k, w]) => sum + fighter.base[k] * w, 0);
  assert.ok(derived.punch_impact < arithmetic - 5, `기하 ${derived.punch_impact} vs 산술 ${arithmetic}`);
  assert.ok(Math.abs(derived.punch_impact - 43.7) < 0.5, derived.punch_impact);
});

test('a floored base parameter never zeroes a capability', () => {
  const derived = computeDerived(flat(50, { punch_technique: 0, strength: 0 }), definitions);
  for (const name of DERIVED_CAPABILITIES) assert.ok(derived[name] > 0 && Number.isFinite(derived[name]), name);
});

test('moving up a weight class does not raise mass ratio on its own', () => {
  const light = createFighter({ id: 'a', name: 'a', base: flat(60).base, body: { natural_weight: 70, current_weight: 70 } });
  const heavy = createFighter({ id: 'b', name: 'b', base: flat(60).base, body: { natural_weight: 84, current_weight: 84 } });
  const a = computeDerived(light, definitions, { referenceWeight: 70 });
  const b = computeDerived(heavy, definitions, { referenceWeight: 84 });
  assert.ok(Math.abs(a.punch_impact - b.punch_impact) < 1e-9, '체급 상승만으로 유리해졌습니다');
});

test('reach does not enter range control; it belongs to the distance model', () => {
  const short = createFighter({ id: 'a', name: 'a', base: flat(60).base, body: { reach: 170 } });
  const long = createFighter({ id: 'b', name: 'b', base: flat(60).base, body: { reach: 200 } });
  assert.equal(computeDerived(short, definitions).range_control, computeDerived(long, definitions).range_control);
});

test('stamina at or above the plateau costs nothing, and decline accelerates below it', () => {
  const derived = computeDerived(flat(70), definitions);
  const at = s => computeEffective(derived, createCondition({ stamina: s }), definitions).effective.evasion_capability;
  assert.ok(Math.abs(at(100) - at(80)) < 1e-9, '80 이상에서 평평하지 않습니다');
  assert.ok(Math.abs(at(100) - derived.evasion_capability) < 1e-9);
  const dropHigh = at(80) - at(65);
  const dropLow = at(35) - at(20);
  assert.ok(dropLow > dropHigh, `가속하지 않습니다: ${dropHigh} vs ${dropLow}`);
});

test('evasion collapses faster than guard at the same stamina', () => {
  const derived = computeDerived(flat(70), definitions);
  const { effective } = computeEffective(derived, createCondition({ stamina: 30 }), definitions);
  const evasionRatio = effective.evasion_capability / derived.evasion_capability;
  const guardRatio = effective.guard_efficiency / derived.guard_efficiency;
  assert.ok(evasionRatio < guardRatio - 0.1, `${evasionRatio} vs ${guardRatio}`);
});

test('lead leg damage degrades range control, which is how low kicks propagate', () => {
  const derived = computeDerived(flat(70), definitions);
  const healthy = computeEffective(derived, createCondition({ stance: 'orthodox' }), definitions).effective.range_control;
  const hurt = computeEffective(derived, createCondition({ stance: 'orthodox', body_damage: { left_leg: 80 } }), definitions).effective.range_control;
  assert.ok(hurt < healthy * 0.95, `${hurt} vs ${healthy}`);
});

test('stance decides which side of damage matters', () => {
  const derived = computeDerived(flat(70), definitions);
  const damage = { body_damage: { left_leg: 80 } };
  const orthodox = computeEffective(derived, createCondition({ ...damage, stance: 'orthodox' }), definitions).effective.range_control;
  const southpaw = computeEffective(derived, createCondition({ ...damage, stance: 'southpaw' }), definitions).effective.range_control;
  assert.notEqual(orthodox, southpaw);
  assert.equal(resolveStance({ left_leg: 80 }, 'orthodox').lead_leg, 80);
  assert.equal(resolveStance({ left_leg: 80 }, 'southpaw').rear_leg, 80);
});

test('effective performance never mutates the derived baseline', () => {
  const derived = computeDerived(flat(70), definitions);
  const snapshot = { ...derived };
  computeEffective(derived, createCondition({ stamina: 10, body_damage: { head: 90 } }), definitions);
  assert.deepEqual({ ...derived }, snapshot);
  assert.ok(Object.isFrozen(derived));
});

test('every effective factor is traceable for the causal log', () => {
  const derived = computeDerived(flat(70), definitions);
  const { traces } = computeEffective(derived, createCondition({ stamina: 40, body_damage: { head: 50 } }), definitions);
  assert.ok(traces.evasion_capability.stamina < 1);
  assert.ok(traces.evasion_capability.head < 1, '머리 손상 원인이 기록되지 않았습니다');
});

test('head wear lowers effective durability, connecting knockdown history to results', () => {
  const fighter = flat(70);
  const fresh = computeEffectiveDurability(fighter, createCondition(), definitions);
  const worn = computeEffectiveDurability(fighter, createCondition({ head_wear: 0.8 }), definitions);
  assert.ok(worn < fresh * 0.8, `${worn} vs ${fresh}`);
});

test('interval recovery favours cardio and never reaches full', () => {
  const cap = definitions.configs.effective_performance.interval_recovery.cap_fraction * 100;
  const good = intervalRecovery(flat(60, { cardio: 95 }), createCondition({ stamina: 30 }), definitions);
  const poor = intervalRecovery(flat(60, { cardio: 20 }), createCondition({ stamina: 30 }), definitions);
  assert.ok(good > poor, `${good} vs ${poor}`);
  for (const value of [good, poor]) assert.ok(value <= cap + 1e-9, `상한 초과: ${value}`);
  assert.ok(intervalRecovery(flat(60, { cardio: 100 }), createCondition({ stamina: 99 }), definitions) < 100);
});

test('invalid base parameters and stances are refused', () => {
  assert.throws(() => createFighter({ id: 'x', name: 'x', base: {} }), /Base Parameter/);
  assert.throws(() => flat(101), /0~100/);
  assert.throws(() => createFighter({ id: 'x', name: 'x', base: flat(50).base, body: { stance: 'sideways' } }), /스탠스/);
});

// --- Knowledge ---

const evidence = (week, overrides = {}) => ({ source_type: 'observed_fight', week, target_keys: ['punch_technique'], ...overrides });

test('more evidence narrows the range but never to a point', () => {
  const k = createKnowledge('f1', definitions);
  const widths = [];
  for (let i = 0; i < 8; i++) {
    widths.push(knowledgeWidth(estimate(k, 'punch_technique', { definitions, trueValue: 70, currentWeek: 0 })));
    addEvidence(k, evidence(0));
  }
  for (let i = 1; i < widths.length; i++) assert.ok(widths[i] <= widths[i - 1], `넓어졌습니다: ${widths}`);
  const min = definitions.configs.knowledge.estimate.min_width;
  assert.ok(widths.at(-1) >= min, `최소 폭 아래로 수렴: ${widths.at(-1)}`);
});

test('a weak interpreter is off-centre while a strong one is not', () => {
  const build = skill => {
    const k = createKnowledge('f1', definitions);
    for (let i = 0; i < 4; i++) addEvidence(k, evidence(0, { bias_strength: { weak_opposition_inflation: 1 } }));
    const r = estimate(k, 'punch_technique', { definitions, trueValue: 50, interpreterSkill: skill, currentWeek: 0 });
    return (r.estimated_low + r.estimated_high) / 2;
  };
  const novice = build(0);
  const expert = build(1);
  assert.ok(novice > 50, `과대평가되지 않았습니다: ${novice}`);
  assert.ok(Math.abs(expert - 50) < Math.abs(novice - 50), `전문가가 더 치우쳤습니다: ${expert} vs ${novice}`);
});

test('a weak interpreter reports higher confidence than accuracy justifies', () => {
  const k = createKnowledge('f1', definitions);
  for (let i = 0; i < 4; i++) addEvidence(k, evidence(0, { bias_strength: { weak_opposition_inflation: 1 } }));
  const novice = estimate(k, 'punch_technique', { definitions, trueValue: 50, interpreterSkill: 0.05, currentWeek: 0 });
  const noviceError = Math.abs((novice.estimated_low + novice.estimated_high) / 2 - 50);
  assert.ok(noviceError > 3, `편향이 없습니다: ${noviceError}`);
  assert.ok(novice.confidence > 0.3, `틀렸는데도 확신이 낮습니다: ${novice.confidence}`);
});

test('contradictory evidence widens instead of flipping the estimate', () => {
  const agree = createKnowledge('f1', definitions);
  const conflict = createKnowledge('f2', definitions);
  for (const value of [70, 70, 70]) addEvidence(agree, evidence(0, { observed_value: value }));
  for (const value of [20, 90, 55]) addEvidence(conflict, evidence(0, { observed_value: value }));
  const a = estimate(agree, 'punch_technique', { definitions, trueValue: 70, currentWeek: 0 });
  const b = estimate(conflict, 'punch_technique', { definitions, trueValue: 70, currentWeek: 0 });
  assert.ok(knowledgeWidth(b) > knowledgeWidth(a), `${knowledgeWidth(b)} vs ${knowledgeWidth(a)}`);
});

test('stale knowledge widens with age', () => {
  const k = createKnowledge('f1', definitions);
  for (let i = 0; i < 4; i++) addEvidence(k, evidence(0, { observed_value: 50 }));
  const fresh = estimate(k, 'punch_technique', { definitions, trueValue: 50, currentWeek: 0 });
  const stale = estimate(k, 'punch_technique', { definitions, trueValue: 50, currentWeek: 200 });
  assert.ok(knowledgeWidth(stale) > knowledgeWidth(fresh), `${knowledgeWidth(stale)} vs ${knowledgeWidth(fresh)}`);
});

test('a fighter who grew unobserved reads as undervalued, not unknown', () => {
  const k = createKnowledge('f1', definitions);
  // Watched two years ago at 50. Nobody has looked since; he is now genuinely 80.
  for (let i = 0; i < 3; i++) addEvidence(k, evidence(0, { observed_value: 50 }));
  const record = estimate(k, 'punch_technique', { definitions, trueValue: 80, interpreterSkill: 0.6, currentWeek: 104 });
  const centre = (record.estimated_low + record.estimated_high) / 2;
  assert.ok(centre < 65, `현재 실력이 새어 들어왔습니다: ${centre}`);
  assert.ok(centre > 35, `관찰값과 무관해졌습니다: ${centre}`);
});

test('a fresh look corrects an anchored estimate upward', () => {
  const k = createKnowledge('f1', definitions);
  for (let i = 0; i < 3; i++) addEvidence(k, evidence(0, { observed_value: 50 }));
  const before = estimate(k, 'punch_technique', { definitions, trueValue: 80, interpreterSkill: 0.6, currentWeek: 104 });
  addEvidence(k, evidence(104, { source_type: 'trial', observed_value: 80 }));
  const after = estimate(k, 'punch_technique', { definitions, trueValue: 80, interpreterSkill: 0.6, currentWeek: 104 });
  const centreOf = r => (r.estimated_low + r.estimated_high) / 2;
  assert.ok(centreOf(after) > centreOf(before), `${centreOf(after)} vs ${centreOf(before)}`);
});

test('combat intelligence and potential are harder to read than physical', () => {
  const build = domain => {
    const k = createKnowledge('f1', definitions);
    for (let i = 0; i < 4; i++) addEvidence(k, evidence(0, { target_keys: ['x'] }));
    return knowledgeWidth(estimate(k, 'x', { definitions, trueValue: 50, domain, currentWeek: 0 }));
  };
  assert.ok(build('combat_intelligence') > build('physical'));
  assert.ok(build('potential') > build('combat_intelligence'));
});

test('potential exposes no ceiling and breakthrough is not estimable', () => {
  const k = createKnowledge('f1', definitions);
  addEvidence(k, evidence(0, { target_keys: ['potential'] }));
  const p = estimatePotential(k, { definitions, trueValue: 80, currentWeek: 0 });
  assert.equal(p.ceiling, null);
  assert.equal(p.breakthrough_estimable, false);
  assert.ok(p.estimated_high - p.estimated_low >= definitions.configs.knowledge.potential.min_width - 1e-9);
});

test('raw evidence is never modified, so a better analyst can re-read it', () => {
  const k = createKnowledge('f1', definitions);
  const stored = addEvidence(k, evidence(0, { raw_fact: '3라운드 훅 명중', bias_strength: { weak_opposition_inflation: 1 } }));
  const novice = estimate(k, 'punch_technique', { definitions, trueValue: 50, interpreterSkill: 0.1, currentWeek: 0 });
  const expert = estimate(k, 'punch_technique', { definitions, trueValue: 50, interpreterSkill: 0.95, currentWeek: 0 });
  assert.equal(k.evidence[0].raw_fact, '3라운드 훅 명중');
  assert.ok(Object.isFrozen(stored));
  assert.ok(knowledgeWidth(expert) < knowledgeWidth(novice), '재해석이 개선되지 않았습니다');
});
