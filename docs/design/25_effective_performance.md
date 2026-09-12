# FCM Delegated Design 25 — Effective Performance 계층

> 상태: 사용자 승인 방향 반영. 계수는 초기 후보이며 밸런싱 전이다.
> 기준: [현재 결정](../spec/current_decisions.md), [Base → Derived 매핑](24_base_to_derived_mapping.md)
> 실물 Config: `config/effective_performance.json`
> 범위: 4계층 전투 아키텍처의 2→3 단계.

## 해결하는 문제

SSOT는 "낮은 Stamina는 공격력 하나가 아니라 Speed, Explosiveness, Guard, Evasion,
Takedown Defense, 판단, Damage Vulnerability에 복합 영향"이라고만 기술하고 함수를 두지 않았다.
23번의 라운드 인터벌 회복도 이 계층이 없으면 정의할 수 없다.

---

# 1. 확정 형태 — Derived별 민감도 계수

```text
effective_d = derived_d × Π clamp(factor_k,d, factor_floor, 1.0)
```

단일 전역 계수를 쓰지 않는다. **능력마다 상태에 대한 민감도가 다르다.**

지쳤을 때 회피가 먼저 사라지고 가드는 비교적 오래 버틴다.
이 차이가 "카디오 압박형"과 "카디오 방어형"이라는 캐릭터 구분을 만든다.
전역 계수를 쓰면 모든 능력이 같은 속도로 떨어져 이 구분이 사라진다.

---

# 2. 계층 경계

명세 §6은 Effective Performance의 입력에 Range와 Setup도 포함시킨다.
그러나 이 둘은 **선수의 상태가 아니라 순간의 상황**이다.

| 계층 | 다루는 것 |
|---|---|
| Derived | 손상·피로 없는 기준 능력 |
| **Effective Performance** | 선수 현재 상태. 스태미너, 부위 손상, 부상, 체중 스트레스, 규칙 친숙도 |
| Action Result | 상황 컨텍스트. 거리, Setup, 상대 행동, 동시 판정 |

거리와 Setup을 이 계층에 넣으면 24번의 이중계산 방지 원칙이 깨진다.
거리는 이미 `effective_distance`(`22번 4장`)에서 작동한다.

---

# 3. 스태미너 곡선

```text
deficit = clamp((plateau - stamina) / (plateau - floor), 0, 1)
factor  = 1 - max_loss_d × deficit ^ curve_exponent
```

- `plateau` = 80. **이 위로는 완전히 평평하다.** SSOT의 "80 이상 거의 최상"을 그대로 구현한다
- `curve_exponent` = 1.6. 지수가 1보다 크므로 스태미너가 낮아질수록 손실이 가속한다
- `max_loss_d`는 **스태미너 0일 때의 최대 손실률**이다. 튜닝 시 "이 능력은 완전히 지치면 몇 %까지 떨어지는가"로 직접 읽힌다

실제 계산값:

| Stamina | Evasion (0.75) | Guard Efficiency (0.40) |
|---|---|---|
| 100 | 1.000 | 1.000 |
| 80 | 1.000 | 1.000 |
| 65 | 0.948 | 0.973 |
| 50 | 0.844 | 0.917 |
| 30 | 0.646 | 0.811 |
| 10 | 0.394 | 0.677 |
| 0 | 0.250 | 0.600 |

## 민감도 배분 원칙

| 구간 | 능력 | 근거 |
|---|---|---|
| 높음 0.70~0.75 | Evasion, Execution Speed, Counter Conversion, Takedown Capability, Bottom Escape | 폭발력과 순발력에 의존한다. 가장 먼저 사라진다 |
| 중간 0.55~0.65 | Impact, Range Control, Clinch/Top Control, Feint Execution | 근력과 지속 압박의 혼합이다 |
| 낮음 0.40~0.45 | Guard Efficiency, Feint Recognition, Submission Defense | 기술과 판단에 의존한다. 지쳐도 상대적으로 남는다 |

## 판단 저하는 여기에 넣지 않는다

SSOT는 저스태미너의 영향으로 "판단 오류"를 든다.
이는 능력치 계수가 아니라 **계획 품질**의 문제이므로 계획 수행 계층에서 다룬다.
Feint Recognition 같은 인지 Derived를 과도하게 깎아 대신 표현하지 않는다.

---

# 4. 부위별 손상

```text
factor = 1 - max_loss × (damage / scale) ^ curve_exponent
```

손상은 전신에 퍼지지 않고 **해당 부위가 실제로 쓰이는 능력만** 깎는다.
SSOT의 "Damage는 해당 기능을 실제로 망가뜨린다"를 구현한다.

| 부위 | 주요 영향 |
|---|---|
| Head | Feint Recognition, Counter Conversion, Evasion |
| Body | Clinch/Top Control, Bottom Escape. 주 효과는 스태미너 경제(5장) |
| Lead Arm | Guard Efficiency, Punch Execution Speed |
| Rear Arm | Punch Impact, Guard Efficiency |
| Lead Leg | Range Control, Evasion, Kick Execution Speed |
| Rear Leg | Kick Impact, Punch Impact, Takedown Capability |

## 좌우와 Stance

Config는 좌우가 아니라 `lead` / `rear`로 키를 둔다. Stance가 L/R을 lead/rear로 해석한다.

24번은 Stance를 Derived 보정에서 제외했다. 여기서 Stance는 **보너스가 아니라 매핑**이므로 충돌하지 않는다.
사우스포의 왼손 손상과 오소독스의 왼손 손상이 다른 능력에 작용한다.

이로써 로드맵 Phase 4의 완료 기준인 "Low Kick 누적이 실제 Footwork 등에 영향"이 성립한다.
리드 레그 손상이 Range Control을 깎으면 거리 지배가 무너지고, 이는 22번의 거리 모델을 통해 전체 전투로 전파된다.

---

# 5. 스태미너 경제

Body 손상과 체중 스트레스는 개별 능력이 아니라 **스태미너 시스템 자체**에 작용한다.

- 바디 손상: 회복량 감소, 소모량 증가
- 체중 스트레스: 최대 스태미너 감소, 회복률 감소

바디 공격이 즉각 위력보다 누적 효과로 보상받는 구조이며, 이는 시제품이 이미 사용하는 방향과 일치한다.

## 라운드 인터벌 회복

23번이 정의를 미룬 항목이다.

```text
recovered = max_stamina × base_fraction × cardio_factor × (1 - recovery_debt_penalty × debt)
                        × (1 - body_damage_recovery_penalty × body_damage)
```

`cap_fraction` = 0.85로 상한을 두어 **완전 회복을 허용하지 않는다.**

카디오가 좋은 선수는 라운드를 거듭해도 회복하고, 나쁜 선수는 회복 폭이 점점 줄어든다.
후반 라운드 붕괴가 확률이 아니라 인과가 된다.

---

# 6. Effective Durability

17개 Derived에는 없지만 SSOT §17이 Finish 조건으로 요구하는 값이다.
**이 계층의 산출물로 정의한다.**

입력: Durability(Base), Head Wear, Head Damage, Stamina, Weight Stress.

지친 선수가 더 쉽게 무너지고, 누적 KO 이력(Head Wear)이 장기적으로 맷집을 깎는다.
SSOT §18의 "반복 KO / Knockdown은 Head Wear에 장기 영향"이 여기서 전투 결과로 연결된다.

---

# 7. 계산 시점

`CombatState.effective_performance_cache`는 **한 칸 안에서만 유효하다.**
칸이 바뀌면 무효화하고 현재 상태로 다시 계산한다.

같은 칸 안에서 상태가 변해도(동시 판정 등) 그 칸의 판정은 칸 시작 시점 스냅샷으로 수행한다.
이는 시제품의 "같은 박자 공격은 같은 스냅샷으로 판정"과 같은 원칙이며 재현성의 전제다.

---

# 8. 미결 항목

- 계수 실측 밸런싱. 현재 값은 설계 의도 표현이며 검증 전이다
- `factor_floor` 0.15의 타당성. 완전히 망가진 능력의 하한
- 부상 `functional_penalty`와 부위 손상 계수의 중복 여부
- 규칙 친숙도의 전역 페널티가 계획 품질 저하와 이중계산되는지
- Skill Card 보정의 적용 지점. Derived 직후인지 이 계층 이후인지
- 체중 스트레스 정규화 범위

---

# 9. 검증 기준

- 스태미너 80 이상에서 모든 계수가 정확히 1.0이다
- 스태미너가 낮아질수록 손실이 가속한다. 선형이 아니다
- 같은 스태미너에서 Evasion이 Guard Efficiency보다 크게 떨어진다
- 리드 레그 손상이 Range Control을 깎고 그 결과가 거리 궤적으로 전파된다
- Stance를 바꾸면 같은 좌우 손상이 다른 능력에 작용한다
- 라운드 인터벌 회복이 `cap_fraction`을 넘지 않는다
- 카디오가 낮은 선수의 회복 폭이 라운드를 거듭할수록 줄어든다
- Effective Performance가 Derived 원본을 변형하지 않는다. 원본은 불변이다
- 한 칸 안에서 판정 스냅샷이 바뀌지 않는다
