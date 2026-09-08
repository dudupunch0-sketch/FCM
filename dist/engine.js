// Pure combat rules. No DOM, animation clock, storage, or player-draft access.
export const RULES = Object.freeze({slots:8,maxTurns:12,maxStamina:100,betweenRecovery:6,restRecovery:11,counterWindow:2,guardDrain:3,koDamage:90,staggerDamage:55,staggerImpact:16});
export const CARDS = Object.freeze({
  jab:{name:'잽',short:'잽',kind:'attack',duration:1,impact:0,cost:7,power:8,target:'head',trajectory:'straight',description:'빠른 머리 공격. 빈틈을 찌르세요.'},
  cross:{name:'크로스',short:'크로스',kind:'attack',duration:2,impact:1,cost:13,power:19,target:'head',trajectory:'straight',description:'다음 박자에 타격. 회피 직후 카운터에 적합.'},
  hook:{name:'훅',short:'훅',kind:'attack',duration:2,impact:1,cost:14,power:20,target:'head',trajectory:'hook',description:'스웨이를 잡는 곡선 공격. 위빙에는 빗나갑니다.'},
  body:{name:'바디 훅',short:'바디',kind:'attack',duration:2,impact:1,cost:12,power:16,target:'body',trajectory:'body',description:'상단 가드와 머리 회피를 공략. 상대 체력을 소모시킵니다.'},
  heavy:{name:'오버핸드',short:'강타',kind:'attack',duration:3,impact:1,cost:22,power:28,target:'head',trajectory:'hook',description:'큰 머리 충격. 타격 뒤 회수 중에는 취약합니다.'},
  guard:{name:'순간 가드',short:'가드',kind:'guard',duration:1,cost:2,protect:'head',description:'한 박자 머리 방어. 바디 공격은 막지 못합니다.'},
  shell:{name:'상단 가드',short:'상단 가드',kind:'guard',duration:4,cost:6,protect:'head',description:'오래 머리를 보호하지만 팔에 충격이 쌓입니다.'},
  lowguard:{name:'바디 가드',short:'바디 가드',kind:'guard',duration:2,cost:3,protect:'body',description:'몸통 방어. 상대 머리 공격에는 노출됩니다.'},
  sway:{name:'스웨이',short:'스웨이',kind:'evade',duration:1,cost:5,dodges:['straight'],description:'직선 머리 공격 회피. 성공하면 짧은 카운터 기회.'},
  weave:{name:'위빙',short:'위빙',kind:'evade',duration:2,cost:8,dodges:['hook'],description:'훅과 오버핸드 회피. 직선·몸통 공격에 주의.'},
  feint:{name:'페이크',short:'페이크',kind:'feint',duration:1,cost:4,description:'상대가 방어 중이면 다음 공격에 빈틈을 만듭니다.'},
  rest:{name:'호흡 정리',short:'호흡',kind:'rest',duration:1,cost:0,description:'스태미너 회복. 방어 효과는 없습니다.'}
});
export const SKILLS = Object.freeze({
  first:{name:'초반 간파',description:'첫 동작의 카드명과 시작 위치를 확정 공개합니다.'},
  heavy:{name:'강타 감지',description:'강공격처럼 보이는 타격 박자를 예고합니다. 페이크에 속을 수 있습니다.'},
  guard:{name:'수비 분석',description:'가드 구간만 확정 공개합니다. 보호 부위는 숨깁니다.'},
  pattern:{name:'패턴 독해',description:'직전 콤보와 같은 위치에 반복되는 동작을 최대 두 개 공개합니다.'},
  counter:{name:'카운터 본능',description:'직전 교환에서 실제 회피에 성공하면 다음 공격 하나를 공개합니다.'},
  none:{name:'정보 카드 없음',description:'지난 콤보와 상대 습관만으로 예측합니다.'}
});
export const PROFILES = Object.freeze({
  pressure:{name:'빅터 · 압박형',trait:'잽으로 시작한 뒤 강하게 밀어붙입니다. 가끔 첫 동작을 바꿉니다.'},
  tricky:{name:'레온 · 교란형',trait:'페이크와 몸통 공격을 섞습니다. 상단 가드에만 의존하지 마세요.'},
  turtle:{name:'이반 · 수비형',trait:'긴 가드 뒤에 반격합니다. 페이크와 몸통 공격으로 틈을 만드세요.'}
});
export function fighter(name){return {name,stamina:100,damage:{head:0,body:0,arms:0},score:0,counterUntil:-1,openUntil:-1,evaded:false,ko:false};}
export function newMatch(profile='pressure',seed=17){
  if(!PROFILES[profile]) throw Error('알 수 없는 상대');
  return {turn:1,seed,profile,fighters:[fighter('도전자'),fighter(PROFILES[profile].name)],lastPlans:null,lastEvaded:[false,false],finished:false,winner:null,method:null};
}
export function span(ids){return ids.reduce((n,id)=>n+(CARDS[id]?.duration??99),0);}
export function makePlan(ids){
  let start=0;
  const plan=ids.map(id=>{if(!CARDS[id])throw Error('알 수 없는 동작');const p={id,start};start+=CARDS[id].duration;return p;});
  if(start>RULES.slots)throw Error('콤보가 시간축을 초과했습니다');
  while(start<RULES.slots)plan.push({id:'rest',start:start++});
  return plan;
}
export function validatePlan(plan){
  let next=0;
  for(const p of plan){if(!CARDS[p.id]||p.start!==next)throw Error('잘못된 콤보 배치');next+=CARDS[p.id].duration;}
  if(next!==RULES.slots)throw Error('콤보 길이 오류');
}
function random(seed){let x=seed|0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
const PATTERNS={
  pressure:[['jab','cross','hook','jab','rest','rest'],['jab','heavy','cross','rest','rest'],['feint','cross','body','jab','rest','rest'],['jab','jab','hook','body','rest','rest']],
  tricky:[['feint','body','hook','sway','rest','rest'],['jab','weave','cross','body','rest'],['body','feint','heavy','rest','rest'],['feint','cross','body','sway','rest','rest']],
  turtle:[['shell','cross','rest','rest'],['lowguard','hook','guard','cross','rest'],['shell','body','rest','rest'],['guard','weave','heavy','rest','rest']]
};
// Only the match state is accepted. The current player's editable plan is never an input.
export function opponentPlan(match){
  const rng=random(match.seed+match.turn*7919);
  const patterns=PATTERNS[match.profile];
  const ids=[...patterns[match.turn===1?0:Math.floor(rng()*patterns.length)]];
  if(match.fighters[1].stamina<30){return makePlan(['guard','rest','rest','body','rest','rest','rest']);}
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
const round=x=>Math.round(x*10)/10;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function resolveTurn(input,playerPlan,enemyPlan){
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
      const dodged=!poses[j].failed&&!isOpen&&dc.kind==='evade'&&dc.dodges.includes(c.trajectory);
      if(dodged){effects.push({type:'evade',actor:j,target:i});continue;}
      const guarding=!poses[j].failed&&!isOpen&&dc.kind==='guard'&&dc.protect===c.target;
      const blocked=guarding&&before[j].stamina>=RULES.guardDrain;
      const counter=before[i].counterUntil>=tick;
      const recovery=dc.kind==='attack'&&tick>active[j].start+dc.impact;
      const mismatch=dc.kind==='evade'&&!dodged;
      let power=c.power*(0.5+0.5*before[i].stamina/100)*(counter?1.4:1)*(isOpen||recovery||mismatch?1.2:1);
      if(blocked)power*=0.18+before[j].damage.arms/500;
      effects.push({type:blocked?'block':'hit',actor:i,target:j,power:round(power),targetPart:c.target,counter,guardBreak:guarding&&!blocked,setup:isOpen,recovery});
    }
    for(const e of effects){
      if(e.type==='evade'){
        f[e.actor].counterUntil=tick+RULES.counterWindow;f[e.actor].evaded=true;f[e.actor].score+=2;
        events.push({...e,text:`${f[e.actor].name}: 회피 성공 · 카운터 기회`});continue;
      }
      const d=f[e.target];d.damage[e.targetPart]=round(clamp(d.damage[e.targetPart]+e.power,0,120));
      if(e.type==='block'){d.stamina=round(Math.max(0,d.stamina-RULES.guardDrain));d.damage.arms=round(clamp(d.damage.arms+e.power*1.5,0,100));d.score+=1;}
      else{f[e.actor].score+=e.power;if(e.targetPart==='body')d.stamina=round(Math.max(0,d.stamina-e.power*0.6));}
      if(e.counter)f[e.actor].counterUntil=-1;
      if(e.setup)d.openUntil=-1;
      events.push({...e,text:`${f[e.actor].name}: ${e.counter?'카운터! ':''}${CARDS[active[e.actor].id].name} → ${e.type==='block'?'블록':e.guardBreak?'가드 붕괴':e.setup?'페이크 연계':'명중'} · ${e.power}`});
      if(e.type==='hit'&&e.targetPart==='head'&&(d.damage.head>=RULES.koDamage||(d.damage.head>=RULES.staggerDamage&&e.power>=RULES.staggerImpact))){d.ko=true;}
    }
    if(f.some(x=>x.ko)){
      match.finished=true;match.winner=f[0].ko&&f[1].ko?null:f[0].ko?1:0;match.method=match.winner===null?'동시 KO':'KO';
      events.push({type:'finish',text:match.winner===null?'동시 KO · 무승부':`${f[match.winner].name} KO 승리`});
    }
    frames.push({tick,poses,events,fighters:structuredClone(f),finished:match.finished});
    if(match.finished)break;
  }
  match.lastPlans=plans;match.lastEvaded=f.map(x=>x.evaded);
  f.forEach(x=>{x.counterUntil=-1;x.openUntil=-1;if(!match.finished)x.stamina=round(clamp(x.stamina+RULES.betweenRecovery,0,100));});
  if(!match.finished&&match.turn>=RULES.maxTurns){match.finished=true;const diff=f[0].score-f[1].score;match.winner=Math.abs(diff)<1?null:diff>0?0:1;match.method='판정';}
  if(!match.finished)match.turn++;
  return {match,frames,plans};
}
