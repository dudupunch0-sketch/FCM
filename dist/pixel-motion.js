// Indices in the generated atlas, separate from all combat decisions.
export const SPRITES=[
  {box:[48,24,320,317],anchor:[106,305]},
  {box:[416,24,328,317],anchor:[119,305]},
  {box:[800,24,344,317],anchor:[118,305]},
  {box:[1216,24,256,317],anchor:[115,305]},
  {box:[48,360,240,308],anchor:[112,294]},
  {box:[448,400,248,268],anchor:[107,254]},
  {box:[824,360,256,308],anchor:[119,294]},
  {box:[1224,432,248,236],anchor:[109,222]},
  {box:[48,688,272,300],anchor:[138,287]},
  {box:[440,688,240,300],anchor:[106,287]},
  {box:[832,752,248,228],anchor:[92,223]},
  {box:[1128,880,376,104],anchor:[188,99]},
];
export function pixelFrame(pose,progress,events,index,ko){
  if(ko&&(!pose||progress>=.78))return 11;
  if(events.some(e=>e.type==='hit'&&e.target===index)&&progress>=.5&&progress<.88)return 8;
  if(pose?.failed)return 9;
  const id=pose?.id??'idle',t=(pose?.phase??0)+progress;
  if(['jab','cross','hook','body','heavy'].includes(id)){
    const impact=id==='jab'?.5:1.5;
    if(t>=impact-.18&&t<impact+.24)return id==='jab'?1:id==='body'?10:2;
    if(t<impact-.18&&id!=='jab')return id==='body'?5:3;
    return 0;
  }
  if(id==='guard'||id==='shell')return 4;
  if(id==='lowguard')return 5;
  if(id==='sway')return progress>.12&&progress<.9?6:0;
  if(id==='weave')return t>.15&&t<(pose?.duration??2)-.15?7:0;
  if(id==='feint')return progress>.15&&progress<.65?10:0;
  if(id==='rest')return 9;
  return 0;
}
export const PLAYER_SPRITES=[
 {box:[48,16,246,328],anchor:[124,322]},
 {box:[414,12,326,332],anchor:[134,326]},
 {box:[816,17,331,327],anchor:[140,321]},
 {box:[1236,27,258,317],anchor:[129,311]},
 {box:[39,351,257,319],anchor:[129,312]},
 {box:[423,409,263,261],anchor:[132,254]},
 {box:[817,366,293,304],anchor:[155,297]},
 {box:[1218,439,250,231],anchor:[126,224]},
 {box:[35,686,292,309],anchor:[165,302]},
 {box:[430,701,250,294],anchor:[125,287]},
 {box:[816,753,234,242],anchor:[114,235]},
 {box:[1104,908,419,92],anchor:[210,89]},
];
