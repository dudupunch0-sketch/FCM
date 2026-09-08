import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.min.js';
import {CARDS,newMatch,makePlan,resolveTurn} from '../dist/engine.js';
import {sampleMotion,advancePlayback} from '../dist/motion.js';
import {solveIK,FighterModel} from '../dist/fighter-model.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('motion is continuous across every internal card boundary',()=>{
 for(const [id,c] of Object.entries(CARDS))for(let phase=1;phase<c.duration;phase++){
  const a=sampleMotion({id,phase:phase-1,duration:c.duration},1,0,0);
  const b=sampleMotion({id,phase,duration:c.duration},0,0,0);
  for(const key of Object.keys(a))if(typeof a[key]==='number')close(a[key],b[key]);
 }
});
test('jab uses lead hand, cross uses rear hand and hip rotation',()=>{
 const jab=sampleMotion({id:'jab',phase:0,duration:1},.5);
 const cross=sampleMotion({id:'cross',phase:1,duration:2},.5);
 assert(jab.lead>.9&&jab.rear===0);assert(cross.rear>.9&&cross.lead===0);assert(Math.abs(cross.twist)>.5);assert(cross.pivot>.9);
});
test('two-bone IK preserves anatomy, including unreachable targets',()=>{
 for(const coords of [[.2,.4,.1],[0,0,0],[10,2,-4],[-1,.001,.2]]){
  const start=new T.Vector3(),target=new T.Vector3(...coords);
  const r=solveIK(start,target,.3,.285,new T.Vector3(.1,-.4,.2));
  close(r.joint.distanceTo(start),.3);close(r.end.distanceTo(r.joint),.285);
  assert(r.end.distanceTo(start)<.585);
 }
});
test('all authored actions produce finite rig transforms and bounded geometry',()=>{
 const models=[new FighterModel(0),new FighterModel(1)];
 for(const [id,c] of Object.entries(CARDS))for(let phase=0;phase<c.duration;phase++)for(const p of [0,.25,.5,.75,1]){
  models.forEach((model,i)=>{
   model.pose(sampleMotion({id,phase,duration:c.duration},p,1000,i));
   model.group.traverse(o=>{for(const n of [...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()])assert(Number.isFinite(n));});
   const b=new T.Box3().setFromObject(model.group);
   assert(b.max.y<2.2&&b.min.y>-.2,`${id}: ${b.min.y}..${b.max.y}`);
  });
 }
});
test('strong impact holds contact once without rewinding or changing resolution',()=>{
 const resolved=resolveTurn(newMatch(),makePlan(['cross']),makePlan([]));
 const snapshot=JSON.stringify(resolved);
 const play={cursor:1.49,holdRemaining:0};
 advancePlayback(play,resolved.frames,30,1,false);close(play.cursor,1.5);assert(play.holdRemaining>0);
 advancePlayback(play,resolved.frames,100,1,false);close(play.cursor,1.5);
 advancePlayback(play,resolved.frames,30,1,false);assert(play.cursor>1.5);
 assert.equal(JSON.stringify(resolved),snapshot);
});
test('reduced motion suppresses bob and hit stop; KO pose settles on floor',()=>{
 const m=sampleMotion(null,0,1234,0,[],true,true);assert.equal(m.breath,0);assert.equal(m.fall,1);
 const p={cursor:.49};advancePlayback(p,[{events:[{type:'hit',counter:true,power:30}]}],30,1,true);assert(p.cursor>.5);assert(!p.holdRemaining);
});
