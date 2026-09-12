// One-fighter vertical slice. Roadmap Milestone A.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {startCareer,trainWeek,takeFight,restWeek,fightReadiness,scoutingView,derivedView} from '../dist/career.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const prospect=()=>startCareer(definitions,{
  id:'p1',name:'유망주',
  base:Object.fromEntries(ALL_BASE_PARAMETERS.map(k=>[k,48])),
  body:{natural_weight:75,current_weight:75,age:21,stance:'orthodox'},
  potential:{overall_talent:78,physical_aptitude:75,striking_aptitude:82,grappling_aptitude:60,combat_intelligence_aptitude:70}
});
const camp=['technical_training','sparring','tactical_drill','recovery'];
const plan=['sway','cross','sway','cross'];

test('eight weeks of camp, a fight, recovery and the next week all run',()=>{
  let c=prospect();
  for(let w=0;w<8;w++)c=trainWeek(c,camp);
  assert.equal(c.week,8);
  const before=c.fighter.base.punch_technique;
  const {career:after,match}=takeFight(c,{seed:3,plan});
  assert.ok(match.finished,'경기가 끝나지 않았습니다');
  assert.ok(after.record.wins+after.record.losses+after.record.draws===1);
  const rested=restWeek(after);
  assert.equal(rested.week,9);
  assert.ok(c.fighter.base.punch_technique>=before-1e-9);
});

test('training raises ability and the fight uses the raised value',()=>{
  let green=prospect(),trained=prospect();
  for(let w=0;w<12;w++)trained=trainWeek(trained,['growth_training','technical_training','recovery']);
  assert.ok(trained.fighter.base.punch_technique>green.fighter.base.punch_technique,'성장이 없습니다');
  assert.ok(derivedView(trained).punch_impact>derivedView(green).punch_impact,'성장이 Derived에 반영되지 않았습니다');
});

test('readiness explains itself instead of being a hidden number',()=>{
  let c=prospect();
  assert.equal(fightReadiness(c).label,'Excellent');
  for(let w=0;w<6;w++)c=trainWeek(c,['growth_training','sparring','sparring','growth_training','technical_training','sparring']);
  const worn=fightReadiness(c);
  assert.notEqual(worn.label,'Excellent');
  assert.ok(worn.reasons.length>0,'원인이 설명되지 않았습니다');
});

test('a fight teaches far more than the weeks around it',()=>{
  let c=prospect();
  for(let w=0;w<4;w++)c=trainWeek(c,camp);
  const trainingExp=c.training.technique_exp.training;
  const {career:after}=takeFight(c,{seed:5,plan});
  const fightExp=Object.entries(after.training.technique_exp).filter(([k])=>k!=='training').reduce((n,[,v])=>n+v,0);
  assert.ok(fightExp>trainingExp,`실전이 훈련보다 적습니다: ${fightExp} vs ${trainingExp}`);
});

test('a fight leaves damage and drained stamina that recovery walks back',()=>{
  let c=prospect();
  for(let w=0;w<4;w++)c=trainWeek(c,camp);
  const {career:after}=takeFight(c,{seed:7,plan});
  const hurt=after.condition.body_damage.head+after.condition.body_damage.body;
  assert.ok(hurt>0||after.condition.stamina<100,'경기가 아무 흔적도 남기지 않았습니다');
  const rested=restWeek(after);
  assert.ok(rested.condition.body_damage.head<=after.condition.body_damage.head);
  assert.ok(rested.condition.stamina>=after.condition.stamina);
});

test('the player sees an estimate, never the true value',()=>{
  let c=prospect();
  for(let w=0;w<3;w++)c=trainWeek(c,camp);
  const {career:after}=takeFight(c,{seed:9,plan});
  const view=scoutingView(after,{interpreterSkill:0.4});
  assert.ok(view.estimated_high>view.estimated_low,'추정이 한 점으로 붕괴했습니다');
  assert.ok(view.confidence>0&&view.confidence<=1);
  assert.ok(!('true_value' in view),'진짜 값이 새어 나갔습니다');
});

test('a better analyst reads the same career more tightly',()=>{
  let c=prospect();
  for(let w=0;w<3;w++)c=trainWeek(c,camp);
  let after=takeFight(c,{seed:11,plan}).career;
  after=takeFight(after,{seed:12,plan}).career;
  const width=v=>v.estimated_high-v.estimated_low;
  assert.ok(width(scoutingView(after,{interpreterSkill:0.95}))<width(scoutingView(after,{interpreterSkill:0.1})));
});

test('an unfit fighter is refused a fight rather than silently entering one',()=>{
  let c=prospect();
  const grind=['growth_training','sparring','sparring','growth_training','sparring','sparring'];
  for(let w=0;w<12;w++)c=trainWeek(c,grind);
  c={...c,condition:{...c.condition,body_damage:{...c.condition.body_damage,head:80}},training:{...c.training,stress:90,sharpness:0}};
  assert.equal(fightReadiness(c).label,'Not Cleared');
  assert.throws(()=>takeFight(c,{seed:1,plan}),/출전 불가/);
});

test('the whole slice is deterministic and every step is logged',()=>{
  const run=()=>{
    let c=prospect();
    for(let w=0;w<6;w++)c=trainWeek(c,camp);
    const {career,match}=takeFight(c,{seed:21,plan});
    const done=restWeek(career);
    return {base:done.fighter.base,record:done.record,method:match.method,log:done.log.length};
  };
  const a=run(),b=run();
  assert.deepEqual(a,b);
  assert.ok(a.log>=8,'로그가 남지 않았습니다');
});
