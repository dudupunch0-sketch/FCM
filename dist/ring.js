import {PixelRing} from './ring-pixel.js';
import {CelRing} from './ring-cel.js';
export async function createRing(canvas){
  // Opt-in study until missing hook/guard contact poses are authored. The full
  // game keeps its existing action silhouettes rather than silently losing them.
  const cel=new URLSearchParams(location.search).get('art')==='cel';
  if(cel){try{const ring=new CelRing(canvas);await ring.load();canvas.setAttribute('aria-label','2D 복서 캐릭터 동작 시안');return ring;}catch(error){console.warn('2D 시안 로드 실패; 기존 선수로 표시합니다.',error);}}
  const ring=new PixelRing(canvas);await ring.load();return ring;
}
