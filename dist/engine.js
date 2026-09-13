import {createFighter,createCondition,computeDerived,computeEffective} from './fighter.js';
import {createMemory,recordPlan,setupModifier,serializeMemory,restoreMemory} from './combat-memory.js';

// Pure combat rules. No DOM, animation clock, storage, or player-draft access.
// Balance data comes from config/combat_prototype.json through configureEngine.
// Live bindings: consumers import these names and see the configured values.
export let RULES = null;
export let CARDS = null;
export let SKILLS = null;
export let PROFILES = null;
let PATTERNS = null;
let LOW_STAMINA = null;
let ROUNDS = null;
let STATUS = null;
let INTERVAL = null;
let SUBBEAT = null;
let RANGE = null;
let CEILING = null;
let MATCHUP = null;
let FIRST_STRIKE = null;
let REVEAL = null;
let ANGLE = null;
// Solved equilibrium mixtures, when calibration output is loaded. Falls back to fixed
// patterns so the engine still runs before anyone has run the calibration tool.
let STRATEGY_MIX = null;
let STYLE = null;
let MODIFIERS = null;
let VARIANCE = 0;
let DEFAULTS = null;
let INFLUENCE = null;
let DEFINITIONS = null;

const required = () => {
  if (!RULES) throw Error('전투 엔진이 설정되지 않았습니다. configureEngine(definitions)를 먼저 호출하세요');
};

// definitions: the object returned by loadDefinitions, or a bare combat_prototype config.
export function configureEngine(definitions) {
  const cfg = definitions?.configs?.combat_prototype ?? definitions;
  if (!cfg?.rules || !cfg?.cards) throw Error('combat_prototype 설정이 아닙니다');
  RULES = Object.freeze({ ...cfg.rules });
  CARDS = Object.freeze(cfg.cards);
  SKILLS = Object.freeze(cfg.skills);
  PROFILES = Object.freeze(cfg.profiles);
  PATTERNS = cfg.patterns;
  LOW_STAMINA = cfg.low_stamina_plan;
  CEILING = cfg.staminaCeiling ?? null;
  MATCHUP = cfg.stanceMatchup ?? null;
  ROUNDS = cfg.rounds;
  STATUS = cfg.status;
  INTERVAL = cfg.intervalRecovery;
  SUBBEAT = cfg.subBeat;
  RANGE = cfg.range;
  FIRST_STRIKE = cfg.firstStrike;
  REVEAL = cfg.reveal;
  ANGLE = cfg.angle ?? null;
  STRATEGY_MIX = null;
  STYLE = cfg.style_cards;
  MODIFIERS = cfg.modifiers;
  VARIANCE = definitions?.configs?.action_resolution?.randomness?.impact_variance ?? 0;
  DEFAULTS = cfg.fighterDefaults;
  INFLUENCE = cfg.statInfluence;
  DEFINITIONS = definitions?.configs ? definitions : null;
  return { RULES, CARDS, SKILLS, PROFILES };
}

// Stats reach resolution through Effective Performance. Both defaults are identical, so wiring
// them in changes nothing until the config gives the two sides different numbers.
export function buildCombatant(spec){
  return createFighter({id:spec?.id??'default',name:spec?.name??'선수',
    base:{...DEFAULTS.base,...(spec?.base??{})},
    body:{...DEFAULTS.body,...(spec?.body??{})}});
}

function effectiveOf(state){
  if(!DEFINITIONS||!state.stats)return null;
  const condition=createCondition({stamina:state.stamina,stance:state.stance,
    body_damage:{head:state.damage.head,body:state.damage.body,left_arm:state.damage.arms,right_arm:state.damage.arms}});
  return computeEffective(state.derived,condition,DEFINITIONS).effective;
}

// A capability at the reference value multiplies by 1.0; above it helps, below it hurts.
function ratio(effective,key){
  if(!effective)return 1;
  const spec=INFLUENCE[key];
  const value=effective[spec.capability]/DEFAULTS.reference;
  return 1+(value-1)*(spec.weight??1);
}

export function fighter(name,spec){return {name,stance:spec?.body?.stance??DEFAULTS.body.stance??'orthodox',stamina:100,staminaCap:RULES.maxStamina,damage:{head:0,body:0,arms:0},score:0,counterUntil:-1,openUntil:-1,statusUntil:-1,offAngleCards:0,status:'normal',evaded:false,ko:false,
  stats:(spec&&DEFINITIONS)?buildCombatant(spec):null,derived:null};}

const round=x=>Math.round(x*10)/10;
// Distance needs finer precision than resources: a single card shift can be smaller than
// the 0.1 step, and rounding each application away would make small movement vanish.
const roundGap=x=>Math.round(x*100)/100;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// A combo boundary is uninterrupted action, so short-lived effects are not truncated by it:
// a window opened at slot 7 continues into the next combo. Spec: docs/design/30 section 2.
const carryTick=v=>v>=RULES.slots?v-RULES.slots:-1;

// The ceiling only ever falls, and every recovery clamps to it. Attrition is therefore a
// permanent change to what a fighter can still do, not a dip they breathe off between rounds.
// A floor is required or the loop feeds itself: a lower ceiling means gassing sooner, which
// lowers it again. Spec: docs/design/38_stamina_attrition.md.
function lowerCeiling(x,amount,events,actor){
  if(!CEILING||!(amount>0))return;
  const before=x.staminaCap;
  x.staminaCap=round(Math.max(CEILING.min,x.staminaCap-amount));
  if(x.staminaCap>=before)return;
  x.stamina=round(Math.min(x.stamina,x.staminaCap));
  if(events)events.push({type:'ceiling',actor,cap:x.staminaCap,lost:round(before-x.staminaCap)});
}

// A round boundary is real rest. Windows expire and stamina partially recovers, never fully.
function endRound(f){
  for(const x of f){
    x.counterUntil=-1;x.openUntil=-1;x.statusUntil=-1;x.offAngleCards=0;x.status='normal';
    // The cap limits how far recovery can take you, it does not drag a healthier fighter down.
    const ceiling=x.staminaCap??RULES.maxStamina;
    const intervalCap=INTERVAL.cap*ceiling/RULES.maxStamina;
    const recovered=x.stamina+ceiling*INTERVAL.fraction*(1-x.damage.body/200);
    x.stamina=round(clamp(Math.max(x.stamina,Math.min(recovered,intervalCap)),0,ceiling));
  }
}

// Impact position inside a slot. Priority falls out of timing rather than a separate rule.
export function impactPosition(card,state){
  const base=card.subBeat??SUBBEAT.nominal;
  const effective=state?effectiveOf(state):null;
  if(!effective)return base;
  const shift=(ratio(effective,'subBeatShift')-1)*INFLUENCE.subBeatShift.max;
  return clamp(base-shift,0,1);
}

// effective_distance = gap - reach contribution. Falloff grows outside the card's tolerance.
export function rangeFactor(gap,card){
  const effective=gap-(card.reachBonus??0);
  const error=Math.abs(effective-card.optimalRange);
  if(error<=card.rangeTolerance)return 1;
  const excess=(error-card.rangeTolerance)/Math.max(RANGE.max-RANGE.min,1e-9);
  return clamp(1-RANGE.maxFalloff*Math.pow(clamp(excess,0,1),1/RANGE.falloffExponent),1-RANGE.maxFalloff,1);
}

// The band boundaries themselves, for anything that needs to reason about distance in the
// same terms the player is shown. Spec: docs/design/22_combat_range_model.md section 2.
export function rangeBands(){required();return {...RANGE.bands};}

// Which side of their own body a fighter throws a given hand from. Orthodox leads with the
// left; southpaw mirrors it. The same mapping dist/fighter.js uses to resolve limb damage.
export function sideOfHand(stance,hand){
  const lead=stance==='southpaw'?'right':'left';
  return hand==='rear'?(lead==='left'?'right':'left'):lead;
}
// Facing each other, my left is their right. A side step is declared as MY movement, because
// that is what the fighter actually commits to; the opponent switching stance afterwards must
// not reach back and turn me around.
const facing=side=>side==='left'?'right':'left';

// Open guard is two fighters in opposite stances. Their lead hands meet across the line and
// lose their bite; the rear hands find a straight path home. It applies to both sides, so it
// is not an edge for either of them — it changes which punch is worth throwing. Cost is left
// alone, so a lead hand in open guard simply buys less impact for the same stamina.
function matchupFactor(attacker,defender,hand){
  if(!MATCHUP||!hand)return 1;
  const guard=attacker.stance!==defender.stance?MATCHUP.openGuard:MATCHUP.closedGuard;
  return guard?.[hand]??1;
}

export function bandOf(gap){
  const bands=Object.entries(RANGE.bands).sort((a,b)=>a[1]-b[1]);
  for(const [name,limit] of bands)if(gap<=limit)return name;
  return bands.at(-1)[0];
}

// Style Skill Cards are conditional passive traits, not timeline placements. Equipped before
// the fight, they never occupy a slot. Spec: docs/design/31_information_economy_and_placement.md.
export function styleCatalogue(){required();return STYLE.cards;}
export function styleLimit(){required();return STYLE.active_limit;}

export function resolveStyle(ids){
  required();
  const list=[...new Set(ids??[])];
  if(list.length>STYLE.active_limit)throw Error(`스타일 카드는 최대 ${STYLE.active_limit}장입니다`);
  const bundle={};
  for(const id of list){
    const card=STYLE.cards[id];
    if(!card)throw Error(`알 수 없는 스타일 카드: ${id}`);
    for(const [key,value] of Object.entries(card.effects)){
      // Multipliers compound, flat bonuses add. Two cards on one axis is already rejected by
      // the loader, so compounding cannot stack the same effect against itself.
      if(key.endsWith('Bonus'))bundle[key]=(bundle[key]??0)+value;
      else bundle[key]=(bundle[key]??1)*value;
    }
  }
  return bundle;
}

const styleOf=(state,key,fallback)=>state.style?.[key]??fallback;

export function roundOf(turn){return Math.floor((turn-1)/ROUNDS.turnsPerRound)+1;}
export function isRoundEnd(turn){return turn%ROUNDS.turnsPerRound===0;}
export function newMatch(profile='pressure',seed=17,options={}){
  required();
  if(!PROFILES[profile]) throw Error('알 수 없는 상대');
  const built=[fighter('도전자',options.player??{}),fighter(PROFILES[profile].name,options.opponent??{})];
  built[0].style=resolveStyle(options.playerStyle);
  built[1].style=resolveStyle(options.opponentStyle);
  // Without full Definition Data the engine still runs; stats simply do not participate.
  for(const x of built)if(x.stats&&DEFINITIONS)x.derived=computeDerived(x.stats,DEFINITIONS,{referenceWeight:x.stats.body.natural_weight});
  return {turn:1,seed,profile,gap:RANGE.initial,memory:DEFINITIONS?serializeMemory(createMemory(DEFINITIONS)):null,fighters:built,lastPlans:null,lastEvaded:[false,false],roundResults:[],roundBaseline:[0,0],finished:false,winner:null,method:null};
}
export function span(ids){return ids.reduce((n,id)=>n+(CARDS[id]?.duration??99),0);}
export function makePlan(ids){
  required();
  let start=0;
  const plan=ids.map(id=>{if(!CARDS[id])throw Error('알 수 없는 동작');const p={id,start};start+=CARDS[id].duration;return p;});
  if(start>RULES.slots)throw Error('콤보가 시간축을 초과했습니다');
  while(start<RULES.slots)plan.push({id:'rest',start:start++});
  return plan;
}
export function validatePlan(plan){
  required();
  let next=0;
  for(const p of plan){if(!CARDS[p.id]||p.start!==next)throw Error('잘못된 콤보 배치');next+=CARDS[p.id].duration;}
  if(next!==RULES.slots)throw Error('콤보 길이 오류');
}
// Randomness creates variation, not causation: it perturbs impact magnitude only, never
// hit/miss, block, evasion, finish or the winner. Derived from the match seed so it replays.
// Deliberately NOT keyed by actor. Two impacts landing in the same slot are the same moment
// of the same fight and share its variation. Keying by actor gave the two corners different
// rolls, so a mirror match was never exactly even and "the game value is zero" held only
// because payoffMatrix negates the upper triangle — the check could not have caught a real
// left/right asymmetry. Sharing the roll makes that antisymmetry true rather than enforced.
function impactVariance(match,tick){
  if(!VARIANCE)return 1;
  const roll=random(match.seed*7919+match.turn*131+tick*17)();
  const second=random(match.seed*104729+match.turn*31+tick*7)();
  return 1+(roll+second-1)*VARIANCE;
}

// xorshift32 is strongly correlated across nearby seeds on its first outputs: consecutive
// seeds alternated between roughly 0.94 and 0.47, so plan selection was effectively binary.
// Discarding a few outputs decorrelates the stream before anything reads it.
function random(seed){
  let x=(seed|0)||0x9e3779b9;
  const next=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
  next();next();next();
  return next;
}
// Only the match state is accepted. The current player's editable plan is never an input.
// Loads a solved mixture for one difficulty tier. Spec: docs/design/34_ai_equilibrium.md.
export function configureStrategies(document, tier){
  required();
  if(!document){STRATEGY_MIX=null;return null;}
  const spec=document.tiers?.[tier];
  if(!spec)throw Error(`전략 문서에 ${tier} 등급이 없습니다`);
  const entries=spec.mixture.filter(e=>e.weight>0);
  if(!entries.length)throw Error(`${tier} 혼합전략이 비어 있습니다`);
  for(const entry of entries)for(const id of entry.plan)if(!CARDS[id])throw Error(`전략이 사라진 카드를 참조합니다: ${id}`);
  const total=entries.reduce((n,e)=>n+e.weight,0);
  STRATEGY_MIX={tier,entries,total};
  return STRATEGY_MIX;
}

export function activeStrategy(){return STRATEGY_MIX?{tier:STRATEGY_MIX.tier,size:STRATEGY_MIX.entries.length}:null;}

export function opponentPlan(match){
  required();
  const rng=random(match.seed+match.turn*7919);
  // A solved mixture replaces the fixed patterns when one is loaded. Sampling still comes
  // from the match seed, so the plan stays reproducible and is still committed before any
  // information is revealed.
  if(STRATEGY_MIX&&!(STATUS.groggyPlanBias&&match.fighters[1].status==='groggy')&&match.fighters[1].stamina>=LOW_STAMINA.threshold){
    let roll=rng()*STRATEGY_MIX.total;
    for(const entry of STRATEGY_MIX.entries){
      roll-=entry.weight;
      if(roll<=0)return makePlan([...entry.plan]);
    }
    return makePlan([...STRATEGY_MIX.entries.at(-1).plan]);
  }
  const patterns=PATTERNS[match.profile];
  const ids=[...patterns[match.turn===1?0:Math.floor(rng()*patterns.length)]];
  // The opponent plans knowing its own carried-over state. Without this the carryover from
  // doc 30 hands over free hits; the two rules only balance together.
  if(STATUS.groggyPlanBias&&match.fighters[1].status==='groggy'){return makePlan([...LOW_STAMINA.actions]);}
  if(match.fighters[1].stamina<LOW_STAMINA.threshold){return makePlan([...LOW_STAMINA.actions]);}
  return makePlan(ids);
}
// Raw candidates for one information card. Budget and priority are applied by observe().
function candidates(plan,skill,match){
  const out=[];
  const exact=p=>({start:p.start,kind:'exact',label:CARDS[p.id].name,id:p.id});
  if(skill==='first')out.push(exact(plan[0]));
  if(skill==='heavy'){
    for(const p of plan.filter(p=>p.id==='heavy'||p.id==='feint').slice(0,2)){
      out.push({start:Math.min(RULES.slots-1,p.start+(p.id==='heavy'?CARDS.heavy.impact:1)),kind:'cue',label:'강타 예고'});
    }
  }
  if(skill==='guard')for(const p of plan.filter(p=>CARDS[p.id].kind==='guard').slice(0,2))for(let i=p.start;i<p.start+CARDS[p.id].duration;i++)out.push({start:i,kind:'zone',label:'가드 구간'});
  // Which side a hook will arrive from. A side step is a read on exactly this, and without a
  // way to make the read it is a coin flip priced like a commitment. Resolved through the
  // thrower's live stance, so switching stance invalidates the read the same way it
  // invalidates everything else built on which hand is where.
  if(skill==='hand')for(const p of plan.filter(p=>CARDS[p.id].trajectory==='hook').slice(0,2)){
    const side=sideOfHand(match.fighters[1].stance,CARDS[p.id].hand);
    out.push({start:Math.min(RULES.slots-1,p.start+CARDS[p.id].impact),kind:'cue',side,label:side==='left'?'좌측 훅':'우측 훅'});
  }
  if(skill==='pattern'&&match.lastPlans)for(const p of plan.filter(p=>match.lastPlans[1].some(old=>old.start===p.start&&old.id===p.id)).slice(0,2))out.push(exact(p));
  if(skill==='counter'&&match.lastEvaded[0]){const p=plan.find(p=>CARDS[p.id].kind==='attack');if(p)out.push(exact(p));}
  return out;
}

export function activeSkillLimit(){required();return REVEAL.activeLimit;}

// Accepts one skill id or up to activeLimit of them. Every equipped card draws on one shared
// per-turn budget, so extra cards buy trigger coverage rather than more disclosure.
// Spec: docs/design/31_information_economy_and_placement.md.
export function observe(plan,skills,match){
  required();
  const list=(Array.isArray(skills)?skills:[skills]).filter(id=>id&&id!=='none');
  for(const id of list)if(!SKILLS[id])throw Error('알 수 없는 정보 스킬');
  if(list.length>REVEAL.activeLimit)throw Error(`정보 카드는 최대 ${REVEAL.activeLimit}장입니다`);
  const pool=[];
  for(const id of new Set(list))for(const reveal of candidates(plan,id,match))pool.push({...reveal,source:id});
  // Deterministic priority: trigger specificity, then card id. An arbitrary order would leak
  // different information from the same seed.
  pool.sort((a,b)=>(SKILLS[b.source].specificity-SKILLS[a.source].specificity)
    ||a.start-b.start
    ||(a.source<b.source?-1:a.source>b.source?1:0));
  const chosen=[],seen=new Set();
  let budget=REVEAL.perTurnTotal,exactUsed=0;
  for(const reveal of pool){
    const key=`${reveal.start}:${reveal.kind}:${reveal.label}`;
    if(seen.has(key))continue;               // the same placement costs budget once, not twice
    const cost=REVEAL.cost[reveal.kind]??1;
    if(cost>budget)continue;
    if(reveal.kind==='exact'&&exactUsed>=REVEAL.maxExactPerTurn)continue;
    seen.add(key);budget-=cost;if(reveal.kind==='exact')exactUsed++;
    chosen.push(reveal);
  }
  return chosen.sort((a,b)=>a.start-b.start);
}

export function costOf(ids){return ids.reduce((n,id)=>n+CARDS[id].cost,0);}
export function resolveTurn(input,playerPlan,enemyPlan){
  required();
  validatePlan(playerPlan);validatePlan(enemyPlan);
  if(input.finished)throw Error('종료된 경기');
  const match=structuredClone(input),plans=structuredClone([playerPlan,enemyPlan]),frames=[];
  // Memory carries across combos like every other observation; a round boundary does not clear it.
  const memory=DEFINITIONS&&match.memory?restoreMemory(DEFINITIONS,match.memory):null;
  const f=match.fighters,failed=[new Set(),new Set()];
  f.forEach(x=>{x.evaded=false;});
  for(let tick=0;tick<RULES.slots;tick++){
    const events=[],active=plans.map(plan=>plan.find(p=>tick>=p.start&&tick<p.start+CARDS[p.id].duration));
    const poses=active.map(p=>({id:p.id,phase:(tick-p.start),duration:CARDS[p.id].duration,failed:false}));
    // Losing the angle is measured in the opponent's ACTIONS, not in slots. Someone turned away
    // stays turned away for what they are already committed to and one more action, then they
    // have squared back up on their own — nobody stands facing the wrong way for four slots.
    // Counting slots charged a jab and a four-slot shell the same exposure, which is backwards:
    // the long commitment is exactly the one that should cost more. This runs before any grant
    // in the same tick, so a fresh grant restores the full window.
    if(ANGLE)for(let i=0;i<2;i++)if(active[i].start===tick&&f[i].offAngleCards>0)f[i].offAngleCards--;
    for(let i=0;i<2;i++){
      const p=active[i],c=CARDS[p.id];
      if(p.start===tick){
        if(f[i].stamina<c.cost){failed[i].add(p.start);events.push({type:'exhausted',actor:i,card:p.id});}
        else{
          // Working while gassed costs more than the stamina it takes: it lowers what you can
          // ever recover to. Read before the cost is paid — the fighter was already gassed when
          // they committed to the card.
          const gassed=CEILING&&c.kind==='attack'&&f[i].stamina<f[i].staminaCap*CEILING.lowThreshold;
          const closing=(c.rangeShift??0)<0?styleOf(f[i],'closingCostMultiplier',1):1;
          f[i].stamina=round(f[i].stamina-c.cost*closing);
          if(gassed)lowerCeiling(f[i],CEILING.attackLoss,events,i);
        }
      }
      poses[i].failed=failed[i].has(p.start);
      // Stepping around someone who is merely breathing gains nothing — they would turn with
      // you. The angle is only earned against an opponent committed to a guard, or to an
      // attack the step slips (handled where the evade resolves).
      if(ANGLE&&CARDS[p.id].grantsAngle&&!poses[i].failed&&CARDS[active[1-i].id].kind==='guard'&&!poses[1-i].failed){
        f[1-i].offAngleCards=Math.max(f[1-i].offAngleCards,ANGLE.actions);
      }
      if(p.start===tick&&!poses[i].failed)match.gap=roundGap(clamp(match.gap+(c.rangeShift??0),RANGE.min,RANGE.max));
      if(c.kind==='rest'){f[i].stamina=round(clamp(f[i].stamina+RULES.restRecovery*(1-f[i].damage.body/200),0,f[i].staminaCap));events.push({type:'rest',actor:i});}
      // Switching stance changes nothing about the card's own numbers and everything about what
      // the fighter's hands mean afterwards: the lead hook now comes from the other side.
      if(c.kind==='stance'&&p.start===tick&&!poses[i].failed){
        f[i].stance=f[i].stance==='southpaw'?'orthodox':'southpaw';
        events.push({type:'stance',actor:i,stance:f[i].stance});
      }
    }
    for(let i=0;i<2;i++){
      const p=active[i],other=CARDS[active[1-i].id];
      if(CARDS[p.id].kind==='feint'&&p.start===tick&&!poses[i].failed){
        const baited=['guard','evade'].includes(other.kind)&&!poses[1-i].failed;
        if(baited)f[1-i].openUntil=tick+2;
        events.push({type:'feint',actor:i,target:1-i,success:baited});
      }
    }
    // Compute both attacks against one snapshot, then apply together (double KO is possible).
    const before=structuredClone(f),effects=[];
    for(let i=0;i<2;i++){
      const p=active[i],c=CARDS[p.id],j=1-i,dc=CARDS[active[j].id];
      if(c.kind!=='attack'||tick!==p.start+c.impact||poses[i].failed)continue;
      const isOpen=before[j].openUntil>=tick;
      const impaired=before[j].status==='groggy'&&before[j].statusUntil>=tick;
      const defenderReady=ratio(effectiveOf(before[j]),'evasion')>=INFLUENCE.evasion.failThreshold;
      // A side step beats the hook thrown from the hand you stepped AWAY from; the one you
      // stepped INTO wraps round with you and is not evaded at all. Choosing the side is the
      // read the card asks for, so a side step is never a free answer to every hook.
      // Expressed in physical sides, not in lead/rear: the opponent's left arm stays their left
      // arm through a stance switch, so a step already committed keeps pointing where it was
      // aimed. What a switch changes is which HAND now comes from that side, which is exactly
      // what switching is for.
      const steppedIntoHand=!!(dc.stepToward&&c.trajectory==='hook'
        &&sideOfHand(before[i].stance,c.hand)===facing(dc.stepToward));
      const dodged=!poses[j].failed&&!isOpen&&!impaired&&defenderReady&&dc.kind==='evade'&&dc.dodges.includes(c.trajectory)&&!steppedIntoHand;
      if(dodged){effects.push({type:'evade',actor:j,target:i});continue;}
      const guarding=!poses[j].failed&&!isOpen&&dc.kind==='guard'&&dc.protect===c.target;
      const blocked=guarding&&before[j].stamina>=RULES.guardDrain;
      const counter=before[i].counterUntil>=tick;
      const recovery=dc.kind==='attack'&&tick>active[j].start+dc.impact;
      const mismatch=dc.kind==='evade'&&!dodged;
      // Punished only for the hand actually stepped into. A fighter who simply could not step
      // — staggered, baited, out of position — takes the ordinary mistimed-evasion penalty.
      const steppedInto=ANGLE&&dc.grantsAngle&&!dodged&&steppedIntoHand;
      const attackerOffAngle=ANGLE&&before[i].offAngleCards>0;
      const defenderOffAngle=ANGLE&&before[j].offAngleCards>0;
      const styleReach=styleOf(before[i],'reachBonus',0);
      const reach=rangeFactor(match.gap,styleReach?{...c,reachBonus:(c.reachBonus??0)+styleReach}:c);
      const band=bandOf(match.gap);
      const bandBoost=band==='clinch'||band==='inside'?styleOf(before[i],'insideImpactMultiplier',1)
        :band==='outside'?styleOf(before[i],'outsideImpactMultiplier',1):1;
      const attackerEffective=effectiveOf(before[i]),defenderEffective=effectiveOf(before[j]);
      const setup=memory?setupModifier(memory,j,active[i].start,p.id,before[j].stats?before[j].stats.base.fight_iq:60):{factor:1,read:false,broken:false,confidence:0};
      const staminaFactor=MODIFIERS.staminaFloor+(1-MODIFIERS.staminaFloor)*before[i].stamina/RULES.maxStamina;
      // staminaFloor weakens what you throw; this deepens what you take. Both read absolute
      // stamina, so a ceiling that has fallen compounds through here without extra rules.
      const gassedTarget=1+(MODIFIERS.staminaVulnerability??0)*(1-clamp(before[j].stamina,0,RULES.maxStamina)/RULES.maxStamina);
      let power=c.power*staminaFactor*gassedTarget*matchupFactor(before[i],before[j],c.hand)*(counter?MODIFIERS.counter*styleOf(before[i],'counterMultiplier',1):1)*(isOpen||recovery||mismatch?MODIFIERS.exposed:1)*reach
        *ratio(attackerEffective,'impact')*setup.factor*bandBoost*(attackerOffAngle?ANGLE.attackPenalty:1)*(defenderOffAngle?ANGLE.incomingBonus:1)*(steppedInto?ANGLE.hookPunish:1)*impactVariance(match,tick);
      if(blocked)power/=Math.max(ratio(defenderEffective,'guard'),0.2);
      // A long guard covers more time but is a coarser block, so it leaks more per hit.
      // Without this the only question is whether the guard can be paid for, which makes
      // shelling either total immunity or instant death rather than a trade.
      // A guard covers a direction. Someone who has lost the angle is holding that guard
      // where the punches are no longer coming from, so it leaks far more — this is what
      // "stepping around a guard finds the opening" has to mean mechanically. Without it the
      // angle was only a damage multiplier and a shelled opponent blocked every punch anyway.
      const guardLeak=blocked&&defenderOffAngle?(ANGLE?.guardLeak??1):1;
      if(blocked)power*=((dc.blockLeak??MODIFIERS.blockLeak)*styleOf(before[j],'blockLeakMultiplier',1)*guardLeak)+before[j].damage.arms/MODIFIERS.blockArmScaling;
      if(impaired)power*=1+STATUS.groggyDefensePenalty;
      if(c.target==='head')power*=styleOf(before[j],'incomingHeadMultiplier',1);
      effects.push({type:blocked?'block':'hit',actor:i,target:j,power:round(power),targetPart:c.target,counter,guardBreak:guarding&&!blocked,setup:isOpen,offAngle:!!defenderOffAngle,steppedInto:!!steppedInto,read:setup.read,patternBreak:setup.broken,readConfidence:round(setup.confidence),recovery,at:impactPosition(c,before[i]),reach:round(reach)});
    }
    // Impacts within the tolerance share the snapshot and apply together, so a double KO stays
    // reachable. A strictly earlier one applies first and weakens the later, never erases it.
    effects.sort((a,b)=>(a.at??SUBBEAT.nominal)-(b.at??SUBBEAT.nominal));
    const struckAt={};
    for(const e of effects){
      if(e.type!=='evade'&&typeof e.at==='number'){
        const earlier=struckAt[e.actor];
        if(typeof earlier==='number'&&e.at-earlier>SUBBEAT.tolerance){
          const level=f[e.actor].status;
          if(level==='groggy')e.power=round(e.power*FIRST_STRIKE.groggyWeakensLater);
          else if(level==='stagger')e.power=round(e.power*FIRST_STRIKE.staggerWeakensLater);
        }
      }
      if(e.type==='evade'){
        f[e.actor].counterUntil=tick+RULES.counterWindow+styleOf(f[e.actor],'counterWindowBonus',0);f[e.actor].evaded=true;f[e.actor].score+=MODIFIERS.evadeScore;
        // An attack that the step slipped is commitment by definition, so the angle is earned.
        if(ANGLE&&CARDS[active[e.actor].id].grantsAngle){
          f[e.target].offAngleCards=Math.max(f[e.target].offAngleCards,ANGLE.actions);
        }
        events.push({...e});continue;
      }
      const d=f[e.target];
      // Score follows the damage actually applied, not the damage attempted. Hitting a part
      // that is already maxed out must not keep paying, or attacking one saturated target
      // becomes a free win on the cards.
      const beforeDamage=d.damage[e.targetPart];
      d.damage[e.targetPart]=round(clamp(beforeDamage+e.power,0,RULES.maxPartDamage));
      const applied=round(d.damage[e.targetPart]-beforeDamage);
      if(e.type==='block'){d.stamina=round(Math.max(0,d.stamina-RULES.guardDrain));d.damage.arms=round(clamp(d.damage.arms+applied*MODIFIERS.armDamageRatio*styleOf(d,'armDamageMultiplier',1),0,100));d.score+=MODIFIERS.blockScore;}
      else{f[e.actor].score+=applied*(MODIFIERS.scoreByTarget[e.targetPart]??1);if(e.targetPart==='body'){d.stamina=round(Math.max(0,d.stamina-applied*MODIFIERS.bodyStaminaDrain*styleOf(f[e.actor],'bodyStaminaDrainMultiplier',1)));
        // Body damage takes the ceiling with it, so neglecting body defence is not a debt you
        // can breathe off between rounds.
        if(CEILING)lowerCeiling(d,applied*CEILING.bodyHitLoss,events,e.target);}}
      if(e.counter)f[e.actor].counterUntil=-1;
      if(e.setup)d.openUntil=-1;
      struckAt[e.target]=e.at;
      events.push({...e,card:active[e.actor].id});
      // Body work can finish a fight, which is what makes guarding the body worth a slot.
      // The threshold is higher than the head's, so the head remains the primary threat.
      if(e.type==='hit'&&e.targetPart==='body'&&d.damage.body>=RULES.bodyKoDamage&&d.stamina<=RULES.bodyKoStamina&&e.power>=RULES.bodyKoImpact*styleOf(d,'staggerResistance',1)){d.ko=true;}
      if(e.type==='hit'&&e.targetPart==='head'){
        if(d.damage.head>=RULES.koDamage||(d.damage.head>=RULES.staggerDamage&&e.power>=RULES.staggerImpact)){d.ko=true;}
        else if(e.power>=RULES.staggerImpact*styleOf(d,'staggerResistance',1)){d.status='groggy';d.statusUntil=tick+STATUS.groggyRecoverySlots;events.push({type:'status',actor:e.target,level:'groggy'});}
        else if(e.power>=RULES.staggerImpact*STATUS.staggerRatio*styleOf(d,'staggerResistance',1)){d.status='stagger';d.statusUntil=tick+STATUS.staggerRecoverySlots;events.push({type:'status',actor:e.target,level:'stagger'});}
      }
    }
    if(f.some(x=>x.ko)){
      match.finished=true;match.winner=f[0].ko&&f[1].ko?null:f[0].ko?1:0;match.method=match.winner===null?'동시 KO':'KO';
      events.push({type:'finish',winner:match.winner,method:match.method});
    }
    frames.push({tick,poses,events,fighters:structuredClone(f),finished:match.finished});
    if(match.finished)break;
  }
  if(memory){recordPlan(memory,0,plans[1],match.turn);recordPlan(memory,1,plans[0],match.turn);match.memory=serializeMemory(memory);}
  match.lastPlans=plans;match.lastEvaded=f.map(x=>x.evaded);
  if(!match.finished){
    const roundEnd=isRoundEnd(match.turn);
    if(roundEnd){
      // Judge metrics accumulate per turn and aggregate per round; the match decision is the
      // sum of round results, never a separately recomputed summary. Spec: docs/design/23 section 5.
      const margin=round(f[0].score-(match.roundBaseline?.[0]??0)-(f[1].score-(match.roundBaseline?.[1]??0)));
      match.roundResults.push({round:roundOf(match.turn),margin,winner:Math.abs(margin)<1?null:margin>0?0:1});
      match.roundBaseline=[f[0].score,f[1].score];
      match.gap=RANGE.initial;
      endRound(f);
    } else {
      f.forEach(x=>{
        x.counterUntil=carryTick(x.counterUntil);x.openUntil=carryTick(x.openUntil);
        x.statusUntil=carryTick(x.statusUntil);
        if(x.statusUntil<0)x.status='normal';
        x.stamina=round(clamp(x.stamina+RULES.betweenRecovery,0,x.staminaCap));
      });
    }
  }
  if(!match.finished&&match.turn>=RULES.maxTurns){
    match.finished=true;
    const won=match.roundResults.reduce((n,r)=>n+(r.winner===0?1:r.winner===1?-1:0),0);
    match.winner=won===0?null:won>0?0:1;match.method='판정';
  }
  if(!match.finished)match.turn++;
  return {match,frames,plans};
}
