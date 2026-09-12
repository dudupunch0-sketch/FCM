// User-facing string table. Spec: docs/design/37_accessibility_localization_performance.md.
// Only strings a player reads live here. Validator and exception messages stay in the source,
// where they map one-to-one onto the verification criteria in the design docs.

let TABLE = null;
let FALLBACK = null;

export function configureStrings(table, fallback = null) {
  if (!table?.strings) throw Error('문자열 테이블이 아닙니다');
  TABLE = table.strings;
  FALLBACK = fallback?.strings ?? null;
  return TABLE;
}

export function stringsReady() { return TABLE !== null; }

// Missing keys fall back to the base language, never to a raw key: a player must never be
// shown "event.hit" because a translation was late.
export function t(key, params = {}) {
  const template = TABLE?.[key] ?? FALLBACK?.[key];
  if (template === undefined) throw Error(`알 수 없는 문자열 키: ${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? ''));
}

export function missingKeys(reference) {
  if (!TABLE) return Object.keys(reference.strings);
  return Object.keys(reference.strings).filter(key => !(key in TABLE));
}
