import * as T from './vendor/three.module.min.js';
// One continuous facial envelope: chin, jaw, cheek, brow and cranium.
// Coordinates face +X, so the same head works with the existing combat rig.
export function headGeometry(face,segments=40){
  const rows=[[-.108,.058,.055,0],[-.100,.076,.024,face.chinWidth],[-.080,.089,-.029,face.jawWidth],[-.045,.099,-.069,face.jawWidth*1.22],[-.009,.104,-.095,face.cheekWidth],[.032,.100,-.106,face.cheekWidth],[.071,.093,-.108,face.cheekWidth*.94],[.106,.071,-.094,face.cheekWidth*.81],[.135,.032,-.062,face.cheekWidth*.48],[.149,-.012,-.012,0]];
  const vertices=[],indices=[];
  for(const [y,front,back,width] of rows){
    for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a),mid=(front+back)/2;
      let x=mid+(front-back)/2*c;
      const z=width*s;
      // A narrow nose bridge grows out of the face; no separate ball on the face.
      if(c>0)x+=face.noseProjection*Math.exp(-(((y-.006)/.04)**2+((z)/.021)**2))*c;
      vertices.push(x,y,z);
    }
  }
  for(let row=0;row<rows.length-1;row++)for(let i=0;i<segments;i++){const a=row*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildHead(parent,profile,materials){
  const f=profile.face,{skin,skinDark,ivory,dark}=materials;
  const skull=new T.Mesh(headGeometry(f),skin);skull.name='continuous-head';skull.castShadow=true;skull.receiveShadow=true;parent.add(skull);
  const sphere=new T.SphereGeometry(1,20,12);
  const part=(name,mat,pos,scale)=>{const m=new T.Mesh(sphere,mat);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;};
  const eyeX=-.003+.103*Math.sqrt(1-(f.eyeSpacing/f.cheekWidth)**2);
  for(const sign of [-1,1]){
    part('ear',skin,[-.024,.010,sign*f.cheekWidth],[.020,.031,.012]);
    part('inner-ear',skinDark,[-.018,.009,sign*(f.cheekWidth+.01)],[.008,.018,.004]);
    // Keep the sockets shallow; dark painted rims rather than deep circular pits.
    part('upper-lid',dark,[eyeX+.004,f.eyeHeight+.008,sign*f.eyeSpacing],[.007,.004,f.eyeWidth]);
    part('eye',ivory,[eyeX+.004,f.eyeHeight,sign*f.eyeSpacing],[.007,.007,f.eyeWidth*.88]);
    part('iris',dark,[eyeX+.012,f.eyeHeight,sign*f.eyeSpacing],[.0028,.006,.007]);
    const brow=part('brow',dark,[eyeX+.002,f.eyeHeight+.024,sign*f.eyeSpacing],[.007,.005,f.eyeWidth*1.15]);brow.rotation.x=sign*f.browTilt;
  }
  part('mouth',skinDark,[.102,-.047,0],[.004,.0035,f.mouthWidth]);
  part('lower-lip',skin,[.107,-.054,0],[.004,.003,f.mouthWidth*.86]);
  const hairMat=new T.MeshStandardMaterial({color:profile.hair.color,roughness:.94});
  const hair=new T.Mesh(new T.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI*.43),hairMat);
  hair.name='hair-cap';hair.scale.set(.105,.145,.102);hair.position.set(-.012,.015,0);hair.castShadow=true;parent.add(hair);
  if(profile.hair.style==='swept'){
    const crest=part('swept-hair',hairMat,[.018,.144,-.012],[.078,.028*profile.hair.volume,.092]);crest.rotation.z=-.19;
    const lock=part('hair-lock',hairMat,[.074,.113,.006],[.030,.045,.055]);lock.rotation.z=-.32;
  }else{hair.scale.y*=profile.hair.volume;}
  return skull;
}
