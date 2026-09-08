// Presentation-only motion curves. Time is local to an action, never a combat input.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function track(t,keys){
  if(t<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const [a,v]=keys[i-1],[b,w]=keys[i];return v+(w-v)*smooth((t-a)/(b-a));}}
  return keys.at(-1)[1];
}
const ATTACKS=new Set(['jab','cross','hook','body','heavy']);
export function sampleMotion(pose,progress,now=0,index=0,events=[],finishedKO=false,reduced=false){
  const id=pose?.failed?'rest':pose?.id??'idle';
  const duration=pose?.duration??1,t=(pose?.phase??0)+clamp(progress),impact=id==='jab'?.5:1.5;
  const breath=reduced?0:Math.sin(now*.0025+index*1.4);
  const m={id,rootX:0,crouch:0,lean:.025,twist:0,headTilt:0,guard:0,lowGuard:0,lead:0,rear:0,hook:0,body:0,overhand:0,feint:0,fall:0,hit:0,bodyHit:0,step:0,pivot:0,breath:breath*.005,rest:0};
  if(ATTACKS.has(id)){
    // Load slowly, release quickly, settle smoothly. Jab and cross use different hands.
    const load=track(t,[[0,0],[Math.max(.12,impact-.3),1],[impact,0],[duration,0]]);
    const strike=track(t,[[0,0],[Math.max(.05,impact-.25),0],[impact-.035,.98],[impact,1],[Math.min(duration-.05,impact+.23),.22],[duration,0]]);
    m.rootX=strike*(id==='jab'?.17:.25)-load*.027;
    m.step=track(t,[[0,0],[impact-.2,.5],[impact,1],[duration,0]]);
    m.lean=.025+strike*.075-load*.035;
    const rear=id==='cross'||id==='heavy';m.lead=rear?0:strike;m.rear=rear?strike:0;
    m.twist=(rear?-.68:.36)*strike+(rear?.18:-.10)*load;
    m.pivot=strike*(rear?1:.4);
    if(id==='hook')m.hook=strike;
    if(id==='body'){m.body=strike;m.crouch=-strike*.09;m.twist=strike*.48;}
    if(id==='heavy'){m.overhand=strike;m.rear=strike;m.crouch=-strike*.035;}
  }
  const held=track(t,[[0,0],[.16,1],[Math.max(.17,duration-.18),1],[duration,0]]);
  if(id==='guard'||id==='shell'){m.guard=held;m.crouch=-.025*held;m.lean=.035+.02*held;}
  if(id==='lowguard'){m.lowGuard=held;m.crouch=-.045*held;}
  if(id==='sway'){
    const v=track(t,[[0,0],[.24,.65],[.5,1],[.7,.8],[1,0]]);
    m.lean=-.22*v;m.rootX=-.065*v;m.headTilt=.16*v;m.crouch=-.03*v;
  }
  if(id==='weave'){
    // One continuous U-shaped motion across the entire card, not a bob each beat.
    const v=track(t,[[0,0],[.4,.9],[.65,1],[duration-.35,.9],[duration,0]]);
    m.crouch=-.29*v;m.lean=.12*v;m.rootX=.04*Math.sin(t/duration*Math.PI*2);m.twist=.22*Math.sin(t/duration*Math.PI*2);m.guard=.55*v;
  }
  if(id==='feint'){m.feint=track(t,[[0,0],[.25,.65],[.36,1],[.55,.2],[1,0]]);m.lead=m.feint*.27;m.twist=m.feint*.14;m.rootX=m.feint*.025;}
  if(id==='rest'){m.rest=held;m.crouch=-.014*held;m.lean=.04;m.breath*=2;}
  const hit=events.find(e=>e.type==='hit'&&e.target===index);
  if(hit&&progress>=.5){
    const recoil=track(progress,[[.5,0],[.57,1],[.76,.55],[1,0]]);
    m.hit=recoil;
    if(hit.targetPart==='body'){m.bodyHit=recoil;m.lean+=.18*recoil;m.crouch-=.08*recoil;}
    else{m.lean-=.12*recoil;m.headTilt+=.24*recoil;m.rootX-=.035*recoil;}
  }
  if(finishedKO){m.fall=pose?track(progress,[[.5,0],[.66,.15],[.88,.82],[1,1]]):1;m.crouch-=.17*m.fall;}
  return m;
}

export function advancePlayback(play,frames,delta,speed=1,reduced=false){
  if(play.holdRemaining>0){play.holdRemaining=Math.max(0,play.holdRemaining-delta);return;}
  const previous=play.cursor,next=previous+delta/(reduced?350:760)*speed;
  const tick=Math.floor(previous),contact=tick+.5;
  const event=frames[tick]?.events.find(e=>e.type==='hit'&&(e.counter||e.power>=16));
  if(!reduced&&event&&previous<contact&&next>=contact&&play.heldTick!==tick){play.cursor=contact;play.heldTick=tick;play.holdRemaining=(event.counter?65:40)/speed;}
  else play.cursor=next;
}
