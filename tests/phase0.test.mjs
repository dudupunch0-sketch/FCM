import { test } from 'node:test';
import assert from 'node:assert/strict';
import { definitions } from './helpers/engine-setup.mjs';
import { newMatch, makePlan, opponentPlan, resolveTurn } from '../dist/engine.js';
import { RngSet, createRngSet } from '../dist/rng.js';
import { EventLog } from '../dist/events.js';
import { createGameState, serializeGameState, loadGameState, saveCombat, replayCombat, validateDefinitionReferences, SAVE_VERSION, SaveError } from '../dist/save.js';

test('streams are independent: consuming one does not move another', () => {
  const a = createRngSet(7, definitions);
  const b = createRngSet(7, definitions);
  for (let i = 0; i < 500; i++) a.stream('combat').next();
  assert.equal(a.stream('world_generation').next(), b.stream('world_generation').next());
  assert.equal(a.stream('world_generation').count, 1);
  assert.equal(a.stream('combat').count, 500);
});

test('same seed reproduces every stream, different seeds diverge', () => {
  const draw = seed => {
    const set = createRngSet(seed, definitions);
    return definitions.configs.save.rng_streams.streams.map(n => set.stream(n).next());
  };
  assert.deepEqual(draw(42), draw(42));
  assert.notDeepEqual(draw(42), draw(43));
});

test('restoring a serialized RNG continues the exact sequence, not a replay from zero', () => {
  const set = createRngSet(11, definitions);
  const stream = set.stream('injury');
  for (let i = 0; i < 1000; i++) stream.next();
  const expected = Array.from({ length: 5 }, () => stream.next());
  const rewound = createRngSet(11, definitions);
  const rewoundStream = rewound.stream('injury');
  for (let i = 0; i < 1000; i++) rewoundStream.next();
  const restored = RngSet.restore(rewound.serialize());
  assert.deepEqual(Array.from({ length: 5 }, () => restored.stream('injury').next()), expected);
  assert.equal(restored.stream('injury').count, 1005);
});

test('an unknown stream name is refused', () => {
  assert.throws(() => createRngSet(1, definitions).stream('vibes'), /알 수 없는 RNG 스트림/);
});

test('variance stays inside its band and is symmetric enough to be neutral', () => {
  const stream = createRngSet(3, definitions).stream('combat');
  let sum = 0;
  for (let i = 0; i < 20000; i++) {
    const v = stream.variance(0.07);
    assert.ok(v >= -0.07 && v <= 0.07, `범위 이탈: ${v}`);
    sum += v;
  }
  assert.ok(Math.abs(sum / 20000) < 0.002, `편향된 분산: ${sum / 20000}`);
});

test('evidence source events survive compaction while ordinary old ones summarise', () => {
  const log = new EventLog(definitions.configs.save.event_history);
  log.append({ type: 'sparring', week: 0, tier: 'C' });
  log.append({ type: 'observed_fight', week: 0, tier: 'C', is_evidence_source: true });
  log.append({ type: 'contract', week: 0, tier: 'C' });
  log.append({ type: 'sparring', week: 900, tier: 'A' });
  const before = log.events.length;
  const result = log.compact(1000);
  assert.ok(result.removed > 0, '오래된 이벤트가 축약되지 않았습니다');
  assert.ok(log.events.some(e => e.is_evidence_source), 'Evidence 출처가 소실되었습니다');
  assert.ok(log.events.some(e => e.type === 'contract'), '보호 대상이 소실되었습니다');
  assert.ok(log.events.length < before + result.summaries);
});

test('a round trip preserves week, rng position and events', () => {
  const state = createGameState(definitions, { seed: 5, week: 12 });
  state.events.append({ type: 'FightCompleted', week: 12 });
  for (let i = 0; i < 30; i++) state.rng.stream('combat').next();
  const { state: loaded, warnings } = loadGameState(serializeGameState(state), definitions);
  assert.equal(loaded.week, 12);
  assert.equal(loaded.rng.stream('combat').count, 30);
  assert.equal(loaded.events.byType('FightCompleted').length, 1);
  assert.deepEqual(warnings, []);
  assert.equal(loaded.rng.stream('combat').next(), state.rng.stream('combat').next());
});

test('saving refuses to persist derived or effective values', () => {
  const state = createGameState(definitions);
  state.fighters.f1 = { name: '테스트', derived: { punch_impact: 70 } };
  assert.throws(() => serializeGameState(state), SaveError);
  assert.throws(() => serializeGameState(state), /계산 가능한 값은 저장하지 않습니다/);
});

test('a config_version mismatch warns but still loads', () => {
  const data = serializeGameState(createGameState(definitions));
  data.config_version = '0.0.1-old';
  const { state, warnings } = loadGameState(data, definitions);
  assert.equal(state.week, 0);
  assert.ok(warnings.some(w => w.includes('config_version')), warnings.join('\n'));
});

test('old saves migrate one step at a time up to the current version', () => {
  const legacy = { save_version: 1, config_version: definitions.version, week: 4, rng_seed: 99, event_history: [{ type: 'Old', week: 1, event_id: 'e1' }] };
  const { state, warnings } = loadGameState(legacy, definitions);
  assert.equal(state.save_version, SAVE_VERSION);
  assert.equal(state.week, 4);
  assert.equal(state.rng.seed, 99);
  assert.equal(state.events.byType('Old').length, 1);
  assert.ok(warnings.some(w => w.includes('v2 → v3')), warnings.join('\n'));
});

test('a save from the future is refused rather than guessed at', () => {
  const data = serializeGameState(createGameState(definitions));
  data.save_version = SAVE_VERSION + 5;
  assert.throws(() => loadGameState(data, definitions), /더 새로운 세이브/);
});

test('broken definition references are reported, not silently dropped', () => {
  const state = createGameState(definitions);
  state.fighters.f1 = { name: '테스트', skill_cards: ['jab', 'deleted_card'] };
  const { warnings } = loadGameState(serializeGameState(state), definitions, { validateReferences: validateDefinitionReferences });
  assert.ok(warnings.some(w => w.includes('deleted_card')), warnings.join('\n'));
  assert.ok(!warnings.some(w => w.includes('jab')));
});

test('in-combat save restores by replaying committed plans, not by storing combat state', () => {
  let match = newMatch('pressure', 21);
  const snapshot = structuredClone(match);
  const plans = [];
  for (let i = 0; i < 3 && !match.finished; i++) {
    const enemy = opponentPlan(match);
    const player = makePlan(['jab', 'cross', 'sway']);
    plans.push([player, enemy]);
    match = resolveTurn(match, player, enemy).match;
  }
  const stream = createRngSet(21, definitions).stream('combat');
  const saved = saveCombat(snapshot, plans, stream);
  assert.ok(!('fighters' in saved) || saved.pre_fight_snapshot.fighters, '전투 상태 전체를 저장하면 안 됩니다');
  const replayed = replayCombat(saved, resolveTurn);
  assert.deepEqual(replayed.match, match, '리플레이 불일치는 결정론이 깨졌다는 뜻입니다');
});
