// Turns resolution events into readable text. Kept out of the engine so that judging never
// carries presentation, and so the wording can be translated without touching the rules.
// Spec: docs/design/37_accessibility_localization_performance.md.

import { t } from './strings.js';
import { CARDS } from './engine.js';

const outcomeKey = event => {
  if (event.type === 'block') return 'event.outcome.block';
  if (event.guardBreak) return 'event.outcome.guardBreak';
  if (event.setup) return 'event.outcome.setup';
  return 'event.outcome.clean';
};

export function describeEvent(event, { fighters = [], cards = CARDS } = {}) {
  const fighter = fighters[event.actor]?.name ?? '';
  switch (event.type) {
    case 'exhausted':
      return t('event.exhausted', { fighter, card: cards[event.card]?.name ?? '' });
    case 'rest':
      return t('event.rest', { fighter });
    case 'feint':
      return t(event.success ? 'event.feint.success' : 'event.feint.ignored', { fighter });
    case 'evade':
      return t('event.evade', { fighter });
    case 'stance':
      return t(`event.stance.${event.stance}`, { fighter });
    case 'ceiling':
      return t('event.ceiling', { fighter, cap: event.cap });
    case 'status':
      return t(`event.status.${event.level}`, { fighter: fighters[event.actor]?.name ?? '' });
    case 'hit':
    case 'block':
      return t('event.hit', {
        fighter,
        counter: event.counter ? t('event.counterPrefix') : '',
        card: cards[event.card]?.name ?? '',
        outcome: t(outcomeKey(event)),
        power: event.power
      });
    case 'finish':
      return event.winner === null
        ? t('event.finish.doubleKo')
        : t('event.finish.ko', { fighter: fighters[event.winner]?.name ?? '' });
    default:
      return '';
  }
}

export function stageMessage(frame) {
  const events = frame.events ?? [];
  const chosen = events.find(e => e.type === 'hit' && e.counter) ?? events.find(e => e.type !== 'rest');
  return chosen ? describeEvent(chosen, { fighters: frame.fighters }) : t('stage.idle');
}
