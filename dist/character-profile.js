// Art direction controls only. These never alter combat stats or action timing.
const BASE={
  body:{shoulderWidth:.49,waistWidth:.29,chestDepth:.168,armThickness:1,legThickness:1},
  face:{cheekWidth:.093,jawWidth:.066,chinWidth:.037,eyeSpacing:.048,eyeHeight:.034,eyeWidth:.025,browTilt:.12,noseProjection:.025,mouthWidth:.033},
  hair:{style:'swept',volume:1,color:'#29222a'},
  colors:{skin:'#c58e70',skinLight:'#cd977a',skinDark:'#936347',kit:'#afcf59'}
};
const LIMITS={body:{shoulderWidth:[.45,.53],waistWidth:[.27,.32],chestDepth:[.15,.18],armThickness:[.9,1.1],legThickness:[.9,1.1]},face:{cheekWidth:[.087,.102],jawWidth:[.060,.077],chinWidth:[.031,.045],eyeSpacing:[.043,.054],eyeHeight:[.027,.042],eyeWidth:[.022,.028],browTilt:[.04,.20],noseProjection:[.018,.032],mouthWidth:[.028,.038]},hair:{volume:[.85,1.15]}};
export function createCharacterProfile(overrides={}){
  const result=structuredClone(BASE);
  for(const [group,values] of Object.entries(overrides)){
    if(!Object.hasOwn(result,group)||!values||typeof values!=='object'||Array.isArray(values))throw Error(`Unknown character group: ${group}`);
    for(const [key,value] of Object.entries(values)){
      if(!Object.hasOwn(result[group],key))throw Error(`Unknown character field: ${group}.${key}`);
      const range=LIMITS[group]?.[key];
      if(range&&(!Number.isFinite(value)||value<range[0]||value>range[1]))throw Error(`Character proportion out of range: ${group}.${key}`);
      if(key==='style'&&!['swept','cropped'].includes(value))throw Error('Unknown hair style');
      if((group==='colors'||key==='color')&&!/^#[0-9a-f]{6}$/i.test(value))throw Error('Invalid character color');
      result[group][key]=value;
    }
  }
  for(const group of Object.values(result))Object.freeze(group);
  return Object.freeze(result);
}
export const CHARACTER_PROFILES=Object.freeze([
  createCharacterProfile(),
  createCharacterProfile({body:{shoulderWidth:.515,waistWidth:.305,armThickness:1.04},face:{jawWidth:.073,cheekWidth:.097,browTilt:.17},hair:{style:'cropped',volume:.92,color:'#211c20'},colors:{skin:'#9d7057',skinLight:'#aa7b61',skinDark:'#714a38',kit:'#d8775b'}})
]);
