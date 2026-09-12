// Staff, facilities, delegation, economy (Phases 8-9) and world simulation (Phases 10-11).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definitions} from './helpers/engine-setup.mjs';
import {createRngSet} from '../dist/rng.js';
import {hireStaff,assign,staffQuality,createFacilities,upgradeCost,trainingQuality,maintenanceCost,delegationPlan,
  createLedger,payPurse,weeklyCosts,affordability,sponsorOffer} from '../dist/organisation.js';
import {createWorld,rankOf,isChampion,applyFightResult,decayInactive,titleEligibility,titleShotPriority,
  simulateWeek,retireEligible,intakeProspects,setTier} from '../dist/world.js';

const cfg=definitions.configs.world;
const rng=seed=>createRngSet(seed,definitions).stream('world_generation');
const coach=()=>hireStaff(definitions,{id:'s1',role:'striking_coach',skill:80});

test('staff roles are validated and salary follows skill',()=>{
  assert.throws(()=>hireStaff(definitions,{id:'x',role:'chef',skill:50}),/알 수 없는 Staff Role/);
  assert.ok(hireStaff(definitions,{id:'a',role:'analyst',skill:90}).salary>hireStaff(definitions,{id:'b',role:'analyst',skill:20}).salary);
});

test('an overloaded staff member produces worse work',()=>{
  const s=coach();
  const fresh=staffQuality(definitions,s);
  for(let i=0;i<cfg.staff.capacity_per_staff+3;i++)assign(definitions,s,'f'+i);
  assert.ok(staffQuality(definitions,s)<fresh,'과부하가 품질을 떨어뜨리지 않았습니다');
});

test('facilities and staff raise preparation quality, never fight-night damage',()=>{
  const poor=trainingQuality(definitions,{facilities:createFacilities(definitions),staff:[]});
  const rich=trainingQuality(definitions,{facilities:createFacilities(definitions,{core_gym:5,striking:5,recovery_medical:5}),staff:[coach()]});
  assert.ok(rich.quality>poor.quality,'투자가 준비 품질을 높이지 않습니다');
  for(const key of Object.keys(rich))assert.ok(!/damage|power|impact/.test(key),'전투 수치를 직접 건드립니다: '+key);
});

test('delegation is never as precise as direct management',()=>{
  const facilities=createFacilities(definitions);
  const manual=trainingQuality(definitions,{facilities,staff:[coach()],delegationMode:'manual'}).quality;
  const auto=trainingQuality(definitions,{facilities,staff:[coach()],delegationMode:'auto_with_policy'}).quality;
  assert.ok(manual>auto,'위임이 직접 관리와 같아졌습니다');
  assert.throws(()=>trainingQuality(definitions,{facilities,delegationMode:'telepathy'}),/알 수 없는 위임 모드/);
});

test('a larger roster is handled by policy rather than by more clicking',()=>{
  const roster=Array.from({length:10},(_,i)=>'f'+i);
  const modes=delegationPlan(definitions,roster,['f0','f1','f2']);
  assert.equal(Object.values(modes).filter(m=>m==='manual').length,3);
  assert.equal(Object.values(modes).filter(m=>m==='delegated').length,7);
});

test('facility upgrades cost more each level and stop at the cap',()=>{
  const f=createFacilities(definitions,{striking:1});
  const first=upgradeCost(definitions,f,'striking');
  f.striking=cfg.facility.max_level-1;
  assert.ok(upgradeCost(definitions,f,'striking')>first);
  f.striking=cfg.facility.max_level;
  assert.equal(upgradeCost(definitions,f,'striking'),null);
  assert.throws(()=>upgradeCost(definitions,f,'sauna'),/알 수 없는 시설/);
  assert.ok(maintenanceCost(definitions,f)>0);
});

test('fighter money and management money stay separate',()=>{
  const ledger=createLedger(definitions);
  const before=ledger.management_cash;
  const split=payPurse(definitions,ledger,{fighterId:'f1',purse:1000,share:0.15,won:true,offer:{win_bonus:500,finish_bonus:300}});
  assert.equal(split.gross,1500);
  assert.equal(ledger.management_cash,before+split.managementShare);
  assert.equal(ledger.fighter_cash.f1,split.fighterShare);
  assert.ok(split.fighterShare>split.managementShare,'플레이어가 선수 몫보다 많이 가져갑니다');
});

test('running out of money narrows options instead of ending the run',()=>{
  const ledger=createLedger(definitions);
  for(let w=0;w<200;w++)weeklyCosts(definitions,ledger,{staff:[coach()],facilities:createFacilities(definitions),inCamp:true});
  const state=affordability(definitions,ledger);
  assert.ok(ledger.management_cash<0);
  assert.equal(state.game_over,false,'자금난이 Game Over가 되었습니다');
  assert.equal(state.can_hire,false);
  assert.ok(state.constrained);
});

test('a sponsor pays money and charges calendar',()=>{
  const small=sponsorOffer(definitions,{ticketPower:10});
  const big=sponsorOffer(definitions,{ticketPower:80});
  assert.ok(big.payment>small.payment);
  assert.ok(big.appearance_slots_per_week>=small.appearance_slots_per_week);
  assert.ok(big.stress_per_appearance>0,'의무가 전혀 없습니다');
});

test('the champion is a separate status from being number one',()=>{
  const world=createWorld(definitions,rng(3));
  assert.ok(isChampion(world,world.ranking.champion_id));
  assert.equal(rankOf(world,world.ranking.champion_id),null,'챔피언이 랭킹 목록에 들어 있습니다');
  assert.equal(rankOf(world,world.ranking.ordered[0]),1);
});

test('beating someone ranked above you moves you past them',()=>{
  const world=createWorld(definitions,rng(3));
  const [above,,below]=world.ranking.ordered;
  const beforeBelow=rankOf(world,below);
  applyFightResult(world,{winnerId:below,loserId:above});
  assert.ok(rankOf(world,below)<beforeBelow,'상위를 이겼는데 순위가 오르지 않았습니다');
});

test('beating the champion takes the belt and the old champion re-enters the ranking',()=>{
  const world=createWorld(definitions,rng(3));
  const champ=world.ranking.champion_id;
  const challenger=world.ranking.ordered[0];
  applyFightResult(world,{winnerId:challenger,loserId:champ});
  assert.equal(world.ranking.champion_id,challenger);
  assert.ok(rankOf(world,champ)!==null,'전 챔피언이 사라졌습니다');
  assert.ok(world.news.some(n=>n.type==='ChampionshipWon'));
});

test('long inactivity drops a fighter and eventually removes them',()=>{
  const world=createWorld(definitions,rng(3));
  const id=world.ranking.ordered[2];
  world.week=cfg.ranking.removal_after_weeks_inactive+1;
  decayInactive(world);
  assert.equal(rankOf(world,id),null,'비활동 선수가 랭킹에 남았습니다');
  assert.ok(world.news.some(n=>n.type==='RankingRemoved'));
});

test('number one does not automatically receive a title shot',()=>{
  const world=createWorld(definitions,rng(3));
  const top=world.ranking.ordered[0];
  world.fighters[top].recent=[];
  const check=titleEligibility(world,top);
  assert.equal(check.eligible,false,'경쟁 자격 없이 타이틀전을 받았습니다');
  assert.ok(check.reasons.length>0);
  world.fighters[top].recent=['W','W','W'];
  assert.equal(titleEligibility(world,top).eligible,true);
});

test('title priority ranks eligible contenders and excludes ineligible ones',()=>{
  const world=createWorld(definitions,rng(3));
  const ids=world.ranking.ordered.slice(0,5);
  for(const id of ids)world.fighters[id].recent=['W','W'];
  world.fighters[ids[4]].recent=['L','L'];
  world.fighters[ids[1]].ticket_power=95;
  const priority=titleShotPriority(world,ids);
  assert.ok(priority.length>0);
  assert.ok(!priority.some(c=>c.id===ids[4]),'자격 없는 후보가 포함되었습니다');
  assert.deepEqual(priority.map(c=>c.id),[...priority].sort((a,b)=>b.score-a.score).map(c=>c.id));
});

test('the world moves without the player and stays internally consistent',()=>{
  const world=createWorld(definitions,rng(5));
  const stream=rng(5);
  const beforeChampion=world.ranking.champion_id;
  for(let w=0;w<120;w++)simulateWeek(world,stream);
  assert.ok(world.week===120);
  assert.ok(world.news.length>0,'세계에 아무 일도 일어나지 않았습니다');
  assert.ok(Object.values(world.fighters).some(f=>!f.active),'아무도 은퇴하지 않았습니다');
  assert.ok(Object.keys(world.fighters).length>cfg.world.roster_per_division,'신인이 들어오지 않았습니다');
  assert.ok(world.ranking.ordered.length<=cfg.ranking.size);
  assert.ok(new Set(world.ranking.ordered).size===world.ranking.ordered.length,'랭킹에 중복이 있습니다');
  assert.ok(!world.ranking.ordered.includes(world.ranking.champion_id),'챔피언이 랭킹에도 있습니다');
  void beforeChampion;
});

test('world simulation is deterministic for the same seed',()=>{
  const run=()=>{
    const world=createWorld(definitions,rng(9));
    const stream=rng(9);
    for(let w=0;w<60;w++)simulateWeek(world,stream);
    return {champion:world.ranking.champion_id,ordered:world.ranking.ordered,news:world.news.length};
  };
  assert.deepEqual(run(),run());
});

test('simulation tier changes fidelity, not the data model',()=>{
  const world=createWorld(definitions,rng(3));
  const id=world.ranking.ordered[0];
  const shape=Object.keys(world.fighters[id]).sort();
  setTier(world,id,'A');
  assert.equal(world.fighters[id].tier,'A');
  assert.deepEqual(Object.keys(world.fighters[id]).sort(),shape,'Tier가 데이터 구조를 바꿨습니다');
  assert.throws(()=>setTier(world,id,'Z'),/알 수 없는 Simulation Tier/);
});

test('new prospects arrive with a history rather than appearing blank',()=>{
  const world=createWorld(definitions,rng(3));
  const before=Object.keys(world.fighters).length;
  intakeProspects(world,rng(3));
  const added=Object.values(world.fighters).filter(f=>f.id.startsWith('p'));
  assert.equal(Object.keys(world.fighters).length,before+cfg.world.prospect_intake_per_year);
  assert.ok(added.some(f=>f.record.wins>0),'모든 신인이 백지 상태로 등장했습니다');
});

test('retirement comes from age or accumulated damage',()=>{
  const world=createWorld(definitions,rng(3));
  const [oldId,hurtId]=world.ranking.ordered;
  world.fighters[oldId].age=cfg.world.retirement_age+1;
  world.fighters[hurtId].damage=cfg.world.retirement_damage_threshold+5;
  retireEligible(world);
  assert.equal(world.fighters[oldId].active,false);
  assert.equal(world.fighters[hurtId].active,false);
  assert.equal(world.news.filter(n=>n.type==='Retirement').length,2);
});
