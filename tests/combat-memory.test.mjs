// Combat Memory and Setup. Roadmap Phase 3.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {newMatch,makePlan,resolveTurn} from '../dist/engine.js';
import {createMemory,recordPlan,expectationAt,setupModifier,exposureOf,serializeMemory,restoreMemory} from '../dist/combat-memory.js';

const ctx=definitions.configs.action_resolution.context_modifiers;
const hits=r=>r.frames.flatMap(f=>f.events).filter(e=>e.type==='hit');
const repeat=()=>makePlan(['jab','cross','rest','rest','rest','rest','rest']);

test('exposure records what was actually thrown, slot by slot',()=>{
  const m=createMemory(definitions);
  recordPlan(m,0,repeat(),1);
  assert.equal(exposureOf(m,0,0).jab,1);
  recordPlan(m,0,repeat(),2);
  assert.equal(exposureOf(m,0,0).jab,2);
});

test('a repeated pattern builds an expectation; an unseen slot has none',()=>{
  const m=createMemory(definitions);
  for(let t=1;t<=4;t++)recordPlan(m,0,repeat(),t);
  const seen=expectationAt(m,0,0,70);
  assert.equal(seen.cardId,'jab');
  assert.ok(seen.confidence>0);
  assert.equal(expectationAt(m,1,0,70),null,'상대는 아직 아무것도 못 봤습니다');
});

test('confidence never reaches certainty, however often a pattern repeats',()=>{
  const m=createMemory(definitions);
  for(let t=1;t<=60;t++)recordPlan(m,0,repeat(),t);
  const ceiling=definitions.configs.combat_ai.fight_iq.prediction_confidence.max;
  assert.ok(expectationAt(m,0,0,100).confidence<=ceiling);
  assert.ok(ceiling<1,'명세상 완전한 예측은 허용되지 않습니다');
});

test('a low Fight IQ fighter over-reacts to a single turn',()=>{
  const m=createMemory(definitions);
  recordPlan(m,0,repeat(),1);
  const dull=expectationAt(m,0,0,10).confidence;
  const sharp=expectationAt(m,0,0,95).confidence;
  assert.ok(dull>sharp,`한 턴 과반응이 없습니다: ${dull} vs ${sharp}`);
});

test('a read defender takes less; breaking the pattern costs the defender',()=>{
  const m=createMemory(definitions);
  for(let t=1;t<=4;t++)recordPlan(m,0,repeat(),t);
  const read=setupModifier(m,0,0,'jab',70);
  const broken=setupModifier(m,0,0,'hook',70);
  assert.ok(read.read&&read.factor<1,'읽었는데 이득이 없습니다');
  assert.ok(broken.broken&&broken.factor>1,'패턴 파괴에 보상이 없습니다');
  assert.ok(read.factor>=1-ctx.read_confidence_defense_bonus-1e-9,'읽기가 확실성이 되었습니다');
});

test('an unread defender loses nothing to a pattern break',()=>{
  const m=createMemory(definitions);
  const fresh=setupModifier(m,0,3,'hook',70);
  assert.equal(fresh.factor,1);
  assert.equal(fresh.broken,false);
});

test('repetition is punished in a real match, which is why it needs no ban',()=>{
  let m=newMatch('pressure',12);
  const plan=repeat();
  let first=null,later=null;
  for(let turn=0;turn<5&&!m.finished;turn++){
    const r=resolveTurn(m,makePlan(['rest']),plan);
    const jab=hits(r).find(e=>e.actor===1);
    if(jab){if(first===null)first=jab.power;later=jab.power;}
    m=r.match;
  }
  assert.ok(first!==null&&later!==null,'타격 표본이 없습니다');
  assert.ok(later<first,`반복이 처벌되지 않습니다: ${first} → ${later}`);
});

test('memory survives combo boundaries and is reported on the event',()=>{
  // Guard up so the observer survives long enough to build a read.
  const survive=()=>makePlan(['shell','shell']);
  let m=newMatch('pressure',12);
  for(let t=0;t<3&&!m.finished;t++)m=resolveTurn(m,survive(),repeat()).match;
  assert.ok(!m.finished,'관찰자가 먼저 쓰러졌습니다');
  assert.ok(m.memory,'기억이 저장되지 않았습니다');
  const r=resolveTurn(m,survive(),repeat());
  // A guarded jab lands as a block, so read reporting must cover blocks too.
  const jab=r.frames.flatMap(f=>f.events).find(e=>(e.type==='hit'||e.type==='block')&&e.actor===1);
  assert.ok(jab,'상대 타격 표본이 없습니다');
  assert.equal(jab.read,true,'읽기가 이벤트에 기록되지 않았습니다');
  assert.ok(jab.readConfidence>0);
});

test('memory serialises and restores without changing behaviour',()=>{
  const m=createMemory(definitions);
  for(let t=1;t<=3;t++)recordPlan(m,0,repeat(),t);
  const restored=restoreMemory(definitions,JSON.parse(JSON.stringify(serializeMemory(m))));
  assert.deepEqual(expectationAt(restored,0,0,70),expectationAt(m,0,0,70));
});

test('setup keeps resolution deterministic',()=>{
  const play=()=>{
    let m=newMatch('tricky',23);const trace=[];
    while(!m.finished){
      const r=resolveTurn(m,repeat(),makePlan(['jab','weave','cross']));
      trace.push(hits(r).map(e=>[e.power,e.read,e.patternBreak]));
      m=r.match;
    }
    return trace;
  };
  assert.deepEqual(play(),play());
});
