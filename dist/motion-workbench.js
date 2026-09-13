import {DEFAULT_CLIP,validateClip,sampleClip,inspectClip,bakeClip} from './rig-motion.js';
import {RigPainter} from './rig-painter.js';
const $=s=>document.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d'),painter=new RigPainter();
let clip={...DEFAULT_CLIP},fraction=0,running=false,last=0,frameId=0;
const message=text=>{$('#message').textContent=text;};
function sync(){
  $('#action').value=clip.action;$('#hand').value=clip.hand;
  for(const input of document.querySelectorAll('[data-param]')){const key=input.dataset.param;input.value=clip[key];document.querySelector(`[data-value="${key}"]`).textContent=key==='durationMs'?`${clip[key]} ms`:key==='contact'?`${Math.round(clip[key]*100)}%`:clip[key];}
  $('#json').value=JSON.stringify(clip,null,2);
  const info=inspectClip(clip);
  $('#metrics').textContent=clip.action==='hook'?`접촉 오차 ${info.contactError.toFixed(1)} px · 팔꿈치 ${info.elbowDegrees.toFixed(0)}° · ${info.reachError>1?'도달 범위 초과 — 목표를 가까이 옮기세요':'팔 길이 고정'}`:'양발 기준점 고정 · 앞손 / 뒷손 독립 · 재생 시간만 변경';
}
function draw(){
  ctx.clearRect(0,0,760,660);ctx.fillStyle='#1b2528';ctx.fillRect(0,0,760,660);
  ctx.strokeStyle='#3b4a43';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(50,617);ctx.lineTo(710,617);ctx.stroke();
  ctx.save();ctx.translate(116,24);ctx.scale(.595,.595);
  painter.draw(ctx,sampleClip(clip,fraction),{bones:$('#bones').checked,ghost:$('#ghost').checked});
  if(clip.action==='hook'){ctx.strokeStyle='#f2a47a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(clip.targetX,clip.targetY,18,0,Math.PI*2);ctx.moveTo(clip.targetX-28,clip.targetY);ctx.lineTo(clip.targetX+28,clip.targetY);ctx.stroke();}
  ctx.restore();$('#position').textContent=`${Math.round(fraction*100)}%`;$('#progress').value=Math.round(fraction*1000);
}
function stop(){running=false;cancelAnimationFrame(frameId);$('#play').textContent='재생';}
function tick(now){if(!running)return;fraction=Math.min(1,fraction+(now-last)/clip.durationMs);last=now;draw();if(fraction===1)stop();else frameId=requestAnimationFrame(tick);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function edit(){stop();const next={...clip,action:$('#action').value,hand:$('#hand').value};for(const input of document.querySelectorAll('[data-param]'))next[input.dataset.param]=Number(input.value);clip=validateClip(next);sync();draw();}
async function boot(){
  await painter.load();sync();draw();for(const b of document.querySelectorAll('button'))b.disabled=false;
  for(const input of document.querySelectorAll('[data-param],select'))input.addEventListener('input',edit);
  for(const id of ['bones','ghost'])$('#'+id).onchange=draw;
  $('#progress').oninput=()=>{stop();fraction=Number($('#progress').value)/1000;draw();};
  $('#play').onclick=()=>{if(running){stop();return;}if(fraction>=1)fraction=0;running=true;last=performance.now();$('#play').textContent='일시정지';frameId=requestAnimationFrame(tick);};
  $('#contact').onclick=()=>{stop();fraction=clip.contact;draw();};
  $('#reset').onclick=()=>{stop();clip={...DEFAULT_CLIP};fraction=0;sync();draw();message('기본값으로 복원했습니다.');};
  $('#save').onclick=()=>{download(new Blob([JSON.stringify(clip,null,2)],{type:'application/json'}),`${clip.action}-${clip.hand}.json`);message('동작 JSON 다운로드를 요청했습니다.');};
  $('#import').onclick=()=>{try{if($('#json').value.length>10000)throw new Error('동작 파일이 너무 큽니다.');const next=validateClip(JSON.parse($('#json').value));stop();clip=next;fraction=0;sync();draw();message('동작을 불러왔습니다.');}catch(e){message(e.message);}};
  $('#atlas').onclick=()=>{
    const out=document.createElement('canvas');out.width=1024;out.height=1152;const c=out.getContext('2d'),rects=[];
    const exported={...clip};
    bakeClip(exported).forEach(({pose,timeMs},i)=>{const x=i%4*256,y=Math.floor(i/4)*384;c.save();c.beginPath();c.rect(x,y,256,384);c.clip();c.translate(x+8,y+10);c.scale(.35,.35);painter.draw(c,pose);c.restore();rects.push({x,y,w:256,h:384,timeMs});});
    out.toBlob(blob=>{if(!blob){message('PNG 내보내기에 실패했습니다.');return;}download(blob,`${exported.action}-${exported.hand}.png`);$('#frame-json').value=JSON.stringify({clip:exported,frames:rects,sheet:{width:1024,height:1152}},null,2);$('#frame-data').hidden=false;message('PNG 다운로드 요청 완료. 프레임 좌표는 내보내기 정보에서 복사할 수 있습니다.');},'image/png');
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}
boot().catch(e=>{$('#metrics').textContent='원화 로드 실패. 서버와 이미지 경로를 확인하세요.';message(e.message);});
