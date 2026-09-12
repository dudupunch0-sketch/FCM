import * as T from './vendor/three.module.min.js';
import {CHARACTER_PROFILES} from './character-profile.js';
import {buildHead} from './character-head.js';
const Y=new T.Vector3(0,1,0);
const sphere=new T.SphereGeometry(1,24,16);
const cylinder=new T.CylinderGeometry(1,1,1,20,1);
const v=a=>new T.Vector3(...a);
const skinMat=color=>new T.MeshPhysicalMaterial({color,roughness:.57,metalness:0,clearcoat:.08,clearcoatRoughness:.7});
function ellipsoid(parent,mat,position,scale){const mesh=new T.Mesh(sphere,mat);mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function box(parent,mat,pos,size){const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.position.set(...pos);m.castShadow=true;parent.add(m);return m;}
function profileGeometry(rings,segments=32){
  const positions=[],indices=[];
  for(const [y,rx,rz] of rings)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz);}
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
// Analytical two-bone IK preserves upper/lower segment lengths during punches and crouches.
export function solveIK(start,target,a,b,pole){
  const axis=target.clone().sub(start),raw=axis.length();
  axis.normalize();if(raw<1e-8)axis.copy(Y);
  const distance=Math.min(a+b-.0001,Math.max(Math.abs(a-b)+.0001,raw));
  const x=(a*a-b*b+distance*distance)/(2*distance),h=Math.sqrt(Math.max(0,a*a-x*x));
  const bend=pole.clone().sub(start);bend.addScaledVector(axis,-bend.dot(axis));
  if(bend.lengthSq()<1e-8)bend.crossVectors(axis,new T.Vector3(0,0,1));
  if(bend.lengthSq()<1e-8)bend.crossVectors(axis,Y);
  bend.normalize();
  return {joint:start.clone().addScaledVector(axis,x).addScaledVector(bend,h),end:start.clone().addScaledVector(axis,distance)};
}
class Segment {
  constructor(parent,mat,a,b){this.mesh=new T.Mesh(new T.CylinderGeometry(b,a,1,24,4),mat);this.mesh.castShadow=true;this.mesh.receiveShadow=true;parent.add(this.mesh);}
  set(a,b){this.mesh.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);this.mesh.scale.y=d.length();this.mesh.quaternion.setFromUnitVectors(Y,d.normalize());}
}
export class FighterModel {
  constructor(index,profile=CHARACTER_PROFILES[index?1:0]){
    this.profile=profile;
    this.index=index;this.group=new T.Group();this.group.rotation.y=index?Math.PI:0;
    const skin=skinMat(profile.colors.skin);
    const skinLight=skinMat(profile.colors.skinLight);
    const skinDark=skinMat(profile.colors.skinDark);
    const leather=new T.MeshPhysicalMaterial({color:profile.colors.kit,roughness:.32,clearcoat:.45,clearcoatRoughness:.3});
    const fabric=new T.MeshStandardMaterial({color:index?'#1f282e':'#222b21',roughness:.91});
    const trim=new T.MeshStandardMaterial({color:index?'#e6835d':'#c4e46a',roughness:.6});
    const ivory=new T.MeshStandardMaterial({color:'#dedccf',roughness:.83});
    const dark=new T.MeshStandardMaterial({color:'#171a18',roughness:.5});
    this.hip=new T.Group();this.group.add(this.hip);
    this.torso=new T.Group();this.group.add(this.torso);
    const torso=new T.Mesh(profileGeometry([[0,.13,.145],[.08,.128,.15],[.18,.145,.19],[.29,.172,.234],[.39,.18,.255],[.47,.155,.243],[.53,.095,.13],[.56,.075,.085]]),skin);this.torso.add(torso);torso.castShadow=true;torso.receiveShadow=true;
    // Continuous trunk silhouette; surface anatomy belongs to the mesh/material,
    // not a stack of overlapping pectoral and abdominal spheres.
    torso.scale.set(profile.body.chestDepth/.168,1,1);
    const waistRatio=profile.body.waistWidth/.29;
    const positions=torso.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const y=positions.getY(i),weight=Math.max(0,1-y/.25);
      positions.setZ(i,positions.getZ(i)*(waistRatio*weight+(profile.body.shoulderWidth/.49)*(1-weight)));
    }
    torso.geometry.computeVertexNormals();
    this.neck=ellipsoid(this.group,skin,[0,1.53,0],[.071,.105,.075]);
    this.head=new T.Group();this.group.add(this.head);
    this.headMesh=buildHead(this.head,profile,{skin,skinDark,ivory,dark});
    // Shorts are separate fitted volumes with a waistband and fabric piping.
    const shorts=new T.Mesh(profileGeometry([[-.04,.14,.18],[.02,.14,.177],[.06,.128,.171]]),fabric);this.hip.add(shorts);
    const belt=new T.Mesh(profileGeometry([[.035,.136,.178],[.075,.13,.175]]),ivory);this.hip.add(belt);
    box(this.hip,trim,[.135,.055,0],[.008,.03,.10]);
    this.arms=[];this.legs=[];
    for(const sign of [1,-1]){
      const upper=new Segment(this.group,skin,.074,.062),fore=new Segment(this.group,skin,.059,.041);
      const shoulder=ellipsoid(this.group,skinLight,[0,0,0],[.09,.09,.085]);
      const elbow=ellipsoid(this.group,skin,[0,0,0],[.059,.061,.057]);
      const muscle=ellipsoid(this.group,skinLight,[0,0,0],[.073,.105,.064]);
      const glove=new T.Group();this.group.add(glove);
      const cuff=new T.Mesh(new T.CylinderGeometry(.057,.061,.075,20),ivory);cuff.rotation.z=Math.PI/2;cuff.position.x=-.055;glove.add(cuff);
      ellipsoid(glove,leather,[.022,0,0],[.11,.087,.078]);
      ellipsoid(glove,leather,[.034,-.06,sign*.037],[.065,.04,.036]);
      const seam=new T.Mesh(new T.TorusGeometry(.06,.002,5,24),ivory);seam.rotation.y=Math.PI/2;seam.position.x=-.025;glove.add(seam);
      box(glove,dark,[-.047,.051,0],[.044,.011,.058]);
      this.arms.push({sign,upper,fore,shoulder,elbow,muscle,glove});
      const thigh=new Segment(this.group,skin,.094,.066),calf=new Segment(this.group,skin,.065,.043);
      const knee=ellipsoid(this.group,skinLight,[0,0,0],[.067,.069,.065]);
      const quad=ellipsoid(this.group,skin,[0,0,0],[.093,.17,.09]);
      const shortLeg=new Segment(this.group,fabric,.123,.119);
      const stripe=new Segment(this.group,trim,.014,.014);
      const boot=new T.Group();this.group.add(boot);
      ellipsoid(boot,dark,[.035,.052,0],[.137,.059,.067]);
      ellipsoid(boot,dark,[-.037,.13,0],[.068,.125,.06]);
      ellipsoid(boot,trim,[.043,.019,0],[.139,.013,.068]);
      for(let l=0;l<5;l++)box(boot,ivory,[.023,.092+l*.023,0],[.013,.008,.063-l*.004]);
      box(boot,trim,[-.066,.21,sign*.04],[.026,.04,.012]);
      this.legs.push({sign,thigh,calf,knee,quad,shortLeg,stripe,boot});
    }
    for(const arm of this.arms){
      for(const cap of [arm.shoulder,arm.elbow,arm.muscle])cap.scale.multiplyScalar(profile.body.armThickness);
      for(const segment of [arm.upper,arm.fore]){segment.mesh.scale.x=profile.body.armThickness;segment.mesh.scale.z=profile.body.armThickness;}
    }
    for(const leg of this.legs){
      for(const cap of [leg.knee,leg.quad])cap.scale.multiplyScalar(profile.body.legThickness);
      for(const segment of [leg.thigh,leg.calf]){segment.mesh.scale.x=profile.body.legThickness;segment.mesh.scale.z=profile.body.legThickness;}
    }
    this.headPoint=new T.Vector3();this.bodyPoint=new T.Vector3();this.glovePoints=[new T.Vector3(),new T.Vector3()];
  }
  pose(m){
    const dir=this.index?-1:1;
    this.group.position.set(dir*(-.57+m.rootX),0,0);
    // Fall around the rear foot; no vertical teleport when the finish overlay appears.
    this.group.rotation.z=dir*m.fall*1.36;
    this.group.position.y=m.fall*.09;
    const hip=v([-.012,.91+m.crouch+m.breath,0]);
    const chest=v([m.lean,1.40+m.crouch+m.breath,0]);
    this.hip.position.copy(hip);this.hip.rotation.y=m.twist*.5;
    this.torso.position.copy(hip);this.torso.rotation.set(0,m.twist,-m.lean*.8);
    this.neck.position.copy(chest).add(v([.012,.12,0]));
    this.head.position.copy(chest).add(v([.055,.26,0]));this.head.rotation.set(0,m.twist*.35,m.headTilt-m.lean*.3);
    const s=Math.sin(m.twist),c=Math.cos(m.twist);
    for(let i=0;i<2;i++){
      const arm=this.arms[i],sign=arm.sign;
      const shoulder=chest.clone().add(v([sign*(this.profile.body.shoulderWidth*.42)*s,.005,sign*(this.profile.body.shoulderWidth*.42)*c]));
      const reach=i===0?m.lead:m.rear;
      const idle=v([i===0?.32:.18,1.47+m.crouch+m.breath,i===0?.16:-.15]);
      idle.x+=m.lean*.5;idle.y-=m.rest*.13;
      idle.lerp(v([.23,1.60+m.crouch,sign*.10]),m.guard);
      idle.lerp(v([.23,1.12+m.crouch,sign*.15]),m.lowGuard);
      const strike=v([.80,1.50+m.crouch*(1-m.body),sign*.01]);
      if(m.body>0)strike.y=1.10;
      if(m.hook>0)strike.z=-.04;
      if(m.overhand>0)strike.y=1.53;
      const target=idle.lerp(strike,reach);
      const pole=v([.17,1.12+m.crouch,sign*(.38+m.hook*.10)]);
      if(m.hook>0||m.overhand>0)pole.y+=.34*reach;
      const ik=solveIK(shoulder,target,.30,.285,pole);
      arm.upper.set(shoulder,ik.joint);arm.fore.set(ik.joint,ik.end);arm.shoulder.position.copy(shoulder);arm.elbow.position.copy(ik.joint);
      arm.muscle.position.copy(shoulder).lerp(ik.joint,.48);arm.muscle.quaternion.copy(arm.upper.mesh.quaternion);
      arm.glove.position.copy(ik.end);arm.glove.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),ik.end.clone().sub(ik.joint).normalize());
    }
    for(const leg of this.legs){
      const sign=leg.sign,lead=sign===1;
      const start=hip.clone().add(v([0,-.035,sign*.11]));
      const foot=v([lead?.255:-.275,.12,sign*.16]);
      // Foot planting compensates the body's forward translation until the final return.
      foot.x+=(lead?m.step*.10:-m.rootX*.7);foot.y+=(lead?Math.sin(m.step*Math.PI)*.02:m.pivot*.055);
      const kneePole=start.clone().add(v([.8,-.2,sign*.16]));
      const ik=solveIK(start,foot,.405,.405,kneePole);
      leg.thigh.set(start,ik.joint);leg.calf.set(ik.joint,ik.end);leg.knee.position.copy(ik.joint);
      leg.quad.position.copy(start).lerp(ik.joint,.42);leg.quad.quaternion.copy(leg.thigh.mesh.quaternion);
      const shortEnd=start.clone().lerp(ik.joint,.51);leg.shortLeg.set(start,shortEnd);
      leg.stripe.set(start.clone().add(v([.01,0,sign*.117])),shortEnd.clone().add(v([.01,0,sign*.12])));
      leg.boot.position.copy(ik.end).add(v([.005,-.12,0]));leg.boot.rotation.y=(lead?-.12:.2)+(!lead?m.pivot*.42:0);
    }
    this.group.updateMatrixWorld(true);
    this.head.getWorldPosition(this.headPoint);this.torso.getWorldPosition(this.bodyPoint);this.bodyPoint.y+=.3;
    this.arms.forEach((a,i)=>a.glove.getWorldPosition(this.glovePoints[i]));
  }
}
