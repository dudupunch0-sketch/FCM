import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,SKILLS,newMatch,makePlan,validatePlan,opponentPlan,observe,resolveTurn} from '../dist/engine.js';

test('plan validation rejects unknown, overlapping and oversized actions',()=>{
  assert.throws(()=>makePlan(['nope']));assert.throws(()=>makePlan(['shell','shell','jab']));
  assert.throws(()=>validatePlan([{id:'shell',start:0},{id:'shell',start:2}]));
  validatePlan(makePlan(['cross','sway']));
});
test('same state and plans replay identically without mutating committed inputs',()=>{
  const m=newMatch(),a=makePlan(['sway','cross','weave','jab']),b=opponentPlan(m),snapshot=JSON.stringify({m,a,b});
  assert.deepEqual(resolveTurn(m,a,b),resolveTurn(m,a,b));assert.equal(JSON.stringify({m,a,b}),snapshot);
});
test('AI plan is stable while arbitrary player drafts change',()=>{
  const m=newMatch(),p=opponentPlan(m);
  for(const id of Object.keys(CARDS)){makePlan([id]);assert.deepEqual(opponentPlan(m),p);}
});
test('a correctly timed sway evades a jab and enables the following cross counter',()=>{
  const r=resolveTurn(newMatch(),makePlan(['sway','cross']),makePlan(['jab']));
  assert(r.frames[0].events.some(e=>e.type==='evade'&&e.actor===0));
  assert(r.frames[2].events.some(e=>e.type==='hit'&&e.actor===0&&e.counter));
});
test('wrong evasion trajectory is hit; empty evasion grants no counter',()=>{
  let r=resolveTurn(newMatch(),makePlan(['weave']),makePlan(['jab']));
  assert(r.frames[0].events.some(e=>e.type==='hit'&&e.actor===1));
  r=resolveTurn(newMatch(),makePlan(['sway','cross']),makePlan([]));
  assert(!r.frames.flatMap(f=>f.events).some(e=>e.counter));
});
test('head guard blocks a jab but leaves body exposed and has a stamina advantage',()=>{
  const r=resolveTurn(newMatch(),makePlan(['guard']),makePlan(['jab']));
  assert(r.frames[0].events.some(e=>e.type==='block'));assert(r.frames[0].fighters[0].stamina>r.frames[0].fighters[1].stamina);
  const b=resolveTurn(newMatch(),makePlan(['shell']),makePlan(['body']));assert(b.frames[1].events.some(e=>e.type==='hit'&&e.targetPart==='body'));
});
test('feint opens active defense; idle opponent does not fall for it',()=>{
  const m=newMatch();let r=resolveTurn(m,makePlan(['feint','cross']),makePlan(['shell']));
  assert(r.frames[0].events.some(e=>e.type==='feint'&&e.success));assert(r.frames[2].events.some(e=>e.type==='hit'&&e.setup));
  r=resolveTurn(m,makePlan(['feint','cross']),makePlan([]));assert(r.frames[0].events.some(e=>e.type==='feint'&&!e.success));
});
test('exact reveal identifies feint; cue reveals no hidden action ID or span',()=>{
  const m=newMatch(),p=makePlan(['feint','heavy']);
  assert.equal(observe(p,'first',m)[0].id,'feint');
  const cues=observe(p,'heavy',m);assert(cues.length);for(const c of cues){assert.equal(c.kind,'cue');assert(!('id' in c));assert(!('duration' in c));}
  assert.deepEqual(observe(p,'none',m),[]);
});
test('pattern and counter information require actual previous evidence',()=>{
  const m=newMatch(),p=makePlan(['jab','cross']);assert.deepEqual(observe(p,'pattern',m),[]);assert.deepEqual(observe(p,'counter',m),[]);
  m.lastPlans=[makePlan([]),p];assert.equal(observe(p,'pattern',m).length,2);
  m.lastEvaded=[true,false];assert.equal(observe(p,'counter',m).length,1);
  const all=Object.keys(SKILLS).map(s=>observe(p,s,m));assert(all.length);
});
test('same-beat attacks apply simultaneously including double knockout',()=>{
  const m=newMatch();m.fighters.forEach(f=>f.damage.head=89);
  const r=resolveTurn(m,makePlan(['jab']),makePlan(['jab']));assert(r.match.finished);assert.equal(r.match.winner,null);assert.equal(r.match.method,'동시 KO');assert.equal(r.frames.length,1);
});
test('stamina failure skips the action without negative resources',()=>{
  const m=newMatch();m.fighters[0].stamina=0;const r=resolveTurn(m,makePlan(['heavy']),makePlan([]));
  assert(r.frames[0].events.some(e=>e.type==='exhausted'&&e.actor===0));assert(!r.frames.flatMap(f=>f.events).some(e=>e.type==='hit'&&e.actor===0));
  for(const frame of r.frames)for(const f of frame.fighters)assert(f.stamina>=0&&f.stamina<=100);
});
test('guard breaks when impact cost cannot be paid',()=>{
  const m=newMatch();m.fighters[0].stamina=2;const r=resolveTurn(m,makePlan(['guard']),makePlan(['jab']));assert(r.frames[0].events.some(e=>e.guardBreak));
});
test('all opponent profiles remain valid and matches terminate with bounded resources',()=>{
  for(const profile of ['pressure','tricky','turtle'])for(let seed=1;seed<=40;seed++){
    let m=newMatch(profile,seed);
    while(!m.finished){const p=opponentPlan(m);validatePlan(p);m=resolveTurn(m,makePlan(['jab','cross','body','rest','rest','rest']),p).match;for(const f of m.fighters){assert(f.stamina>=0&&f.stamina<=100);for(const d of Object.values(f.damage))assert(Number.isFinite(d)&&d>=0);}}
    assert(m.method);
  }
});
test('rest-only match still ends by decision, counter does not leak across turns',()=>{
  let m=newMatch();while(!m.finished)m=resolveTurn(m,makePlan([]),makePlan([])).match;
  assert.equal(m.method,'판정');assert.equal(m.winner,null);
  const r=resolveTurn(newMatch(),makePlan(['sway']),makePlan(['jab']));assert.equal(r.match.fighters[0].counterUntil,-1);
});
