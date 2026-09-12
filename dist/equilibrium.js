// Self-play equilibrium solving for the combat AI.
// Spec: docs/design/34_ai_equilibrium.md.
//
// Combat resolves deterministically, so a plan-versus-plan result is ground truth rather
// than a noisy sample. That makes this a two-player zero-sum matrix game with an exact
// answer, not a function to approximate: no neural network, no gradients, no dependencies.
//
// Equilibrium play is the ceiling. Difficulty is distance from it, measured as
// exploitability — how much a best responder gains against a given mixture.

import { newMatch, makePlan, resolveTurn } from './engine.js';
import { neighbours, planKey, samplePlans } from './plan-space.js';
import { CONDITIONS, ROLES, behaviourKey, choosePlan, firingRule, observableView, policyNeighbours, roleNames, samplePolicies, thresholdsFor } from './policy.js';

// Double oracle rebuilds the matrix every round, so the same pairing is asked for repeatedly.
// Results are deterministic, which makes them perfectly cacheable.
const duelCache = new Map();
export function clearDuelCache() { duelCache.clear(); }
export function duelCacheSize() { return duelCache.size; }

// Both fighters use identical stats so the payoff isolates strategy from ability.
export function duel(planA, planB, options = {}) {
  const { seeds = [1, 2, 3], stats = null, profile = 'pressure' } = options;
  const key = `${planKey(planA)}#${planKey(planB)}#${profile}#${seeds.join(',')}#${stats ? stats.base.punch_technique : 'd'}`;
  const cached = duelCache.get(key);
  if (cached !== undefined) return cached;
  const value = computeDuel(planA, planB, { seeds, stats, profile });
  duelCache.set(key, value);
  duelCache.set(`${planKey(planB)}#${planKey(planA)}#${profile}#${seeds.join(',')}#${stats ? stats.base.punch_technique : 'd'}`, -value);
  return value;
}

function computeDuel(planA, planB, { seeds, stats, profile }) {
  let score = 0;
  for (const seed of seeds) {
    let match = newMatch(profile, seed, stats ? { player: stats, opponent: stats } : undefined);
    const a = makePlan(planA), b = makePlan(planB);
    while (!match.finished) match = resolveTurn(match, a, b).match;
    score += match.winner === 0 ? 1 : match.winner === 1 ? -1 : 0;
  }
  return score / seeds.length;
}

// Payoff is antisymmetric by construction: swapping the plans negates the result. Computing
// only the upper triangle halves the work and guarantees the symmetry holds exactly.
export function payoffMatrix(pool, options = {}, space = PLAN_SPACE) {
  const n = pool.length;
  const matrix = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) { matrix[i][j] = 0; continue; }
      const value = space.duel(pool[i], pool[j], options);
      matrix[i][j] = value;
      matrix[j][i] = -value;
    }
  }
  return matrix;
}

const bestIndex = (values) => {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
  return best;
};

// Fictitious play. In a zero-sum game the time-average of best responses converges to an
// equilibrium, which is all we need and takes a few dozen lines instead of an LP solver.
export function fictitiousPlay(matrix, { iterations = 3000 } = {}) {
  const n = matrix.length;
  if (!n) throw Error('빈 페이오프 행렬입니다');
  const countsRow = new Float64Array(n);
  const countsCol = new Float64Array(n);
  const payoffAgainstCol = new Float64Array(n);
  const payoffAgainstRow = new Float64Array(n);
  countsRow[0] = 1;
  countsCol[0] = 1;
  for (let i = 0; i < n; i++) {
    payoffAgainstCol[i] = matrix[i][0];
    payoffAgainstRow[i] = -matrix[0][i];
  }
  for (let t = 0; t < iterations; t++) {
    const row = bestIndex(payoffAgainstCol);
    const col = bestIndex(payoffAgainstRow);
    countsRow[row]++;
    countsCol[col]++;
    for (let i = 0; i < n; i++) {
      payoffAgainstCol[i] += matrix[i][col];
      payoffAgainstRow[i] += -matrix[row][i];
    }
  }
  const totalRow = countsRow.reduce((a, b) => a + b, 0);
  const totalCol = countsCol.reduce((a, b) => a + b, 0);
  const strategy = Array.from(countsRow, c => c / totalRow);
  const opponent = Array.from(countsCol, c => c / totalCol);
  return { strategy, opponent, value: expectedValue(matrix, strategy, opponent) };
}

export function expectedValue(matrix, rowMix, colMix) {
  let total = 0;
  for (let i = 0; i < matrix.length; i++) {
    if (!rowMix[i]) continue;
    for (let j = 0; j < matrix.length; j++) {
      if (!colMix[j]) continue;
      total += rowMix[i] * colMix[j] * matrix[i][j];
    }
  }
  return total;
}

// How much a best responder gains against this mixture. Zero means unexploitable within the
// pool; large means the mixture has a hole. This is the difficulty dial.
export function exploitability(matrix, mixture) {
  let best = -Infinity;
  for (let i = 0; i < matrix.length; i++) {
    let value = 0;
    for (let j = 0; j < matrix.length; j++) value += mixture[j] * matrix[i][j];
    if (value > best) best = value;
  }
  return best;
}

// Double oracle. Solve on the current pool, hunt for a plan that beats the solution, add it,
// repeat. Terminates when nothing in the search neighbourhood beats the mixture, which is a
// far stronger statement than "we tried a lot of plans".
export function doubleOracle(seedPool, rng, { rounds = 6, candidatesPerRound = 250, addPerRound = 5, options = {}, onRound = null, space = PLAN_SPACE } = {}) {
  let pool = seedPool.map(space.clone);
  let seen = new Set(pool.map(space.key));
  let matrix = payoffMatrix(pool, options, space);
  let solution = fictitiousPlay(matrix);
  const history = [];

  for (let round = 0; round < rounds; round++) {
    const support = pool.filter((_, i) => solution.strategy[i] > 0.01);
    const local = [], fresh = [];
    const round_seen = new Set(seen);
    const collect = (into, candidate) => {
      const key = space.key(candidate);
      if (round_seen.has(key)) return;
      round_seen.add(key);
      into.push(candidate);
    };
    for (const plan of support) for (const candidate of space.neighbours(plan, { limit: 60 })) collect(local, candidate);
    const freshShare = Math.max(20, Math.floor(candidatesPerRound / 4));
    for (const plan of space.sample(rng, freshShare)) collect(fresh, plan);

    // Both lists are budgeted separately. Concatenating and truncating starved the search of
    // fresh candidates entirely whenever the support was wide enough for its neighbours to
    // fill the budget on their own, which left the solver doing pure local search and sitting
    // in whatever basin it started in.
    const candidates = [...fresh.slice(0, freshShare), ...local.slice(0, Math.max(0, candidatesPerRound - freshShare))];
    if (!candidates.length) break;

    // Best response. Adding only the single best answer converges far too slowly here: the
    // game is strongly cyclic, so each new plan beats the current mixture and is then beaten
    // in turn, leaving the support small and fully exploitable. Taking the top K widens the
    // pool fast enough for a stable mixture to form.
    const scored = [];
    for (const candidate of candidates) {
      let value = 0;
      for (let j = 0; j < pool.length; j++) {
        if (!solution.strategy[j]) continue;
        value += solution.strategy[j] * space.duel(candidate, pool[j], options);
      }
      if (value > 0) scored.push({ candidate, value });
    }
    scored.sort((a, b) => b.value - a.value);
    const added = scored.slice(0, addPerRound);
    history.push({ round, poolSize: pool.length, support: support.length, gain: added.length ? added[0].value : 0, exploitability: exploitability(matrix, solution.strategy) });
    if (onRound) onRound(history.at(-1));
    if (!added.length) break;

    for (const entry of added) {
      pool = [...pool, entry.candidate];
      seen.add(space.key(entry.candidate));
    }
    matrix = payoffMatrix(pool, options, space);
    solution = fictitiousPlay(matrix);
  }

  return { pool, matrix, solution, history, exploitability: exploitability(matrix, solution.strategy) };
}

// A tier plays the equilibrium mixture with probability 1 - deviation, and an off-equilibrium
// plan otherwise. Higher deviation is more exploitable, which is exactly what "easier" means.
export function deviateMixture(strategy, deviation, { weakestFirst = null } = {}) {
  const n = strategy.length;
  if (deviation <= 0) return [...strategy];
  const fallback = new Array(n).fill(0);
  if (weakestFirst && weakestFirst.length) {
    const share = 1 / weakestFirst.length;
    for (const index of weakestFirst) fallback[index] = share;
  } else {
    for (let i = 0; i < n; i++) fallback[i] = 1 / n;
  }
  return strategy.map((p, i) => p * (1 - deviation) + fallback[i] * deviation);
}

export function supportOf(pool, strategy, { threshold = 0.01 } = {}) {
  return pool
    .map((plan, i) => ({ plan, weight: strategy[i] }))
    .filter(entry => entry.weight > threshold)
    .sort((a, b) => b.weight - a.weight);
}

// ---------------------------------------------------------------------------------------
// Reactive policies
//
// Solving over fixed plans asks "what is the best eight slots to throw twelve times in a
// row". Nothing that answers a read can win that question, so movement and the side step
// were being judged by a test they cannot pass. A policy re-decides every turn from what it
// is allowed to see, which is the setting those cards were designed for.

const policyDuelCache = new Map();
export function clearPolicyDuelCache() { policyDuelCache.clear(); }

export function duelPolicies(policyA, policyB, options = {}) {
  const { seeds = [1, 2, 3], stats = null, profile = 'pressure' } = options;
  const tail = `${profile}#${seeds.join(',')}#${stats ? stats.base.punch_technique : 'd'}`;
  // Keyed by behaviour, so two differently written but identical policies share a cache entry.
  const key = `${behaviourKey(policyA)}#${behaviourKey(policyB)}#${tail}`;
  const cached = policyDuelCache.get(key);
  if (cached !== undefined) return cached;
  const value = computePolicyDuel(policyA, policyB, { seeds, stats, profile });
  policyDuelCache.set(key, value);
  policyDuelCache.set(`${behaviourKey(policyB)}#${behaviourKey(policyA)}#${tail}`, -value);
  return value;
}

// Both sides read the same pre-resolution snapshot, so neither can see what the other has
// committed to this turn. That is the reveal rule of doc 18, enforced by construction.
export function playPolicies(policyA, policyB, { seed = 1, stats = null, profile = 'pressure' } = {}) {
  let match = newMatch(profile, seed, stats ? { player: stats, opponent: stats } : undefined);
  const thrown = [[], []];
  while (!match.finished) {
    const chosen = [
      choosePlan(policyA, observableView(match, 0, thrown[1])),
      choosePlan(policyB, observableView(match, 1, thrown[0]))
    ];
    thrown[0].push(chosen[0]);
    thrown[1].push(chosen[1]);
    match = resolveTurn(match, makePlan(chosen[0]), makePlan(chosen[1])).match;
  }
  return { match, thrown };
}

function computePolicyDuel(policyA, policyB, { seeds, stats, profile }) {
  let score = 0;
  for (const seed of seeds) {
    const { match } = playPolicies(policyA, policyB, { seed, stats, profile });
    score += match.winner === 0 ? 1 : match.winner === 1 ? -1 : 0;
  }
  return score / seeds.length;
}

// The two strategy spaces the solver can work in. Everything the solver needs to know about
// a strategy is here, so double oracle does not care which one it is given.
export const PLAN_SPACE = Object.freeze({
  key: planKey,
  clone: plan => [...plan],
  neighbours: (plan, opts) => neighbours(plan, opts),
  sample: (rng, count) => samplePlans(rng, count),
  duel: (a, b, options) => duel(a, b, options)
});

export const POLICY_SPACE = Object.freeze({
  // Behaviour, not syntax: a pool that dedupes by text fills with policies that play the same.
  key: behaviourKey,
  clone: policy => ({ rules: policy.rules.map(r => ({ ...r })), fallback: policy.fallback }),
  neighbours: (policy, opts) => policyNeighbours(policy, opts),
  sample: (rng, count) => samplePolicies(rng, count),
  duel: (a, b, options) => duelPolicies(a, b, options)
});

// What a mixture of policies actually throws. A policy's value cannot be read off its rules:
// a rule that never fires costs nothing and does nothing. Replaying the mixture and counting
// the cards that reach the timeline is the only honest answer to "is this card used".
export function cardUsage(pool, strategy, { seeds = [1, 2, 3], stats = null, profile = 'pressure', threshold = 0.005 } = {}) {
  const counts = new Map();
  let total = 0;
  const active = pool.map((policy, i) => ({ policy, weight: strategy[i] })).filter(e => e.weight > threshold);
  const mass = active.reduce((n, e) => n + e.weight, 0) || 1;
  for (const a of active) {
    for (const b of active) {
      const share = (a.weight / mass) * (b.weight / mass);
      for (const seed of seeds) {
        const { thrown } = playPolicies(a.policy, b.policy, { seed, stats, profile });
        for (const plan of thrown[0]) {
          for (const id of plan) {
            counts.set(id, (counts.get(id) ?? 0) + share);
            total += share;
          }
        }
      }
    }
  }
  const out = {};
  for (const [id, n] of counts) out[id] = n / (total || 1);
  return out;
}

// How much of the grammar is actually load-bearing. A policy can carry four rules and still
// behave like a constant: what matters is which rule decided each turn, and how many distinct
// combos the policy ended up throwing. Measured the same way card usage is — by replay.
export function grammarUsage(pool, strategy, { seeds = [1, 2, 3], stats = null, profile = 'pressure', threshold = 0.005 } = {}) {
  const active = pool.map((policy, i) => ({ policy, weight: strategy[i] })).filter(e => e.weight > threshold);
  const mass = active.reduce((n, e) => n + e.weight, 0) || 1;
  const byCondition = new Map();
  const byRuleIndex = new Map();
  let decisions = 0, fromFallback = 0, distinctTotal = 0, replays = 0;
  for (const a of active) {
    for (const b of active) {
      const share = (a.weight / mass) * (b.weight / mass);
      for (const seed of seeds) {
        let match = newMatch(profile, seed, stats ? { player: stats, opponent: stats } : undefined);
        const thrown = [[], []];
        while (!match.finished) {
          const view = observableView(match, 0, thrown[1]);
          const fired = firingRule(a.policy, view);
          decisions += share;
          if (fired < 0) fromFallback += share;
          else {
            const when = a.policy.rules[fired].when;
            byCondition.set(when, (byCondition.get(when) ?? 0) + share);
            byRuleIndex.set(fired, (byRuleIndex.get(fired) ?? 0) + share);
          }
          const chosen = [choosePlan(a.policy, view), choosePlan(b.policy, observableView(match, 1, thrown[0]))];
          thrown[0].push(chosen[0]);
          thrown[1].push(chosen[1]);
          match = resolveTurn(match, makePlan(chosen[0]), makePlan(chosen[1])).match;
        }
        distinctTotal += share * new Set(thrown[0].map(p => p.join('+'))).size;
        replays += share;
      }
    }
  }
  const norm = m => Object.fromEntries([...m].map(([k, v]) => [k, v / (decisions || 1)]));
  return {
    fallbackShare: fromFallback / (decisions || 1),
    byCondition: norm(byCondition),
    byRuleIndex: norm(byRuleIndex),
    // 1.0 means the mixture is reactive in name only: every policy threw one combo all fight.
    distinctPlansPerMatch: distinctTotal / (replays || 1)
  };
}

// How often each condition is true at a turn boundary, played out across every role pairing.
// This is the grammar's health check, independent of any solve: a condition that is almost
// never true is a rule slot nobody can use, and one that is almost always true is the
// fallback wearing a disguise. Both inflate the search space without adding strategies, which
// is why double oracle struggled before the first grammar was measured.
export function conditionBaseRates({ seeds = [1, 2, 3], stats = null, profile = 'pressure' } = {}) {
  const roles = roleNames();
  const probes = [];
  for (const when of CONDITIONS) {
    const values = thresholdsFor(when);
    for (const value of values.length ? values : [undefined]) {
      probes.push({ label: value === undefined ? when : `${when}:${value}`, rule: { when, value, role: roles[0] } });
    }
  }
  const hits = new Map(probes.map(p => [p.label, 0]));
  let decisions = 0;
  for (const a of roles) {
    for (const b of roles) {
      for (const seed of seeds) {
        let match = newMatch(profile, seed, stats ? { player: stats, opponent: stats } : undefined);
        const thrown = [[], []];
        while (!match.finished) {
          const view = observableView(match, 0, thrown[1]);
          decisions++;
          for (const probe of probes) {
            if (firingRule({ rules: [probe.rule], fallback: roles[0] }, view) === 0) hits.set(probe.label, hits.get(probe.label) + 1);
          }
          thrown[0].push(ROLES[a]);
          thrown[1].push(ROLES[b]);
          match = resolveTurn(match, makePlan(ROLES[a]), makePlan(ROLES[b])).match;
        }
      }
    }
  }
  return Object.fromEntries([...hits].map(([label, n]) => [label, n / (decisions || 1)]));
}
