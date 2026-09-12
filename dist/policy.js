// Reactive policies: a plan chosen per turn from observable state.
// Spec: docs/design/34_ai_equilibrium.md.
//
// Solving over fixed plans undervalues anything reactive by construction. Movement and the
// side step exist to answer a read, and a fighter who throws the same eight slots for twelve
// turns can never demonstrate that. A policy re-decides each turn, so distance work and angle
// work can finally be worth something.
//
// What a policy may see is deliberately narrow. Doc 18 commits the opponent's plan before the
// reveal step, so a policy that could read the current enemy plan would be cheating; it sees
// its own condition, the distance, and the opponent's PAST combos, which are always visible.

import { CARDS, RULES, span } from './engine.js';

// Named roles rather than raw card lists: a policy is a set of intentions, and the cards that
// express each intention can be retuned without rewriting every policy.
export const ROLES = Object.freeze({
  pressure: ['jab', 'cross', 'hook'],
  close: ['stepin', 'advance', 'body'],
  retreat: ['backstep', 'flicker', 'flicker'],
  angle: ['sidestep', 'cross', 'rest'],
  counter: ['sway', 'cross', 'rest'],
  shell: ['shell', 'guard', 'jab'],
  bodywork: ['body', 'body', 'guard'],
  recover: ['rest', 'rest', 'guard', 'rest']
});

export const CONDITIONS = Object.freeze(['gapAbove', 'gapBelow', 'staminaBelow', 'opponentGroggy', 'opponentRepeated']);

export function roleNames() { return Object.keys(ROLES); }

export function validateRole(plan) {
  for (const id of plan) if (!CARDS[id]) throw Error(`알 수 없는 카드: ${id}`);
  if (span(plan) > RULES.slots) throw Error(`역할 계획이 ${RULES.slots}칸을 초과합니다`);
  return plan;
}

// The only state a policy is allowed to read. Built explicitly so that nothing about the
// opponent's committed plan for THIS turn can leak in.
export function observableView(match, side) {
  const self = match.fighters[side];
  const other = match.fighters[1 - side];
  const previous = match.lastPlans?.[1 - side] ?? null;
  return Object.freeze({
    gap: match.gap,
    turn: match.turn,
    stamina: self.stamina,
    headDamage: self.damage.head,
    bodyDamage: self.damage.body,
    opponentStamina: other.stamina,
    opponentStatus: other.status,
    // Past combos only. Doc 18 makes these visible without any information card.
    opponentLastPlan: previous ? previous.map(p => p.id) : null,
    opponentRepeatedOpening: Boolean(previous && match.lastPlans?.[1 - side]?.[0]?.id === previous[0]?.id)
  });
}

function matches(rule, view) {
  switch (rule.when) {
    case 'gapAbove': return view.gap > rule.value;
    case 'gapBelow': return view.gap < rule.value;
    case 'staminaBelow': return view.stamina < rule.value;
    case 'opponentGroggy': return view.opponentStatus === 'groggy';
    case 'opponentRepeated': return view.opponentRepeatedOpening;
    default: throw Error(`알 수 없는 조건: ${rule.when}`);
  }
}

// First match wins, in declared order. Deterministic by construction: no scoring, no tie-break.
export function choosePlan(policy, view) {
  for (const rule of policy.rules) {
    if (matches(rule, view)) return ROLES[rule.role];
  }
  return ROLES[policy.fallback];
}

export function policyKey(policy) {
  return `${policy.rules.map(r => `${r.when}${r.value ?? ''}:${r.role}`).join('|')}>${policy.fallback}`;
}

export function describePolicy(policy) {
  const parts = policy.rules.map(r => {
    if (r.when === 'gapAbove') return `멀면 ${r.role}`;
    if (r.when === 'gapBelow') return `가까우면 ${r.role}`;
    if (r.when === 'staminaBelow') return `지치면 ${r.role}`;
    if (r.when === 'opponentGroggy') return `상대 그로기면 ${r.role}`;
    return `상대 반복하면 ${r.role}`;
  });
  return `${parts.join(', ')} / 그 외 ${policy.fallback}`;
}

// Sampling. Keeping the grammar small matters: every extra condition multiplies the space the
// solver has to search, and it already struggles once the card count grows.
export function samplePolicies(rng, count, { maxRules = 2 } = {}) {
  const roles = roleNames();
  const seen = new Set();
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 60) {
    const ruleCount = rng.int(maxRules + 1);
    const rules = [];
    const used = new Set();
    for (let i = 0; i < ruleCount; i++) {
      const when = rng.pick(CONDITIONS);
      if (used.has(when)) continue;
      used.add(when);
      const rule = { when, role: rng.pick(roles) };
      if (when === 'gapAbove') rule.value = 1.8 + rng.int(5) * 0.25;
      if (when === 'gapBelow') rule.value = 0.8 + rng.int(5) * 0.25;
      if (when === 'staminaBelow') rule.value = 20 + rng.int(5) * 10;
      rules.push(rule);
    }
    const policy = { rules, fallback: rng.pick(roles) };
    const key = policyKey(policy);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(policy);
  }
  return out;
}

// Small edits, for best-response search around a policy already in the pool.
export function policyNeighbours(policy, { limit = 120 } = {}) {
  const roles = roleNames();
  const out = [];
  const push = p => { if (out.length < limit) out.push(p); };
  for (const fallback of roles) {
    if (fallback !== policy.fallback) push({ rules: policy.rules.map(r => ({ ...r })), fallback });
  }
  policy.rules.forEach((rule, index) => {
    for (const role of roles) {
      if (role === rule.role) continue;
      const rules = policy.rules.map((r, i) => (i === index ? { ...r, role } : { ...r }));
      push({ rules, fallback: policy.fallback });
    }
    if (rule.value !== undefined) {
      for (const delta of [-0.5, -0.25, 0.25, 0.5]) {
        const rules = policy.rules.map((r, i) => (i === index ? { ...r, value: r.value + delta } : { ...r }));
        push({ rules, fallback: policy.fallback });
      }
    }
    push({ rules: policy.rules.filter((_, i) => i !== index), fallback: policy.fallback });
  });
  if (policy.rules.length < CONDITIONS.length) {
    for (const when of CONDITIONS) {
      if (policy.rules.some(r => r.when === when)) continue;
      for (const role of roles.slice(0, 3)) {
        const rule = { when, role };
        if (when === 'gapAbove') rule.value = 2.3;
        if (when === 'gapBelow') rule.value = 1.2;
        if (when === 'staminaBelow') rule.value = 35;
        push({ rules: [...policy.rules.map(r => ({ ...r })), rule], fallback: policy.fallback });
      }
    }
  }
  return out;
}
