// The space of legal 8-slot plans, and sampling within it.
// Spec: docs/design/34_ai_equilibrium.md.
// Full enumeration is out of reach — one-slot cards alone give six to the eighth — so the
// solver works on a pool and grows it by best response rather than by brute force.

import { CARDS, RULES, span } from './engine.js';

export function playableCards() {
  return Object.keys(CARDS).filter(id => id !== 'rest');
}

export function planKey(ids) {
  return ids.join('>');
}

// Trailing rests are implicit: makePlan pads the timeline. Two plans that differ only in
// trailing rests are the same plan and must not appear twice in a payoff matrix.
export function normalisePlan(ids) {
  const trimmed = [...ids];
  while (trimmed.length && trimmed.at(-1) === 'rest') trimmed.pop();
  return trimmed;
}

export function isLegalPlan(ids) {
  if (!Array.isArray(ids)) return false;
  for (const id of ids) if (!CARDS[id]) return false;
  return span(ids) <= RULES.slots;
}

// Enumerates every legal plan up to a slot budget, capped. Used for small exhaustive checks
// and to seed the pool with short, meaningful sequences.
export function enumeratePlans({ maxCards = 4, limit = 4000 } = {}) {
  const cards = playableCards();
  const out = [];
  const walk = (prefix, used) => {
    if (out.length >= limit) return;
    if (prefix.length) out.push([...prefix]);
    if (prefix.length >= maxCards) return;
    for (const id of cards) {
      const next = used + CARDS[id].duration;
      if (next > RULES.slots) continue;
      prefix.push(id);
      walk(prefix, next);
      prefix.pop();
      if (out.length >= limit) return;
    }
  };
  walk([], 0);
  return out;
}

// Random legal plans, used to seed and to widen a pool without bias toward short sequences.
export function samplePlans(rng, count, { maxCards = 5 } = {}) {
  const cards = playableCards();
  const seen = new Set();
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 50) {
    const ids = [];
    let used = 0;
    const target = 1 + rng.int(maxCards);
    while (ids.length < target) {
      const candidates = cards.filter(id => used + CARDS[id].duration <= RULES.slots);
      if (!candidates.length) break;
      const id = rng.pick(candidates);
      ids.push(id);
      used += CARDS[id].duration;
    }
    const normalised = normalisePlan(ids);
    if (!normalised.length) continue;
    const key = planKey(normalised);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalised);
  }
  return out;
}

// Small edits to an existing plan. Best response searches here first: a plan that beats the
// current mixture is usually a near neighbour of one already in the pool.
export function neighbours(ids, { limit = 200 } = {}) {
  const cards = playableCards();
  const out = [];
  const push = plan => {
    const normalised = normalisePlan(plan);
    if (normalised.length && isLegalPlan(normalised) && out.length < limit) out.push(normalised);
  };
  for (let i = 0; i < ids.length; i++) {
    for (const id of cards) {
      if (id === ids[i]) continue;
      const swapped = [...ids];
      swapped[i] = id;
      push(swapped);
    }
    const removed = [...ids];
    removed.splice(i, 1);
    push(removed);
    for (const id of cards) {
      const inserted = [...ids];
      inserted.splice(i, 0, id);
      push(inserted);
    }
  }
  for (let i = 0; i < ids.length - 1; i++) {
    const swapped = [...ids];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    push(swapped);
  }
  return out;
}
