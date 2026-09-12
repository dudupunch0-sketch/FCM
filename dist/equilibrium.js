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
export function payoffMatrix(pool, options = {}) {
  const n = pool.length;
  const matrix = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) { matrix[i][j] = 0; continue; }
      const value = duel(pool[i], pool[j], options);
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
export function doubleOracle(seedPool, rng, { rounds = 6, candidatesPerRound = 250, addPerRound = 5, options = {}, onRound = null } = {}) {
  let pool = seedPool.map(p => [...p]);
  let seen = new Set(pool.map(planKey));
  let matrix = payoffMatrix(pool, options);
  let solution = fictitiousPlay(matrix);
  const history = [];

  for (let round = 0; round < rounds; round++) {
    const support = pool.filter((_, i) => solution.strategy[i] > 0.01);
    const candidates = [];
    for (const plan of support) {
      for (const candidate of neighbours(plan, { limit: 60 })) {
        const key = planKey(candidate);
        if (!seen.has(key)) candidates.push(candidate);
      }
    }
    for (const plan of samplePlans(rng, Math.max(20, Math.floor(candidatesPerRound / 4)))) {
      if (!seen.has(planKey(plan))) candidates.push(plan);
    }
    if (!candidates.length) break;

    // Best response. Adding only the single best answer converges far too slowly here: the
    // game is strongly cyclic, so each new plan beats the current mixture and is then beaten
    // in turn, leaving the support small and fully exploitable. Taking the top K widens the
    // pool fast enough for a stable mixture to form.
    const scored = [];
    for (const candidate of candidates.slice(0, candidatesPerRound)) {
      let value = 0;
      for (let j = 0; j < pool.length; j++) {
        if (!solution.strategy[j]) continue;
        value += solution.strategy[j] * duel(candidate, pool[j], options);
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
      seen.add(planKey(entry.candidate));
    }
    matrix = payoffMatrix(pool, options);
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
