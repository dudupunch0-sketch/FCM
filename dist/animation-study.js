import {CelRing} from './ring-cel.js';
import {CARDS} from './engine.js';
const ring=new CelRing(document.querySelector('canvas'),{showCandidates:true});await ring.load();
const slider=document.querySelector('#progress'),playButton=document.querySelector('#play');
let action='hook',running=false,start=0;
const descriptions={hook:'검토 중: 팔꿈치 굽힘은 확보했지만 상대와 접촉 위치가 어긋납니다. 게임 적용 보류.',guard:'글러브를 올리고 팔꿈치를 닫아 얼굴을 보호합니다.',weave:'무릎과 골반을 낮추고 앞으로 빠져나온 뒤 일어납니다.'};
document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>{
 action=button.dataset.action;slider.value='0';running=false;playButton.textContent='재생';
 document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#description').textContent=descriptions[action];
});
slider.oninput=()=>{running=false;playButton.textContent='재생';};
playButton.onclick=()=>{running=!running;start=performance.now()-Number(slider.value)/100*CARDS[action].duration*380;playButton.textContent=running?'일시정지':'재생';};
document.querySelector('#contact').onclick=()=>{running=false;playButton.textContent='재생';slider.value=action==='hook'?'75':'50';};
function render(now){
 if(running){slider.value=String(Math.min(100,(now-start)/(CARDS[action].duration*380)*100));if(Number(slider.value)>=100){running=false;playButton.textContent='재생';}}
 const fraction=Number(slider.value)/100,t=Math.min(CARDS[action].duration-.00001,fraction*CARDS[action].duration);
 const pose={id:action,duration:CARDS[action].duration,phase:Math.floor(t)};
 ring.render(fraction*CARDS[action].duration*380,{fighters:[{},{}],poses:[pose,null],events:[]},t%1);
 document.querySelector('#position').textContent=`${slider.value}%`;
 requestAnimationFrame(render);
}requestAnimationFrame(render);
