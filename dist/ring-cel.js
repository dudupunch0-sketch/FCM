import {PixelRing} from './ring-pixel.js';
import {CEL_SCALE,CEL_ANCHOR,CEL_BASES,clearExteriorWhite,celPose,celPoint,celContact} from './cel-boxer.js';

export class CelRing extends PixelRing{
  async load(){
    this.art={};
    for(const name of ['guard','straight']){
      const image=new Image();image.src=new URL(`./assets/cel-boxer/${name}.png`,import.meta.url).href;await image.decode();
      const layer=document.createElement('canvas');layer.width=image.naturalWidth;layer.height=image.naturalHeight;
      const ctx=layer.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,layer.width,layer.height);
      clearExteriorWhite(pixels.data,layer.width,layer.height);ctx.putImageData(pixels,0,0);this.art[name]=layer;
    }
    this.ready=true;
    this.canvas.style.imageRendering='auto';
  }
  contactPoint(index,sprite,part,m){return celContact(index,part,m,this.reduced);}
  drawFighter(index,sprite,m){
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
