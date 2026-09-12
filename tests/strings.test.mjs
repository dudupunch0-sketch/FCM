// String table and commentary layer.
// Spec: docs/design/37_accessibility_localization_performance.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import './helpers/engine-setup.mjs';
import {CARDS, newMatch, makePlan, resolveTurn} from '../dist/engine.js';
import {configureStrings, t, missingKeys, stringsReady} from '../dist/strings.js';
import {describeEvent, stageMessage} from '../dist/commentary.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const base = JSON.parse(await readFile(new URL('../config/strings/ko.json', import.meta.url), 'utf8'));
configureStrings(base, base);
const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });

test('the base table loads and declares itself the fallback language', () => {
  assert.ok(stringsReady());
  assert.equal(base.base_language, true);
  assert.ok(Object.keys(base.strings).length > 10);
});

test('placeholders are substituted and unknown keys are refused loudly', () => {
  assert.equal(t('event.rest', { fighter: '도전자' }), '도전자: 호흡 정리');
  assert.throws(() => t('event.nonexistent'), /알 수 없는 문자열 키/);
});

test('a missing translation falls back to the base language, never to a raw key', () => {
  const partial = { strings: { 'event.rest': '{fighter} rests' } };
  configureStrings(partial, base);
  assert.equal(t('event.rest', { fighter: 'A' }), 'A rests');
  const fellBack = t('event.evade', { fighter: 'A' });
  assert.ok(!fellBack.includes('event.evade'), `키가 그대로 노출됐습니다: ${fellBack}`);
  assert.ok(fellBack.includes('A'));
  assert.deepEqual(missingKeys(base).includes('event.evade'), true);
  configureStrings(base, base);
});

test('the engine emits no user-facing text of its own', async () => {
  // Presentation must not live inside resolution, or the wording cannot be translated and
  // judging carries display concerns. Spec: docs/design/37 section 2.
  const source = await readFile(new URL('../dist/engine.js', import.meta.url), 'utf8');
  assert.ok(!/\btext:/.test(source), '엔진이 아직 표시 문구를 만듭니다');
  let match = newMatch('pressure', 3, { player: evenly(60), opponent: evenly(60) });
  const result = resolveTurn(match, makePlan(['jab', 'cross']), makePlan(['guard']));
  for (const event of result.frames.flatMap(f => f.events)) {
    assert.ok(!('text' in event), `${event.type} 이벤트에 text가 남아 있습니다`);
  }
});

test('every emitted event kind renders to non-empty text', () => {
  const seen = new Set();
  let match = newMatch('pressure', 7, { player: evenly(60), opponent: evenly(60) });
  while (!match.finished) {
    const result = resolveTurn(match, makePlan(['feint', 'heavy', 'sway']), makePlan(['jab', 'shell']));
    for (const frame of result.frames) {
      for (const event of frame.events) {
        const text = describeEvent(event, { fighters: frame.fighters });
        assert.ok(text.length > 0, `${event.type} 이벤트 문구가 비었습니다`);
        assert.ok(!text.includes('{'), `치환되지 않은 자리표시자: ${text}`);
        seen.add(event.type);
      }
      assert.ok(stageMessage(frame).length > 0);
    }
    match = result.match;
  }
  for (const kind of ['hit', 'rest']) assert.ok(seen.has(kind), `${kind} 이벤트가 발생하지 않았습니다`);
});

test('commentary names the card that was actually thrown', () => {
  const match = newMatch('pressure', 4, { player: evenly(60), opponent: evenly(60) });
  const result = resolveTurn(match, makePlan(['heavy']), makePlan([]));
  const hit = result.frames.flatMap(f => f.events).find(e => e.type === 'hit');
  assert.ok(hit, '타격이 없습니다');
  assert.ok(describeEvent(hit, { fighters: result.frames[0].fighters }).includes(CARDS.heavy.name));
});

test('validator messages stay out of the table: they are traceability, not copy', () => {
  for (const key of Object.keys(base.strings)) {
    assert.ok(!/필요합니다|알 수 없는|초과합니다/.test(base.strings[key]),
      `검증 메시지가 문자열 테이블에 들어왔습니다: ${key}`);
  }
});
