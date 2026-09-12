# Fight Club Manager

선수를 육성하는 격투 매니지먼트 게임. 현재는 **콤보 링**이라는 독립 복싱 전투 시제품이 구현되어 있습니다.

## 실행

외부 패키지 설치가 필요 없는 정적 브라우저 앱입니다. 저장소 루트에서 실행합니다.

```bash
npm start
```

`npm start`는 `config/`의 밸런스 데이터를 `dist/config/`로 동기화한 뒤 정적 서버를 띄웁니다.

브라우저에서 `http://localhost:8000`을 엽니다. ES 모듈을 사용하므로 HTML 파일을 직접 더블 클릭하는 대신 HTTP 서버를 사용하세요.

## 플레이

상대와 정보 스킬카드를 선택하고 경기를 시작합니다. 동작 카드를 눌러 시간축에 배치한 뒤 콤보를 실행하세요. 배치한 동작을 누르면 삭제되고 화살표로 순서를 바꿀 수 있습니다. 빈칸은 호흡 정리로 처리됩니다.

상대 계획은 정보 공개 전에 고정됩니다. 스웨이는 직선 공격, 위빙은 훅을 피합니다. 머리 가드에는 바디 공격, 긴 가드에는 페이크를 활용해 보세요.

## 검증

```bash
npm test
```

`config/`가 밸런스 데이터의 단일 원본입니다. 전투 수치는 코드가 아니라 `config/combat_prototype.json`에 있고, 값을 바꾸면 코드 수정 없이 결과가 바뀝니다. 로더가 각 설계 문서의 검증 기준을 실행하므로 잘못된 값은 파일과 경로를 지목하며 거부됩니다.

## 문서

- [독립 캐릭터 모델 초안과 미리보기](assets/characters/rook/README.md)
- [캐릭터 고정 레퍼런스: 야생의 숨결·왕국의 눈물 링크](docs/art/reference/link/README.md)
- [현재 결정과 전체 게임 범위](docs/spec/current_decisions.md)
- [콤보 전투와 정보 카드 설계](docs/design/18_combo_turn_combat_and_information_cards.md)
- [플랫폼 선택, 구현 범위, 임시 판정 규칙과 한계](docs/design/19_combat_prototype_implementation.md)
- [전투 거리 모델](docs/design/22_combat_range_model.md)
- [라운드 구조와 판정 집계](docs/design/23_round_structure_and_judging.md)
- [Base → Derived 매핑](docs/design/24_base_to_derived_mapping.md)과 [Effective Performance 계층](docs/design/25_effective_performance.md)

현재 시제품은 육성 시스템과 분리되어 있으며 상대 패턴 학습, 전체 선수 능력치 계산, MMA 확장은 아직 미구현입니다.

거리 모델, 라운드 구조, 능력치 계산 계층은 **명세가 코드를 앞선 상태**입니다. 시제품은 아직 거리와 라운드가 없고 `config/`의 밸런스 값을 읽지 않습니다.

화면은 모바일 세로 레이아웃과 Canvas 도트 스프라이트를 사용합니다. 범위는 [모바일 도트 전투와 콤보 편집](docs/design/21b_mobile_pixel_combat.md)을 참고하세요.

과거의 Three.js 입체 렌더러([모델·애니메이션 업그레이드](docs/design/20_fighter_visual_upgrade.md))는 도트 전환으로 대체되어 [`archive/three-renderer/`](archive/three-renderer/README.md)로 옮겼습니다. 배포 경로에 포함되지 않으며, WebGL 실패 시 Canvas로 전환하는 경로도 지금은 없습니다.
