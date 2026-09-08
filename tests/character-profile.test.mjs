import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCharacterProfile,CHARACTER_PROFILES} from '../dist/character-profile.js';
import {FighterModel} from '../dist/fighter-model.js';
import {sampleMotion} from '../dist/motion.js';
import {CARDS} from '../dist/engine.js';

test('profiles are immutable and reject invalid art dimensions and unknown fields',()=>{
 const a=createCharacterProfile(),b=createCharacterProfile({face:{jawWidth:.073}});
 assert.notEqual(a.face.jawWidth,b.face.jawWidth);assert(Object.isFrozen(a.face));
 assert.throws(()=>createCharacterProfile({face:{jawWidth:NaN}}));
 assert.throws(()=>createCharacterProfile({body:{shoulderWidth:9}}));
 assert.throws(()=>createCharacterProfile({face:{damage:100}}));
});
test('both art profiles preserve finite head mesh and rig positions through all actions',()=>{
 for(const [index,profile] of CHARACTER_PROFILES.entries()){
  const m=new FighterModel(index,profile);const pos=m.headMesh.geometry.attributes.position;
  assert.equal(m.headMesh.name,'continuous-head');
  for(const x of pos.array)assert(Number.isFinite(x));
  for(const [id,c] of Object.entries(CARDS))for(let phase=0;phase<c.duration;phase++){
   m.pose(sampleMotion({id,phase,duration:c.duration},.5));
   for(const x of [...m.headPoint.toArray(),...m.glovePoints.flatMap(p=>p.toArray())])assert(Number.isFinite(x));
  }
 }
});
