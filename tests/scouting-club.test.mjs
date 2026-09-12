// Scouting, recruitment, contracts (Phase 6) and the Part 1 club (Phase 7).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {createRngSet} from '../dist/rng.js';
import {createScoutingState,discover,watch,runTrial,recruitmentReport,joinInterest,signContract,resolvePromise,knowledgeQuality,isPubliclyVisible} from '../dist/scouting.js';
import {createClub,availableOpponents,makeOffer,applyResult,nextTicketPower,updateRivalry,part1Gate,rungIndex} from '../dist/club.js';

const cfg=definitions.configs.world;
const hidden={id:'h1',name:'무명',base:{punch_technique:64},potential:{overall_talent:80},ticket_power:2,career_need:'prospect'};
const famous={id:'f1',name:'유명 선수',base:{punch_technique:70},potential:{overall_talent:65},ticket_power:80,career_need:'star'};
const rng=()=>createRngSet(4,definitions).stream('world_generation');
const always={next:()=>0};
const never={next:()=>1};

test('the player cannot see every fighter: fame is its own discovery channel',()=>{
  assert.equal(isPubliclyVisible(hidden,definitions),false);
  assert.equal(isPubliclyVisible(famous,definitions),true);
  const s=createScoutingState(definitions);
  assert.equal(discover(s,famous,'rumor',{rng:never}).found,true,'유명 선수는 노력 없이 보여야 합니다');
  assert.equal(discover(s,hidden,'rumor',{rng:never}).found,false,'무명이 거저 발견되었습니다');
});

test('discovery creates knowledge and a trial narrows it',()=>{
  const s=createScoutingState(definitions);
  discover(s,hidden,'scout_report',{week:0,rng:always});
  recruitmentReport(s,hidden,{interpreterSkill:0.5});
  const before=knowledgeQuality(s,hidden.id).width;
  runTrial(s,hidden,{week:2});
  recruitmentReport(s,hidden,{interpreterSkill:0.5});
  assert.ok(knowledgeQuality(s,hidden.id).width<before,'트라이얼이 추정을 좁히지 않았습니다');
});

test('an undiscovered fighter cannot be watched, tried or reported on',()=>{
  const s=createScoutingState(definitions);
  assert.throws(()=>watch(s,'nobody'),/발견하지 않은/);
  assert.throws(()=>runTrial(s,hidden),/발견하지 않은/);
  assert.throws(()=>recruitmentReport(s,hidden),/발견하지 않은/);
});

test('the recruitment report uses every documented axis and no single rating',()=>{
  const s=createScoutingState(definitions);
  discover(s,hidden,'scout_report',{rng:always});
  const report=recruitmentReport(s,hidden,{interpreterSkill:0.6});
  for(const axis of cfg.recruitment.report_axes)assert.ok(axis in report,'축 누락: '+axis);
  assert.ok(!('rating' in report)&&!('stars' in report),'단일 별점이 들어갔습니다');
  assert.ok(report.growth_potential.high>report.growth_potential.low);
});

test('join interest follows current career need, not a hidden personality',()=>{
  const s=createScoutingState(definitions);
  const prospect={...hidden,career_need:'prospect'};
  const veteran={...hidden,career_need:'veteran'};
  const bigPurse={purse:4000,opportunity:10};
  const bigChance={purse:200,opportunity:90};
  assert.ok(joinInterest(s,veteran,bigPurse,{reputation:50}).score>joinInterest(s,prospect,bigPurse,{reputation:50}).score);
  assert.ok(joinInterest(s,prospect,bigChance,{reputation:50}).score>joinInterest(s,veteran,bigChance,{reputation:50}).score);
  assert.equal(joinInterest(s,veteran,bigPurse,{reputation:50}).wants,'purse');
});

test('contract terms are bounded and a broken promise costs more than a kept one gains',()=>{
  const s=createScoutingState(definitions);
  assert.throws(()=>signContract(s,hidden,{share:0.9}),/Management Share/);
  assert.throws(()=>signContract(s,hidden,{duration_weeks:5}),/계약 기간/);
  const kept=signContract(s,hidden,{promises:[{type:'title_shot'}]});
  const broken=signContract(s,hidden,{promises:[{type:'title_shot'}]});
  const base=kept.relationship.trust;
  const up=resolvePromise(kept,'title_shot',true,definitions).trust;
  const down=resolvePromise(broken,'title_shot',false,definitions).trust;
  assert.ok(up>base&&down<base);
  assert.ok(base-down>up-base,'약속 위반이 더 크게 작용해야 합니다');
  assert.throws(()=>resolvePromise(kept,'title_shot',true,definitions),/해결할 약속이 없습니다/);
});

test('the club has one visible ladder and opponents come from nearby rungs',()=>{
  const club=createClub(definitions,rng());
  assert.equal(club.roster.length,cfg.club.pool_size);
  assert.ok(club.ladder.includes('champion'));
  const near=availableOpponents(club,'regular');
  assert.ok(near.length>0&&near.length<club.roster.length,'래더가 난이도를 거르지 않습니다');
  for(const f of near)assert.ok(Math.abs(rungIndex(club,f.rung)-rungIndex(club,'regular'))<=1);
});

test('a fight offer prices the opponent and flags a title fight',()=>{
  const club=createClub(definitions,rng());
  const champ=club.roster.find(f=>f.id===club.championId);
  const offer=makeOffer(club,champ,{week:3});
  assert.ok(offer.purse>cfg.fight_offer.base_purse);
  assert.equal(offer.title_fight,true);
  assert.ok(makeOffer(club,champ,{shortNotice:true}).purse>offer.purse,'단기 수락 보상이 없습니다');
  assert.ok(offer.risk>0);
});

test('wins climb the ladder and losses fall back down',()=>{
  const club=createClub(definitions,rng());
  let me={rung:'newcomer',record:{wins:0,losses:0},ticket_power:5};
  for(let i=0;i<cfg.club.promotion_wins_required;i++)me=applyResult(club,me,{won:true,finished:false,offer:{}});
  assert.notEqual(me.rung,'newcomer','승리로 승급하지 않았습니다');
  const climbed=rungIndex(club,me.rung);
  for(let i=0;i<cfg.club.demotion_losses;i++)me=applyResult(club,me,{won:false,offer:{}});
  assert.ok(rungIndex(club,me.rung)<climbed,'연패로 강등되지 않았습니다');
});

test('the belt requires an actual title fight, not just a win streak',()=>{
  const club=createClub(definitions,rng());
  let me={rung:'top_challenger',record:{wins:0,losses:0},ticket_power:5,streak:0};
  for(let i=0;i<6;i++)me=applyResult(club,me,{won:true,offer:{title_fight:false}});
  assert.notEqual(me.rung,'champion','타이틀전 없이 챔피언이 되었습니다');
  me=applyResult(club,me,{won:true,offer:{title_fight:true}});
  assert.equal(me.rung,'champion');
  assert.equal(part1Gate(me).reveal_fight_available,true);
});

test('a great loss can raise ticket power while a dull win may not',()=>{
  const start=cfg.ticket_power.start;
  const greatLoss=nextTicketPower(definitions,start,{won:false,greatFight:true});
  const dullWin=nextTicketPower(definitions,start,{won:true,finished:false,greatFight:false});
  assert.ok(greatLoss>start,'명경기 패배로 흥행이 오르지 않았습니다');
  assert.ok(nextTicketPower(definitions,start,{won:true,upset:true})>dullWin,'업셋 보상이 없습니다');
  assert.ok(nextTicketPower(definitions,50,{won:false,weeksInactive:40})<50,'비활동 감소가 없습니다');
  assert.ok(nextTicketPower(definitions,99,{won:true,finished:true,title:true,upset:true})<=cfg.ticket_power.max);
});

test('rivalry emerges from history rather than being created directly',()=>{
  const rivalries={};
  const quiet=updateRivalry(rivalries,'a','b',{});
  assert.equal(quiet.progress,0,'아무 일 없이 라이벌이 생겼습니다');
  const heated=updateRivalry(rivalries,'a','b',{closeFight:true,controversial:true});
  assert.ok(heated.progress>0);
  assert.equal(updateRivalry(rivalries,'b','a',{}).fighter_a,heated.fighter_a,'순서가 다른 같은 쌍이 갈라졌습니다');
  assert.ok(heated.sources.includes('controversial_decision'));
});
