// Two supplied drawings, with presentation-only cutout motion. No combat inputs.
// Fixed artwork coordinates also keep the two poses on the same foot baseline.
export const CEL_SCALE=.226;
export const CEL_ANCHOR={x:340,y:996};
export const CEL_BASES=[263,377];

// Remove only near-white pixels connected to the image boundary. Enclosed ivory
// wraps/boots stay opaque. The source files themselves are retained unchanged.
export function clearExteriorWhite(data,width,height){
  const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let read=0,end=0;
  const visit=i=>{if(seen[i])return;seen[i]=1;const k=i*4;
    if(data[k]>=242&&data[k+1]>=242&&data[k+2]>=242){queue[end++]=i;data[k+3]=0;}};
  for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
  for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
  while(read<end){const i=queue[read++],x=i%width,y=Math.floor(i/width);
    if(x)visit(i-1);if(x<width-1)visit(i+1);if(y)visit(i-width);if(y<height-1)visit(i+width);}
  return data;
}
const clamp=x=>Math.max(0,Math.min(1,x));
export function celPose(m){
  // Hook has no approved contact drawing; don't relabel a straight as a hook.
  return (m.id==='jab'||m.id==='cross')&&Math.max(m.lead,m.rear)>.62?'straight':'guard';
}
export function celPoint(x,y,m,reduced=false){
  if(reduced)return {x,y};
  const upper=clamp((950-y)/660),hip=clamp((996-y)/530);
  const crouch=Math.max(0,-m.crouch)*290;
  return {x:x+upper*((m.lean-.025)*180+Math.min(.17,m.rootX)*650),
    y:y+crouch*hip+Math.sin(upper*Math.PI)*m.breath*180};
}
export function celContact(index,part,m,reduced=false){
  const p=celPoint(part==='body'?345:392,part==='body'?385:168,m,reduced),sign=index===0?1:-1;
  return {x:CEL_BASES[index]+sign*(p.x-CEL_ANCHOR.x)*CEL_SCALE,y:278+(p.y-CEL_ANCHOR.y)*CEL_SCALE};
}
