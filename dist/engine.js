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
let FIRST_STRIKE = null;

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
  ROUNDS = cfg.rounds;
  STATUS = cfg.status;
  INTERVAL = cfg.intervalRecovery;
  SUBBEAT = cfg.subBeat;
  RANGE = cfg.range;
  FIRST_STRIKE = cfg.firstStrike;
  return { RULES, CARDS, SKILLS, PROFILES };
}

export function fighter(name){return {name,stamina:100,damage:{head:0,body:0,arms:0},score:0,counterUntil:-1,openUntil:-1,statusUntil:-1,status:'normal',evaded:false,ko:false};}

const round=x=>Math.round(x*10)/10;
// Distance needs finer precision than resources: a single card shift can be smaller than
// the 0.1 step, and rounding each application away would make small movement vanish.
const roundGap=x=>Math.round(x*100)/100;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// A combo boundary is uninterrupted action, so short-lived effects are not truncated by it:
// a window opened at slot 7 continues into the next combo. Spec: docs/design/30 section 2.
const carryTick=v=>v>=RULES.slots?v-RULES.slots:-1;

// A round boundary is real rest. Windows expire and stamina partially recovers, never fully.
function endRound(f){
  for(const x of f){
    x.counterUntil=-1;x.openUntil=-1;x.statusUntil=-1;x.status='normal';
    // The cap limits how far recovery can take you, it does not drag a healthier fighter down.
    const recovered=x.stamina+RULES.maxStamina*INTERVAL.fraction*(1-x.damage.body/200);
    x.stamina=round(clamp(Math.max(x.stamina,Math.min(recovered,INTERVAL.cap)),0,RULES.maxStamina));
  }
}

// Impact position inside a slot. Priority falls out of timing rather than a separate rule.
export function impactPosition(card){return card.subBeat??SUBBEAT.nominal;}

// effective_distance = gap - reach contribution. Falloff grows outside the card's tolerance.
export function rangeFactor(gap,card){
  const effective=gap-(card.reachBonus??0);
  const error=Math.abs(effective-card.optimalRange);
  if(error<=card.rangeTolerance)return 1;
  const excess=(error-card.rangeTolerance)/Math.max(RANGE.max-RANGE.min,1e-9);
  return clamp(1-RANGE.maxFalloff*Math.pow(clamp(excess,0,1),1/RANGE.falloffExponent),1-RANGE.maxFalloff,1);
}

export function bandOf(gap){
  const bands=Object.entries(RANGE.bands).sort((a,b)=>a[1]-b[1]);
  for(const [name,limit] of bands)if(gap<=limit)return name;
  return bands.at(-1)[0];
}

export function roundOf(turn){return Math.floor((turn-1)/ROUNDS.turnsPerRound)+1;}
export function isRoundEnd(turn){return turn%ROUNDS.turnsPerRound===0;}
export function newMatch(profile='pressure',seed=17){
  required();
  if(!PROFILES[profile]) throw Error('알 수 없는 상대');
  return {turn:1,seed,profile,gap:RANGE.initial,fighters:[fighter('도전자'),fighter(PROFILES[profile].name)],lastPlans:null,lastEvaded:[false,false],roundResults:[],roundBaseline:[0,0],finished:false,winner:null,method:null};
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
function random(seed){let x=seed|0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
// Only the match state is accepted. The current player's editable plan is never an input.
export function opponentPlan(match){
  required();
  const rng=random(match.seed+match.turn*7919);
  const patterns=PATTERNS[match.profile];
  const ids=[...patterns[match.turn===1?0:Math.floor(rng()*patterns.length)]];
  // The opponent plans knowing its own carried-over state. Without this the carryover from
  // doc 30 hands over free hits; the two rules only balance together.
  if(STATUS.groggyPlanBias&&match.fighters[1].status==='groggy'){return makePlan([...LOW_STAMINA.actions]);}
  if(match.fighters[1].stamina<LOW_STAMINA.threshold){return makePlan([...LOW_STAMINA.actions]);}
  return makePlan(ids);
}
export function observe(plan,skill,match){
  const reveals=[];
  const exact=p=>({start:p.start,kind:'exact',label:CARDS[p.id].name,id:p.id});
  if(skill==='first')reveals.push(exact(plan[0]));
  if(skill==='heavy'){
    const candidates=plan.filter(p=>p.id==='heavy'||p.id==='feint').slice(0,2);
    for(const p of candidates)reveals.push({start:Math.min(7,p.start+(p.id==='heavy'?CARDS.heavy.impact:1)),kind:'cue',label:'강타 예고'});
  }
  if(skill==='guard')for(const p of plan.filter(p=>CARDS[p.id].kind==='guard').slice(0,2))for(let i=p.start;i<p.start+CARDS[p.id].duration;i++)reveals.push({start:i,kind:'zone',label:'가드 구간'});
  if(skill==='pattern'&&match.lastPlans)for(const p of plan.filter(p=>match.lastPlans[1].some(old=>old.start===p.start&&old.id===p.id)).slice(0,2))reveals.push(exact(p));
  if(skill==='counter'&&match.lastEvaded[0]){const p=plan.find(p=>CARDS[p.id].kind==='attack');if(p)reveals.push(exact(p));}
  return reveals;
}
export function costOf(ids){return ids.reduce((n,id)=>n+CARDS[id].cost,0);}
export function resolveTurn(input,playerPlan,enemyPlan){
  required();
  validatePlan(playerPlan);validatePlan(enemyPlan);
  if(input.finished)throw Error('종료된 경기');
  const match=structuredClone(input),plans=structuredClone([playerPlan,enemyPlan]),frames=[];
  const f=match.fighters,failed=[new Set(),new Set()];
  f.forEach(x=>{x.evaded=false;x.counterUntil=-1;x.openUntil=-1;});
  for(let tick=0;tick<RULES.slots;tick++){
    const events=[],active=plans.map(plan=>plan.find(p=>tick>=p.start&&tick<p.start+CARDS[p.id].duration));
    const poses=active.map(p=>({id:p.id,phase:(tick-p.start),duration:CARDS[p.id].duration,failed:false}));
    for(let i=0;i<2;i++){
      const p=active[i],c=CARDS[p.id];
      if(p.start===tick){
        if(f[i].stamina<c.cost){failed[i].add(p.start);events.push({type:'exhausted',actor:i,text:`${f[i].name}: 스태미너 부족 · ${c.name} 실패`});}
        else f[i].stamina=round(f[i].stamina-c.cost);
      }
      poses[i].failed=failed[i].has(p.start);
      if(p.start===tick&&!poses[i].failed)match.gap=roundGap(clamp(match.gap+(c.rangeShift??0),RANGE.min,RANGE.max));
      if(c.kind==='rest'){f[i].stamina=round(clamp(f[i].stamina+RULES.restRecovery*(1-f[i].damage.body/200),0,100));events.push({type:'rest',actor:i,text:`${f[i].name}: 호흡 정리`});}
    }
    for(let i=0;i<2;i++){
      const p=active[i],other=CARDS[active[1-i].id];
      if(CARDS[p.id].kind==='feint'&&p.start===tick&&!poses[i].failed){
        const baited=['guard','evade'].includes(other.kind)&&!poses[1-i].failed;
        if(baited)f[1-i].openUntil=tick+2;
        events.push({type:'feint',actor:i,target:1-i,success:baited,text:`${f[i].name}: 페이크 ${baited?'성공 · 방어에 빈틈':'무반응'}`});
      }
    }
    // Compute both attacks against one snapshot, then apply together (double KO is possible).
    const before=structuredClone(f),effects=[];
    for(let i=0;i<2;i++){
      const p=active[i],c=CARDS[p.id],j=1-i,dc=CARDS[active[j].id];
      if(c.kind!=='attack'||tick!==p.start+c.impact||poses[i].failed)continue;
      const isOpen=before[j].openUntil>=tick;
      const impaired=before[j].status==='groggy'&&before[j].statusUntil>=tick;
      const dodged=!poses[j].failed&&!isOpen&&!impaired&&dc.kind==='evade'&&dc.dodges.includes(c.trajectory);
      if(dodged){effects.push({type:'evade',actor:j,target:i});continue;}
      const guarding=!poses[j].failed&&!isOpen&&dc.kind==='guard'&&dc.protect===c.target;
      const blocked=guarding&&before[j].stamina>=RULES.guardDrain;
      const counter=before[i].counterUntil>=tick;
      const recovery=dc.kind==='attack'&&tick>active[j].start+dc.impact;
      const mismatch=dc.kind==='evade'&&!dodged;
      const reach=rangeFactor(match.gap,c);
      let power=c.power*(0.5+0.5*before[i].stamina/100)*(counter?1.4:1)*(isOpen||recovery||mismatch?1.2:1)*reach;
      if(blocked)power*=0.18+before[j].damage.arms/500;
      if(impaired)power*=1+STATUS.groggyDefensePenalty;
      effects.push({type:blocked?'block':'hit',actor:i,target:j,power:round(power),targetPart:c.target,counter,guardBreak:guarding&&!blocked,setup:isOpen,recovery,at:impactPosition(c),reach:round(reach)});
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
        f[e.actor].counterUntil=tick+RULES.counterWindow;f[e.actor].evaded=true;f[e.actor].score+=2;
        events.push({...e,text:`${f[e.actor].name}: 회피 성공 · 카운터 기회`});continue;
      }
      const d=f[e.target];d.damage[e.targetPart]=round(clamp(d.damage[e.targetPart]+e.power,0,120));
      if(e.type==='block'){d.stamina=round(Math.max(0,d.stamina-RULES.guardDrain));d.damage.arms=round(clamp(d.damage.arms+e.power*1.5,0,100));d.score+=1;}
      else{f[e.actor].score+=e.power;if(e.targetPart==='body')d.stamina=round(Math.max(0,d.stamina-e.power*0.6));}
      if(e.counter)f[e.actor].counterUntil=-1;
      if(e.setup)d.openUntil=-1;
      struckAt[e.target]=e.at;
      events.push({...e,text:`${f[e.actor].name}: ${e.counter?'카운터! ':''}${CARDS[active[e.actor].id].name} → ${e.type==='block'?'블록':e.guardBreak?'가드 붕괴':e.setup?'페이크 연계':'명중'} · ${e.power}`});
      if(e.type==='hit'&&e.targetPart==='head'){
        if(d.damage.head>=RULES.koDamage||(d.damage.head>=RULES.staggerDamage&&e.power>=RULES.staggerImpact)){d.ko=true;}
        else if(e.power>=RULES.staggerImpact){d.status='groggy';d.statusUntil=tick+STATUS.groggyRecoverySlots;events.push({type:'status',actor:e.target,level:'groggy',text:`${d.name}: 그로기`});}
        else if(e.power>=RULES.staggerImpact*STATUS.staggerRatio){d.status='stagger';d.statusUntil=tick+STATUS.staggerRecoverySlots;events.push({type:'status',actor:e.target,level:'stagger',text:`${d.name}: 휘청임`});}
      }
    }
    if(f.some(x=>x.ko)){
      match.finished=true;match.winner=f[0].ko&&f[1].ko?null:f[0].ko?1:0;match.method=match.winner===null?'동시 KO':'KO';
      events.push({type:'finish',text:match.winner===null?'동시 KO · 무승부':`${f[match.winner].name} KO 승리`});
    }
    frames.push({tick,poses,events,fighters:structuredClone(f),finished:match.finished});
    if(match.finished)break;
  }
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
        x.stamina=round(clamp(x.stamina+RULES.betweenRecovery,0,RULES.maxStamina));
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
