# FCM Delegated Design 22 — 전투 거리 모델

> 상태: 사용자 승인 방향 반영. 수치는 미확정이며 Config로 관리한다.
> 기준: [현재 결정](../spec/current_decisions.md), [콤보형 턴제 전투](18_combo_turn_combat_and_information_cards.md)
> 범위: 콤보 타임라인에 거리 축을 연결하는 구조 결정. 구현 완료를 의미하지 않는다.

## 해결하는 문제

명세는 Range Control, OptimalRange, RangeTolerance, Reach를 전투의 기둥으로 둔다.
그러나 8칸 콤보 타임라인에는 거리 축이 없었고 시제품도 거리를 연결하지 않았다.
이 상태에서는 리치가 긴 아웃복서와 파고드는 인파이터가 구분되지 않는다.

---

# 1. 확정 방향

**거리는 별도의 스텝 카드가 아니라 동작카드 자체에 내장된 이동으로 변화한다.**

- 잽: 이동 없음
- 플리커잽: 유효 리치 보정을 가진 잽 변형
- 전진훅: 전진 이동 후 타격

같은 기술군의 변형을 Fighter 능력치를 건드리지 않고 Action Data만으로 생성한다.
이는 "선수 능력치를 수정하지 않고 Action Data로 기술 밸런스를 조절한다"는 기존 원칙(`game_spec:7장`)의 직접 적용이다.

별도의 스텝 인/아웃 카드를 금지하지 않는다. 이동만 하는 카드도 같은 필드로 표현되는 특수 사례다.

---

# 2. 거리 표현

두 선수 사이 간격을 **단일 스칼라 `gap`** 하나로 둔다.
선수별 위치 좌표를 두지 않는다. 링 이동과 코너 압박은 현재 범위에 포함하지 않는다.

`gap`은 연속값이며 참고용 밴드 이름을 가진다.

| 밴드 | 의미 |
|---|---|
| Clinch | 붙은 상태. 그래플링 연결 지점 |
| Inside | 훅·바디·짧은 연타의 영역 |
| Mid | 크로스·기본 교환의 영역 |
| Outside | 잽·리치 우위·거리 유지의 영역 |

밴드는 UI 표기와 카드 설명을 위한 이름이며 판정은 연속값으로 수행한다.
밴드 경계값은 Config에 둔다.

---

# 3. Action Data 추가 필드

기존 `ActionDefinition`에 다음을 추가한다.

```text
- range_shift        이 동작이 만드는 gap 변화. 음수는 전진
- shift_timing       이동이 발생하는 구간: Windup | Impact | Recovery
- reach_bonus        이 동작의 유효 리치 보정
```

`optimal_range`와 `range_tolerance`는 기존 스키마에 이미 존재하며 그대로 사용한다.

`shift_timing`이 필요한 이유는 전진훅과 후퇴잽이 같은 `range_shift` 크기를 가져도
타격 시점의 `gap`이 다르기 때문이다. 이동과 타격의 선후가 카드 성격을 결정한다.

---

# 4. 유효 거리와 위력 판정

타격 시점에 다음을 계산한다.

```text
effective_distance = gap - (actor.reach + card.reach_bonus)
range_error        = abs(effective_distance - card.optimal_range)
```

`range_error`가 `card.range_tolerance` 이내면 해당 동작은 자신의 위력을 온전히 발휘한다.
허용폭을 벗어나면 감쇠하며, 감쇠 곡선은 Config에 둔다.

감쇠는 위력 하나만 깎지 않는다. 대상은 다음이며 카드별 비중은 Data로 조정한다.

- Impact
- 명중 판정
- 상대 방어 관통
- 회수 구간 취약도

리치는 자동 플러스가 아니다. 리치가 길면 Outside에서 유리하지만
Inside로 들어온 상대에게는 같은 카드의 `range_error`가 커진다.

---

# 5. 동시 이동 합산

같은 칸에서 양측이 이동을 만들면 `range_shift`를 합산한다.

- 둘 다 전진: 빠르게 붙는다
- 한쪽 전진, 한쪽 후퇴: 상쇄되어 거리가 유지된다
- 둘 다 후퇴: 빠르게 벌어진다

합산 결과는 Clinch 하한과 Outside 상한으로 클램프한다.

---

# 6. Range Control의 역할

`Range Control`은 Base Parameter가 아니라 Derived Capability다.
기여 Base는 Footwork Technique, Agility, Fight IQ이며 정확한 가중치는 별도 결정한다.

**Range Control은 의도한 이동을 실제로 얼마나 만들어내는가의 계수다.**

```text
actual_shift = card.range_shift × control_factor(self.RangeControl, opponent.RangeControl)
```

Range Control이 상대보다 높으면 자신의 이동은 온전히 반영되고 상대의 이동은 덜 반영된다.
이는 "자신에게 유리한 거리를 만들고 유지하는 능력"이라는 기존 정의(`game_spec:8장`)와 일치한다.

`control_factor`의 형태와 상한은 Config로 둔다.
한쪽이 상대 이동을 완전히 무효화하는 값은 허용하지 않는다.

---

# 7. 계획 단계의 예측 가능성

카드가 이동을 들고 있으므로 플레이어는 배치 시점에 자신의 거리 궤적을 예상할 수 있다.
UI는 자기 계획 기준의 예상 거리를 표시하되 **상대 이동을 제외하고 계산했다고 명시한다.**
이는 기존 예상 스태미너 표기(`21_mobile_pixel_combat.md`)와 같은 원칙이다.

상대 이동이 포함된 정확한 거리는 실행 후에만 확정된다.
정보 카드로 상대 이동을 읽는 효과는 정보 공개 규칙의 확장으로 다룬다.

---

# 8. 기존 시스템과의 연결

| 시스템 | 연결 |
|---|---|
| Derived Capability | Range Control이 이동 반영률을 결정 |
| Effective Performance | 스태미너·부상으로 이동 반영률이 떨어짐 |
| Combat Memory | 거리 운영 패턴도 노출·독해 대상 |
| Skill Card | 특정 밴드에서 보너스를 받는 스타일 카드 |
| Grappling | Clinch 하한 도달이 그래플링 진입 조건 후보 |

---

# 9. 미결 항목

- `gap` 초기값. 교환 경계 이월은 [30번](30_combo_boundary_and_sub_beat.md)에서 확정했다
- 밴드 경계값, 감쇠 곡선, `control_factor` 형태
- Clinch 도달 시 처리. 그래플링 확장 전까지의 임시 규칙
- 회피 동작의 이동 성분. 스웨이·위빙이 `gap`을 바꾸는지
- 거리 표시 UI 형태
- **선택 부하**: 배운 기술이 늘어날수록 8칸 계획의 선택지가 과다해지는 문제.
  무작위 덱은 도입하지 않기로 했으므로 카드 그룹핑, 최근 사용 우선 정렬,
  프리셋 콤보, 상황별 추천 등으로 완화한다. 실제 플레이 후 조정한다.

---

# 10. 검증 기준

- 리치가 긴 선수가 Outside에서 유리하고 Inside에서 불리하다
- 전진 카드가 실제로 `gap`을 줄이고 그 결과가 후속 카드 위력에 반영된다
- Range Control이 높은 쪽이 원하는 거리를 더 자주 유지한다
- 동일 Seed·계획·설정에서 거리 궤적이 동일하게 재현된다
- 계획 UI의 예상 거리가 상대 이동 제외임을 명시하고 실제와 다를 수 있음을 표시한다
- 거리 감쇠 없이 모든 카드를 아무 거리에서 써도 되는 상태가 아니다
