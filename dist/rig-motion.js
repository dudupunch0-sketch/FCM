// Pure, portable motion authoring. No AI, browser, or combat-engine dependency.
export const DEFAULT_CLIP = Object.freeze({version:1, action:'hook', hand:'lead', durationMs:760, contact:.75, targetX:580, targetY:250, lean:45, depth:65});
export const LIMITS = Object.freeze({durationMs:[250,2400],contact:[.4,.85],targetX:[400,600],targetY:[190,380],lean:[0,65],depth:[0,100]});
export const REST = Object.freeze({lead:[[245,270],[283,399],[352,327]],rear:[[411,298],[470,394],[522,334]],feet:[[140,941],[514,924]]});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const pointMix=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function gloveOffset(hand,angle){
  const [,e,w]=REST[hand],tip=hand==='lead'?[439,250]:[580,260];
  const rotation=angle-Math.atan2(w[1]-e[1],w[0]-e[0]),x=tip[0]-w[0],y=tip[1]-w[1];
  return [x*Math.cos(rotation)-y*Math.sin(rotation),x*Math.sin(rotation)+y*Math.cos(rotation)];
}

export function validateClip(value){
  if(!value||value.version!==1||!['hook','guard','weave'].includes(value.action)||!['lead','rear'].includes(value.hand))throw new Error('지원하지 않는 동작 파일입니다.');
  const result={version:1,action:value.action,hand:value.hand};
  for(const [key,[min,max]] of Object.entries(LIMITS)){
    if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw new Error(`${key}: ${min}–${max} 범위가 필요합니다.`);
    result[key]=value[key];
  }
  return result;
}

// Analytic two-bone IK. Unreachable targets clamp, never stretch the bones.
export function solveArm(shoulder,target,a,b,bend=1){
  const dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],requested=Math.hypot(dx,dy);
  const d=clamp(requested,Math.abs(a-b)+.001,a+b-.001),angle=Math.atan2(dy,dx);
  const offset=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1));
  const elbow=[shoulder[0]+a*Math.cos(angle+bend*offset),shoulder[1]+a*Math.sin(angle+bend*offset)];
  const wrist=[shoulder[0]+d*Math.cos(angle),shoulder[1]+d*Math.sin(angle)];
  return {shoulder,elbow,wrist,error:Math.abs(requested-d)};
}

export function sampleClip(clip,fraction){
  const t=clamp(fraction),contact=clip.contact;
  const amount=t<=contact?smooth(t/contact):1-smooth((t-contact)/(1-contact));
  const duck=clip.action==='weave'?Math.sin(Math.PI*t)**2*clip.depth:0;
  const shift=clip.action==='hook'?amount*clip.lean:clip.action==='weave'?Math.sin(2*Math.PI*t)*18:0;
  const arms={};
  for(const hand of ['lead','rear']){
    const [s,e,w]=REST[hand],shoulder=[s[0]+shift,s[1]+duck];
    let target=[w[0]+shift,w[1]+duck],punch=clip.action==='hook'&&clip.hand===hand;
    if(punch){const offset=gloveOffset(hand,-.62);target=pointMix(target,[clip.targetX-offset[0],clip.targetY-offset[1]],amount);}
    if(clip.action==='guard')target=pointMix(target,hand==='lead'?[363,257]:[433,258],amount);
    arms[hand]=solveArm(shoulder,target,distance(s,e),distance(e,w));
    arms[hand].gloveAngle=mix(Math.atan2(w[1]-e[1],w[0]-e[0]),-.62,punch?amount:0);
    const offset=gloveOffset(hand,arms[hand].gloveAngle);
    arms[hand].contact=[arms[hand].wrist[0]+offset[0],arms[hand].wrist[1]+offset[1]];
  }
  return {arms,shift,duck,feet:REST.feet.map(p=>[...p]),amount,t};
}

export function inspectClip(clip){
  const pose=sampleClip(clip,clip.contact),arm=pose.arms[clip.hand];
  const upper=distance(arm.shoulder,arm.elbow),lower=distance(arm.elbow,arm.wrist),span=distance(arm.shoulder,arm.wrist);
  return {contactError:distance(arm.contact,[clip.targetX,clip.targetY]),elbowDegrees:Math.acos(clamp((upper*upper+lower*lower-span*span)/(2*upper*lower),-1,1))*180/Math.PI,reachError:arm.error};
}

export function bakeClip(clip,count=12){
  clip=validateClip(clip);
  if(!Number.isInteger(count)||count<4||count>120)throw new Error('프레임 수는 4–120입니다.');
  const phases=Array.from({length:count},(_,i)=>i/(count-1));
  phases[Math.round(clip.contact*(count-1))]=clip.contact;
  return phases.map(phase=>({phase,timeMs:phase*clip.durationMs,pose:sampleClip(clip,phase)}));
}
