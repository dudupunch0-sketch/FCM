import {clearExteriorWhite} from './cel-boxer.js';
import {REST} from './rig-motion.js';

// Runtime cutout renderer: original PNG remains byte-for-byte untouched.
export class RigPainter{
  async load(){
    const image=new Image();image.src=new URL('./assets/cel-boxer/guard.png',import.meta.url);await image.decode();
    this.source=document.createElement('canvas');this.source.width=image.width;this.source.height=image.height;
    const c=this.source.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
    const pixels=c.getImageData(0,0,image.width,image.height);clearExteriorWhite(pixels.data,image.width,image.height);c.putImageData(pixels,0,0);
    const head=new Image();head.src=new URL('./assets/cel-boxer/head-source.png',import.meta.url);await head.decode();
    this.head=document.createElement('canvas');this.head.width=head.width;this.head.height=head.height;const hc=this.head.getContext('2d',{willReadFrequently:true});hc.drawImage(head,0,0);const hp=hc.getImageData(0,0,head.width,head.height);clearExteriorWhite(hp.data,head.width,head.height);hc.putImageData(hp,0,0);
  }
  part(c,polygon,from=[0,0],to=from,angle=0,source=this.source){
    c.save();c.translate(...to);c.rotate(angle);c.translate(-from[0],-from[1]);
    c.beginPath();polygon.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.drawImage(source,0,0);c.restore();
  }
  segment(c,from,to,restFrom,restTo,width){
    const angle=Math.atan2(to[1]-from[1],to[0]-from[0])-Math.atan2(restTo[1]-restFrom[1],restTo[0]-restFrom[0]);
    c.save();c.translate(...from);c.rotate(angle);c.translate(-restFrom[0],-restFrom[1]);
    const dx=restTo[0]-restFrom[0],dy=restTo[1]-restFrom[1],len=Math.hypot(dx,dy),angleRest=Math.atan2(dy,dx);
    c.translate(...restFrom);c.rotate(angleRest);c.beginPath();c.roundRect(-width,-width,len+width*2,width*2,width);c.clip();c.rotate(-angleRest);c.translate(-restFrom[0],-restFrom[1]);c.drawImage(this.source,0,0);c.restore();
  }
  draw(c,pose,{bones=false,ghost=false}={}){
    if(ghost){c.save();c.globalAlpha=.16;c.drawImage(this.source,0,0);c.restore();}
    // Legs stay planted. The simple weave preview bends the lower-body texture;
    // stronger body turns need authored replacement patches, not regeneration.
    for(let y=450;y<1024;y+=8){const d=pose.duck*Math.max(0,(940-y)/490),next=pose.duck*Math.max(0,(932-y)/490);c.drawImage(this.source,0,y,687,8,0,y+d,687,8+next-d+.2);}
    c.save();c.transform(1,0,-pose.shift/250,1,pose.shift*480/250,pose.duck);
    // Backing covers areas hidden by the original arms. Deliberately limited to
    // the torso; this is a cutout study, not a fully authored rotating torso.
    c.fillStyle='#e5b78e';c.strokeStyle='#231e19';c.lineWidth=3;c.beginPath();c.moveTo(230,456);c.bezierCurveTo(235,397,211,348,217,278);c.quadraticCurveTo(222,235,303,216);c.lineTo(329,188);c.lineTo(376,210);c.quadraticCurveTo(439,234,428,316);c.lineTo(391,465);c.closePath();c.fill();c.stroke();
    c.fillStyle='#bf886a';c.beginPath();c.moveTo(235,306);c.quadraticCurveTo(262,350,278,451);c.lineTo(235,456);c.closePath();c.fill();
    c.strokeStyle='#875e4d';c.lineWidth=2;c.beginPath();c.moveTo(282,279);c.quadraticCurveTo(314,298,350,293);c.moveTo(365,281);c.quadraticCurveTo(386,296,411,286);c.moveTo(351,311);c.lineTo(340,424);c.moveTo(292,351);c.quadraticCurveTo(314,361,337,351);c.moveTo(348,355);c.quadraticCurveTo(372,368,391,350);c.moveTo(298,386);c.quadraticCurveTo(315,396,334,389);c.moveTo(347,390);c.quadraticCurveTo(366,402,381,388);c.stroke();
    this.part(c,[[285,60],[448,60],[447,220],[415,243],[361,234],[315,213]],[0,0],[0,0],0,this.head);c.restore();
    for(const hand of ['rear','lead']){
      const a=pose.arms[hand],[s,e,w]=REST[hand];
      // Rounded joint backing prevents gaps between rigid texture segments.
      c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(...a.shoulder);c.lineTo(...a.elbow);c.lineTo(...a.wrist);c.strokeStyle='#231e19';c.lineWidth=hand==='lead'?63:53;c.stroke();c.strokeStyle='#e5b78e';c.lineWidth=hand==='lead'?57:47;c.stroke();
      this.segment(c,a.shoulder,a.elbow,s,e,hand==='lead'?25:20);
      this.segment(c,a.elbow,a.wrist,e,w,hand==='lead'?22:18);
      const polygon=hand==='lead'?[[332,331],[333,250],[360,203],[420,210],[453,264],[428,309],[377,345]]:[[490,338],[482,272],[500,231],[534,218],[577,238],[593,278],[570,323],[531,353]];
      const restAngle=Math.atan2(w[1]-e[1],w[0]-e[0]);this.part(c,polygon,w,a.wrist,a.gloveAngle-restAngle);
      if(bones){c.strokeStyle=hand==='lead'?'#d6f477':'#79dcec';c.lineWidth=4;c.beginPath();c.moveTo(...a.shoulder);c.lineTo(...a.elbow);c.lineTo(...a.wrist);c.stroke();for(const p of [a.shoulder,a.elbow,a.wrist]){c.beginPath();c.arc(...p,7,0,Math.PI*2);c.fillStyle=c.strokeStyle;c.fill();}}
    }
  }
}
