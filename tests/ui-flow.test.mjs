// Controller integration with a minimal DOM double; not browser or layout QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as engine from '../dist/engine.js';
import {advancePlayback} from '../dist/motion.js';
import * as planner from '../dist/planner.js';
async function harness(){
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 class Element{
  constructor(){this.dataset={};this.classList={toggle(){},add(){}};this.children=[];this.value='';this.hidden=false;this.disabled=false;this.open=false;this.tagName='DIV';this.textContent='';}
  set innerHTML(value){this.html=value;const option=value.match(/<option value="([^"]*)"/);if(option)this.value=option[1];this.children=Array.from(value.matchAll(/data-start="(\d+)" data-end="(\d+)"/g),m=>Object.assign(new Element(),{dataset:{start:m[1],end:m[2]}}));if(!this.children.length)this.children=Array.from({length:8},()=>new Element());}
  get innerHTML(){return this.html??'';}
  setAttribute(){}append(){}prepend(){}showModal(){this.open=true;}close(){this.open=false;}click(){if(!this.disabled)this.onclick?.();}
 }
 const ids=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 const categories=['attack','defense','tactic'].map(c=>Object.assign(new Element(),{dataset:{category:c}}));
 const closes=['menu','help','cardsInfo'].map(c=>Object.assign(new Element(),{dataset:{close:c}}));
 const events={};let raf;
 const document={getElementById:id=>{assert.ok(ids.has(id),'missing HTML element: '+id);return ids.get(id);},querySelectorAll:q=>q==='[data-category]'?categories:q==='[data-close]'?closes:q==='#timeline .slot'?ids.get('timeline').children:[],createElement:()=>new Element(),addEventListener:(e,fn)=>events[e]=fn,activeElement:new Element()};
 const source=(await readFile(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
 const deps={...engine,...planner,advancePlayback,document,createRing:async()=>({render(){},reduced:false}),requestAnimationFrame:f=>raf=f,window:{}};
 const factory=new (Object.getPrototypeOf(async function(){}).constructor)('deps',`const {${Object.keys(deps).join(',')}}=deps;\n${source}\nreturn {add,execute,finishPlayback,beginPlayback,edit,getState:()=>structuredClone({match,enemyPlan,draft,mode,play,last}),setSelected:i=>selected=i};`);
 const api=await factory(deps);return {...api,ids,events,step:t=>raf(t)};
}
test('normal completion returns directly to planning, keeps draft, and hides unearned next-turn intel',async()=>{
 const h=await harness();h.add('sway');h.add('cross');const original=h.getState();h.execute();assert.equal(h.getState().mode,'playing');
 for(let t=1;t<6000&&h.getState().mode==='playing';t+=16)h.step(t);
 const after=h.getState();assert.equal(after.mode,'planning');assert.equal(after.match.turn,2);assert.deepEqual(after.draft,original.draft);assert.equal(h.ids.get('intel').innerHTML.match(/class="slot exact"/g)?.length,1);
 h.add('jab');const edited=h.getState();h.beginPlayback(true);h.finishPlayback();const replayed=h.getState();assert.deepEqual(replayed.match,edited.match);assert.deepEqual(replayed.enemyPlan,edited.enemyPlan);assert.deepEqual(replayed.draft,edited.draft);
});
test('paused replay cannot edit, advance, or change the committed result; skip is equivalent',async()=>{
 const h=await harness();h.add('jab');h.execute();const calculated=h.getState().last.match;h.ids.get('pause').click();h.step(16);const before=h.getState();h.add('cross');h.step(200);assert.deepEqual(h.getState().draft,before.draft);assert.equal(h.getState().play.cursor,before.play.cursor);h.finishPlayback();assert.deepEqual(h.getState().match,calculated);assert.equal(h.ids.get('pause').hidden,true);
});
test('selected card replacement, undo, new match, and modal wiring work',async()=>{
 const h=await harness();h.add('jab');h.setSelected(0);h.add('sway');assert.deepEqual(h.getState().draft,['sway']);h.ids.get('undo').click();assert.deepEqual(h.getState().draft,['jab']);h.ids.get('menuButton').click();assert.equal(h.ids.get('menu').open,true);h.ids.get('start').click();assert.deepEqual(h.getState().draft,[]);assert.equal(h.getState().match.turn,1);assert.equal(h.ids.get('menu').open,false);
});
