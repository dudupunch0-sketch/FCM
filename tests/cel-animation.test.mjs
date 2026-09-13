import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {selectCelAnimation} from '../dist/cel-animation.js';
const manifest=JSON.parse(await readFile(new URL('../dist/assets/cel-boxer/animation/manifest.json',import.meta.url),'utf8'));
const calm={hit:0,fall:0};
test('hook contact follows the engine contact beat, with recovery afterward',()=>{
 assert.equal(selectCelAnimation(manifest,{id:'hook',phase:0,duration:2},.5,calm).index,0);
 assert.equal(selectCelAnimation(manifest,{id:'hook',phase:1,duration:2},.5,calm).index,2);
 assert.equal(selectCelAnimation(manifest,{id:'hook',phase:1,duration:2},1,calm).index,3);
});
test('weave is continuous across the internal card beat and has intermediate recovery art',()=>{
 const pose={id:'weave',phase:0,duration:2};
 assert.deepEqual(selectCelAnimation(manifest,pose,1,calm),selectCelAnimation(manifest,{...pose,phase:1},0,calm));
 assert.equal(manifest.animation.rows.weave.frames,6);
 assert.equal(selectCelAnimation(manifest,{...pose,phase:1},.5,calm).index,4);
});
test('failed actions and KO never show a generated attacking pose',()=>{
 assert.equal(selectCelAnimation(manifest,{id:'hook',phase:1,duration:2,failed:true},.5,calm),null);
 assert.equal(selectCelAnimation(manifest,{id:'hook',phase:1,duration:2},.5,{hit:0,fall:1}),null);
 for(const rects of Object.values(manifest.frame_layout.rows))for(const r of rects){assert(r.x>=0&&r.y>=0&&r.x+r.w<=manifest.frame_layout.sheetWidth&&r.y+r.h<=manifest.frame_layout.sheetHeight);}
});
