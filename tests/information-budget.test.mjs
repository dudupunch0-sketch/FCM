// Information card limit and the shared per-turn reveal budget.
// Spec: docs/design/31_information_economy_and_placement.md
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {RULES,newMatch,makePlan,observe,activeSkillLimit,resolveTurn} from '../dist/engine.js';

const reveal=definitions.configs.combat_prototype.reveal;
const costOf=list=>list.reduce((n,r)=>n+(reveal.cost[r.kind]??1),0);
const loaded=()=>{
  const m=newMatch();
  const plan=makePlan(['feint','heavy','shell']);
  m.lastPlans=[makePlan([]),plan];
  m.lastEvaded=[true,false];
  return {m,plan};
};

test('the active limit matches the spec and is enforced', () => {
  assert.equal(activeSkillLimit(),definitions.configs.information_cards.active_card_limit.information);
  const {m,plan}=loaded();
  assert.throws(()=>observe(plan,['first','guard','pattern','counter'],m),/최대 3장/);
});

test('three cards never exceed the shared per-turn budget', () => {
  const {m,plan}=loaded();
  const out=observe(plan,['first','pattern','counter'],m);
  assert.ok(costOf(out)<=reveal.perTurnTotal,`예산 초과: ${costOf(out)}`);
  assert.ok(out.filter(r=>r.kind==='exact').length<=reveal.maxExactPerTurn);
});

test('the budget, not the card count, is what binds', () => {
  const {m,plan}=loaded();
  const one=observe(plan,['first'],m);
  const three=observe(plan,['first','pattern','counter'],m);
  assert.ok(costOf(three)>=costOf(one),'카드를 늘려도 아무 이득이 없습니다');
  assert.ok(costOf(three)<=reveal.perTurnTotal);
  assert.ok(three.length<RULES.slots,'8칸 계획 전체가 공개되었습니다');
});

test('extra cards buy coverage across situations, not more disclosure in one turn', () => {
  const {m,plan}=loaded();
  const withoutEvidence=newMatch();
  // counter only triggers after a real evasion; with no evidence it contributes nothing.
  assert.deepEqual(observe(plan,['counter'],withoutEvidence),[]);
  const covered=observe(plan,['counter','guard'],withoutEvidence);
  assert.ok(covered.length>0,'다른 카드가 상황을 메우지 못했습니다');
  assert.ok(costOf(observe(plan,['first','pattern','counter'],m))<=reveal.perTurnTotal);
});

test('the same placement revealed by two cards is charged once', () => {
  const {m,plan}=loaded();
  const doubled=observe(plan,['first','pattern'],m);
  const keys=doubled.map(r=>`${r.start}:${r.kind}:${r.label}`);
  assert.equal(new Set(keys).size,keys.length,'중복 공개가 예산을 두 번 소모했습니다');
});

test('reveal selection is deterministic for the same cards and state', () => {
  const {m,plan}=loaded();
  assert.deepEqual(observe(plan,['pattern','counter','first'],m),observe(plan,['pattern','counter','first'],m));
  assert.deepEqual(observe(plan,['pattern','counter','first'],m),observe(plan,['counter','first','pattern'],m));
});

test('no cards still leaves the free baseline: past combos remain visible', () => {
  const {m,plan}=loaded();
  assert.deepEqual(observe(plan,'none',m),[]);
  assert.deepEqual(observe(plan,[],m),[]);
  assert.ok(m.lastPlans,'무카드 기준선인 지난 콤보가 사라졌습니다');
});

test('an unknown card id is refused rather than silently ignored', () => {
  const {m,plan}=loaded();
  assert.throws(()=>observe(plan,['telepathy'],m),/알 수 없는 정보 스킬/);
});

test('reveals never leak a hidden action id through a cue', () => {
  const {m,plan}=loaded();
  for(const r of observe(plan,['heavy','guard'],m)){
    if(r.kind!=='exact')assert.ok(!('id' in r),'추정 예고가 카드 ID를 노출했습니다');
    assert.ok(r.start>=0&&r.start<RULES.slots);
  }
});

test('information cards do not alter the committed opponent plan', () => {
  const m=newMatch('tricky',31);
  const plan=makePlan(['feint','heavy','shell']);
  const before=structuredClone(plan);
  observe(plan,['first','pattern','counter'],m);
  assert.deepEqual(plan,before);
  const a=resolveTurn(m,makePlan(['jab']),plan);
  observe(plan,['guard'],m);
  const b=resolveTurn(m,makePlan(['jab']),plan);
  assert.deepEqual(a.match,b.match);
});
