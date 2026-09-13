// Combat Memory and Setup. Roadmap Phase 3.
// Spec: docs/design/26_action_result_resolution.md section 5, docs/design/28 section 2.
// Pattern exposure builds an expectation, the expectation raises read confidence, and a
// pattern break undoes it. Reading is an edge, never certainty — the bonus is capped.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function createMemory(definitions) {
  const ai = definitions.configs.combat_ai.fight_iq;
  const ctx = definitions.configs.action_resolution.context_modifiers;
  return {
    // observer index -> slot -> { cardId: count }
    exposure: [{}, {}],
    turns: [0, 0],
    limits: {
      window: ai.memory_window_turns,
      confidence: ai.prediction_confidence,
      overfit: ai.recency_overfit_penalty,
      readBonus: ctx.read_confidence_defense_bonus,
      breakPenalty: ctx.pattern_break_defense_penalty
    }
  };
}

// Fight IQ buys a wider memory window and better calibration; it never buys hidden information.
function windowFor(memory, fightIq) {
  const { min, max } = memory.limits.window;
  return Math.round(min + (max - min) * clamp(fightIq / 100, 0, 1));
}

function confidenceCeiling(memory, fightIq) {
  const { min, max } = memory.limits.confidence;
  return min + (max - min) * clamp(fightIq / 100, 0, 1);
}

// Records what the observer actually saw the other side do. Raw exposure, no interpretation.
export function recordPlan(memory, observer, plan, turn) {
  const table = memory.exposure[observer];
  for (const placement of plan) {
    const slot = (table[placement.start] ??= {});
    slot[placement.id] = (slot[placement.id] ?? 0) + 1;
  }
  memory.turns[observer] = turn;
}

// A low Fight IQ fighter weights the single most recent turn far too heavily; a high one
// reads across the window. Both see the same history.
export function expectationAt(memory, observer, slot, fightIq) {
  const table = memory.exposure[observer]?.[slot];
  if (!table) return null;
  const entries = Object.entries(table);
  const total = entries.reduce((n, [, c]) => n + c, 0);
  if (!total) return null;
  const [cardId, count] = entries.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  const share = count / total;
  const window = windowFor(memory, fightIq);
  const evidence = Math.min(total, window) / window;
  const overfit = total <= 1 ? memory.limits.overfit * (1 - clamp(fightIq / 100, 0, 1)) : 0;
  const confidence = clamp(share * evidence + overfit, 0, confidenceCeiling(memory, fightIq));
  return { cardId, confidence, samples: total };
}

// What the defender gets for having read the attacker, and what the attacker gets for
// breaking the pattern the defender was reading.
export function setupModifier(memory, defender, slot, actualCardId, fightIq) {
  const expectation = expectationAt(memory, defender, slot, fightIq);
  if (!expectation) return { factor: 1, read: false, broken: false, confidence: 0 };
  if (expectation.cardId === actualCardId) {
    return { factor: 1 - memory.limits.readBonus * expectation.confidence, read: true, broken: false, confidence: expectation.confidence };
  }
  // Only a confident expectation can be broken; an unread defender loses nothing.
  const broken = expectation.confidence > 0;
  return { factor: 1 + memory.limits.breakPenalty * expectation.confidence, read: false, broken, confidence: expectation.confidence };
}

export function exposureOf(memory, observer, slot) {
  return { ...(memory.exposure[observer]?.[slot] ?? {}) };
}

export function serializeMemory(memory) {
  return { exposure: memory.exposure, turns: memory.turns };
}

export function restoreMemory(definitions, data) {
  const memory = createMemory(definitions);
  memory.exposure = data?.exposure ?? [{}, {}];
  memory.turns = data?.turns ?? [0, 0];
  return memory;
}
