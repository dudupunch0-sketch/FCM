# 보관: Three.js 입체 렌더러

모바일 도트 스프라이트 렌더러로 대체된 이전 렌더링 스택입니다.
결정 기록은 `docs/spec/current_decisions.md` Superseded의 "Design 20 → 21b: 렌더링",
설계 문서는 `docs/design/20_fighter_visual_upgrade.md`와 `docs/design/21a_character_model_foundation.md`에 있습니다.

## 왜 지우지 않고 옮겼나

- `dist/`는 정적 서버가 그대로 배포하는 디렉터리다. 여기에 두면 도달하지 않는 코드와
  vendor 717KB가 모든 사용자에게 전송된다.
- 그러나 `character-profile.js`의 비례 시스템과 관절 IK는 재사용 가치가 있다.
  도트 아트의 비례 기준을 다시 잡을 때 참고 대상이다.

따라서 배포 경로에서 빼되 삭제하지 않는다. 기존 테스트는 그대로 통과한다.

## 내용

| 파일 | 역할 |
|---|---|
| `character-profile.js` | 외형 프로필과 허용 범위 |
| `character-head.js` | 연속 얼굴 메시 |
| `fighter-model.js` | 메시·재질과 2관절 IK |
| `ring-3d.js` | 링·조명·카메라 |
| `ring-legacy.js` | WebGL 실패 시 기본 Canvas 화면 |
| `vendor/` | 고정 버전 Three.js와 라이선스 |

`dist/motion.js`는 렌더러에 독립적인 동작 곡선이므로 여기로 옮기지 않았다. 현재도 사용 중이다.
