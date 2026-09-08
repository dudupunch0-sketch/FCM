// WebGL presentation with a functional Canvas fallback. Combat is renderer-independent.
import {Ring as LegacyRing} from './ring-legacy.js';
export async function createRing(canvas){
  try {
    const {Ring3D}=await import('./ring-3d.js');
    const ring=new Ring3D(canvas);
    canvas.setAttribute('aria-label','입체 복서의 펀치, 가드, 회피, 피격과 다운 애니메이션');
    return ring;
  } catch(error) {
    // A failed WebGL context can lock the original canvas to that context type.
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);
    const ring=new LegacyRing(replacement);
    console.warn('입체 그래픽을 사용할 수 없어 기본 전투 화면으로 전환합니다.',error);
    return ring;
  }
}
