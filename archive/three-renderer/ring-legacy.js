// Procedural joint animation is presentation only; it never resolves a hit.
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
export class Ring {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  render(now,frame=null,progress=0,idleFighters=null){
    const ctx=this.ctx,W=1100,H=410;
    ctx.clearRect(0,0,W,H);
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#101710');sky.addColorStop(1,'#2c3a24');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Ring geometry, light cones and floor are part of the playable arena.
    for(const x of [200,550,900]){const g=ctx.createLinearGradient(x,0,x,330);g.addColorStop(0,'#bde39a14');g.addColorStop(1,'#bde39a00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-30,0);ctx.lineTo(x+30,0);ctx.lineTo(x+180,330);ctx.lineTo(x-180,330);ctx.fill();ctx.fillStyle='#c5d9ad';ctx.fillRect(x-35,12,70,3);}
    ctx.strokeStyle='#687b4230';ctx.lineWidth=1;for(let x=0;x<W;x+=55){ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x,220);ctx.stroke();}ctx.fillStyle='#526747';ctx.font='800 77px sans-serif';ctx.textAlign='center';ctx.globalAlpha=.13;ctx.fillText('FIGHT CLUB',550,151);ctx.globalAlpha=1;
    ctx.fillStyle='#26321f';ctx.beginPath();ctx.moveTo(105,224);ctx.lineTo(995,224);ctx.lineTo(1100,410);ctx.lineTo(0,410);ctx.fill();
    for(let y=225;y<410;y+=37){ctx.strokeStyle='#647a4320';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.save();ctx.translate(550,326);ctx.scale(1,.36);ctx.strokeStyle='#647c46';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,220,140,0,0,Math.PI*2);ctx.stroke();ctx.font='800 70px sans-serif';ctx.fillStyle='#75904b45';ctx.fillText('FCM',0,23);ctx.restore();
    for(const x of [95,1005]){ctx.fillStyle='#121b10';ctx.fillRect(x-6,116,12,152);ctx.fillStyle=x<500?'#b6db62':'#c27c60';ctx.fillRect(x-10,129,20,49);}
    for(const y of [147,181,217]){ctx.strokeStyle='#879a6955';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(95,y);ctx.lineTo(1005,y);ctx.stroke();}
    const effects=frame?.events??[];
    const heavyHit=effects.some(e=>e.type==='hit'&&(e.counter||e.power>=20));
    const shake=!this.reduced&&heavyHit&&progress>.48&&progress<.68?Math.sin(progress*170)*3:0;
    ctx.save();ctx.translate(shake,0);
    for(let i=0;i<2;i++)this.fighter(i,now,frame,progress,idleFighters);
    ctx.restore();
    if(frame&&progress>.47){
      for(const e of effects){
        if(e.type==='rest'||e.type==='finish')continue;
        const target=e.type==='evade'?e.actor:e.target??e.actor;
        const x=target===0?415:685;
        const y=e.targetPart==='body'?237:155;
        const life=Math.max(0,1-(progress-.47)/.53);
        ctx.globalAlpha=life;
        if(e.type==='hit'||e.type==='block'){
          ctx.strokeStyle=e.type==='block'?'#95cbea':e.counter?'#e8ff9a':'#ffd9a4';ctx.lineWidth=2;
          for(let k=0;k<9;k++){const a=k*Math.PI*2/9;const len=(1-life)*36+7;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*len*.4,y+Math.sin(a)*len*.4);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();}
          ctx.fillStyle=ctx.strokeStyle;ctx.font=`800 ${e.counter?27:21}px sans-serif`;ctx.textAlign='center';ctx.fillText(e.type==='block'?'BLOCK':e.counter?'COUNTER':e.guardBreak?'BREAK':String(e.power),x,y-35-(1-life)*25);
        }else{
          ctx.fillStyle=e.type==='evade'?'#95cbea':e.type==='feint'?'#e9c66a':'#ff956f';ctx.font='700 17px sans-serif';ctx.textAlign='center';ctx.fillText(e.type==='evade'?'EVADE':e.type==='feint'?(e.success?'OPENING':'FEINT'):'EXHAUSTED',x,105-(1-life)*15);
        }
        ctx.globalAlpha=1;
      }
    }
    ctx.strokeStyle='#182111';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,373);ctx.lineTo(1100,373);ctx.stroke();
    ctx.strokeStyle='#7f945948';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,370);ctx.lineTo(1100,370);ctx.stroke();
  }
  fighter(i,now,frame,p,idleFighters){
    const ctx=this.ctx,pose=frame?.poses[i];
    const f=frame?.fighters[i]??idleFighters?.[i];
    const id=pose?.failed?'rest':pose?.id??'idle';
    const bob=this.reduced?0:Math.sin(now/340+i*2)*2;
    const pulse=Math.sin(Math.PI*Math.min(1,p));
    let hip=[0,-69],neck=[8,-155],head=[14,-181],frontElbow=[27,-113],frontHand=[49,-152],rearElbow=[-19,-116],rearHand=[15,-151],frontKnee=[33,-38],rearKnee=[-31,-37],frontFoot=[52,0],rearFoot=[-47,0];
    let shift=0,angle=0;
    const isAttack=['jab','cross','hook','body','heavy'].includes(id);
    const impact=id==='jab'?0:1;
    let extension=0;
    if(isAttack){
      if(pose.phase===impact)extension=Math.sin(Math.PI*p);
      else if(pose.phase<impact)extension=-.12*Math.sin(Math.PI*p);
      shift=extension*26;neck[0]+=extension*8;head[0]+=extension*8;
      if(['jab','cross'].includes(id)){frontElbow=mix(frontElbow,[83,-156],extension);frontHand=mix(frontHand,[160,-172],extension);rearHand=mix(rearHand,[9,-155],extension);}
      if(id==='hook'||id==='heavy'){frontElbow=mix(frontElbow,[80,-188],extension);frontHand=mix(frontHand,[153,-174],extension);neck[0]+=extension*5;}
      if(id==='body'){frontElbow=mix(frontElbow,[85,-107],extension);frontHand=mix(frontHand,[157,-100],extension);neck[1]+=extension*11;head[1]+=extension*11;}
    }
    if(id==='guard'||id==='shell'){frontHand=[36,-180];rearHand=[7,-176];frontElbow=[42,-134];rearElbow=[-4,-129];head[0]=12;}
    if(id==='lowguard'){frontHand=[46,-111];rearHand=[16,-108];frontElbow=[29,-82];rearElbow=[-8,-94];}
    if(id==='sway'){neck[0]-=35*pulse;head[0]-=50*pulse;head[1]+=8*pulse;frontElbow[0]-=20*pulse;frontHand[0]-=28*pulse;rearHand[0]-=30*pulse;}
    if(id==='weave'){neck[1]+=40*pulse;neck[0]+=8*pulse;head[1]+=55*pulse;head[0]+=15*pulse;hip[1]+=12*pulse;frontHand[1]+=35*pulse;rearHand[1]+=35*pulse;frontElbow[1]+=20*pulse;}
    if(id==='feint'){frontHand[0]+=Math.sin(p*Math.PI*2)*20;frontHand[1]-=pulse*12;shift=pulse*7;}
    if(id==='rest'){frontHand[1]+=18;rearHand[1]+=16;neck[1]+=bob;head[1]+=bob;}
    const hit=frame?.events.find(e=>e.type==='hit'&&e.target===i);
    if(hit&&p>.49){const recoil=Math.sin((p-.49)/.51*Math.PI);head[0]-=recoil*24;neck[0]-=recoil*12;shift-=recoil*15;}
    const ko=f?.ko&&(p>.55||!frame);
    if(ko){angle=-Math.PI*.46*(frame?Math.min(1,(p-.55)*3):1);shift-=20;}
    const baseX=i===0?423:677,baseY=349;
    ctx.save();ctx.translate(baseX,baseY);ctx.fillStyle='#070b07aa';ctx.beginPath();ctx.ellipse(0,4,75,12,0,0,Math.PI*2);ctx.fill();ctx.scale(i===0?1.15:-1.15,1.15);ctx.translate(shift,bob);ctx.rotate(angle);
    const skin=i===0?'#bd9570':'#986d52',light=i===0?'#dfb28a':'#ba8b69',shadow=i===0?'#896a50':'#684938',kit=i===0?'#b6dd52':'#d98260';
    const line=(points,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((pt,j)=>j?ctx.lineTo(...pt):ctx.moveTo(...pt));ctx.stroke();};
    const limb=(pts,width)=>{line(pts,width+3,'#10170f');line(pts,width,skin);line(pts.map(([x,y])=>[x-2,y-2]),width*.25,light);};
    limb([[hip[0]-15,hip[1]+9],rearKnee,rearFoot],17);limb([[hip[0]+15,hip[1]+9],frontKnee,frontFoot],20);
    line([[rearFoot[0]-8,0],[rearFoot[0]+10,0]],14,'#141b12');line([[frontFoot[0]-4,0],[frontFoot[0]+18,0]],15,'#141b12');line([[frontFoot[0]-4,-4],[frontFoot[0]+14,-4]],3,kit);
    limb([[neck[0]-18,neck[1]+12],rearElbow,rearHand],16);
    const torso=ctx.createLinearGradient(-25,-125,40,-100);torso.addColorStop(0,shadow);torso.addColorStop(.5,skin);torso.addColorStop(1,light);ctx.fillStyle=torso;ctx.strokeStyle='#10170f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(neck[0]-22,neck[1]+8);ctx.quadraticCurveTo(neck[0]+3,neck[1]-4,neck[0]+28,neck[1]+13);ctx.lineTo(hip[0]+22,hip[1]+5);ctx.lineTo(hip[0]-21,hip[1]+5);ctx.closePath();ctx.fill();ctx.stroke();
    line([[neck[0]+4,neck[1]+34],[hip[0]+5,hip[1]-9]],1.5,shadow);line([[neck[0]-13,neck[1]+39],[neck[0]+3,neck[1]+43],[neck[0]+20,neck[1]+37]],2,shadow);
    ctx.fillStyle=kit;ctx.strokeStyle='#131a11';ctx.beginPath();ctx.moveTo(hip[0]-23,hip[1]-3);ctx.lineTo(hip[0]+24,hip[1]-3);ctx.lineTo(hip[0]+32,hip[1]+28);ctx.lineTo(hip[0]+3,hip[1]+28);ctx.lineTo(hip[0]-2,hip[1]+17);ctx.lineTo(hip[0]-6,hip[1]+28);ctx.lineTo(hip[0]-29,hip[1]+26);ctx.closePath();ctx.fill();ctx.stroke();line([[hip[0]-23,hip[1]-1],[hip[0]+24,hip[1]-1]],7,'#e4e5d7');
    limb([[neck[0]+16,neck[1]+16],frontElbow,frontHand],20);
    line([[neck[0]+4,neck[1]+7],[head[0],head[1]+20]],15,skin);
    ctx.save();ctx.translate(...head);ctx.fillStyle=skin;ctx.strokeStyle='#152011';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,19,24,-.08,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#22231c';ctx.beginPath();ctx.ellipse(-3,-13,18,12,-.1,Math.PI,Math.PI*2);ctx.lineTo(13,-9);ctx.quadraticCurveTo(0,-18,-18,-4);ctx.fill();ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(15,-3);ctx.lineTo(24,3);ctx.lineTo(14,6);ctx.fill();line([[10,-5],[16,-4]],2,'#22271b');line([[11,13],[17,12]],2,shadow);ctx.restore();
    for(const hand of [rearHand,frontHand]){ctx.fillStyle='#e4e8d7';ctx.beginPath();ctx.ellipse(hand[0]-5,hand[1]+4,9,10,-.2,0,Math.PI*2);ctx.fill();ctx.fillStyle=kit;ctx.strokeStyle='#162010';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(hand[0]+2,hand[1]-3,15,13,-.3,0,Math.PI*2);ctx.fill();ctx.stroke();line([[hand[0]-3,hand[1]-10],[hand[0]+7,hand[1]-11]],2,'#ffffff65');}
    ctx.restore();
  }
}
