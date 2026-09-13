// Weekly calendar, load, recovery debt and growth. Roadmap Phase 5.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {createFighter} from '../dist/fighter.js';
import {createTrainingState,runWeek,applyGains,weeklyCapacity,proximityFactor,matchTechniqueExp,addTechniqueExp,addAdversity} from '../dist/growth.js';
import {ALL_BASE_PARAMETERS} from '../dist/fighter-schema.js';

const cfg=definitions.configs.training;
const mk=(overrides={},body={})=>createFighter({id:'f',name:'테스트',
  base:Object.fromEntries(ALL_BASE_PARAMETERS.map(k=>[k,overrides[k]??50])),
  body:{natural_weight:75,current_weight:75,age:24,...body}});
const talent={overall_talent:70,physical_aptitude:70,striking_aptitude:70,grappling_aptitude:70,combat_intelligence_aptitude:70};
const hard=['growth_training','growth_training','sparring','sparring','technical_training','technical_training'];
const easy=['technical_training','recovery','personal'];

test('a week of training raises base parameters',()=>{
  const f=mk();
  const {gains}=runWeek(f,createTrainingState(),['growth_training','technical_training'],definitions,{potential:talent});
  const grown=applyGains(f,gains);
  assert.ok(grown.base.strength>f.base.strength,'성장이 없습니다');
  assert.ok(Object.isFrozen(grown.base));
});

test('the schedule is what limits training, not an activity counter',()=>{
  const f=mk();
  assert.throws(()=>runWeek(f,createTrainingState(),Array(cfg.week.slots+1).fill('recovery'),definitions),/최대/);
  assert.throws(()=>runWeek(f,createTrainingState(),['meditation'],definitions),/알 수 없는 활동/);
});

test('load beyond capacity accumulates as recovery debt; rest pays it down',()=>{
  const f=mk();
  let state=createTrainingState();
  for(let w=0;w<3;w++)state=runWeek(f,state,hard,definitions,{potential:talent}).state;
  assert.ok(state.recovery_debt>0,'과훈련이 누적되지 않았습니다');
  const peak=state.recovery_debt;
  for(let w=0;w<3;w++)state=runWeek(f,state,['recovery','recovery','personal'],definitions,{potential:talent}).state;
  assert.ok(state.recovery_debt<peak,'회복으로 빚이 줄지 않았습니다');
  assert.ok(state.recovery_debt>=0);
});

test('accumulated debt suppresses growth, so grinding stops paying',()=>{
  const f=mk();
  let state=createTrainingState();
  const first=runWeek(f,state,hard,definitions,{potential:talent});
  state=first.state;
  for(let w=0;w<5;w++)state=runWeek(f,state,hard,definitions,{potential:talent}).state;
  const tired=runWeek(f,state,hard,definitions,{potential:talent});
  assert.ok(tired.gains.strength<first.gains.strength,`피로가 성장을 억제하지 않습니다: ${first.gains.strength} → ${tired.gains.strength}`);
  assert.ok(tired.trace.debtPenalty<1);
  assert.ok(tired.gains.strength>0,'과훈련이 성장을 완전히 멈췄습니다. 명세의 한계는 곡선이지 절벽이 아닙니다');
});

test('better cardio buys more weekly capacity; age takes it away',()=>{
  assert.ok(weeklyCapacity(mk({cardio:90}),definitions)>weeklyCapacity(mk({cardio:20}),definitions));
  assert.ok(weeklyCapacity(mk({},{age:38}),definitions)<weeklyCapacity(mk({},{age:24}),definitions));
});

test('the potential ceiling is soft: growth collapses near it but never stops',()=>{
  const far=proximityFactor(40,100,definitions);
  const near=proximityFactor(97,100,definitions);
  assert.ok(near<far/5,`한계 부근에서 충분히 나빠지지 않습니다: ${near} vs ${far}`);
  assert.ok(near>0,'완전히 멈췄습니다. Hard Cap이 되면 안 됩니다');
  const atCeiling=runWeek(mk({strength:99}),createTrainingState(),['growth_training'],definitions,
    {potential:{...talent,ceilings:{strength:100}}});
  assert.ok(atCeiling.gains.strength>0,'상한에서 성장이 0이 되었습니다');
});

test('aptitude and age change how much a week is worth',()=>{
  const week=(fighter,potential)=>runWeek(fighter,createTrainingState(),['growth_training'],definitions,{potential}).gains.strength;
  assert.ok(week(mk(),{...talent,physical_aptitude:90})>week(mk(),{...talent,physical_aptitude:30}));
  assert.ok(week(mk({},{age:38}),talent)<week(mk({},{age:24}),talent),'노화가 반영되지 않았습니다');
});

test('a real fight teaches far more than a training week',()=>{
  const training=runWeek(mk(),createTrainingState(),['technical_training','sparring'],definitions,{potential:talent}).techniqueGain;
  const fight=matchTechniqueExp({jab:2,cross:1},definitions);
  assert.ok(fight.jab>training,`실전이 훈련보다 적습니다: ${fight.jab} vs ${training}`);
  assert.equal(fight.jab/2,cfg.technique_exp.training_unit*cfg.technique_exp.match_multiplier);
});

test('finishing with a technique carries a large bonus for that technique',()=>{
  const plain=matchTechniqueExp({cross:1},definitions).cross;
  const finished=matchTechniqueExp({cross:1},definitions,{finishedWith:'cross'}).cross;
  assert.equal(finished-plain,cfg.technique_exp.finish_bonus);
});

test('technique experience accumulates across sessions',()=>{
  let state=createTrainingState();
  state=addTechniqueExp(state,matchTechniqueExp({jab:1},definitions));
  const once=state.technique_exp.jab;
  state=addTechniqueExp(state,matchTechniqueExp({jab:1},definitions));
  assert.equal(state.technique_exp.jab,once*2);
});

test('breakthrough needs both adversity and being near the limit, and is never a visible bar',()=>{
  let state=createTrainingState();
  const comfortable=addAdversity(state,definitions,{kind:'upset',proximity:0.1});
  assert.equal(comfortable.broke,false);
  assert.equal(comfortable.state.breakthrough_progress,0,'한계와 멀리 있는데 진척이 쌓였습니다');
  let broke=false;
  for(let i=0;i<10&&!broke;i++){
    const step=addAdversity(state,definitions,{kind:'upset',proximity:0.95});
    state=step.state;broke=step.broke;
  }
  assert.ok(broke,'한계에서 역경을 반복해도 돌파가 없습니다');
  assert.equal(state.breakthrough_progress,0,'돌파 후 진척이 초기화되지 않았습니다');
});

test('a full training week is traceable for the causal report',()=>{
  const {trace}=runWeek(mk(),createTrainingState(),hard,definitions,{potential:talent});
  for(const key of ['load','capacity','debtDelta','debtPenalty','agePenalty','injuryRisk']){
    assert.ok(Number.isFinite(trace[key]),`${key} 추적값이 없습니다`);
  }
  assert.ok(trace.injuryRisk>0,'하드 스파링에 부상 위험이 없습니다');
  assert.equal(runWeek(mk(),createTrainingState(),easy,definitions,{potential:talent}).trace.injuryRisk<trace.injuryRisk,true);
});
