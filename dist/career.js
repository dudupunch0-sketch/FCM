// One-fighter vertical slice. Roadmap Milestone A.
// Spec: implementation_roadmap Milestone A, docs/design/13, 24, 25, 29.
// Connects the loop the roadmap calls the most important question: train a fighter for weeks,
// prepare a fight, fight it, take damage and growth, and continue.

import { createFighter, createCondition, computeDerived, intervalRecovery } from './fighter.js';
import { createTrainingState, runWeek, applyGains, matchTechniqueExp, addTechniqueExp, addAdversity, proximityFactor } from './growth.js';
import { createKnowledge, addEvidence, estimate } from './knowledge.js';
import { newMatch, makePlan, opponentPlan, resolveTurn } from './engine.js';

export function startCareer(definitions, spec) {
  const fighter = createFighter({ id: spec.id ?? 'p1', name: spec.name ?? '유망주', base: spec.base, body: spec.body });
  return {
    definitions,
    week: 0,
    fighter,
    potential: spec.potential ?? { overall_talent: 60, physical_aptitude: 60, striking_aptitude: 60, grappling_aptitude: 60, combat_intelligence_aptitude: 60 },
    training: createTrainingState(),
    condition: createCondition({ stance: fighter.body.stance }),
    knowledge: createKnowledge(spec.id ?? 'p1', definitions),
    record: { wins: 0, losses: 0, draws: 0 },
    log: []
  };
}

export function trainWeek(career, schedule) {
  const result = runWeek(career.fighter, career.training, schedule, career.definitions, { potential: career.potential });
  const grown = applyGains(career.fighter, result.gains);
  const training = addTechniqueExp(result.state, { training: result.techniqueGain });
  const next = { ...career, week: career.week + 1, fighter: grown, training };
  next.log = [...career.log, { week: next.week, type: 'week', schedule, trace: result.trace }];
  return next;
}

// Fight Readiness is a summary of state, not a stat. It explains itself.
export function fightReadiness(career) {
  const { training, fighter } = career;
  const reasons = [];
  let score = 100;
  if (training.recovery_debt > 6) { score -= 30; reasons.push('회복 부채 누적'); }
  else if (training.recovery_debt > 2) { score -= 12; reasons.push('피로 잔존'); }
  if (training.stress > 60) { score -= 25; reasons.push('높은 스트레스'); }
  if (training.sharpness < 5) { score -= 15; reasons.push('실전 감각 부족'); }
  if (career.condition.body_damage.head > 30) { score -= 20; reasons.push('머리 손상 미회복'); }
  if (fighter.body.age > 34) { score -= 10; reasons.push('회복 속도 저하'); }
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Questionable' : score >= 30 ? 'Poor' : 'Not Cleared';
  return { label, score, reasons };
}

// A fight is a full match played out with the fighter's real stats and the plan the player gave.
export function takeFight(career, { profile = 'pressure', seed = 1, plan, opponent = {} } = {}) {
  const readiness = fightReadiness(career);
  if (readiness.label === 'Not Cleared') throw Error('출전 불가 상태입니다: ' + readiness.reasons.join(', '));

  let match = newMatch(profile, seed, {
    player: { base: career.fighter.base, body: career.fighter.body },
    opponent
  });
  match.fighters[0].stamina = career.condition.stamina;
  match.fighters[0].damage.head = career.condition.body_damage.head;

  const usage = {};
  const committed = [];
  while (!match.finished) {
    const playerPlan = makePlan(plan);
    for (const placement of playerPlan) usage[placement.id] = (usage[placement.id] ?? 0) + 1;
    const enemy = opponentPlan(match);
    committed.push([playerPlan, enemy]);
    match = resolveTurn(match, playerPlan, enemy).match;
  }

  const won = match.winner === 0;
  const finished = match.method === 'KO' && won;
  const record = { ...career.record };
  if (match.winner === null) record.draws++; else if (won) record.wins++; else record.losses++;

  // Real fights teach far more than training, and finishing teaches most.
  let training = addTechniqueExp(career.training, matchTechniqueExp(usage, career.definitions, { finishedWith: finished ? 'cross' : null }));
  training = { ...training, sharpness: Math.min(100, training.sharpness + 20) };

  // Adversity only counts when the fighter is actually near their limit.
  const proximity = 1 - proximityFactor(career.fighter.base.punch_technique, 100, career.definitions);
  const adversity = addAdversity(training, career.definitions, { kind: won ? 'upset' : 'adversity', proximity });

  const condition = createCondition({
    stance: career.fighter.body.stance,
    stamina: match.fighters[0].stamina,
    body_damage: { head: match.fighters[0].damage.head, body: match.fighters[0].damage.body }
  });

  // A fight is evidence about the fighter, recorded as fact and interpreted later.
  const knowledge = career.knowledge;
  addEvidence(knowledge, {
    source_type: 'observed_fight',
    week: career.week,
    target_keys: ['punch_technique'],
    observed_value: career.fighter.base.punch_technique,
    raw_fact: `${match.method} · ${won ? '승' : match.winner === null ? '무' : '패'}`
  });

  const next = {
    ...career,
    training: adversity.state,
    condition,
    record,
    log: [...career.log, { week: career.week, type: 'fight', method: match.method, winner: match.winner, breakthrough: adversity.broke }]
  };
  return { career: next, match, breakthrough: adversity.broke, readiness };
}

// Recovery between fights uses the same interval model the ring uses between rounds.
export function restWeek(career) {
  const stamina = intervalRecovery(career.fighter, career.condition, career.definitions, { recoveryDebt: career.training.recovery_debt / 20 });
  const damage = { ...career.condition.body_damage };
  for (const part of Object.keys(damage)) damage[part] = Math.max(0, damage[part] - 12);
  const trained = trainWeek(career, ['recovery', 'personal']);
  return { ...trained, condition: createCondition({ stance: career.fighter.body.stance, stamina, body_damage: damage }) };
}

// What the player is allowed to see: an estimate, never the true state.
export function scoutingView(career, { interpreterSkill = 0.5 } = {}) {
  return estimate(career.knowledge, 'punch_technique', {
    definitions: career.definitions,
    trueValue: career.fighter.base.punch_technique,
    interpreterSkill,
    currentWeek: career.week
  });
}

export function derivedView(career) {
  return computeDerived(career.fighter, career.definitions, { referenceWeight: career.fighter.body.natural_weight });
}
