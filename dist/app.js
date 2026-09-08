import {CARDS,SKILLS,PROFILES,RULES,newMatch,makePlan,span,costOf,opponentPlan,observe,resolveTurn} from './engine.js';
import {createRing} from './ring.js';
import {advancePlayback} from './motion.js';
const $=id=>document.getElementById(id);
const ring=await createRing($('ring'));
let match=newMatch(),enemyPlan=null,draft=[],skill='first',mode='setup',last=null,play=null,speed=1,sound=false,audio=null,seed=17,lastLogged=-1;
const icons={jab:'JAB',cross:'CRS',hook:'HOK',body:'BDY',heavy:'OVR',guard:'GRD',shell:'HLD',lowguard:'LOW',sway:'SWY',weave:'WEV',feint:'FNT',rest:'RST'};
const keys=['1','2','3','4','5','6','7','8','9','0','-','='];
const presets={counter:['sway','cross','weave','jab','rest','rest'],pressure:['jab','cross','jab','hook','rest','rest'],body:['feint','body','jab','body','rest','rest']};
function notice(text,warning=false){$('notice').textContent=text;$('notice').classList.toggle('warning',warning);}
function hud(fighters){fighters.forEach((f,i)=>{const e=$(i?'enemyHud':'playerHud');e.innerHTML=`<div class="fighter-name"><span>${f.name}</span><small>${i?'OPPONENT':'YOUR FIGHTER'}</small></div><div class="stamina"><div style="width:${f.stamina}%"></div></div><div class="stamina-label"><span>스태미너</span><span>${Math.round(f.stamina)} / 100</span></div><div class="damage-line"><span>머리 충격 <b>${Math.round(f.damage.head)}</b></span><span>몸통 <b>${Math.round(f.damage.body)}</b></span><span>팔 <b>${Math.round(f.damage.arms)}</b></span></div>`;});}
function renderIntel(reveals=[]){$('intel').innerHTML=Array.from({length:RULES.slots},(_,i)=>{const r=reveals.find(r=>r.start===i);return `<div class="slot ${r?.kind??''}" data-beat="${i}"><span class="beat">${i+1}</span>${r?`<span class="intel-label">${r.label}</span><span style="font-size:9px">${r.kind==='cue'?'추정':'확정'}</span>`:'<span class="unknown">?</span>'}</div>`;}).join('');}
function updateIntel(){const r=enemyPlan?observe(enemyPlan,skill,match):[];renderIntel(r);$('skillTag').textContent=mode==='setup'?'정보 카드 선택 전':SKILLS[skill].name;$('intelHint').textContent=mode==='setup'?'경기를 시작하면 정보 카드가 고정되고 상대의 의도가 공개됩니다.':r.length?'실선은 확정 정보 · 점선은 추정 예고입니다. 상대 계획은 이미 고정됐습니다.':skill==='pattern'?'지난 콤보와 같은 위치에 반복되는 동작이 있으면 공개됩니다.':skill==='counter'?'실제 공격을 회피하면 다음 교환에서 공격 하나가 공개됩니다.':'이번 교환에는 추가 정보가 없습니다. 상대의 지난 패턴을 활용하세요.';}
function renderDraft(){
  let beat=0;const editing=mode==='planning';
  $('timeline').innerHTML=draft.map((id,index)=>{const c=CARDS[id],start=beat;beat+=c.duration;return `<div class="slot action ${c.kind}" style="grid-column:span ${c.duration}" data-start="${start}" data-end="${beat}"><span class="beat">${start+1}${c.duration>1?'–'+beat:''}</span><button data-remove="${index}" ${!editing?'disabled':''} aria-label="${c.name} 삭제">${c.short}</button><div class="beat-marks">${Array.from({length:c.duration},(_,j)=>`<i class="${c.kind==='attack'&&j===c.impact?'impact':''}"></i>`).join('')}</div><div class="mini-moves"><button data-move="${index}" data-dir="-1" ${!editing||index===0?'disabled':''} aria-label="${c.name} 앞으로 이동">‹</button><button data-move="${index}" data-dir="1" ${!editing||index===draft.length-1?'disabled':''} aria-label="${c.name} 뒤로 이동">›</button></div></div>`;}).join('')+Array.from({length:8-beat},(_,i)=>`<div class="slot" data-start="${beat+i}" data-end="${beat+i+1}"><span class="beat">${beat+i+1}</span><span style="font-size:11px;color:#718266">호흡</span></div>`).join('');
  $('slotCount').textContent=`${beat} / 8`;$('cost').textContent=`동작 비용 ${costOf(draft)} · 빈칸 회복 별도`;
  $('undo').disabled=!editing||!draft.length;$('clear').disabled=!editing||!draft.length;$('preset').disabled=!editing;
  document.querySelectorAll('[data-card]').forEach(b=>{b.disabled=!editing||beat+CARDS[b.dataset.card].duration>8;});
}
function renderControls(){
  $('execute').disabled=mode==='setup'||mode==='playing'||match.finished;
  $('execute').innerHTML=mode==='review'?'다음 콤보 구성 <span>→</span>':'콤보 실행 <span>↵</span>';
  $('skip').disabled=mode!=='playing';$('replay').disabled=!last||mode==='playing';$('rematch').disabled=mode==='playing';
  $('phase').textContent=mode==='setup'?'경기 준비':mode==='playing'?'동시 실행 중':match.finished?'경기 종료':mode==='review'?'교환 결과':'콤보 계획';
  $('turn').textContent=mode==='setup'?'교환 —':`교환 ${mode==='review'&&!match.finished?match.turn-1:play?.turn??match.turn} / ${RULES.maxTurns}`;
  renderDraft();
}
function start(){
  skill=$('skill').value;match=newMatch($('opponent').value,seed);enemyPlan=opponentPlan(match);draft=[];last=null;mode='planning';
  $('setup').hidden=true;$('coach').hidden=false;$('result').hidden=true;
  $('coachText').textContent=PROFILES[match.profile].trait;
  $('history').innerHTML='<p class="hint">아직 관찰한 콤보가 없습니다.</p>';$('historyTurn').textContent='—';$('log').innerHTML='';$('logCount').textContent='—';
  updateIntel();hud(match.fighters);renderControls();notice('카드를 눌러 콤보를 구성하세요. 타격 표시는 실제 공격 박자입니다.');
}
function add(id){if(mode!=='planning')return;if(span(draft)+CARDS[id].duration>8){notice('남은 칸이 부족합니다. 동작을 지우거나 더 짧은 카드를 선택하세요.',true);return;}draft.push(id);$('preset').value='';renderDraft();notice(CARDS[id].description,costOf(draft)>match.fighters[0].stamina);}
function next(){mode='planning';draft=[];enemyPlan=opponentPlan(match);$('result').hidden=true;updateIntel();renderControls();notice('상대가 새 콤보를 확정했습니다. 지난 순서와 비교해 보세요.');$('stageMessage').textContent='다음 교환을 준비하세요';}
function execute(){
  if(mode==='review'){next();return;}if(mode!=='planning')return;
  const result=resolveTurn(match,makePlan(draft),enemyPlan);
  last={...result,before:structuredClone(match),turn:match.turn};beginPlayback(false);
}
function beginPlayback(replaying){
  play={cursor:0,lastTime:0,replaying,turn:last.turn};mode='playing';lastLogged=-1;$('log').innerHTML='';$('result').hidden=true;$('playbackLabel').textContent=replaying?'지난 교환 재생':'양측 콤보 동시 실행';renderControls();
}
function appendEvents(frame,audible=true){
  const events=frame.events.filter(e=>e.type!=='rest');
  for(const e of events){const row=document.createElement('div');row.className=`log-entry ${e.actor===1?'enemy':''}`;const tick=document.createElement('span');tick.className='tick';tick.textContent=`${frame.tick+1}박`;row.append(tick);const text=document.createElement(e.counter?'strong':'span');text.textContent=e.text;row.append(text);$('log').prepend(row);}
  if(sound&&audible)beep(frame.events);
  $('logCount').textContent=`${frame.tick+1} / ${last.frames.length}박`;
}
function finishPlayback(){
  if(!play)return;
  const replaying=play.replaying;if(!replaying)match=structuredClone(last.match);
  // Skipping and normal playback expose the same complete event history and final state.
  for(let t=lastLogged+1;t<last.frames.length;t++)appendEvents(last.frames[t],false);
  lastLogged=last.frames.length-1;play=null;mode='review';hud(match.fighters);renderControls();
  renderIntel(last.plans[1].map(p=>({start:p.start,kind:'exact',label:CARDS[p.id].name})));
  $('intelHint').textContent='방금 상대가 시도한 콤보입니다. 다음 교환에서는 정보 카드가 허용하는 부분만 보입니다.';
  $('historyTurn').textContent=`교환 ${last.turn}`;
  $('history').innerHTML=`<div class="history-chips">${last.plans[1].map(p=>`<span>${p.start+1} · ${CARDS[p.id].short}</span>`).join('')}</div>`;
  $('playbackLabel').textContent=match.finished?'경기가 끝났습니다':'교환 종료 · 양측 스태미너 소량 회복';
  const hits=last.frames.flatMap(f=>f.events);const evade=hits.some(e=>e.type==='evade'&&e.actor===0);const counter=hits.some(e=>e.type==='hit'&&e.actor===0&&e.counter);
  $('coachText').textContent=counter?'회피 뒤 반격이 연결됐습니다. 같은 순서를 반복하면 상대의 다른 공격 궤도에 노출될 수 있습니다.':evade?'공격을 읽었습니다. 회피 직후 크로스를 연결하면 카운터 기회를 활용할 수 있습니다.':match.fighters[0].stamina<30?'스태미너가 낮습니다. 긴 공격을 줄이고 호흡 정리를 섞으세요.':'상대의 타격 박자와 궤도를 함께 보세요. 직선은 스웨이, 훅은 위빙으로 피할 수 있습니다.';
  notice(match.finished?'새 경기 준비를 누르면 다른 상대와 정보 카드를 선택할 수 있습니다.':'교환 기록을 확인하고 다음 콤보를 구성하세요.');
  $('stageMessage').textContent=match.finished?'경기 종료':'교환 종료';
  if(match.finished){$('result').hidden=false;$('result').innerHTML=`<strong>${match.winner===null?'DRAW':match.winner===0?'VICTORY':'DEFEAT'}</strong><p>${match.method} · ${match.winner===null?'무승부':match.winner===0?'도전자 승리':'상대 승리'}</p><small>유효 타격·방어 점수 ${Math.round(match.fighters[0].score)} : ${Math.round(match.fighters[1].score)}</small>`;}
}
function beep(events){
  if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{return;}}
  if(audio.state==='suspended')audio.resume().catch(()=>{});
  for(const e of events.filter(e=>['hit','block','evade'].includes(e.type))){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=e.type==='hit'?'triangle':'sine';o.frequency.setValueAtTime(e.type==='hit'?120:e.type==='block'?270:650,t);o.frequency.exponentialRampToValueAtTime(45,t+.1);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.13);}
}
function loop(now){
  if(play){
    const dt=play.lastTime?Math.min(80,now-play.lastTime):0;play.lastTime=now;advancePlayback(play,last.frames,dt,speed,ring.reduced);
    if(play.cursor>=last.frames.length){finishPlayback();ring.render(now,null,0,match.fighters);}
    else{const tick=Math.floor(play.cursor),p=play.cursor-tick,frame=last.frames[tick];ring.render(now,frame,p);
      if(p>=.5&&lastLogged<tick){for(let t=lastLogged+1;t<=tick;t++)appendEvents(last.frames[t]);lastLogged=tick;hud(frame.fighters);$('stageMessage').textContent=frame.events.find(e=>e.type==='hit'&&e.counter)?.text??frame.events.find(e=>e.type!=='rest')?.text??'호흡을 고르는 중';}
      const known=last.plans[1].filter(a=>a.start<=tick).map(a=>({start:a.start,kind:'exact',label:CARDS[a.id].name}));renderIntel(known);
      document.querySelectorAll('#timeline .slot').forEach(s=>s.classList.toggle('current',tick>=Number(s.dataset.start)&&tick<Number(s.dataset.end)));
      $('intel').children[tick]?.classList.add('current');
    }
  }else ring.render(now,null,0,match.fighters);
  requestAnimationFrame(loop);
}
$('opponent').innerHTML=Object.entries(PROFILES).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('');
$('skill').innerHTML=Object.entries(SKILLS).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('');
function setupHints(){$('opponentHint').textContent=PROFILES[$('opponent').value].trait;$('skillHint').textContent=SKILLS[$('skill').value].description;}
$('opponent').onchange=setupHints;$('skill').onchange=setupHints;
$('deck').innerHTML=Object.entries(CARDS).map(([id,c],i)=>`<button class="card ${c.kind}" data-card="${id}" title="${c.description}" aria-label="${c.name}, ${c.duration}칸, 비용 ${c.cost}. ${c.description}"><span class="card-top"><span>${c.duration}칸</span><span>${keys[i]}</span></span><span class="card-icon">${icons[id]}</span><strong>${c.name}</strong><span class="card-bottom"><span>${c.kind==='attack'?c.power+' 충격':c.kind==='rest'?'회복':'방어·전술'}</span><span>${c.cost?'−'+c.cost:'+'+RULES.restRecovery}</span></span></button>`).join('');
$('deck').onclick=e=>{const b=e.target.closest('[data-card]');if(b)add(b.dataset.card);};
$('timeline').onclick=e=>{if(mode!=='planning')return;const remove=e.target.closest('[data-remove]'),move=e.target.closest('[data-move]');if(remove)draft.splice(Number(remove.dataset.remove),1);if(move){const i=Number(move.dataset.move),j=i+Number(move.dataset.dir);if(j>=0&&j<draft.length)[draft[i],draft[j]]=[draft[j],draft[i]];}renderDraft();};
$('start').onclick=start;$('execute').onclick=execute;$('undo').onclick=()=>{draft.pop();renderDraft();};$('clear').onclick=()=>{draft=[];renderDraft();};
$('preset').onchange=()=>{const ids=presets[$('preset').value];if(ids){draft=[...ids];renderDraft();notice('예시 콤보입니다. 상대의 공개 정보에 맞춰 순서를 바꿔보세요.');}};
$('skip').onclick=finishPlayback;$('replay').onclick=()=>beginPlayback(true);
$('speed').onclick=()=>{speed=speed===1?2:1;$('speed').textContent=`속도 ×${speed}`;};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'소리 켜짐':'소리 꺼짐';$('sound').setAttribute('aria-pressed',String(sound));if(sound)beep([{type:'block'}]);};
$('rematch').onclick=()=>{play=null;mode='setup';last=null;draft=[];enemyPlan=null;seed++;match=newMatch($('opponent').value,seed);$('setup').hidden=false;$('coach').hidden=true;$('result').hidden=true;updateIntel();hud(match.fighters);renderControls();notice('상대와 정보 카드를 선택하세요.');};
$('helpButton').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||$('help').open)return;if(e.key==='Enter'&&!$('execute').disabled){e.preventDefault();execute();}if(mode==='planning'){const i=keys.indexOf(e.key);if(i>=0){e.preventDefault();add(Object.keys(CARDS)[i]);}if(e.key==='Backspace'){e.preventDefault();draft.pop();renderDraft();}}});
document.addEventListener('visibilitychange',()=>{if(play)play.lastTime=0;});
setupHints();hud(match.fighters);updateIntel();renderControls();requestAnimationFrame(loop);
