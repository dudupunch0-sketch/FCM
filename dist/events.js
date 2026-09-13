// Event history with retention. Roadmap Phase 0.
// Spec: docs/spec/data_model_part1_part2.md section 38, docs/design/32 section 5.
// Evidence source events are exempt from compaction: doc 29 lets a better analyst
// re-read past evidence, which is impossible once the source is gone.

export const EVIDENCE_SOURCE_KIND = 'evidence_source_events';

export class EventLog {
  constructor(retention) {
    if (!retention) throw Error('event_history 설정이 필요합니다');
    this.retention = retention;
    this.events = [];
    this.nextId = 1;
  }

  append(event) {
    if (!event?.type) throw Error('이벤트 type이 필요합니다');
    if (!Number.isInteger(event.week)) throw Error('이벤트 week가 필요합니다');
    const stored = { ...event, event_id: `e${this.nextId++}` };
    this.events.push(stored);
    return stored;
  }

  since(week) { return this.events.filter(e => e.week >= week); }
  byType(type) { return this.events.filter(e => e.type === type); }
  find(id) { return this.events.find(e => e.event_id === id) ?? null; }

  isProtected(event) {
    const never = this.retention.never_summarised ?? [];
    return never.includes(event.type) || never.includes(EVIDENCE_SOURCE_KIND) && event.is_evidence_source === true;
  }

  // Old, low-tier, unprotected events collapse into per-type summaries.
  compact(currentWeek) {
    const full = this.retention.full_retention_weeks ?? Infinity;
    const tierCAfter = this.retention.tier_c_summarise_after_weeks ?? Infinity;
    const kept = [];
    const summarised = new Map();
    for (const event of this.events) {
      const age = currentWeek - event.week;
      const stale = age > full || (event.tier === 'C' && age > tierCAfter);
      if (!stale || this.isProtected(event)) { kept.push(event); continue; }
      const key = `${event.type}:${Math.floor(event.week / 52)}`;
      const summary = summarised.get(key) ?? { type: event.type, week: Math.floor(event.week / 52) * 52, summarised: true, count: 0, event_id: `s_${key}` };
      summary.count++;
      summarised.set(key, summary);
    }
    const removed = this.events.length - kept.length;
    this.events = [...summarised.values(), ...kept].sort((a, b) => a.week - b.week);
    return { removed, summaries: summarised.size };
  }

  serialize() { return { events: this.events, nextId: this.nextId }; }

  static restore(retention, data) {
    const log = new EventLog(retention);
    log.events = data?.events ?? [];
    log.nextId = data?.nextId ?? log.events.length + 1;
    return log;
  }
}
