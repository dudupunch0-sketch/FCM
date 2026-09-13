// Full Part 1 to Part 2 playthrough. Roadmap Milestone C.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {createRngSet} from '../dist/rng.js';
import {startCampaign,advanceWeek,runCampaign,ladderStage,sandboxAvailable,PART1,PART2,COMPLETE} from '../dist/campaign.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const talent=()=>({
  id:'hero',name:'주인공',
  base:Object.fromEntries(ALL_BASE_PARAMETERS.map(k=>[k,62])),
  body:{natural_weight:75,current_weight:75,age:22,stance:'orthodox'},
  potential:{overall_talent:88,physical_aptitude:85,striking_aptitude:92,grappling_aptitude:70,combat_intelligence_aptitude:85}
});
// The campaign must face the opponent the game ships, not the fallback patterns.
const strategies=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../config/ai_strategies.json',import.meta.url),'utf8'));
const start=seed=>startCampaign(definitions,createRngSet(seed,definitions).stream('world_generation'),talent(),{strategies});
// Completion is no longer guaranteed, so tests that need a finished run find one rather than
// assuming a fixed seed always wins.
const completedRun=()=>{
  for(let seed=1;seed<=25;seed++){
    const c=runCampaign(start(seed));
    if(c.part===COMPLETE)return c;
  }
  throw Error('어떤 시드로도 서사 완료에 도달하지 못했습니다');
};
const reachedPart2=()=>{
  for(let seed=1;seed<=25;seed++){
    const c=start(seed);
    while(c.part===PART1&&c.week<400)advanceWeek(c);
    if(c.part!==PART1)return c;
  }
  throw Error('어떤 시드로도 Part 2에 도달하지 못했습니다');
};

test('a campaign starts in Part 1 at the bottom of the one visible ladder',()=>{
  const c=start(1);
  assert.equal(c.part,PART1);
  assert.equal(ladderStage(c),'newcomer');
  assert.equal(c.world,null,'Part 1에서 국제 월드가 이미 보입니다');
});

test('weeks advance, training happens and money is spent',()=>{
  const c=start(2);
  const cash=c.ledger.management_cash;
  const level=c.career.fighter.base.punch_technique;
  for(let i=0;i<5;i++)advanceWeek(c);
  assert.equal(c.week,5);
  assert.ok(c.career.fighter.base.punch_technique>level,'훈련 성장이 없습니다');
  assert.notEqual(c.ledger.management_cash,cash,'돈이 전혀 움직이지 않았습니다');
  assert.ok(c.history.length>0);
});

test('an unfit fighter rests instead of being pushed into a fight',()=>{
  const c=start(3);
  c.career={...c.career,training:{...c.career.training,recovery_debt:15,stress:95,sharpness:0}};
  advanceWeek(c);
  const last=c.history.at(-1);
  assert.equal(last.type,'rest','출전 불가 상태인데 경기를 잡았습니다');
  assert.ok(last.reasons.length>0,'이유가 설명되지 않았습니다');
});

test('the full ladder is reachable: club champion, reveal fight, then the world',()=>{
  const c=completedRun();
  const types=c.history.map(h=>h.type);
  assert.ok(types.includes('club_fight'),'클럽 경기가 없습니다');
  assert.ok(types.includes('reveal_fight'),'외부 챔피언 특별전에 도달하지 못했습니다');
  assert.ok(types.includes('international_entry'),'국제 진입이 없습니다');
  assert.ok(types.includes('world_fight'),'국제 경기가 없습니다');
  assert.equal(c.part,COMPLETE,`서사 완료에 도달하지 못했습니다: ${c.part}, week ${c.week}`);
  assert.ok(types.includes('international_champion'));
});

test('reaching Part 2 opens the world and closes the club ladder',()=>{
  const c=reachedPart2();
  assert.notEqual(c.part,PART1);
  assert.ok(c.world,'Part 2인데 월드가 없습니다');
  assert.ok(c.world.fighters[c.career.fighter.id],'선수가 국제 명단에 없습니다');
  assert.equal(c.world.fighters[c.career.fighter.id].tier,'A','플레이어 선수가 Tier A가 아닙니다');
});

test('the belt is only won through an actual title fight',()=>{
  const c=completedRun();
  const titleWin=c.history.find(h=>h.type==='world_fight'&&h.title&&h.won);
  assert.ok(titleWin,'타이틀전 없이 챔피언이 되었습니다');
  assert.equal(c.history.at(-1).type,'international_champion');
});

test('narrative completion does not end the save',()=>{
  const c=completedRun();
  assert.equal(sandboxAvailable(c),true);
  assert.ok(Number.isInteger(c.completedWeek));
  const week=c.week;
  advanceWeek(c);
  assert.equal(c.week,week+1,'완료 후 진행이 막혔습니다');
});

test('the world keeps moving alongside the player career',()=>{
  const c=reachedPart2();
  const before=c.world.news.length;
  for(let i=0;i<20&&c.part!==COMPLETE;i++)advanceWeek(c);
  assert.ok(c.world.news.length>=before,'월드가 정지했습니다');
  assert.ok(c.world.week>0);
});

test('a whole playthrough is deterministic',()=>{
  const summary=seed=>{
    const c=runCampaign(start(seed));
    return {part:c.part,week:c.week,history:c.history.map(h=>h.type),record:c.career.record};
  };
  assert.deepEqual(summary(7),summary(7));
});

test('the ladder label tracks the real stage rather than a stored string',()=>{
  // One seed is not enough: a career that stalls early passes through fewer stages, and which
  // seeds stall changes whenever combat does. Same convention as completedRun above.
  let best=new Set();
  for(let seed=1;seed<=25&&best.size<=2;seed++){
    const c=start(seed);
    const seen=new Set([ladderStage(c)]);
    while(c.part!==COMPLETE&&c.week<400){advanceWeek(c);seen.add(ladderStage(c));}
    if(seen.size>best.size)best=seen;
  }
  assert.ok(best.has('newcomer'));
  assert.ok(best.size>2,`어떤 시드에서도 단계가 변하지 않았습니다: ${[...best]}`);
});

test('narrative completion is an achievement, not a guarantee',()=>{
  // Both sides draw competent plans, so the career decides rather than one fixed sequence.
  // The rate is low enough that a ten-seed sample would sometimes read zero; twenty-four is
  // the smallest window that distinguishes "rare" from "impossible".
  const seeds=24;
  let completed=0;
  for(let seed=1;seed<=seeds;seed++)if(runCampaign(start(seed)).part===COMPLETE)completed++;
  assert.ok(completed>0,'어떤 시드도 완주하지 못합니다');
  assert.ok(completed<seeds,'모든 시드가 완주합니다. 완료가 성취가 아닙니다');
});
