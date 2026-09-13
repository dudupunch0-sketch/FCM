// Structure of the design document set.
//
// Numbering collided twice. The first time was inside one stream (`80d1f1c`); the second time
// two streams working in parallel each claimed 22 through 25 for different documents, and
// because the filenames differ git merges them without a word — there is no conflict to
// resolve, just eight files where four should be. A test is the only thing that notices.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';

const designDir = new URL('../docs/design/', import.meta.url);
const files = (await readdir(designDir)).filter(name => name.endsWith('.md'));
// `21a` and `21b` are one document deliberately split, so the letter is part of the number.
const numberOf = name => name.match(/^(\d+[a-z]?)_/)?.[1] ?? null;

test('every design document is numbered', () => {
  const unnumbered = files.filter(name => !numberOf(name));
  assert.deepEqual(unnumbered, [], `번호 없는 설계 문서: ${unnumbered.join(', ')}`);
});

test('no two design documents share a number', () => {
  // The numbers are how every other document points here, so a duplicate makes a reference
  // ambiguous rather than merely untidy.
  const byNumber = new Map();
  for (const name of files) {
    const number = numberOf(name);
    if (!byNumber.has(number)) byNumber.set(number, []);
    byNumber.get(number).push(name);
  }
  const clashes = [...byNumber].filter(([, names]) => names.length > 1);
  assert.deepEqual(clashes, [],
    `번호가 겹칩니다: ${clashes.map(([n, names]) => `${n} → ${names.join(' vs ')}`).join(' · ')}`);
});

test('the numbering bands keep the two work streams apart', async () => {
  // Combat and systems own 22-38; animation and presentation own 39 and up. Documents below
  // 22 predate the split and are shared history. Spec: dev/WORKSTREAMS.md.
  const SYSTEM_BAND = [22, 38];
  const shared = new Set(['20', '21a', '21b']);
  const strays = files.filter(name => {
    const number = numberOf(name);
    const value = Number.parseInt(number, 10);
    return value >= SYSTEM_BAND[0] && !shared.has(number) && value > SYSTEM_BAND[1];
  });
  assert.deepEqual(strays, [], `이 브랜치는 시스템 대역(22~38)만 써야 합니다: ${strays.join(', ')}`);

  // The band boundary is a fact other documents state, so it must not drift silently.
  const streams = await readFile(new URL('../dev/WORKSTREAMS.md', import.meta.url), 'utf8');
  assert.ok(streams.includes('22 ~ 38'), 'WORKSTREAMS가 시스템 대역을 명시하지 않습니다');
  assert.ok(/39\s*번? 이상|39~/.test(streams), 'WORKSTREAMS가 애니메이션 대역을 명시하지 않습니다');
});

test('every design document the SSOT points at exists', async () => {
  // Renumbering a document is cheap; leaving a pointer behind is how a register stops being
  // authoritative. This makes the rename safe to perform.
  const ssot = await readFile(new URL('../docs/spec/current_decisions.md', import.meta.url), 'utf8');
  const referenced = [...ssot.matchAll(/docs\/design\/([\w.-]+\.md)/g)].map(m => m[1]);
  assert.ok(referenced.length > 5, `참조가 너무 적습니다: ${referenced.length}`);
  const missing = [...new Set(referenced)].filter(name => !files.includes(name));
  assert.deepEqual(missing, [], `SSOT가 없는 문서를 가리킵니다: ${missing.join(', ')}`);
});

test('every design document the guide points at exists', async () => {
  const guide = await readFile(new URL('../docs/guide/testing_and_calibration.md', import.meta.url), 'utf8');
  const referenced = [...guide.matchAll(/docs\/design\/([\w.-]+\.md)/g)].map(m => m[1]);
  const missing = [...new Set(referenced)].filter(name => !files.includes(name));
  assert.deepEqual(missing, [], `지침이 없는 문서를 가리킵니다: ${missing.join(', ')}`);
});
