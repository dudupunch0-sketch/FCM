import {clamp,track} from './motion.js';

// Map engine action time onto art time; this never changes gameplay timing.
// Read per-frame durations and rectangles from the exported manifest.
export function selectCelAnimation(manifest,pose,progress,m){
  if(!pose||pose.failed||m.hit>0||m.fall>0)return null;
  const state=pose.id==='shell'?'guard':pose.id;
  const row=manifest?.animation.rows[state];
  if(!row)return null;
  const t=(pose.phase??0)+clamp(progress),duration=pose.duration??1;
  let phase=clamp(t/duration);
  if(state==='hook')phase=track(t,[[0,0],[1.18,.25],[1.465,.5],[1.7,.75],[duration,1]]);
  if(state==='guard')phase=track(t,[[0,0],[.09,.25],[.18,.5],[Math.max(.19,duration-.12),.74],[duration,1]]);
  const durations=row.durations_ms??Array(row.frames).fill(1000/row.fps);
  const total=durations.reduce((sum,n)=>sum+n,0),clock=phase*total;
  let end=0,index=durations.length-1;
  for(let i=0;i<durations.length;i++){end+=durations[i];if(clock<end){index=i;break;}}
  return {state,index,rect:manifest.frame_layout.rows[state][index]};
}
