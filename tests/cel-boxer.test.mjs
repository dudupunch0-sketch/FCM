import test from 'node:test';
import assert from 'node:assert/strict';
import {clearExteriorWhite,celPoint,celContact,celPose} from '../dist/cel-boxer.js';
import {sampleMotion} from '../dist/motion.js';
test('exterior cleanup preserves enclosed ivory and opaque character outlines',()=>{
  const w=7,data=new Uint8ClampedArray(w*w*4).fill(255);
  for(let y=1;y<6;y++)for(let x=1;x<6;x++)if(x===1||x===5||y===1||y===5){const k=(y*w+x)*4;data[k]=data[k+1]=data[k+2]=30;}
  clearExteriorWhite(data,w,w);
  assert.equal(data[3],0);assert.equal(data[(3*w+3)*4+3],255);assert.equal(data[(w+1)*4+3],255);
});
test('cutout motion pins soles and mirrors contact landmarks',()=>{
  for(const id of ['jab','cross','hook','body','heavy','guard','sway','weave','rest']){
    const m=sampleMotion({id,phase:0,duration:2},.5,500);
    assert.deepEqual(celPoint(340,996,m),{x:340,y:996});
    const a=celContact(0,'head',m),b=celContact(1,'head',m);
    assert.equal(a.x+b.x,640);assert.equal(a.y,b.y);
    assert.deepEqual(celPoint(100,200,m,true),{x:100,y:200});
  }
});
test('missing hook art is not advertised as a straight contact pose',()=>{
  assert.equal(celPose({id:'hook',lead:1,rear:0}),'guard');
  assert.equal(celPose({id:'jab',lead:1,rear:0}),'straight');
});
