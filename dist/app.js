import {CARDS,SKILLS,PROFILES,RULES,newMatch,makePlan,span,opponentPlan,observe,resolveTurn} from './engine.js';
import {createRing} from './ring.js';
import {advancePlayback} from './motion.js';
import {editDraft,forecast} from './planner.js';
const $=id=>document.getElementById(id);
const ring=await createRing($('ring'));
let match=newMatch(),enemyPlan=null,draft=[],skill='first',mode='planning',last=null,play=null,speed=2,sound=false,audio=null,seed=17,lastLogged=-1,selected=-1,undoStack=[],category='attack';
const keys=['1','2','3','4','5','6','7','8','9','0','-','='];
const presets={counter:['sway','cross','weave','jab','rest','rest'],pressure:['jab','cross','jab','hook','rest','rest'],body:['feint','body','jab','body','rest','rest']};
const dialogs=['menu','help','cardsInfo'];
const canEdit=()=>mode==='planning'&&!match.finished;
function notice(text,warning=false){$('notice').textContent=text;$('notice').classList.toggle('warning',warning);}
function hud(fighters){fighters.forEach((f,i)=>{$(i?'enemyHud':'playerHud').innerHTML=`<div class="fighter-name"><span>${f.name.split(' · ')[0]}</span><small>기력 ${Math.round(f.stamina)}</small></div><div class="stamina" role="meter" aria-label="${f.name} 스태미너" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(f.stamina)}"><div style="width:${f.stamina}%"></div></div><div class="damage-line"><span>머리 <b>${Math.round(f.damage.head)}</b></span><span>몸통 <b>${Math.round(f.damage.body)}</b></span><span>팔 <b>${Math.round(f.damage.arms)}</b></span></div>`;});}
function renderIntel(reveals=[]){
  $('intel').innerHTML=Array.from({length:RULES.slots},(_,i)=>{const r=reveals.find(r=>r.start===i),label=r?(r.id?CARDS[r.id].short:r.kind==='cue'?'강타?':r.kind==='zone'?'가드':r.label):'?';return `<div class="slot ${r?.kind??''}" data-beat="${i}" aria-label="${i+1}박 ${r?(r.kind==='cue'?'추정 ':'확정 ')+r.label:'미공개'}"><span class="${r?'intel-label':'unknown'}">${label}</span></div>`;}).join('');
}
function updateIntel(){renderIntel(enemyPlan?observe(enemyPlan,skill,match):[]);$('skillTag').textContent=SKILLS[skill].name+' ⓘ';$('intelHint').textContent=SKILLS[skill].description+' 실선은 확정, 점선은 추정입니다. 상대 계획은 이미 고정됐습니다.';}
function renderDeck(){
  const entries=Object.entries(CARDS).filter(([,c])=>category==='attack'?c.kind==='attack':category==='defense'?['guard','evade'].includes(c.kind):['feint','rest'].includes(c.kind));
  const used=span(draft)-(selected>=0?CARDS[draft[selected]].duration:0);
  $('deck').innerHTML=entries.map(([id,c])=>`<button class="card ${c.kind}" data-card="${id}" ${!canEdit()||used+c.duration>RULES.slots?'disabled':''} aria-label="${selected>=0?'교체: ':''}${c.name}, ${c.duration}칸, 소모 ${c.cost}. ${c.description}"><strong>${c.name}</strong><span class="card-meta"><span>${c.duration}칸</span><span>${c.kind==='rest'?'기력 회복':'기력 −'+c.cost}</span></span></button>`).join('');
}
function renderDraft(){
  const ids=play?last.draft:draft;let beat=0;
  $('timeline').innerHTML=ids.map((id,index)=>{const c=CARDS[id],start=beat;beat+=c.duration;return `<button class="slot action ${c.kind} ${selected===index&&canEdit()?'selected':''}" style="grid-column:span ${c.duration}" data-select="${index}" data-start="${start}" data-end="${beat}" aria-pressed="${selected===index&&canEdit()}" ${!canEdit()?'disabled':''} aria-label="${start+1}박 ${c.name}, 누르면 편집">${c.short}<span class="beat-marks">${Array.from({length:c.duration},(_,j)=>`<i class="${c.kind==='attack'&&j===c.impact?'impact':''}"></i>`).join('')}</span></button>`;}).join('')+Array.from({length:RULES.slots-beat},(_,i)=>`<div class="slot" data-start="${beat+i}" data-end="${beat+i+1}" aria-label="${beat+i+1}박 자동 호흡">호흡</div>`).join('');
  $('slotCount').textContent=`${beat}/${RULES.slots}`;
  const prediction=forecast(draft,match.fighters[0]);
  $('cost').textContent=prediction.failed.length?'스태미너 부족 · 일부 동작 실패 예상':`예상 잔량 ${Math.round(prediction.stamina)} · 피격 제외`;
  $('planMeta').classList.toggle('warning',!!prediction.failed.length);
  $('planMeta').hidden=selected>=0&&canEdit();$('moveControls').hidden=selected<0||!canEdit();
  if(selected>=0){$('selectedName').textContent=CARDS[draft[selected]].short+' 교체';$('moveLeft').disabled=selected===0;$('moveRight').disabled=selected===draft.length-1;}
  $('undo').disabled=!canEdit()||!undoStack.length;$('clear').disabled=!canEdit()||!draft.length;$('preset').disabled=!canEdit();renderDeck();
}
function renderControls(){
  if(play)play.visualTick=-1;
  $('execute').disabled=mode==='playing';$('execute').innerHTML=match.finished?'다시 대전 <span>↻</span>':'콤보 실행 <span>▶</span>';
  $('phase').textContent=mode==='playing'?(play?.paused?'일시정지 · 관찰 중':'전투 중'):match.finished?'경기 종료':'작전 중 · 시간 정지';
  $('turn').textContent=`교환 ${play?.turn??match.turn} / ${RULES.maxTurns}`;
  $('skip').disabled=mode!=='playing';$('replay').disabled=!last||mode==='playing';$('start').disabled=mode==='playing';$('opponent').disabled=mode==='playing';$('skill').disabled=mode==='playing';
  $('pause').hidden=mode!=='playing';$('pause').textContent=play?.paused?'계속 재생':'일시정지';renderDraft();
}
function start(){
  skill=$('skill').value;match=newMatch($('opponent').value,seed++);enemyPlan=opponentPlan(match);draft=[];last=null;play=null;mode='planning';selected=-1;undoStack=[];
  $('result').hidden=true;$('menu').close();$('history').textContent='아직 관찰한 콤보가 없습니다.';$('historyTurn').textContent='';$('log').innerHTML='';$('logCount').textContent='';$('coachText').textContent=PROFILES[match.profile].trait;$('playbackLabel').textContent='전투 후 다음 콤보를 바로 준비합니다.';$('preset').value='';
  updateIntel();hud(match.fighters);renderControls();notice('카드로 추가 · 타임라인으로 편집');$('stageMessage').textContent='상대의 첫 동작을 읽고 콤보를 준비하세요';
}
function edit(operation){if(!canEdit())return;try{const next=editDraft(draft,operation);undoStack.push([...draft]);draft=next;if(operation.type==='move')selected=operation.index+operation.direction;else selected=-1;$('preset').value='';renderDraft();notice(operation.id?CARDS[operation.id].description:'콤보를 수정했습니다.');}catch(e){notice(e.message,true);}}
function add(id){edit({type:selected>=0?'replace':'add',id,index:selected});}
function execute(){if(match.finished&&mode!=='playing'){start();return;}if(!canEdit())return;selected=-1;const result=resolveTurn(match,makePlan(draft),enemyPlan);last={...result,before:structuredClone(match),turn:match.turn,draft:[...draft]};beginPlayback(false);}
function beginPlayback(replaying){play={cursor:0,lastTime:0,replaying,turn:last.turn,paused:false};mode='playing';selected=-1;lastLogged=-1;$('menu').close();$('log').innerHTML='';$('result').hidden=true;$('playbackLabel').textContent=replaying?'직전 교환 다시 보기':'양측 콤보 동시 실행';hud(last.before.fighters);renderControls();notice(replaying?'다시 보기는 결과를 바꾸지 않습니다.':'양측 콤보를 동시에 실행합니다.');}
function appendEvents(frame,audible=true){
  for(const e of frame.events.filter(e=>e.type!=='rest')){const row=document.createElement('div');row.className=`log-entry ${e.actor===1?'enemy':''}`;const tick=document.createElement('span');tick.className='tick';tick.textContent=`${frame.tick+1}박`;row.append(tick);const label=document.createElement(e.counter?'strong':'span');label.textContent=e.text;row.append(label);$('log').prepend(row);}
  if(sound&&audible)beep(frame.events);$('logCount').textContent=`${frame.tick+1}/${last.frames.length}박`;
}
function finishPlayback(){
  if(!play)return;const replaying=play.replaying;
  if(!replaying){match=structuredClone(last.match);if(!match.finished)enemyPlan=opponentPlan(match);undoStack=[];}
  for(let t=lastLogged+1;t<last.frames.length;t++)appendEvents(last.frames[t],false);
  play=null;mode=match.finished?'finished':'planning';selected=-1;
  $('historyTurn').textContent=`· 교환 ${last.turn}`;$('history').innerHTML=last.plans[1].map(p=>`<span>${p.start+1} · ${CARDS[p.id].short}</span>`).join('');
  const hits=last.frames.flatMap(f=>f.events),counter=hits.some(e=>e.type==='hit'&&e.actor===0&&e.counter),evade=hits.some(e=>e.type==='evade'&&e.actor===0),bodyHit=hits.some(e=>e.type==='hit'&&e.target===0&&e.targetPart==='body');
  const summary=counter?'카운터 성공':evade?'회피 성공':bodyHit?'몸통 피격':hits.some(e=>e.type==='hit'&&e.actor===0)?'공격 적중':'교환 종료';
  $('stageMessage').textContent=match.finished?'경기 종료':summary+' · 다음 콤보 준비';$('coachText').textContent=match.fighters[0].stamina<30?'스태미너가 낮습니다. 호흡과 짧은 동작을 섞어보세요.':counter?'회피 후 반격이 연결됐습니다. 상대의 다음 타격 박자를 확인하세요.':PROFILES[match.profile].trait;
  $('playbackLabel').textContent='지난 교환은 기록과 다시 보기에서 확인할 수 있습니다.';
  if(match.finished){renderIntel(last.plans[1].map(p=>({...p,kind:'exact',label:CARDS[p.id].name})));$('result').hidden=false;$('result').innerHTML=`<strong>${match.winner===null?'무승부':match.winner===0?'승리':'패배'}</strong><p>${match.method}</p><small>유효 타격·방어 ${Math.round(match.fighters[0].score)} : ${Math.round(match.fighters[1].score)}</small>`;notice('다시 대전하면 새 경기를 시작합니다.');}
  else{updateIntel();notice('직전 콤보 유지 · 필요한 동작만 수정');}
  hud(match.fighters);renderControls();
}
function beep(events){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{return;}}if(audio.state==='suspended')audio.resume().catch(()=>{});for(const e of events.filter(e=>['hit','block','evade'].includes(e.type))){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=e.type==='hit'?'triangle':'sine';o.frequency.setValueAtTime(e.type==='hit'?120:e.type==='block'?270:650,t);o.frequency.exponentialRampToValueAtTime(45,t+.1);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.13);}}
function loop(now){
  if(play){
    const dt=play.lastTime?Math.min(80,now-play.lastTime):0;play.lastTime=now;
    if(!play.paused){advancePlayback(play,last.frames,dt,speed,ring.reduced);play.renderTime=now;}
    if(play.cursor>=last.frames.length){finishPlayback();ring.render(now,null,0,match.fighters);}
    else{const tick=Math.floor(play.cursor),p=play.cursor-tick,frame=last.frames[tick];ring.render(play.renderTime??now,frame,p);
      if(p>=.5&&lastLogged<tick){for(let t=lastLogged+1;t<=tick;t++)appendEvents(last.frames[t]);lastLogged=tick;hud(frame.fighters);$('stageMessage').textContent=frame.events.find(e=>e.type==='hit'&&e.counter)?.text??frame.events.find(e=>e.type!=='rest')?.text??'호흡 정리';}
      // Replay reveals only what has executed, never the next committed enemy plan.
      if(play.visualTick!==tick){play.visualTick=tick;
      renderIntel(last.plans[1].filter(a=>a.start<=tick).map(a=>({...a,kind:'exact',label:CARDS[a.id].name})));
      document.querySelectorAll('#timeline .slot').forEach(s=>s.classList.toggle('current',tick>=Number(s.dataset.start)&&tick<Number(s.dataset.end)));$('intel').children[tick]?.classList.add('current');}
    }
  }else ring.render(now,null,0,match.fighters);
  requestAnimationFrame(loop);
}
$('opponent').innerHTML=Object.entries(PROFILES).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('');$('skill').innerHTML=Object.entries(SKILLS).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('');
function setupHints(){$('opponentHint').textContent=PROFILES[$('opponent').value].trait;$('skillHint').textContent=SKILLS[$('skill').value].description;}
$('opponent').onchange=setupHints;$('skill').onchange=setupHints;
$('cardsInfoBody').innerHTML=Object.entries(CARDS).map(([id,c],i)=>`<section><h3>${c.name} · ${c.duration}칸</h3><p>${c.description}</p><p>기력 소모 ${c.cost}${c.kind==='attack'?` · 타격은 동작의 ${c.impact+1}번째 박자`:''} · 단축키 ${keys[i]}</p></section>`).join('');
$('deck').onclick=e=>{const b=e.target.closest('[data-card]');if(b&&!b.disabled)add(b.dataset.card);};
$('timeline').onclick=e=>{const b=e.target.closest('[data-select]');if(!canEdit()||!b)return;selected=selected===Number(b.dataset.select)?-1:Number(b.dataset.select);renderDraft();notice(selected>=0?'카드를 누르면 선택한 동작과 교체됩니다.':'카드로 추가 · 타임라인으로 편집');};
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderDeck();});
$('moveLeft').onclick=()=>edit({type:'move',index:selected,direction:-1});$('moveRight').onclick=()=>edit({type:'move',index:selected,direction:1});$('remove').onclick=()=>edit({type:'remove',index:selected});$('cancelSelection').onclick=()=>{selected=-1;renderDraft();};
$('clear').onclick=()=>edit({type:'clear'});$('undo').onclick=()=>{if(canEdit()&&undoStack.length){draft=undoStack.pop();selected=-1;renderDraft();}};
$('start').onclick=start;$('execute').onclick=execute;
$('preset').onchange=()=>{const ids=presets[$('preset').value];if(ids&&canEdit()){undoStack.push([...draft]);draft=[...ids];selected=-1;renderDraft();$('menu').close();notice('상대의 공개 행동에 맞춰 수정하세요.');}};
$('pause').onclick=()=>{if(play){play.paused=!play.paused;play.lastTime=0;renderControls();}};
$('skip').onclick=()=>{finishPlayback();$('menu').close();};$('replay').onclick=()=>{if(last&&mode!=='playing')beginPlayback(true);};
$('speed').onclick=()=>{speed=speed===2?1:speed===1?3:2;$('speed').textContent=speed===1?'천천히':speed===2?'빠르게':'매우 빠르게';};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(sound));if(sound)beep([{type:'block'}]);};
$('menuButton').onclick=()=>{if(play&&!play.paused){play.paused=true;renderControls();}$('menu').showModal();};
$('skillTag').onclick=()=>{notice(SKILLS[skill].description);};$('helpButton').onclick=()=>$('help').showModal();$('cardHelp').onclick=()=>$('cardsInfo').showModal();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||dialogs.some(id=>$(id).open))return;if(e.key==='Enter'&&!$('execute').disabled){e.preventDefault();execute();}if(canEdit()){const i=keys.indexOf(e.key);if(i>=0){e.preventDefault();add(Object.keys(CARDS)[i]);}if(e.key==='Backspace'){e.preventDefault();$('undo').click();}}});
document.addEventListener('visibilitychange',()=>{if(play){play.lastTime=0;if(document.hidden){play.paused=true;renderControls();}}});
setupHints();start();requestAnimationFrame(loop);
