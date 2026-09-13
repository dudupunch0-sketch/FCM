// Save / load with versioning. Roadmap Phase 0.
// Spec: docs/design/32_save_versioning_and_determinism.md.
// Anything computable is recomputed on load, so balance patches cannot desynchronise
// from saves. Schema and balance versions get different treatment because their
// failure modes differ: one cannot be read, the other merely changes values.

import { RngSet } from './rng.js';
import { EventLog } from './events.js';

export const SAVE_VERSION = 3;

export class SaveError extends Error {
  constructor(message) { super(message); this.name = 'SaveError'; }
}

// Sequential only. v1 to v2 to v3, never a v1 to v3 shortcut, so there is one path to test.
const MIGRATIONS = {
  2(data) {
    // v1 stored a bare seed. Streams and counters were added when determinism was specified.
    const streams = {};
    for (const name of ['world_generation', 'npc_simulation', 'combat', 'injury', 'events']) {
      streams[name] = { state: (data.rng_seed | 0) || 1, count: 0 };
    }
    return { ...data, rng: { seed: data.rng_seed ?? 0, streams }, rng_seed: undefined };
  },
  3(data) {
    // v2 kept an event array at the top level; it became a log with its own id counter.
    const events = data.event_history ?? [];
    return { ...data, events: { events, nextId: events.length + 1 }, event_history: undefined };
  }
};

function migrate(data) {
  let version = data.save_version ?? 1;
  if (version > SAVE_VERSION) throw new SaveError(`더 새로운 세이브입니다: v${version} > v${SAVE_VERSION}`);
  let current = data;
  const applied = [];
  while (version < SAVE_VERSION) {
    version++;
    const step = MIGRATIONS[version];
    if (!step) throw new SaveError(`v${version} 마이그레이션이 없습니다`);
    current = step(current);
    applied.push(version);
  }
  return { data: { ...current, save_version: SAVE_VERSION }, applied };
}

const NEVER_PERSISTED_KEYS = ['derived', 'derived_capability', 'effective', 'effective_performance', 'combat_caches'];

function assertNoComputedValues(node, path = 'game_state', seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  for (const [key, value] of Object.entries(node)) {
    if (NEVER_PERSISTED_KEYS.includes(key)) {
      throw new SaveError(`계산 가능한 값은 저장하지 않습니다: ${path}.${key}`);
    }
    assertNoComputedValues(value, `${path}.${key}`, seen);
  }
}

export function createGameState(definitions, { seed = 1, week = 0 } = {}) {
  const save = definitions.configs.save;
  return {
    save_version: SAVE_VERSION,
    config_version: definitions.version,
    week,
    rng: new RngSet(seed, save.rng_streams.streams),
    events: new EventLog(save.event_history),
    fighters: {},
    knowledge: {},
    active_fight: null
  };
}

export function serializeGameState(state) {
  const data = {
    save_version: SAVE_VERSION,
    config_version: state.config_version,
    week: state.week,
    rng: state.rng.serialize(),
    events: state.events.serialize(),
    fighters: state.fighters,
    knowledge: state.knowledge,
    active_fight: state.active_fight
  };
  assertNoComputedValues(data);
  return data;
}

// Returns { state, warnings }. A config_version mismatch is a warning, not a failure:
// values changing after a balance patch is correct behaviour, not corruption.
export function loadGameState(data, definitions, { validateReferences } = {}) {
  if (!data || typeof data !== 'object') throw new SaveError('세이브 데이터가 아닙니다');
  const { data: migrated, applied } = migrate(data);
  const warnings = [];
  if (applied.length) warnings.push(`마이그레이션 적용: v${applied.join(' → v')}`);
  if (migrated.config_version !== definitions.version) {
    warnings.push(`config_version이 다릅니다: 세이브 ${migrated.config_version} vs 현재 ${definitions.version}. 밸런스 값이 달라질 수 있습니다`);
  }
  const state = {
    save_version: SAVE_VERSION,
    config_version: migrated.config_version,
    week: migrated.week ?? 0,
    rng: RngSet.restore(migrated.rng),
    events: EventLog.restore(definitions.configs.save.event_history, migrated.events),
    fighters: migrated.fighters ?? {},
    knowledge: migrated.knowledge ?? {},
    active_fight: migrated.active_fight ?? null
  };
  if (validateReferences) {
    for (const problem of validateReferences(state, definitions)) warnings.push(problem);
  }
  return { state, warnings };
}

// Broken references are logged, never silently dropped. Deletion of definition content is
// a last resort; deprecation is the default, so a dangling id is worth reporting.
export function validateDefinitionReferences(state, definitions) {
  const problems = [];
  const cards = definitions.configs.combat_prototype.cards;
  const fight = state.active_fight;
  if (fight) {
    for (const plan of fight.committed_plans ?? []) {
      for (const placement of plan) {
        if (!cards[placement.id]) problems.push(`끊어진 참조: active_fight 계획의 카드 ${placement.id}`);
      }
    }
  }
  for (const [id, fighter] of Object.entries(state.fighters)) {
    for (const cardId of fighter.skill_cards ?? []) {
      if (!cards[cardId] && !definitions.configs.combat_prototype.skills[cardId]) {
        problems.push(`끊어진 참조: fighter ${id}의 카드 ${cardId}`);
      }
    }
  }
  return problems;
}

// Combat is deterministic, so it is stored as a snapshot plus committed plans rather than
// full combat state. This reuses the replay path and turns every restore into a
// determinism check: a mismatch proves determinism broke.
export function saveCombat(preFightSnapshot, committedPlans, combatStream) {
  return {
    pre_fight_snapshot: structuredClone(preFightSnapshot),
    committed_plans: structuredClone(committedPlans),
    combat_rng: { state: combatStream.state, count: combatStream.count }
  };
}

export function replayCombat(saved, resolveTurn) {
  let match = structuredClone(saved.pre_fight_snapshot);
  const turns = [];
  for (const [playerPlan, enemyPlan] of saved.committed_plans) {
    if (match.finished) break;
    const result = resolveTurn(match, playerPlan, enemyPlan);
    match = result.match;
    turns.push(result);
  }
  return { match, turns };
}
