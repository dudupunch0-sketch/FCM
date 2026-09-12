// Distance model and sub-beat timing.
// Spec: docs/design/22_combat_range_model.md, docs/design/30_combo_boundary_and_sub_beat.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {CARDS,RULES,newMatch,makePlan,resolveTurn,rangeFactor,impactPosition,bandOf,isRoundEnd} from '../dist/engine.js';

const cfg=definitions.configs.combat_prototype;
const hits=r=>r.frames.flatMap(f=>f.events).filter(e=>e.type==='hit');

test('a match starts at the configured distance and cards move it',()=>{
  const m=newMatch();
  assert.equal(m.gap,cfg.range.initial);
  const closed=resolveTurn(m,makePlan(['advance']),makePlan([])).match;
  assert.ok(closed.gap<m.gap,`전진 카드가 거리를 좁히지 않았습니다: ${closed.gap}`);
  const opened=resolveTurn(m,makePlan(['rest','rest']),makePlan([])).match;
  assert.ok(opened.gap>m.gap,'호흡이 거리를 벌리지 않았습니다');
});

test('gap stays inside its configured bounds under repeated movement',()=>{
  let m=newMatch();
  for(let i=0;i<RULES.maxTurns&&!m.finished;i++){
    m=resolveTurn(m,makePlan(['advance','advance','body']),makePlan([])).match;
    assert.ok(m.gap>=cfg.range.min&&m.gap<=cfg.range.max,`범위 이탈: ${m.gap}`);
  }
});

test('a card is strongest at its optimal range and falls off outside tolerance',()=>{
  const hook=CARDS.hook;
  assert.equal(rangeFactor(hook.optimalRange,hook),1);
  assert.ok(Math.abs(rangeFactor(hook.optimalRange+hook.rangeTolerance,hook)-1)<1e-6,'허용폭 안에서 감쇠했습니다');
  assert.ok(rangeFactor(hook.optimalRange+hook.rangeTolerance*3,hook)<1,'허용폭 밖에서 감쇠가 없습니다');
  const far=rangeFactor(cfg.range.max,hook);
  assert.ok(far<1,'먼 거리에서 감쇠가 없습니다');
  assert.ok(far>=1-cfg.range.maxFalloff-1e-9,'감쇠 하한을 넘었습니다');
});

test('reach bonus lets the flicker jab reach where the plain jab cannot',()=>{
  const far=cfg.range.max;
  assert.ok(rangeFactor(far,CARDS.flicker)>rangeFactor(far,CARDS.jab),'리치 보정이 작동하지 않습니다');
  // Same technique family, different Action Data only: no fighter stat was touched.
  assert.equal(CARDS.flicker.trajectory,CARDS.jab.trajectory);
  assert.equal(CARDS.flicker.kind,CARDS.jab.kind);
});

test('distance actually changes what a punch does in a match',()=>{
  const close=resolveTurn(newMatch(),makePlan(['advance','body']),makePlan([]));
  const far=resolveTurn(newMatch(),makePlan(['rest','rest','body']),makePlan([]));
  const closeBody=hits(close).filter(e=>e.targetPart==='body').at(-1);
  const farBody=hits(far).filter(e=>e.targetPart==='body').at(-1);
  assert.ok(closeBody&&farBody);
  assert.ok(closeBody.reach>farBody.reach,`거리가 위력에 반영되지 않았습니다: ${closeBody.reach} vs ${farBody.reach}`);
});

test('gap carries across a combo boundary and resets at a round boundary',()=>{
  let m=newMatch();
  m=resolveTurn(m,makePlan(['advance','advance']),makePlan([])).match;
  const closed=m.gap;
  assert.ok(closed<cfg.range.initial);
  m=resolveTurn(m,makePlan([]),makePlan([])).match;
  assert.ok(m.gap!==cfg.range.initial||isRoundEnd(m.turn),'콤보 경계에서 거리가 리셋되었습니다');
  while(m.roundResults.length===0&&!m.finished)m=resolveTurn(m,makePlan(['guard']),makePlan([])).match;
  assert.equal(m.gap,cfg.range.initial,'라운드 경계에서 거리가 리셋되지 않았습니다');
});

test('sub-beat positions differ per card and stay inside the slot',()=>{
  const attacks=Object.values(CARDS).filter(c=>c.kind==='attack');
  for(const c of attacks){
    const at=impactPosition(c);
    assert.ok(at>=0&&at<=1,`${c.name} 위치 이탈: ${at}`);
  }
  assert.ok(impactPosition(CARDS.jab)<impactPosition(CARDS.heavy),'빠른 카드가 먼저 닿지 않습니다');
});

test('equally timed strikes still apply together, so double KO survives sub-beat',()=>{
  const m=newMatch();m.fighters.forEach(f=>f.damage.head=RULES.koDamage-1);
  const r=resolveTurn(m,makePlan(['jab']),makePlan(['jab']));
  assert.ok(r.match.finished);
  assert.equal(r.match.winner,null);
  assert.equal(r.match.method,'동시 KO');
});

test('a clearly earlier strike weakens the later one but does not erase it',()=>{
  const m=newMatch();m.fighters[1].damage.head=40;
  const r=resolveTurn(m,makePlan(['jab']),makePlan(['heavy']));
  const landed=hits(r);
  assert.ok(landed.some(e=>e.actor===0),'선타가 없습니다');
  assert.ok(landed.some(e=>e.actor===1),'후속 타격이 지워졌습니다');
});

test('bands name the gap without being used for resolution',()=>{
  assert.equal(bandOf(cfg.range.min),'clinch');
  assert.equal(bandOf(cfg.range.max),'outside');
  assert.ok(['inside','mid'].includes(bandOf(cfg.range.initial)));
});

test('the whole distance and timing path stays deterministic',()=>{
  const play=()=>{
    let m=newMatch('tricky',77);const trace=[];
    while(!m.finished){
      const r=resolveTurn(m,makePlan(['advance','flicker','body']),makePlan(['jab','weave','cross']));
      trace.push([m.turn,r.match.gap,...hits(r).map(e=>e.power)]);
      m=r.match;
    }
    return trace;
  };
  assert.deepEqual(play(),play());
});
