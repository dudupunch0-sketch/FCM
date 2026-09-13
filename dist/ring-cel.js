import {PixelRing} from './ring-pixel.js';
import {CEL_SCALE,CEL_ANCHOR,CEL_BASES,clearExteriorWhite,celPose,celPoint,celContact} from './cel-boxer.js';
import {selectCelAnimation} from './cel-animation.js';

export class CelRing extends PixelRing{
  constructor(canvas,{showCandidates=false}={}){super(canvas);this.showCandidates=showCandidates;}
  animationFrame(pose,progress,m){
    const frame=selectCelAnimation(this.manifest,pose,progress,m);
    return frame&&(this.showCandidates||this.presentation.rows[frame.state].enabled_in_game)?frame:null;
  }
  async load(){
    this.art={};
    for(const name of ['guard','straight']){
      const image=new Image();image.src=new URL(`./assets/cel-boxer/${name}.png`,import.meta.url).href;await image.decode();
      const layer=document.createElement('canvas');layer.width=image.naturalWidth;layer.height=image.naturalHeight;
      const ctx=layer.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,layer.width,layer.height);
      clearExteriorWhite(pixels.data,layer.width,layer.height);ctx.putImageData(pixels,0,0);this.art[name]=layer;
    }
    const directory=new URL('./assets/cel-boxer/animation/',import.meta.url);
    const responses=await Promise.all(['manifest.json','presentation.json'].map(file=>fetch(new URL(file,directory))));
    if(responses.some(response=>!response.ok))throw new Error('2D animation manifest missing');
    [this.manifest,this.presentation]=await Promise.all(responses.map(response=>response.json()));
    this.atlas=new Image();this.atlas.src=new URL(this.manifest.game_input,directory).href;await this.atlas.decode();
    this.ready=true;
    this.canvas.style.imageRendering='auto';
  }
  contactPoint(index,sprite,part,m,pose,progress){
    const frame=this.animationFrame(pose,progress,m);
    if(!frame)return celContact(index,part,m,this.reduced);
    const row=this.presentation.rows[frame.state],point=row.landmarks[frame.index][part==='body'?'body':'head'];
    return {x:CEL_BASES[index]+(index===0?1:-1)*(point[0]-row.anchor[0])*row.scale,y:278+(point[1]-row.anchor[1])*row.scale};
  }
  drawFighter(index,sprite,m,pose,progress){
    const frame=this.animationFrame(pose,progress,m);
    if(frame){
      const c=this.ctx,{rect,state}=frame,row=this.presentation.rows[state];
      c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      c.translate(CEL_BASES[index],278);c.scale((index===0?1:-1)*row.scale,row.scale);
      c.drawImage(this.atlas,rect.x,rect.y,rect.w,rect.h,-row.anchor[0],-row.anchor[1],rect.w,rect.h);c.restore();return;
    }
    const c=this.ctx,source=this.art[celPose(m)],base=CEL_BASES[index],sign=index===0?1:-1;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.translate(base,278);c.scale(sign*CEL_SCALE,CEL_SCALE);
    if(m.fall)c.rotate(-Math.PI*.47*m.fall);
    // Horizontal bands preserve the original face and clothes. Upper-body
    // offsets taper to zero at the soles; idle does not move the planted feet.
    for(let y=0;y<source.height;y+=8){
      const h=Math.min(8,source.height-y),a=celPoint(0,y,m,this.reduced),b=celPoint(0,y+h,m,this.reduced);
      c.drawImage(source,0,y,source.width,h,a.x-CEL_ANCHOR.x,a.y-CEL_ANCHOR.y,source.width,b.y-a.y+.15);
    }
    c.restore();
    if(!m.fall){c.save();c.fillStyle=index===0?'#d6f477':'#f5a58b';c.fillRect(base-16,286,32,2);c.restore();}
  }
}
