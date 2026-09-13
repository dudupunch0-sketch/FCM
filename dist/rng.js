// Deterministic RNG with per-purpose streams. Roadmap Phase 0.
// Spec: docs/design/32_save_versioning_and_determinism.md section 3.
// A seed alone does not reproduce a run, so each stream carries its own state and
// consumption counter. Streams are separated so changing combat code cannot perturb
// world generation and destroy A/B comparison.

const UINT32 = 4294967296;

function hashName(name) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nextState(state) {
  let x = state | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x | 0;
}

// A zero state is a fixed point for xorshift, so it is never allowed.
const seedState = (seed, name) => (((seed | 0) ^ hashName(name)) | 0) || 0x9e3779b9;

export class RngStream {
  constructor(name, state, count = 0) {
    this.name = name;
    this.state = state;
    this.count = count;
  }

  next() {
    this.state = nextState(this.state);
    this.count++;
    return (this.state >>> 0) / UINT32;
  }

  int(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1) throw Error('int(max)는 1 이상의 정수가 필요합니다');
    return Math.floor(this.next() * maxExclusive);
  }

  pick(items) {
    if (!items?.length) throw Error('빈 목록에서 뽑을 수 없습니다');
    return items[this.int(items.length)];
  }

  // Symmetric triangular in [-spread, spread]. Used for impact variance, which is the
  // only place randomness is allowed to touch resolution.
  variance(spread) {
    return (this.next() + this.next() - 1) * spread;
  }
}

export class RngSet {
  constructor(seed, streamNames) {
    if (!Number.isInteger(seed)) throw Error('seed는 정수여야 합니다');
    if (!streamNames?.length) throw Error('스트림 목록이 필요합니다');
    this.seed = seed;
    this.streams = new Map(streamNames.map(name => [name, new RngStream(name, seedState(seed, name))]));
  }

  stream(name) {
    const stream = this.streams.get(name);
    if (!stream) throw Error(`알 수 없는 RNG 스트림: ${name}`);
    return stream;
  }

  // Saved alongside the game state. Restoring counters alone is not enough; the state is
  // what makes restoration exact rather than a replay.
  serialize() {
    const streams = {};
    for (const [name, s] of this.streams) streams[name] = { state: s.state, count: s.count };
    return { seed: this.seed, streams };
  }

  static restore(data) {
    const names = Object.keys(data?.streams ?? {});
    const set = new RngSet(data.seed, names);
    for (const name of names) {
      const saved = data.streams[name];
      set.streams.set(name, new RngStream(name, saved.state, saved.count));
    }
    return set;
  }

  totalConsumed() {
    let total = 0;
    for (const s of this.streams.values()) total += s.count;
    return total;
  }
}

export function createRngSet(seed, definitions) {
  const names = definitions?.configs?.save?.rng_streams?.streams ?? definitions?.rng_streams?.streams;
  if (!names) throw Error('save 설정에서 RNG 스트림 목록을 찾을 수 없습니다');
  return new RngSet(seed, names);
}
