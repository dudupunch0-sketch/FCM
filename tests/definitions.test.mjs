import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../tools/config_source.mjs';
import { CONFIG_FILES, loadDefinitions, buildDefinitions, validateConfig, ConfigError } from '../dist/definitions.js';
import { ALL_BASE_PARAMETERS, DERIVED_CAPABILITIES } from '../dist/fighter-schema.js';

const raw = async () => {
  const out = {};
  for (const name of CONFIG_FILES) out[name] = await readConfig(name);
  return out;
};
const clone = o => structuredClone(o);

test('every shipped config loads, validates, and freezes', async () => {
  const defs = await loadDefinitions(readConfig);
  assert.equal(defs.files.length, CONFIG_FILES.length);
  assert.ok(Object.isFrozen(defs.configs.derived_capability.capabilities));
  assert.throws(() => { defs.configs.derived_capability.formula.base_floor = 99; }, TypeError);
  assert.equal(Object.keys(defs.configs.derived_capability.capabilities).length, DERIVED_CAPABILITIES.length);
});

test('derived weights sum to one and every base parameter is used', async () => {
  const { capabilities } = (await readConfig('derived_capability'));
  const used = new Set();
  for (const [name, spec] of Object.entries(capabilities)) {
    const sum = Object.values(spec.weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${name} 가중치 합 ${sum}`);
    Object.keys(spec.weights).forEach(b => used.add(b));
  }
  assert.deepEqual(ALL_BASE_PARAMETERS.filter(b => !used.has(b)), []);
});

test('a broken weight sum is rejected with the offending path', async () => {
  const cfg = clone(await readConfig('derived_capability'));
  cfg.capabilities.punch_impact.weights.strength = 0.9;
  let error;
  try { validateConfig('derived_capability', cfg); } catch (e) { error = e; }
  assert.ok(error instanceof ConfigError, '주소를 가진 ConfigError여야 합니다');
  assert.equal(error.file, 'derived_capability');
  assert.equal(error.path, 'capabilities.punch_impact.weights');
  assert.match(error.message, /가중치 합이 1\.0/);
});

test('an unknown base parameter name is rejected', async () => {
  const cfg = clone(await readConfig('derived_capability'));
  delete cfg.capabilities.guard_efficiency.weights.strength;
  cfg.capabilities.guard_efficiency.weights.punch_power = 0.2;
  assert.throws(() => validateConfig('derived_capability', cfg), /알 수 없는 Base Parameter/);
});

test('stamina sensitivity must cover all seventeen capabilities', async () => {
  const cfg = clone(await readConfig('effective_performance'));
  delete cfg.stamina.max_loss.evasion_capability;
  assert.throws(() => validateConfig('effective_performance', cfg), /stamina\.max_loss\.evasion_capability/);
});

test('interval recovery may not reach full', async () => {
  const cfg = clone(await readConfig('effective_performance'));
  cfg.interval_recovery.cap_fraction = 1;
  assert.throws(() => validateConfig('effective_performance', cfg), /완전 회복/);
});

test('forbidden randomness rolls cannot be removed', async () => {
  const cfg = clone(await readConfig('action_resolution'));
  cfg.randomness.forbidden = cfg.randomness.forbidden.filter(x => x !== 'winner_roll');
  assert.throws(() => validateConfig('action_resolution', cfg), /winner_roll/);
});

test('defense precedence order and status thresholds are enforced', async () => {
  const base = await readConfig('action_resolution');
  const reordered = clone(base);
  reordered.defense_precedence.order = ['guard_coverage', 'evasion_trajectory', 'unprotected'];
  assert.throws(() => validateConfig('action_resolution', reordered), /회피 → 가드 → 무방비/);
  const thresholds = clone(base);
  thresholds.status.impact_ratio_thresholds.groggy = 0.4;
  assert.throws(() => validateConfig('action_resolution', thresholds), /단조 증가/);
});

test('zero simultaneity tolerance is rejected so double KO stays reachable', async () => {
  const cfg = clone(await readConfig('action_resolution'));
  cfg.sub_beat.simultaneity_tolerance = 0;
  assert.throws(() => validateConfig('action_resolution', cfg), /동시 KO/);
});

test('combo carryover must include status, counter window, feint opening and gap', async () => {
  const cfg = clone(await readConfig('action_resolution'));
  cfg.turn_carryover.carries = cfg.turn_carryover.carries.filter(x => x !== 'counter_window');
  assert.throws(() => validateConfig('action_resolution', cfg), /counter_window/);
});

test('boxing and kickboxing may not allow ground, and submissions keep an escape window', async () => {
  const base = await readConfig('grappling');
  const ground = clone(base);
  ground.ruleset_gating.boxing.ground_allowed = true;
  assert.throws(() => validateConfig('grappling', ground), /그라운드가 금지/);
  const escape = clone(base);
  escape.submission.escape_window_slots = 0;
  assert.throws(() => validateConfig('grappling', escape), /escape_window_slots/);
});

test('demoted actions may not keep proficiency', async () => {
  const cfg = clone(await readConfig('grappling'));
  cfg.demotion.proficiency_multiplier = 0.5;
  assert.throws(() => validateConfig('grappling', cfg), /숙련도 보너스/);
});

test('prediction confidence cannot reach certainty and NPC cards stay retrospective', async () => {
  const base = await readConfig('combat_ai');
  const certain = clone(base);
  certain.fight_iq.prediction_confidence.max = 1;
  assert.throws(() => validateConfig('combat_ai', certain), /완전한 예측/);
  const peeking = clone(base);
  peeking.npc_information_cards.forbidden = [];
  assert.throws(() => validateConfig('combat_ai', peeking), /read_current_turn_plan/);
});

test('repetition penalty must stay negative', async () => {
  const cfg = clone(await readConfig('combat_ai'));
  cfg.evaluation.terms.pattern_repetition_penalty = 0.4;
  assert.throws(() => validateConfig('combat_ai', cfg), /반복 패널티/);
});

test('knowledge estimates never collapse and potential stays hidden', async () => {
  const base = await readConfig('knowledge');
  const collapsed = clone(base);
  collapsed.estimate.min_width = 0;
  assert.throws(() => validateConfig('knowledge', collapsed), /0으로 수렴/);
  const exposed = clone(base);
  exposed.potential.expose_ceiling = true;
  assert.throws(() => validateConfig('knowledge', exposed), /Potential 상한/);
});

test('every evidence source references a declared bias source', async () => {
  const cfg = clone(await readConfig('knowledge'));
  cfg.evidence_sources.rumor.bias_sources = ['vibes'];
  assert.throws(() => validateConfig('knowledge', cfg), /알 수 없는 편향 원천/);
});

test('reveal budget must bind before the information card limit', async () => {
  const cfg = clone(await readConfig('information_cards'));
  assert.ok(cfg.active_card_limit.information > 1);
  cfg.reveal_budget.per_turn_total = cfg.active_card_limit.information * cfg.reveal_budget.cost.exact;
  assert.throws(() => validateConfig('information_cards', cfg), /예산이 카드 수를 구속하지 못합니다/);
});

test('card limits stay split and growth cannot raise the budget', async () => {
  const base = await readConfig('information_cards');
  const shared = clone(base);
  shared.active_card_limit.shared_pool = true;
  assert.throws(() => validateConfig('information_cards', shared), /갈래별로 분리/);
  const growth = clone(base);
  growth.card_growth.raises_budget = true;
  assert.throws(() => validateConfig('information_cards', growth), /예산 상한을 올리지 않습니다/);
});

test('the free baseline cannot be switched off', async () => {
  const cfg = clone(await readConfig('information_cards'));
  cfg.free_baseline.repeated_habit_markers = false;
  assert.throws(() => validateConfig('information_cards', cfg), /무카드 기준선/);
});

test('derived and effective values may never be persisted', async () => {
  const cfg = clone(await readConfig('save'));
  cfg.persistence.never_persisted = cfg.persistence.never_persisted.filter(x => x !== 'derived_capability');
  assert.throws(() => validateConfig('save', cfg), /derived_capability는 저장하지 않습니다/);
});

test('seeds alone are not accepted as reproducible', async () => {
  const cfg = clone(await readConfig('save'));
  cfg.rng_streams.persist_consumption_counters = false;
  assert.throws(() => validateConfig('save', cfg), /Seed만으로는 재현되지 않습니다/);
});

test('evidence source events are exempt from history compaction', async () => {
  const cfg = clone(await readConfig('save'));
  cfg.event_history.never_summarised = ['contract'];
  assert.throws(() => validateConfig('save', cfg), /evidence_source_events/);
});

test('a missing config file is reported by name', async () => {
  const all = await raw();
  delete all.knowledge;
  assert.throws(() => buildDefinitions(all), /knowledge\.json/);
});

test('dist/config mirrors the authoritative config directory', async () => {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  for (const name of CONFIG_FILES) {
    const source = await readFile(join(root, 'config', `${name}.json`), 'utf8');
    const mirrored = await readFile(join(root, 'dist', 'config', `${name}.json`), 'utf8');
    assert.deepEqual(JSON.parse(mirrored), JSON.parse(source), `${name}.json 동기화 필요: node tools/sync_config.mjs`);
  }
});
