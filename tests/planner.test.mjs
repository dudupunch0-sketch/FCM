import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,makePlan,newMatch,resolveTurn} from '../dist/engine.js';
import {editDraft,forecast} from '../dist/planner.js';
import {pixelFrame,SPRITES,PLAYER_SPRITES} from '../dist/pixel-motion.js';
test('replace and reorder preserve the original draft and enforce the time budget',()=>{
 const draft=['sway','cross','weave','jab','rest','rest'];
 const moved=editDraft(draft,{type:'move',index:1,direction:-1});
 assert.deepEqual(moved,['cross','sway','weave','jab','rest','rest']);
 assert.equal(draft[0],'sway');
 assert.throws(()=>editDraft(draft,{type:'replace',index:0,id:'heavy'}),/칸/);
 assert.deepEqual(editDraft(draft,{type:'replace',index:0,id:'guard'}),['guard','cross','weave','jab','rest','rest']);
 assert.deepEqual(editDraft(draft,{type:'remove',index:1}),['sway','weave','jab','rest','rest']);
});
test('stamina forecast respects rest before costly actions and never needs the enemy plan',()=>{
 const m=newMatch();m.fighters[0].stamina=5;
 assert.equal(forecast(['cross'],m.fighters[0]).failed.length,1);
 assert.equal(forecast(['rest','cross'],m.fighters[0]).failed.length,0);
 const draft=['rest','cross','rest','hook'];
 const actual=resolveTurn(m,makePlan(draft),makePlan([]));
 assert.ok(Math.abs(forecast(draft,m.fighters[0]).stamina-actual.frames.at(-1).fighters[0].stamina)<1);
});
test('sprite attacks peak at combat contact; failed actions cannot show a punch',()=>{
 for(const id of ['jab','cross','hook','heavy']){
  const c=CARDS[id],pose={id,phase:c.impact,duration:c.duration};
  assert.ok([1,2].includes(pixelFrame(pose,.5,[],0,false)));
  assert.equal(pixelFrame({...pose,failed:true},.5,[],0,false),9);
 }
 assert.equal(pixelFrame({id:'rest',phase:0,duration:1},.6,[{type:'hit',target:0}],0,false),8);
 assert.equal(pixelFrame(null,0,[],0,true),11);
});
test('atlas crops and anchors remain inside the source image',()=>{
 for(const {box:[x,y,w,h],anchor:[ax,ay]} of [...SPRITES,...PLAYER_SPRITES]){assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert.ok(ax>=0&&ax<w&&ay>=0&&ay<h);}
});
