import {sampleMotion} from './motion.js';
import {SPRITES,PLAYER_SPRITES,pixelFrame} from './pixel-motion.js';
export class PixelRing{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.sheet=new Image();this.playerSheet=new Image();this.ready=false;}
  async load(){try{this.sheet.src=new URL('./assets/boxer-pixel-sheet.png',import.meta.url).href;this.playerSheet.src=new URL('./assets/player-pixel-sheet.png',import.meta.url).href;await Promise.all([this.sheet.decode(),this.playerSheet.decode()]);this.ready=true;}catch{console.warn('도트 선수 이미지를 불러오지 못했습니다.');}}
  render(now,frame=null,p=0,idleFighters=null){
    const c=this.ctx,W=640,H=320;c.imageSmoothingEnabled=false;
    c.fillStyle='#142431';c.fillRect(0,0,W,H);
    // Playable arena geometry. All fighter artwork comes from the bitmap atlas.
    c.fillStyle='#1c3240';c.fillRect(0,85,W,120);c.fillStyle='#2c454e';c.fillRect(0,205,W,115);
    for(const y of [130,162,195]){c.fillStyle='#425b62';c.fillRect(0,y,W,3);c.fillStyle='#13242c';c.fillRect(0,y+3,W,2);}
    for(const x of [20,610]){c.fillStyle='#101d26';c.fillRect(x,112,10,150);c.fillStyle=x<100?'#759846':'#ad6550';c.fillRect(x-4,120,18,40);}
    c.fillStyle='#233c47';c.fillRect(0,270,W,50);c.fillStyle='#33525b';c.fillRect(0,273,W,2);
    const events=frame?.events??[],strong=events.some(e=>e.type==='hit'&&(e.counter||e.power>=16));
    const shake=!this.reduced&&strong&&p>.5&&p<.68?Math.round(Math.sin(p*130)*2):0;
    c.save();c.translate(shake,0);
    for(let i=0;i<2;i++){
      const f=frame?.fighters[i]??idleFighters?.[i],pose=frame?.poses[i],m=sampleMotion(pose,p,now,i,events,f?.ko,this.reduced);
      const spriteIndex=pixelFrame(pose,p,events,i,f?.ko),s=(i===0?PLAYER_SPRITES:SPRITES)[spriteIndex];
      const step=this.reduced?0:Math.round(m.rootX*60),bob=this.reduced||f?.ko?0:Math.round(Math.sin(now*.006+i*2));
      const base=i===0?238:402,sign=i===0?1:-1;
      c.fillStyle='#0b182480';c.fillRect(base-48,276,96,5);
      if(this.ready){
        c.save();c.translate(base+sign*step,278+bob);const scale=i===0?.68:.72;c.scale(sign*scale,scale);
        c.drawImage(i===0?this.playerSheet:this.sheet,...s.box,-s.anchor[0],-s.anchor[1],s.box[2],s.box[3]);c.restore();
      }else{c.fillStyle='#c1d2d9';c.font='14px system-ui';c.textAlign='center';c.fillText('선수 이미지 로드 실패',base,190);}
    }
    c.restore();
    if(frame&&p>=.5){
      for(const e of events){if(!['hit','block','evade','feint','exhausted'].includes(e.type))continue;
        const target=e.type==='evade'?e.actor:e.target??e.actor,x=target===0?263:377,y=e.targetPart==='body'?167:105,life=Math.max(0,1-(p-.5)*2);
        c.globalAlpha=this.reduced?1:life;
        c.fillStyle=e.type==='hit'?(e.counter?'#e4ff94':'#ffdfa6'):e.type==='block'||e.type==='evade'?'#98e5f2':'#e9c377';
        if((e.type==='hit'||e.type==='block')&&!this.reduced){for(let k=0;k<8;k++){const a=k*Math.PI/4,r=8+(1-life)*22;c.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),4,4);}}
        c.font='bold 16px system-ui';c.textAlign='center';const label=e.type==='hit'?(e.counter?'카운터!':e.guardBreak?'가드 붕괴':String(e.power)):e.type==='block'?'블록':e.type==='evade'?'회피':e.type==='feint'?(e.success?'빈틈!':'페이크'):'기력 부족';
        c.fillText(label,x,Math.round(y-28-(this.reduced?0:(1-life)*12)));c.globalAlpha=1;
      }
    }
  }
}
