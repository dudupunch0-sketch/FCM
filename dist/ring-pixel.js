import {sampleMotion} from './motion.js';
import {SPRITES,PLAYER_SPRITES,pixelFrame,pixelContact} from './pixel-motion.js';
export class PixelRing{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');const preference=matchMedia('(prefers-reduced-motion: reduce)');this.reduced=preference.matches;preference.addEventListener?.('change',e=>{this.reduced=e.matches;this.resetEffects();});this.sheet=new Image();this.playerSheet=new Image();this.ready=false;this.effects=[];}
  resetEffects(){this.effects=[];}
  queueEffects(frame,at){
    for(const e of frame.events){
      if(!['hit','block','evade','feint','exhausted'].includes(e.type))continue;
      const target=e.type==='evade'?e.actor:e.target??e.actor,pose=frame.poses[target];
      const m=sampleMotion(pose,.5,0,target,frame.events,frame.fighters[target]?.ko,this.reduced);
      const sprite=pixelFrame(pose,.5,frame.events,target,frame.fighters[target]?.ko);
      const point=this.contactPoint(target,sprite,e.targetPart,m);
      this.effects.push({...e,...point,at,strong:e.type==='hit'&&(e.counter||e.power>=16)});
    }
  }
  contactPoint(index,sprite,part,m){return pixelContact(index,sprite,part,this.reduced?0:m.rootX);}
  drawFighter(index,spriteIndex,m){
    const c=this.ctx,s=(index===0?PLAYER_SPRITES:SPRITES)[spriteIndex],sign=index===0?1:-1;
    c.save();c.translate((index===0?238:402)+sign*(this.reduced?0:Math.round(m.rootX*60)),278);
    const scale=index===0?.68:.72;c.scale(sign*scale,scale);
    c.drawImage(index===0?this.playerSheet:this.sheet,...s.box,-s.anchor[0],-s.anchor[1],s.box[2],s.box[3]);c.restore();
  }
  async load(){try{this.sheet.src=new URL('./assets/boxer-pixel-sheet.png',import.meta.url).href;this.playerSheet.src=new URL('./assets/player-pixel-sheet.png',import.meta.url).href;await Promise.all([this.sheet.decode(),this.playerSheet.decode()]);this.ready=true;}catch{console.warn('도트 선수 이미지를 불러오지 못했습니다.');}}
  render(now,frame=null,p=0,idleFighters=null){
    const c=this.ctx,W=640,H=320;c.imageSmoothingEnabled=false;
    c.fillStyle='#142431';c.fillRect(0,0,W,H);
    // Playable arena geometry. All fighter artwork comes from the bitmap atlas.
    c.fillStyle='#1c3240';c.fillRect(0,85,W,120);c.fillStyle='#2c454e';c.fillRect(0,205,W,115);
    for(const y of [130,162,195]){c.fillStyle='#425b62';c.fillRect(0,y,W,3);c.fillStyle='#13242c';c.fillRect(0,y+3,W,2);}
    for(const x of [20,610]){c.fillStyle='#101d26';c.fillRect(x,112,10,150);c.fillStyle=x<100?'#759846':'#ad6550';c.fillRect(x-4,120,18,40);}
    c.fillStyle='#233c47';c.fillRect(0,270,W,50);c.fillStyle='#33525b';c.fillRect(0,273,W,2);
    const events=frame?.events??[];
    if(frame)this.effects=this.effects.filter(e=>now-e.at<320);
    const recent=frame?this.effects.find(e=>e.strong&&now-e.at>=0&&now-e.at<100):null;
    const shake=!this.reduced&&recent?Math.round(Math.sin((now-recent.at)*.19)*2*(1-(now-recent.at)/100)):0;
    c.save();c.translate(shake,0);
    for(let i=0;i<2;i++){
      const f=frame?.fighters[i]??idleFighters?.[i],pose=frame?.poses[i],m=sampleMotion(pose,p,now,i,events,f?.ko,this.reduced);
      const spriteIndex=pixelFrame(pose,p,events,i,f?.ko),s=(i===0?PLAYER_SPRITES:SPRITES)[spriteIndex];
      const step=this.reduced?0:Math.round(m.rootX*60);
      const base=i===0?238:402,sign=i===0?1:-1;
      c.fillStyle='#0b182480';c.fillRect(base-48,276,96,5);
      if(this.ready){
        // Feet remain anchored. Whole-sprite vertical bob made the fighters float.
        this.drawFighter(i,spriteIndex,m);
      }else{c.fillStyle='#c1d2d9';c.font='14px system-ui';c.textAlign='center';c.fillText('선수 이미지 로드 실패',base,190);}
    }
    c.restore();
    if(frame){
      for(const e of this.effects){
        const age=now-e.at;if(age<0)continue;
        const {x,y}=e,life=Math.max(0,1-age/(e.strong?120:90));
        c.globalAlpha=life;
        c.fillStyle=e.type==='hit'?(e.counter?'#e4ff94':'#ffdfa6'):e.type==='block'||e.type==='evade'?'#98e5f2':'#e9c377';
        if(!this.reduced&&life>0){
          if(e.type==='hit'){for(let k=0;k<(e.strong?8:4);k++){const a=k*Math.PI/(e.strong?4:2),r=5+(1-life)*(e.strong?24:13);c.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),e.strong?5:3,3);}}
          else if(e.type==='block'){c.fillRect(x-12,y-3,24,3);c.fillRect(x-9,y+4,18,2);}
          else if(e.type==='evade'){c.fillRect(x-23,y,18,2);c.fillRect(x-16,y+6,14,2);}
        }
        c.globalAlpha=this.reduced?1:Math.min(1,Math.max(0,(300-age)/90));
        c.font='bold 16px system-ui';c.textAlign='center';const label=e.type==='hit'?(e.counter?'카운터!':e.guardBreak?'가드 붕괴':String(e.power)):e.type==='block'?'블록':e.type==='evade'?'회피':e.type==='feint'?(e.success?'빈틈!':'페이크'):'기력 부족';
        c.fillText(label,x,Math.round(y-28-(this.reduced?0:Math.min(age/15,12))));c.globalAlpha=1;
      }
    }
  }
}
