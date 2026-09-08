import * as T from './vendor/three.module.min.js';
import {FighterModel} from './fighter-model.js';
import {sampleMotion,clamp} from './motion.js';
const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
function mesh(scene,geometry,material,x,y,z){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;}
function rod(scene,a,b,r,material){const p=new T.Vector3(...a),q=new T.Vector3(...b);const m=mesh(scene,new T.CylinderGeometry(r,r,p.distanceTo(q),12),material,0,0,0);m.position.copy(p).add(q).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return m;}
function textTexture(text,color='#b1ba99',size=100){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1024,256);ctx.font=`800 ${size}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,128);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;}
export class Ring3D {
  constructor(canvas){
    this.canvas=canvas;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.scene=new T.Scene();this.scene.background=new T.Color('#101714');this.scene.fog=new T.FogExp2('#101714',.105);
    this.camera=new T.OrthographicCamera(-3.5,3.5,1.35,-1.35,.1,35);this.camera.position.set(1.15,2.35,7);this.target=new T.Vector3(0,1,0);this.camera.lookAt(this.target);this.baseCamera=this.camera.position.clone();
    this.scene.add(new T.HemisphereLight('#dce5f0','#44442c',2.1));
    const key=new T.DirectionalLight('#fff1dc',4.2);key.position.set(-2,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.025;key.shadow.bias=-.00015;key.shadow.camera.far=15;this.scene.add(key);
    const rim=new T.DirectionalLight('#c7e7ff',3.2);rim.position.set(1,3,-4);this.scene.add(rim);
    const warm=new T.PointLight('#ef986f',13,7,2);warm.position.set(2.7,1.7,1);this.scene.add(warm);
    const lime=new T.PointLight('#d5efa1',10,6,2);lime.position.set(-2.7,2,1);this.scene.add(lime);
    this.arena();this.fighters=[new FighterModel(0),new FighterModel(1)];this.fighters.forEach(f=>this.scene.add(f.group));
    this.labels=[];
    for(let i=0;i<2;i++){
      const c=document.createElement('canvas');c.width=512;c.height=128;const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
      const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,toneMapped:false}));sprite.scale.set(.85,.2125,1);sprite.visible=false;this.scene.add(sprite);this.labels.push({canvas:c,texture,sprite,text:''});
    }
    const positions=new Float32Array(24*3);this.particleGeo=new T.BufferGeometry();this.particleGeo.setAttribute('position',new T.BufferAttribute(positions,3));
    this.particles=new T.Points(this.particleGeo,new T.PointsMaterial({color:'#ffe4b7',size:.025,transparent:true,opacity:0,depthWrite:false}));this.scene.add(this.particles);
    this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
    this.contextLost=false;canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.contextLost=true;});canvas.addEventListener('webglcontextrestored',()=>{this.contextLost=false;});
  }
  resize(){const rect=this.canvas.getBoundingClientRect();const w=Math.max(1,rect.width),h=Math.max(1,rect.height);this.renderer.setSize(w,h,false);const half=1.36;this.camera.left=-half*w/h;this.camera.right=half*w/h;this.camera.top=half;this.camera.bottom=-half;this.camera.updateProjectionMatrix();}
  arena(){
    const floor=mat('#48513a',.96),frame=mat('#202620',.5,.25),rope=mat('#b6bca7',.79),black=mat('#171f1b');
    mesh(this.scene,new T.BoxGeometry(8,.16,6),frame,0,-.14,0);
    mesh(this.scene,new T.BoxGeometry(7.7,.035,5.7),floor,0,-.045,0);
    const logo=mesh(this.scene,new T.PlaneGeometry(1.45,.36),new T.MeshBasicMaterial({map:textTexture('FCM','#8b966d',170),transparent:true,depthWrite:false,opacity:.38}),0,-.023,.4);logo.rotation.x=-Math.PI/2;
    const boundary=new T.EdgesGeometry(new T.BoxGeometry(6.8,.002,4.8));const lines=new T.LineSegments(boundary,new T.LineBasicMaterial({color:'#7b855f',transparent:true,opacity:.35}));lines.position.y=-.02;this.scene.add(lines);
    for(const x of [-3.45,3.45])for(const z of [-2.2,2.2]){
      rod(this.scene,[x,-.08,z],[x,1.52,z],.055,frame);
      const pad=mesh(this.scene,new T.CapsuleGeometry(.085,.32,6,12),mat(x<0?'#b4cf63':'#d17d5c',.48),x,1.15,z);pad.castShadow=true;
    }
    for(const y of [.48,.88,1.28]){
      // Foreground rope kept below the fighters' faces, with open corner sight lines.
      rod(this.scene,[-3.45,y,-2.2],[3.45,y,-2.2],.014,rope);
      rod(this.scene,[-3.45,y,-2.2],[-3.45,y,2.2],.014,rope);
      rod(this.scene,[3.45,y,-2.2],[3.45,y,2.2],.014,rope);
    }
    mesh(this.scene,new T.PlaneGeometry(24,14),black,0,4,-4.6);
    for(let x=-8;x<=8;x+=1.7)mesh(this.scene,new T.BoxGeometry(.07,5,.10),frame,x,2,-4.4);
    const sign=mesh(this.scene,new T.PlaneGeometry(4.4,1.1),new T.MeshBasicMaterial({map:textTexture('THE BASEMENT','#9cae8d',104),transparent:true,opacity:.38}),0,2.15,-4.35);
    for(const x of [-2.8,0,2.8]){const emissive=new T.MeshBasicMaterial({color:'#eee8d3'});mesh(this.scene,new T.BoxGeometry(1.1,.035,.18),emissive,x,3.45,-1.4);}
  }
  render(now,frame=null,progress=0,idleFighters=null){
    if(this.contextLost)return;
    const events=frame?.events??[];
    this.fighters.forEach((f,i)=>f.pose(sampleMotion(frame?.poses[i],progress,now,i,events,!!(frame?.fighters[i]??idleFighters?.[i])?.ko,this.reduced)));
    const hit=events.find(e=>e.type==='hit');const impact=hit&&progress>=.5&&progress<.75;
    const pulse=impact?Math.sin((progress-.5)/.25*Math.PI):0;
    this.camera.position.copy(this.baseCamera);
    if(!this.reduced&&impact){const force=hit.counter?.025:.012;this.camera.position.x+=Math.sin(progress*140)*force*pulse;this.camera.position.y+=Math.cos(progress*100)*force*.4*pulse;}
    this.camera.lookAt(this.target);
    this.labels.forEach(l=>l.sprite.visible=false);
    if(progress>=.5&&frame){
      events.filter(e=>['hit','block','evade','feint','exhausted'].includes(e.type)).slice(0,2).forEach((e,i)=>{
        const label=this.labels[i];const actor=e.type==='evade'?e.actor:e.target??e.actor;
        const value=e.type==='hit'?(e.counter?'COUNTER':String(e.power)):e.type==='block'?'BLOCK':e.type==='evade'?'EVADE':e.type==='feint'?(e.success?'OPENING':'FEINT'):'EXHAUSTED';
        if(value!==label.text){const ctx=label.canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.font='800 58px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=10;ctx.shadowColor='#000000';ctx.fillStyle=e.counter?'#e4ff9d':e.type==='evade'||e.type==='block'?'#a7d9f1':'#f9e3c6';ctx.fillText(value,256,64);label.texture.needsUpdate=true;label.text=value;}
        label.sprite.visible=true;label.sprite.material.opacity=clamp(1-(progress-.5)*1.7);label.sprite.position.copy(this.fighters[actor].headPoint).add(new T.Vector3(0,.23+(progress-.5)*.22,.08));
      });
    }
    this.particles.material.opacity=0;
    if(hit&&progress>=.5&&!this.reduced){
      const origin=hit.targetPart==='body'?this.fighters[hit.target].bodyPoint:this.fighters[hit.target].headPoint;
      const age=(progress-.5)*.9,positions=this.particleGeo.attributes.position.array;
      for(let i=0;i<24;i++){const theta=i*2.399963;const r=(.025+age*.55)*(1+(i%4)*.14);positions[i*3]=origin.x+Math.cos(theta)*r;positions[i*3+1]=origin.y+Math.sin(theta)*r-age*age*.8;positions[i*3+2]=origin.z+Math.sin(i*1.2)*r*.6;}
      this.particleGeo.attributes.position.needsUpdate=true;this.particles.material.opacity=clamp(1-age*2.4)*.8;
    }
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.observer.disconnect();this.renderer.dispose();}
}
