# Fight Club Manager

선수를 육성하는 격투 매니지먼트 게임. 현재는 **콤보 링**이라는 독립 복싱 전투 시제품이 구현되어 있습니다.

## 실행

외부 패키지 설치가 필요 없는 정적 브라우저 앱입니다. 저장소 루트에서 실행합니다.

```bash
python3 -m http.server 8000 --directory dist
```

브라우저에서 `http://localhost:8000`을 엽니다. ES 모듈을 사용하므로 HTML 파일을 직접 더블 클릭하는 대신 HTTP 서버를 사용하세요.

## 플레이

상대와 정보 스킬카드를 선택하고 경기를 시작합니다. 동작 카드를 눌러 시간축에 배치한 뒤 콤보를 실행하세요. 배치한 동작을 누르면 삭제되고 화살표로 순서를 바꿀 수 있습니다. 빈칸은 호흡 정리로 처리됩니다.

상대 계획은 정보 공개 전에 고정됩니다. 스웨이는 직선 공격, 위빙은 훅을 피합니다. 머리 가드에는 바디 공격, 긴 가드에는 페이크를 활용해 보세요.

## 검증

```bash
node --test tests/*.test.mjs
```

## 문서

- [캐릭터 고정 레퍼런스: 야생의 숨결·왕국의 눈물 링크](docs/art/reference/link/README.md)
- [현재 결정과 전체 게임 범위](docs/spec/current_decisions.md)
- [콤보 전투와 정보 카드 설계](docs/design/18_combo_turn_combat_and_information_cards.md)
- [플랫폼 선택, 구현 범위, 임시 판정 규칙과 한계](docs/design/19_combat_prototype_implementation.md)

현재 시제품은 육성 시스템과 분리되어 있으며 상대 패턴 학습, 전체 선수 능력치 계산, MMA 확장은 아직 미구현입니다.

입체 캐릭터와 관절 애니메이션의 구현 범위는 [모델·애니메이션 업그레이드](docs/design/20_fighter_visual_upgrade.md)를 참고하세요. WebGL 초기화가 불가능하면 기본 Canvas 화면으로 전환합니다.
