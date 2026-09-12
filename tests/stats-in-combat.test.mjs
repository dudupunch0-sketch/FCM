// Roadmap Phase 2 completion criteria: fighter stats decide fights, upsets have causes.
// Spec: implementation_roadmap Phase 2, docs/design/24 and 25.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {newMatch,makePlan,opponentPlan,resolveTurn,impactPosition,CARDS,RULES} from '../dist/engine.js';

const strong={base:{punch_technique:92,strength:88,explosiveness:88,agility:85,reflex:85,cardio:88,durability:85,guard_technique:85}};
const weak={base:{punch_technique:28,strength:32,explosiveness:30,agility:30,reflex:30,cardio:35,durability:35,guard_technique:30}};
const hits=r=>r.frames.flatMap(f=>f.events).filter(e=>e.type==='hit');
const jabPlan=()=>makePlan(['jab','cross','jab','rest','rest']);

test('identical defaults leave resolution unchanged, so wiring alone shifts nothing', () => {
  const plain=resolveTurn(newMatch('pressure',5),jabPlan(),makePlan(['guard']));
  const explicit=resolveTurn(newMatch('pressure',5,{player:{},opponent:{}}),jabPlan(),makePlan(['guard']));
  assert.deepEqual(hits(plain).map(e=>e.power),hits(explicit).map(e=>e.power));
});

test('a stronger puncher lands harder with the identical plan', () => {
  const strongHit=hits(resolveTurn(newMatch('pressure',5,{player:strong}),jabPlan(),makePlan([])))[0];
  const weakHit=hits(resolveTurn(newMatch('pressure',5,{player:weak}),jabPlan(),makePlan([])))[0];
  assert.ok(strongHit.power>weakHit.power*1.3,`${strongHit.power} vs ${weakHit.power}`);
});

test('a poor defender fails an otherwise correct evasion', () => {
  const clean=resolveTurn(newMatch('pressure',5,{player:strong}),makePlan(['sway']),makePlan(['jab']));
  const clumsy=resolveTurn(newMatch('pressure',5,{player:weak}),makePlan(['sway']),makePlan(['jab']));
  assert.ok(clean.frames[0].events.some(e=>e.type==='evade'),'좋은 선수가 회피하지 못했습니다');
  assert.ok(!clumsy.frames[0].events.some(e=>e.type==='evade'),'나쁜 선수가 같은 회피에 성공했습니다');
});

test('a faster fighter reaches impact earlier inside the slot', () => {
  const fast=newMatch('pressure',5,{player:strong}).fighters[0];
  const slow=newMatch('pressure',5,{player:weak}).fighters[0];
  assert.ok(impactPosition(CARDS.cross,fast)<impactPosition(CARDS.cross,slow),'속도가 타격 시점에 반영되지 않았습니다');
});

test('the stronger fighter usually wins across many seeds', () => {
  let wins=0,fights=0;
  for(let seed=1;seed<=30;seed++){
    let m=newMatch('pressure',seed,{player:strong,opponent:weak});
    while(!m.finished)m=resolveTurn(m,jabPlan(),opponentPlan(m)).match;
    fights++;if(m.winner===0)wins++;
  }
  assert.ok(wins/fights>0.7,`강자 승률이 낮습니다: ${wins}/${fights}`);
});

const evenly=v=>({base:Object.fromEntries(
  ['punch_technique','strength','explosiveness','agility','reflex','cardio','durability','guard_technique'].map(k=>[k,v]))});
const winsWith=(player,opponent,plan,seeds=30)=>{
  let wins=0;
  for(let seed=1;seed<=seeds;seed++){
    let m=newMatch('pressure',seed,{player,opponent});
    while(!m.finished)m=resolveTurn(m,makePlan(plan),opponentPlan(m)).match;
    if(m.winner===0)wins++;
  }
  return wins;
};
// Measured against the 'pressure' patterns: patient, well-timed guards punish them, while a
// long shell gets worn down. Exact rates move whenever balance is tuned — re-derive them with
// tools/balance.mjs rather than assuming these plans stay on the same side.
const workingPlan=['guard','jab','guard','cross','rest'];
const poorPlan=['shell','cross','guard','rest'];

test('an upset has a cause: the same weaker fighter loses one way and wins another',()=>{
  const underdog=evenly(50),favourite=evenly(60);
  assert.equal(winsWith(underdog,favourite,poorPlan),0,'약자가 아무 계획으로나 이깁니다');
  assert.ok(winsWith(underdog,favourite,workingPlan)>=15,'전략으로 뒤집을 방법이 없습니다');
});

test('a large enough gap is not reliably strategised away',()=>{
  // Randomness must not routinely hand a heavy favourite a loss. A rare upset is fine;
  // a common one would mean the result came from noise rather than from the matchup.
  const upsets=winsWith(evenly(35),evenly(60),workingPlan);
  assert.ok(upsets<=6,`압도적 격차가 너무 자주 뒤집힙니다: ${upsets}/30`);
});

test('stats change results without changing determinism', () => {
  const play=()=>{
    let m=newMatch('tricky',19,{player:strong,opponent:weak});const trace=[];
    while(!m.finished){const r=resolveTurn(m,jabPlan(),opponentPlan(m));trace.push(hits(r).map(e=>e.power));m=r.match;}
    return {trace,winner:m.winner,method:m.method};
  };
  assert.deepEqual(play(),play());
});

test('fighter stats are never persisted as derived values on the match', () => {
  const m=newMatch('pressure',5,{player:strong});
  assert.ok(m.fighters[0].stats,'선수 데이터가 없습니다');
  assert.ok(m.fighters[0].derived,'Derived가 계산되지 않았습니다');
  // Derived is recomputed from base data, never hand-edited at runtime.
  assert.ok(Object.isFrozen(m.fighters[0].derived));
  assert.ok(Object.isFrozen(m.fighters[0].stats.base));
});

test('resources stay bounded when stats are extreme', () => {
  for(const pair of [[strong,weak],[weak,strong]]){
    let m=newMatch('turtle',7,{player:pair[0],opponent:pair[1]});
    while(!m.finished){
      m=resolveTurn(m,makePlan(['heavy','body','rest']),opponentPlan(m)).match;
      for(const f of m.fighters){
        assert.ok(f.stamina>=0&&f.stamina<=RULES.maxStamina,`스태미너 이탈: ${f.stamina}`);
        for(const d of Object.values(f.damage))assert.ok(Number.isFinite(d)&&d>=0);
      }
    }
    assert.ok(m.method);
  }
});
