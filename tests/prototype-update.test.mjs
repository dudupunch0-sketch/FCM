// Combo boundary carryover, status levels and round structure.
// Spec: docs/design/23_round_structure_and_judging.md, docs/design/30_combo_boundary_and_sub_beat.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {RULES,CARDS,newMatch,makePlan,opponentPlan,resolveTurn,roundOf,isRoundEnd} from '../dist/engine.js';

const cfg=definitions.configs.combat_prototype;
const lateSway=makePlan(['shell','rest','rest','rest','sway']);
const lateJab=makePlan(['rest','rest','rest','rest','rest','rest','rest','jab']);

test('a counter window opened on the last slot continues into the next combo',()=>{
  const r=resolveTurn(newMatch(),lateSway,lateJab);
  assert.ok(r.frames.at(-1).events.some(e=>e.type==='evade'&&e.actor===0),'마지막 칸 회피가 성립하지 않았습니다');
  assert.equal(r.match.fighters[0].counterUntil,1,'칸 경계에서 잘렸습니다');
});

test('carryover does not lengthen the window, it only avoids truncation',()=>{
  const r=resolveTurn(newMatch(),lateSway,lateJab);
  const carried=r.match.fighters[0].counterUntil;
  assert.equal(carried,(7+RULES.counterWindow)-RULES.slots,'창 길이가 늘어났습니다');
});

test('a round boundary expires a window that a combo boundary would have carried',()=>{
  // Body shots only: they drain and score without ever reaching a head KO.
  let m=newMatch('pressure',5);
  for(let i=0;i<cfg.rounds.turnsPerRound-1;i++)m=resolveTurn(m,makePlan(['body','body','body']),makePlan([])).match;
  const after=resolveTurn(m,lateSway,lateJab).match;
  assert.equal(after.roundResults.length,1,'라운드가 마감되지 않았습니다');
  assert.equal(after.fighters[0].counterUntil,-1,'라운드 경계에서 창이 소멸하지 않았습니다');
});

test('interval recovery lifts a drained fighter without reaching full',()=>{
  const drain=makePlan(['body','body','body']);
  let m=newMatch('pressure',5);
  for(let i=0;i<cfg.rounds.turnsPerRound-1;i++)m=resolveTurn(m,drain,makePlan([])).match;
  const before=m.fighters[0].stamina;
  assert.ok(before<cfg.intervalRecovery.cap,`먼저 소모되어야 합니다: ${before}`);
  const after=resolveTurn(m,drain,makePlan([])).match.fighters[0].stamina;
  assert.ok(after>before,`회복이 없습니다: ${before} → ${after}`);
  assert.ok(after<=cfg.intervalRecovery.cap,`상한을 넘었습니다: ${after}`);
  assert.ok(after<RULES.maxStamina,'완전 회복이 일어났습니다');
});

test('interval recovery never lowers a fighter who is already above the cap',()=>{
  let m=newMatch('pressure',5);
  for(let i=0;i<cfg.rounds.turnsPerRound-1;i++)m=resolveTurn(m,makePlan([]),makePlan([])).match;
  assert.equal(m.fighters[0].stamina,RULES.maxStamina);
  const after=resolveTurn(m,makePlan([]),makePlan([])).match;
  assert.equal(after.fighters[0].stamina,RULES.maxStamina,'상한이 건강한 선수를 깎았습니다');
});

test('round boundaries fall where the config says and never truncate a combo',()=>{
  assert.equal(roundOf(1),1);
  assert.equal(roundOf(cfg.rounds.turnsPerRound),1);
  assert.equal(roundOf(cfg.rounds.turnsPerRound+1),2);
  let m=newMatch('turtle',9);
  while(!m.finished){
    const r=resolveTurn(m,makePlan([]),makePlan([]));
    assert.equal(r.frames.length,RULES.slots,'콤보가 잘렸습니다');
    m=r.match;
  }
  assert.equal(m.method,'판정');
  assert.equal(m.roundResults.length,cfg.rounds.count,'라운드 수가 설정과 다릅니다');
});

test('a decision is the sum of round results, not a separate recount',()=>{
  let m=newMatch('turtle',3);
  while(!m.finished)m=resolveTurn(m,makePlan(['body','body']),makePlan([])).match;
  assert.equal(m.method,'판정');
  const won=m.roundResults.reduce((n,r)=>n+(r.winner===0?1:r.winner===1?-1:0),0);
  assert.equal(m.winner,won===0?null:won>0?0:1);
  assert.ok(m.roundResults.every(r=>Number.isFinite(r.margin)),'라운드 격차가 보존되지 않았습니다');
});

test('a heavy head shot staggers or groggies before it kills',()=>{
  const m=newMatch();m.fighters[1].damage.head=20;
  const r=resolveTurn(m,makePlan(['heavy']),makePlan([]));
  const status=r.frames.flatMap(f=>f.events).filter(e=>e.type==='status');
  assert.ok(status.length,'상태 전이가 없습니다');
  assert.ok(['stagger','groggy'].includes(status[0].level));
  assert.ok(!r.match.finished,'한 방에 끝났습니다');
});

test('a groggy fighter defends worse, which is what makes carryover survivable rather than free',()=>{
  const build=groggy=>{
    const m=newMatch();
    if(groggy){m.fighters[1].status='groggy';m.fighters[1].statusUntil=RULES.slots;}
    return resolveTurn(m,makePlan(['jab']),makePlan(['sway'])).match.fighters[1].damage.head;
  };
  assert.ok(build(true)>build(false),'그로기 상태에서 방어가 약해지지 않았습니다');
});

test('the opponent plans around its own carried-over groggy state',()=>{
  const m=newMatch('pressure',4);
  const healthy=opponentPlan(m);
  m.fighters[1].status='groggy';m.fighters[1].statusUntil=RULES.slots;
  const hurt=opponentPlan(m);
  assert.notDeepEqual(hurt,healthy,'그로기인데 같은 계획을 세웁니다');
  const defensive=hurt.filter(p=>['guard','rest'].includes(CARDS[p.id].kind)).length;
  assert.ok(defensive>hurt.length/2,'회복·방어로 기울지 않았습니다');
});

test('carried state stays deterministic across a full match',()=>{
  const play=()=>{
    let m=newMatch('tricky',13);const trace=[];
    while(!m.finished){
      const r=resolveTurn(m,makePlan(['sway','cross','body']),opponentPlan(m));
      trace.push([r.match.turn,r.match.fighters[0].counterUntil,r.match.fighters[1].status]);
      m=r.match;
    }
    return {trace,method:m.method,winner:m.winner};
  };
  assert.deepEqual(play(),play());
});
