import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CLIP,REST,distance,validateClip,sampleClip,inspectClip,solveArm,bakeClip} from '../dist/rig-motion.js';
test('IK preserves both bones even beyond reachable range or at shoulder',()=>{
 for(const target of [[999,0],[0,0],[12,24],[-200,-300]]){const a=solveArm([0,0],target,140,100);assert(Math.abs(distance(a.shoulder,a.elbow)-140)<1e-8);assert(Math.abs(distance(a.elbow,a.wrist)-100)<1e-8);}
});
test('all templates return to the same pose and never move planted feet',()=>{
 for(const action of ['hook','guard','weave']){const clip={...DEFAULT_CLIP,action};const start=sampleClip(clip,0),end=sampleClip(clip,1);for(const hand of ['lead','rear'])assert(distance(start.arms[hand].wrist,end.arms[hand].wrist)<1e-8);for(let i=0;i<=100;i++)assert.deepEqual(sampleClip(clip,i/100).feet,REST.feet);}
});
test('attack hand identity stays stable; changing lead target does not change rear arm',()=>{
 const a=sampleClip(DEFAULT_CLIP,.75),b=sampleClip({...DEFAULT_CLIP,targetX:480},.75);assert.deepEqual(a.arms.rear,b.arms.rear);assert(distance(a.arms.lead.wrist,b.arms.lead.wrist)>10);
});
test('default hook reaches marked target with a bent elbow',()=>{const result=inspectClip(DEFAULT_CLIP);assert(result.contactError<1);assert(result.elbowDegrees<150);assert(result.reachError<1);});
test('duration changes playback clock only, not geometry',()=>{assert.deepEqual(sampleClip(DEFAULT_CLIP,.5),sampleClip({...DEFAULT_CLIP,durationMs:1600},.5));});
test('frame export retains contact, endpoints and monotonic times',()=>{for(const contact of [.4,.53,.75,.85]){const frames=bakeClip({...DEFAULT_CLIP,contact});assert.equal(frames.length,12);assert.equal(frames[0].phase,0);assert.equal(frames.at(-1).phase,1);assert(frames.some(f=>f.phase===contact));assert(frames.every((f,i)=>!i||f.timeMs>frames[i-1].timeMs));}});
test('import rejects unsupported or unbounded data, strips extra fields',()=>{
 for(const bad of [null,{}, {...DEFAULT_CLIP,version:2},{...DEFAULT_CLIP,targetX:Infinity},{...DEFAULT_CLIP,contact:1},{...DEFAULT_CLIP,durationMs:'760'}])assert.throws(()=>validateClip(bad));
 assert.deepEqual(validateClip({...DEFAULT_CLIP,extra:'ignored'}),DEFAULT_CLIP);
});
