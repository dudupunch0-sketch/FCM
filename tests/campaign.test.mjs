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
const start=seed=>startCampaign(definitions,createRngSet(seed,definitions).stream('world_generation'),talent());

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
  const c=runCampaign(start(7));
  const types=c.history.map(h=>h.type);
  assert.ok(types.includes('club_fight'),'클럽 경기가 없습니다');
  assert.ok(types.includes('reveal_fight'),'외부 챔피언 특별전에 도달하지 못했습니다');
  assert.ok(types.includes('international_entry'),'국제 진입이 없습니다');
  assert.ok(types.includes('world_fight'),'국제 경기가 없습니다');
  assert.equal(c.part,COMPLETE,`서사 완료에 도달하지 못했습니다: ${c.part}, week ${c.week}`);
  assert.ok(types.includes('international_champion'));
});

test('reaching Part 2 opens the world and closes the club ladder',()=>{
  const c=start(7);
  while(c.part===PART1&&c.week<400)advanceWeek(c);
  assert.notEqual(c.part,PART1);
  assert.ok(c.world,'Part 2인데 월드가 없습니다');
  assert.ok(c.world.fighters[c.career.fighter.id],'선수가 국제 명단에 없습니다');
  assert.equal(c.world.fighters[c.career.fighter.id].tier,'A','플레이어 선수가 Tier A가 아닙니다');
});

test('the belt is only won through an actual title fight',()=>{
  const c=runCampaign(start(7));
  const titleWin=c.history.find(h=>h.type==='world_fight'&&h.title&&h.won);
  assert.ok(titleWin,'타이틀전 없이 챔피언이 되었습니다');
  assert.equal(c.history.at(-1).type,'international_champion');
});

test('narrative completion does not end the save',()=>{
  const c=runCampaign(start(7));
  assert.equal(sandboxAvailable(c),true);
  assert.ok(Number.isInteger(c.completedWeek));
  const week=c.week;
  advanceWeek(c);
  assert.equal(c.week,week+1,'완료 후 진행이 막혔습니다');
});

test('the world keeps moving alongside the player career',()=>{
  const c=start(7);
  while(c.part===PART1&&c.week<400)advanceWeek(c);
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
  const c=start(7);
  const seen=new Set([ladderStage(c)]);
  while(c.part!==COMPLETE&&c.week<400){advanceWeek(c);seen.add(ladderStage(c));}
  assert.ok(seen.has('newcomer'));
  assert.ok(seen.size>2,`단계가 변하지 않았습니다: ${[...seen]}`);
  assert.equal(ladderStage(c),'international_champion');
});
