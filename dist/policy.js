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

import { CARDS, RULES, span, rangeBands } from './engine.js';

// Named roles rather than raw card lists: a policy is a set of intentions, and the cards that
// express each intention can be retuned without rewriting every policy.
//
// Every playable card must appear in some role. A card no role can express is unreachable by
// any policy, and would then read as dead content for a reason that has nothing to do with
// balance. A test enforces the coverage.
export const ROLES = Object.freeze({
  pressure: ['jab', 'cross', 'hook'],
  close: ['stepin', 'advance', 'body'],
  retreat: ['backstep', 'flicker', 'flicker'],
  angle: ['sidestep', 'cross', 'rest'],
  counter: ['sway', 'cross', 'rest'],
  slip: ['weave', 'hook', 'rest'],
  power: ['feint', 'heavy', 'guard'],
  shell: ['shell', 'guard', 'jab'],
  cover: ['lowguard', 'lowguard', 'jab'],
  bodywork: ['body', 'body', 'guard'],
  recover: ['rest', 'rest', 'guard', 'rest']
});

// A condition is only worth a rule slot if it is sometimes true and sometimes false. The
// first grammar keyed two of its five conditions on state that barely varies: stamina sat at
// full for half of all decisions, and groggy was true 1.8% of the time. Those rules were
// written down and never played. Measured base rates drive what is here now.
export const CONDITIONS = Object.freeze([
  'gapAbove', 'gapBelow', 'staminaBelow', 'damageAbove', 'opponentRepeated'
]);

// Deliberately absent: the counter window, the angle, and the opponent's stagger. All three
// are real state, and all three are gone by the time a turn boundary arrives — a window set
// at slot 3 has expired long before slot 8. Measured across every role pairing they were true
// 0.00%, 0.00% and 0.52% of the time. Reacting to them is the player's job INSIDE the eight
// slots, by card ordering; it is not something a per-turn policy can reach. Doc 18 commits
// the whole combo before the reveal, so a policy that re-decided mid-combo would be cheating.

// Thresholds come from the same Config the player is shown — the band boundaries of doc 22
// and the caps in RULES — rather than from magic numbers. A threshold nobody reaches is a
// rule that never fires, and one everybody passes is a rule that is really the fallback.
export function thresholdsFor(when) {
  const bands = rangeBands();
  switch (when) {
    case 'gapAbove': return [bands.mid];
    case 'gapBelow': return [bands.clinch, bands.inside];
    case 'staminaBelow': return [Math.round(RULES.maxStamina * 0.9)];
    case 'damageAbove': return [0.2, 0.35, 0.5].map(f => Math.round(RULES.maxPartDamage * f));
    default: return [];
  }
}

export function roleNames() { return Object.keys(ROLES); }

export function validateRole(plan) {
  for (const id of plan) if (!CARDS[id]) throw Error(`알 수 없는 카드: ${id}`);
  if (span(plan) > RULES.slots) throw Error(`역할 계획이 ${RULES.slots}칸을 초과합니다`);
  return plan;
}

// The only state a policy is allowed to read. Built explicitly so that nothing about the
// opponent's committed plan for THIS turn can leak in.
//
// `opponentHistory` is the list of combos the opponent has already thrown, oldest first.
// Reading "did they repeat" needs two past turns, and the match itself keeps only the last
// one, so the caller carries the history. Falling back to match.lastPlans keeps the view
// usable for a single-turn caller, which then simply cannot see repetition.
export function observableView(match, side, opponentHistory = null) {
  const self = match.fighters[side];
  const other = match.fighters[1 - side];
  const history = opponentHistory
    ?? (match.lastPlans ? [match.lastPlans[1 - side].map(p => p.id)] : []);
  const previous = history.at(-1) ?? null;
  const before = history.at(-2) ?? null;
  return Object.freeze({
    gap: match.gap,
    turn: match.turn,
    stamina: self.stamina,
    headDamage: self.damage.head,
    bodyDamage: self.damage.body,
    opponentStamina: other.stamina,
    opponentStatus: other.status,
    // Past combos only. Doc 18 makes these visible without any information card.
    opponentLastPlan: previous,
    opponentRepeatedOpening: Boolean(previous && before && previous[0] === before[0])
  });
}

function matches(rule, view) {
  switch (rule.when) {
    case 'gapAbove': return view.gap > rule.value;
    case 'gapBelow': return view.gap < rule.value;
    case 'staminaBelow': return view.stamina < rule.value;
    case 'damageAbove': return view.headDamage > rule.value;
    case 'opponentRepeated': return view.opponentRepeatedOpening;
    default: throw Error(`알 수 없는 조건: ${rule.when}`);
  }
}

// Which rule decided this turn, or -1 for the fallback. Separated out because a rule that
// never fires costs nothing and does nothing: it is written down, not played. Reading the
// grammar's real width means counting what fired, exactly as card usage counts what landed.
export function firingRule(policy, view) {
  for (let i = 0; i < policy.rules.length; i++) if (matches(policy.rules[i], view)) return i;
  return -1;
}

// First match wins, in declared order. Deterministic by construction: no scoring, no tie-break.
export function choosePlan(policy, view) {
  const fired = firingRule(policy, view);
  return ROLES[fired < 0 ? policy.fallback : policy.rules[fired].role];
}

export function policyKey(policy) {
  return `${policy.rules.map(r => `${r.when}${r.value ?? ''}:${r.role}`).join('|')}>${policy.fallback}`;
}

// Two policies that always choose the same thing are the same strategy, however differently
// they are written. Deduplicating by syntax let the pool fill with rules that never change an
// outcome — a rule on a condition true 5% of the time makes a policy that is identical to its
// neighbour 95% of the time. This is the same defect normalisePlan fixes for trailing rests,
// one level up, and it wastes the search budget double oracle has to spend on real strategies.
//
// The signature is the role chosen across a grid of synthetic states, sampled either side of
// every declared threshold. Two policies sharing it are interchangeable everywhere the grammar
// can tell states apart.
const NUMERIC_FIELDS = Object.freeze({
  gap: ['gapAbove', 'gapBelow'],
  stamina: ['staminaBelow'],
  headDamage: ['damageAbove']
});

function probeValues(conditions) {
  const bounds = [...new Set(conditions.flatMap(thresholdsFor))].sort((a, b) => a - b);
  if (!bounds.length) return [0];
  const step = Math.max((bounds.at(-1) - bounds[0]) / 4, Math.abs(bounds[0]) / 4, 0.01);
  const values = [bounds[0] - step];
  for (let i = 0; i < bounds.length - 1; i++) values.push((bounds[i] + bounds[i + 1]) / 2);
  values.push(bounds.at(-1) + step);
  return values;
}

let probeCache = null;
export function probeViews() {
  if (probeCache) return probeCache;
  let views = [{ opponentStatus: 'normal', opponentLastPlan: null }];
  for (const [field, conditions] of Object.entries(NUMERIC_FIELDS)) {
    views = views.flatMap(view => probeValues(conditions).map(value => ({ ...view, [field]: value })));
  }
  views = views.flatMap(view => [false, true].map(flag => ({ ...view, opponentRepeatedOpening: flag })));
  probeCache = views.map(Object.freeze);
  return probeCache;
}

// Thresholds come from Config, so a reconfigured engine invalidates the grid.
export function clearProbeViews() { probeCache = null; }

export function behaviourKey(policy) {
  return probeViews().map(view => {
    const fired = firingRule(policy, view);
    return fired < 0 ? policy.fallback : policy.rules[fired].role;
  }).join('');
}

const PHRASES = Object.freeze({
  gapAbove: '멀면', gapBelow: '가까우면', staminaBelow: '지치면',
  damageAbove: '맞았으면', opponentRepeated: '상대 반복하면'
});

export function describePolicy(policy) {
  const parts = policy.rules.map(r => `${PHRASES[r.when] ?? r.when} ${r.role}`);
  return `${parts.join(', ')} / 그 외 ${policy.fallback}`;
}

// Sampling. Keeping the grammar small matters: every extra condition multiplies the space the
// solver has to search, and it already struggles once the card count grows.
// Sampled policies stay simple; the neighbour search is what grows rules. Sampling at three
// rules made every seed specific, best responses sharper, and the solve collapsed onto a
// single policy mid-search — support 18 fell to 7 and external gain rose from 0.32 to 0.50.
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
      const values = thresholdsFor(when);
      if (values.length) rule.value = rng.pick(values);
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
    // Values move between the declared thresholds rather than by arbitrary deltas, so a
    // neighbour is always a threshold that means something.
    for (const value of thresholdsFor(rule.when)) {
      if (value === rule.value) continue;
      const rules = policy.rules.map((r, i) => (i === index ? { ...r, value } : { ...r }));
      push({ rules, fallback: policy.fallback });
    }
    push({ rules: policy.rules.filter((_, i) => i !== index), fallback: policy.fallback });
  });
  if (policy.rules.length < CONDITIONS.length) {
    for (const when of CONDITIONS) {
      if (policy.rules.some(r => r.when === when)) continue;
      for (const role of roles.slice(0, 3)) {
        const values = thresholdsFor(when);
        const rule = { when, role };
        if (values.length) rule.value = values[Math.floor(values.length / 2)];
        push({ rules: [...policy.rules.map(r => ({ ...r })), rule], fallback: policy.fallback });
      }
    }
  }
  return out;
}
