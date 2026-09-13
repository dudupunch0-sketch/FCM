import './boot.js';
import {describeEvent,stageMessage} from './commentary.js';
import {t} from './strings.js';
import {CARDS,SKILLS,PROFILES,RULES,newMatch,makePlan,span,opponentPlan,observe,resolveTurn} from './engine.js';
import {createRing} from './ring.js';
import {advancePlayback} from './motion.js';
import {editDraft,forecast} from './planner.js';
const $=id=>document.getElementById(id);
const ring=await createRing($('ring'));
let match=newMatch(),enemyPlan=null,draft=[],skills=['first','none','none'],mode='planning',last=null,play=null,speed=2,sound=false,audio=null,seed=17,lastLogged=-1,selected=-1,undoStack=[],category='attack';
const keys=['1','2','3','4','5','6','7','8','9','0','-','='];
const presets={counter:['sway','cross','weave','jab','rest','rest'],pressure:['jab','cross','jab','hook','rest','rest'],body:['feint','body','jab','body','rest','rest']};
const dialogs=['menu','help','cardsInfo'];
const DEFENCE_KINDS=['guard','evade'];
const canEdit=()=>mode==='planning'&&!match.finished;
function notice(text,warning=false){$('notice').textContent=text;$('notice').classList.toggle('warning',warning);}
// The recovery ceiling only falls, so the part of the bar past it can never be refilled. It
// has to be visible: a player who cannot see why their stamina stopped coming back reads the
// system as unfair rather than as attrition. Spec: docs/design/38 section 5.
function hud(fighters){
  fighters.forEach((f,i)=>{
    const cap=Math.round(f.staminaCap??RULES.maxStamina),stamina=Math.round(f.stamina);
    const worn=cap<RULES.maxStamina;
    // The hatched tail is the stamina this fighter can no longer reach, so the bar itself
    // carries the answer to "why did my recovery stop".
    const lost=worn?`<i class="lost" style="left:${cap}%" aria-hidden="true"></i>`:'';
    // The ceiling rides on the damage line, not the name line: two fighters share a phone
    // width and a fourth item up top pushes the name out.
    const ceiling=worn?`<span class="ceiling">${t('ui.hud.ceiling',{value:cap})}</span>`:'';
    $(i?'enemyHud':'playerHud').innerHTML=`<div class="fighter-name"><span class="who">${f.name.split(' · ')[0]}</span><small class="stance">${t(f.stance==='southpaw'?'ui.stance.southpaw':'ui.stance.orthodox')}</small><small>${t('ui.hud.stamina',{value:stamina})}</small></div><div class="stamina" role="meter" aria-label="${t('ui.hud.staminaMeter',{fighter:f.name})}${worn?` · ${t('ui.hud.ceilingMeter',{fighter:f.name,value:cap})}`:''}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stamina}">${lost}<i style="width:${f.stamina}%"></i></div><div class="damage-line"><span>${t('ui.part.head')} <b>${Math.round(f.damage.head)}</b></span><span>${t('ui.part.body')} <b>${Math.round(f.damage.body)}</b></span><span>${t('ui.part.arms')} <b>${Math.round(f.damage.arms)}</b></span>${ceiling}</div>`;
  });
  // Open guard is a relationship between the two fighters, not a property of either, so it
  // belongs between them rather than in a corner.
  const open=fighters[0].stance!==fighters[1].stance;
  $('guardState').textContent=t(open?'ui.guard.open':'ui.guard.closed');
  $('guardState').classList.toggle('open',open);
  $('guardState').title=t(open?'ui.guard.openHint':'ui.guard.closedHint');
}
function renderIntel(reveals=[]){
  // A cue that names a side carries structured data, so the wording stays in the string table
  // rather than being passed through from the engine.
  const cueLabel=r=>r.side?t(r.side==='left'?'ui.cue.left':'ui.cue.right'):t('ui.02');
  $('intel').innerHTML=Array.from({length:RULES.slots},(_,i)=>{const r=reveals.find(r=>r.start===i),label=r?(r.id?CARDS[r.id].short:r.kind==='cue'?cueLabel(r):r.kind==='zone'?t('ui.01'):r.label):'?';return `<div class="slot ${r?.kind??''}" data-beat="${i}" aria-label="${t('ui.beat',{n:i+1})} ${r?(r.kind==='cue'?t('ui.37'):t('ui.44'))+r.label:t('ui.16')}"><span class="${r?'intel-label':'unknown'}">${label}</span></div>`;}).join('');
}
const skillIds=['skill','skill2','skill3'];
const activeSkills=()=>[...new Set(skills.filter(id=>id&&id!=='none'))];
function updateIntel(){
  const active=activeSkills();
  renderIntel(enemyPlan?observe(enemyPlan,active,match):[]);
  $('skillTag').textContent=(active.length?active.map(id=>SKILLS[id].name).join(' · '):SKILLS.none.name)+' ⓘ';
  const detail=active.length?active.map(id=>SKILLS[id].description).join(' '):SKILLS.none.description;
  $('intelHint').textContent=detail+t('ui.intelHint.suffix');
}
function renderDeck(){
  // Tactics is defined by exclusion on purpose. Listing its kinds meant that adding `move` and
  // `stance` cards silently dropped three cards out of the deck entirely — they existed, the
  // solver used them, and no player could ever pick one. A catch-all cannot lose a card.
  const entries=Object.entries(CARDS).filter(([,c])=>category==='attack'?c.kind==='attack':category==='defense'?DEFENCE_KINDS.includes(c.kind):!['attack',...DEFENCE_KINDS].includes(c.kind));
  const used=span(draft)-(selected>=0?CARDS[draft[selected]].duration:0);
  $('deck').innerHTML=entries.map(([id,c])=>`<button class="card ${c.kind}" data-card="${id}" ${!canEdit()||used+c.duration>RULES.slots?'disabled':''} aria-label="${selected>=0?t('ui.06'):''}${c.name}, ${t('ui.slots',{n:c.duration})}, ${t('ui.cost',{n:c.cost})}. ${c.description}"><strong>${c.name}</strong><span class="card-meta"><span>${t('ui.slots',{n:c.duration})}</span><span>${c.kind==='rest'?t('ui.09'):t('ui.08')+c.cost}</span></span></button>`).join('');
}
function renderDraft(){
  const ids=play?last.draft:draft;let beat=0;
  $('timeline').innerHTML=ids.map((id,index)=>{const c=CARDS[id],start=beat;beat+=c.duration;return `<button class="slot action ${c.kind} ${selected===index&&canEdit()?'selected':''}" style="grid-column:span ${c.duration}" data-select="${index}" data-start="${start}" data-end="${beat}" aria-pressed="${selected===index&&canEdit()}" ${!canEdit()?'disabled':''} aria-label="${t('ui.beat',{n:start+1})} ${c.name}${t('ui.card.editHint')}">${c.short}<span class="beat-marks">${Array.from({length:c.duration},(_,j)=>`<i class="${c.kind==='attack'&&j===c.impact?'impact':''}"></i>`).join('')}</span></button>`;}).join('')+Array.from({length:RULES.slots-beat},(_,i)=>`<div class="slot" data-start="${beat+i}" data-end="${beat+i+1}" aria-label="${t('ui.beat',{n:beat+i+1})} ${t('ui.autoRest')}">${t('ui.rest')}</div>`).join('');
  $('slotCount').textContent=`${beat}/${RULES.slots}`;
  const prediction=forecast(draft,match.fighters[0]);
  $('cost').textContent=prediction.failed.length?t('ui.22'):t('ui.forecast',{value:Math.round(prediction.stamina)});
  $('planMeta').classList.toggle('warning',!!prediction.failed.length);
  $('planMeta').hidden=selected>=0&&canEdit();$('moveControls').hidden=selected<0||!canEdit();
  if(selected>=0){$('selectedName').textContent=CARDS[draft[selected]].short+t('ui.replaceSuffix');$('moveLeft').disabled=selected===0;$('moveRight').disabled=selected===draft.length-1;}
  $('undo').disabled=!canEdit()||!undoStack.length;$('clear').disabled=!canEdit()||!draft.length;$('preset').disabled=!canEdit();renderDeck();
}
function renderControls(){
  if(play)play.visualTick=-1;
  $('execute').disabled=mode==='playing';$('execute').innerHTML=match.finished?t('ui.10'):t('ui.41');
  $('phase').textContent=mode==='playing'?(play?.paused?t('ui.29'):t('ui.31')):match.finished?t('ui.03'):t('ui.30');
  $('turn').textContent=t('ui.turnCounter',{current:play?.turn??match.turn,total:RULES.maxTurns});
  $('skip').disabled=mode!=='playing';$('replay').disabled=!last||mode==='playing';$('start').disabled=mode==='playing';$('opponent').disabled=mode==='playing';skillIds.forEach(id=>{$(id).disabled=mode==='playing';});
  $('pause').hidden=mode!=='playing';$('pause').textContent=play?.paused?t('ui.04'):t('ui.28');renderDraft();
}
function start(){
  skills=skillIds.map(id=>$(id).value);match=newMatch($('opponent').value,seed++);enemyPlan=opponentPlan(match);draft=[];last=null;play=null;mode='planning';selected=-1;undoStack=[];
  $('result').hidden=true;$('menu').close();$('history').textContent=t('ui.25');$('historyTurn').textContent='';$('log').innerHTML='';$('logCount').textContent='';$('coachText').textContent=PROFILES[match.profile].trait;$('playbackLabel').textContent=t('ui.32');$('preset').value='';
  updateIntel();hud(match.fighters);renderControls();notice(t('ui.38'));$('stageMessage').textContent=t('ui.19');
}
function edit(operation){if(!canEdit())return;try{const next=editDraft(draft,operation);undoStack.push([...draft]);draft=next;if(operation.type==='move')selected=operation.index+operation.direction;else selected=-1;$('preset').value='';renderDraft();notice(operation.id?CARDS[operation.id].description:t('ui.42'));}catch(e){notice(e.message,true);}}
function add(id){edit({type:selected>=0?'replace':'add',id,index:selected});}
function execute(){if(match.finished&&mode!=='playing'){start();return;}if(!canEdit())return;selected=-1;const result=resolveTurn(match,makePlan(draft),enemyPlan);last={...result,before:structuredClone(match),turn:match.turn,draft:[...draft]};beginPlayback(false);}
function beginPlayback(replaying){play={cursor:0,lastTime:0,replaying,turn:last.turn,paused:false};mode='playing';selected=-1;lastLogged=-1;$('menu').close();$('log').innerHTML='';$('result').hidden=true;$('playbackLabel').textContent=replaying?t('ui.34'):t('ui.26');hud(last.before.fighters);renderControls();notice(replaying?t('ui.12'):t('ui.27'));}
function appendEvents(frame,audible=true){
  for(const e of frame.events.filter(e=>e.type!=='rest')){const row=document.createElement('div');row.className=`log-entry ${e.actor===1?'enemy':''}`;const tick=document.createElement('span');tick.className='tick';tick.textContent=t('ui.beat',{n:frame.tick+1});row.append(tick);const label=document.createElement(e.counter?'strong':'span');label.textContent=describeEvent(e,{fighters:frame.fighters});row.append(label);$('log').prepend(row);}
  if(sound&&audible)beep(frame.events);$('logCount').textContent=t('ui.beatOf',{current:frame.tick+1,total:last.frames.length});
}
function finishPlayback(){
  if(!play)return;const replaying=play.replaying;
  if(!replaying){match=structuredClone(last.match);if(!match.finished)enemyPlan=opponentPlan(match);undoStack=[];}
  for(let t=lastLogged+1;t<last.frames.length;t++)appendEvents(last.frames[t],false);
  play=null;mode=match.finished?'finished':'planning';selected=-1;
  $('historyTurn').textContent=t('ui.turnTag',{turn:last.turn});$('history').innerHTML=last.plans[1].map(p=>`<span>${p.start+1} · ${CARDS[p.id].short}</span>`).join('');
  const hits=last.frames.flatMap(f=>f.events),counter=hits.some(e=>e.type==='hit'&&e.actor===0&&e.counter),evade=hits.some(e=>e.type==='evade'&&e.actor===0),bodyHit=hits.some(e=>e.type==='hit'&&e.target===0&&e.targetPart==='body');
  const summary=counter?t('ui.40'):evade?t('ui.45'):bodyHit?t('ui.14'):hits.some(e=>e.type==='hit'&&e.actor===0)?t('ui.05'):t('ui.07');
  $('stageMessage').textContent=match.finished?t('ui.03'):summary+t('ui.nextComboSuffix');$('coachText').textContent=match.fighters[0].stamina<30?t('ui.23'):counter?t('ui.46'):PROFILES[match.profile].trait;
  $('playbackLabel').textContent=t('ui.33');
  if(match.finished){renderIntel(last.plans[1].map(p=>({...p,kind:'exact',label:CARDS[p.id].name})));$('result').hidden=false;$('result').innerHTML=`<strong>${match.winner===null?t('ui.15'):match.winner===0?t('ui.24'):t('ui.43')}</strong><p>${match.method}</p><small>${t('ui.scoreLine',{player:Math.round(match.fighters[0].score),enemy:Math.round(match.fighters[1].score)})}</small>`;notice(t('ui.11'));}
  else{updateIntel();notice(t('ui.35'));}
  hud(match.fighters);renderControls();
}
function beep(events){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{return;}}if(audio.state==='suspended')audio.resume().catch(()=>{});for(const e of events.filter(e=>['hit','block','evade'].includes(e.type))){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type=e.type==='hit'?'triangle':'sine';o.frequency.setValueAtTime(e.type==='hit'?120:e.type==='block'?270:650,t);o.frequency.exponentialRampToValueAtTime(45,t+.1);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.13);}}
function loop(now){
  if(play){
    const dt=play.lastTime?Math.min(80,now-play.lastTime):0;play.lastTime=now;
    if(!play.paused){advancePlayback(play,last.frames,dt,speed,ring.reduced);play.renderTime=now;}
    if(play.cursor>=last.frames.length){finishPlayback();ring.render(now,null,0,match.fighters);}
    else{const tick=Math.floor(play.cursor),p=play.cursor-tick,frame=last.frames[tick];ring.render(play.renderTime??now,frame,p);
      if(p>=.5&&lastLogged<tick){for(let t=lastLogged+1;t<=tick;t++)appendEvents(last.frames[t]);lastLogged=tick;hud(frame.fighters);$('stageMessage').textContent=stageMessage(frame);}
      // Replay reveals only what has executed, never the next committed enemy plan.
      if(play.visualTick!==tick){play.visualTick=tick;
      renderIntel(last.plans[1].filter(a=>a.start<=tick).map(a=>({...a,kind:'exact',label:CARDS[a.id].name})));
      document.querySelectorAll('#timeline .slot').forEach(s=>s.classList.toggle('current',tick>=Number(s.dataset.start)&&tick<Number(s.dataset.end)));$('intel').children[tick]?.classList.add('current');}
    }
  }else ring.render(now,null,0,match.fighters);
  requestAnimationFrame(loop);
}
$('opponent').innerHTML=Object.entries(PROFILES).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('');skillIds.forEach((slot,index)=>{$(slot).innerHTML=Object.entries(SKILLS).map(([id,p])=>`<option value="${id}"${(index>0&&id==='none')||(index===0&&id==='first')?' selected':''}>${p.name}</option>`).join('');});
function setupHints(){
  $('opponentHint').textContent=PROFILES[$('opponent').value].trait;
  const picked=[...new Set(skillIds.map(id=>$(id).value).filter(id=>id&&id!=='none'))];
  $('skillHint').textContent=picked.length?picked.map(id=>SKILLS[id].description).join(' '):SKILLS.none.description;
}
$('opponent').onchange=setupHints;skillIds.forEach(id=>{$(id).onchange=setupHints;});
$('cardsInfoBody').innerHTML=Object.entries(CARDS).map(([id,c],i)=>`<section><h3>${t('ui.cardHelpHead',{name:c.name,slots:c.duration})}</h3><p>${c.description}</p><p>${t('ui.cardHelpCost',{cost:c.cost})}${c.kind==='attack'?t('ui.cardHelpImpact',{beat:c.impact+1}):''}${t('ui.cardHelpKey',{key:keys[i]})}</p></section>`).join('');
$('deck').onclick=e=>{const b=e.target.closest('[data-card]');if(b&&!b.disabled)add(b.dataset.card);};
$('timeline').onclick=e=>{const b=e.target.closest('[data-select]');if(!canEdit()||!b)return;selected=selected===Number(b.dataset.select)?-1:Number(b.dataset.select);renderDraft();notice(selected>=0?t('ui.39'):t('ui.38'));};
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderDeck();});
$('moveLeft').onclick=()=>edit({type:'move',index:selected,direction:-1});$('moveRight').onclick=()=>edit({type:'move',index:selected,direction:1});$('remove').onclick=()=>edit({type:'remove',index:selected});$('cancelSelection').onclick=()=>{selected=-1;renderDraft();};
$('clear').onclick=()=>edit({type:'clear'});$('undo').onclick=()=>{if(canEdit()&&undoStack.length){draft=undoStack.pop();selected=-1;renderDraft();}};
$('start').onclick=start;$('execute').onclick=execute;
$('preset').onchange=()=>{const ids=presets[$('preset').value];if(ids&&canEdit()){undoStack.push([...draft]);draft=[...ids];selected=-1;renderDraft();$('menu').close();notice(t('ui.18'));}};
$('pause').onclick=()=>{if(play){play.paused=!play.paused;play.lastTime=0;renderControls();}};
$('skip').onclick=()=>{finishPlayback();$('menu').close();};$('replay').onclick=()=>{if(last&&mode!=='playing')beginPlayback(true);};
$('speed').onclick=()=>{speed=speed===2?1:speed===1?3:2;$('speed').textContent=speed===1?t('ui.36'):speed===2?t('ui.17'):t('ui.13');};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?t('ui.21'):t('ui.20');$('sound').setAttribute('aria-pressed',String(sound));if(sound)beep([{type:'block'}]);};
$('menuButton').onclick=()=>{if(play&&!play.paused){play.paused=true;renderControls();}$('menu').showModal();};
$('skillTag').onclick=()=>{const active=activeSkills();notice(active.length?active.map(id=>SKILLS[id].description).join(' '):SKILLS.none.description);};$('helpButton').onclick=()=>$('help').showModal();$('cardHelp').onclick=()=>$('cardsInfo').showModal();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||dialogs.some(id=>$(id).open))return;if(e.key==='Enter'&&!$('execute').disabled){e.preventDefault();execute();}if(canEdit()){const i=keys.indexOf(e.key);if(i>=0){e.preventDefault();add(Object.keys(CARDS)[i]);}if(e.key==='Backspace'){e.preventDefault();$('undo').click();}}});
document.addEventListener('visibilitychange',()=>{if(play){play.lastTime=0;if(document.hidden){play.paused=true;renderControls();}}});
setupHints();start();requestAnimationFrame(loop);
