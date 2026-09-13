# FCM Delegated Design 24 — Base → Derived 매핑

> 상태: 사용자 승인 방향 반영. 가중치는 초기 후보이며 밸런싱 전이다.
> 기준: [현재 결정](../spec/current_decisions.md), [거리 모델](22_combat_range_model.md)
> 실물 Config: `config/derived_capability.json`
> 범위: 4계층 전투 아키텍처의 1→2 단계. Effective Performance 계층은 별도 문서다.

## 해결하는 문제

`Base Parameter → Derived Capability → Effective Performance → Action Result`는 명세 전반의 척추다.
그러나 18개 Base가 17개 Derived로 어떻게 연결되는지에 대한 공식이 존재하지 않았고,
저장소에 밸런스 Config 파일이 하나도 없어 "모든 밸런스는 Data화한다"는 원칙이 선언에만 머물렀다.

---

# 1. 확정 형태 — 가중 기하평균

```text
raw      = Π clamp(Base_i, floor, ceiling) ^ w_i      단, Σ w_i = 1
Derived  = raw × Π (body_source_j ^ e_j)
```

산술 가중합이 아니라 **기하평균**을 쓴다.

## 이유

핵심 원칙은 다음이다.

> 높은 숫자 총합이 게임의 정답이 되어서는 안 된다.

가중합은 이 원칙과 정면으로 충돌한다. 약한 Base 하나가 다른 높은 Base로 그대로 메워지기 때문이다.
기하평균은 **병목형**이다. 약점 하나가 Derived 전체를 끌어내린다.

Punch Impact 실제 계산 예시:

| 선수 | Punch Tech | Strength | Explosive | 기하평균 | 가중합 |
|---|---|---|---|---|---|
| 힘만 센 선수 | 20 | 90 | 60 | **43.7** | 53.0 |
| 기술만 좋은 선수 | 90 | 20 | 60 | **50.8** | 60.0 |
| 균형형 | 57 | 57 | 57 | **57.0** | 57.0 |

균형이 잡히면 두 방식이 일치하고, 편중될수록 기하평균이 낮아진다.
즉 **불균형에만 비용이 발생한다.** 균형 선수를 보상하는 것이 아니라 구멍을 처벌한다.

"보완할 것인가, 강점을 극단으로 밀 것인가"(`game_spec:1장`)라는 질문이 실제 선택이 되려면
극단에 대가가 있어야 한다. 대가는 Skill Card와 Action Data가 상쇄한다.

## 하한값 보호

기하평균은 Base가 0이면 전체가 0이 된다.
`base_floor`(초기 10)로 클램프해 이를 막는다. 0 근처의 극단적 붕괴를 허용하지 않는다.

---

# 2. 매핑 테이블

전체 수치는 `config/derived_capability.json`에 있다. 아래는 주축 요약이다.

| Derived | 주축 (최대 가중) | 함께 작용 |
|---|---|---|
| Punch Impact | Punch Technique .40 | Strength, Explosiveness, 체중 |
| Punch Execution Speed | Explosiveness .40 | Punch Technique, Agility |
| Kick Impact | Kick Technique .40 | Strength, Explosiveness, 체중·신장 |
| Kick Execution Speed | Explosiveness / Kick Tech .35 | Agility, 신장(역보정) |
| Range Control | Footwork Technique .45 | Agility, Fight IQ |
| Guard Efficiency | Guard Technique .55 | Durability, Strength |
| Evasion Capability | Agility / Reflex .35 | Guard Technique, Footwork |
| Counter Conversion | Reflex .35 | Fight IQ, Punch Tech, Explosiveness |
| Feint Execution | Fight IQ .35 | Punch Tech, Footwork, Tactical Execution |
| Feint Recognition | Fight IQ .45 | Reflex, Guard Technique |
| Takedown Capability | Takedown Technique .45 | Strength, Explosiveness, Agility |
| Takedown Defense | TD Defense Technique .50 | Strength, Agility, Reflex |
| Clinch Control | Clinch Technique .45 | Strength, Durability, Cardio, 체중 |
| Top Control | Ground Top Technique .50 | Strength, Cardio, Durability, 체중 |
| Bottom Escape | Ground Bottom Technique .50 | Agility, Explosiveness, Cardio |
| Submission Threat | Submission Technique .50 | Ground Top, Strength, Fight IQ |
| Submission Defense | Submission Technique .45 | Fight IQ, Ground Bottom, Durability |

18개 Base가 모두 최소 한 곳에 사용된다. 사용되지 않는 Base는 없다.

## Guard Technique이 Evasion에도 들어가는 이유

기존 결정(`current_decisions:8장`)에 명시돼 있다.

> Block과 Evasion은 별도 행동이지만 Guard Technique은 둘 모두에 도움.

---

# 3. 의도적으로 기여가 적은 Base

세 개는 Derived 기여가 작다. 누락이 아니라 **다른 계층에서 작동하기 때문**이다.

| Base | 실제 작동 계층 |
|---|---|
| Cardio | Effective Performance. 스태미너 곡선과 라운드 인터벌 회복(`23번 3장`) |
| Durability | Effective Performance. 피격 내구와 Finish 저항 |
| Tactical Execution | 계획 수행 계층. 코너 지시 반영률과 지시된 Sequence 충실도 |

Cardio를 Derived에 크게 넣으면 스태미너 계층과 이중계산이 된다.
Durability도 마찬가지다. 이 셋은 "Derived를 올리는" 스탯이 아니라 **Derived를 유지시키는** 스탯이다.

---

# 4. 이중계산 방지 원칙

**한 요소는 한 계층에서만 작동한다.**

| 요소 | 작동 위치 | Derived 제외 |
|---|---|---|
| Reach | 거리 판정의 `effective_distance`(`22번 4장`) | Range Control에 넣지 않음 |
| Age | Base Parameter를 직접 감소시킴(Aging Decline) | 별도 Derived 보정 없음 |
| Stance | 매치업 상성. Action Result 계층 | Derived 보정 없음 |
| Stamina / Injury | Effective Performance | Derived는 손상 없는 기준값 |

특히 Reach가 중요하다. 리치는 이미 거리 모델에서 유효 거리를 바꾼다.
Range Control에도 리치를 넣으면 "긴 팔이 거리도 잘 잡고 닿기도 잘 닿는" 이중 보상이 된다.

**Derived는 손상·피로가 없는 상태의 기준 능력이다.** 현재 상태 반영은 전부 Effective Performance의 몫이다.

---

# 5. Body 보정

체중과 신장만 곱셈 보정으로 들어간다.

- `mass_ratio` = 현재 체중 / 체급 기준 체중, `[0.85, 1.15]` 클램프
- `height_ratio` = 신장 / 체급 기준 신장, `[0.9, 1.1]` 클램프

체급 내 상대값이므로 **체급을 올리는 것만으로 유리해지지 않는다.**
체급 상승 시 기준 체중도 함께 올라가 `mass_ratio`는 오히려 낮아진다.
이는 "체급 상승이 즉시 상위호환이 아니다"(`current_decisions:19장`)와 일치한다.

Kick Execution Speed의 신장 지수만 음수다. 큰 선수의 킥이 느린 것을 반영한다.

---

# 6. Config 구조

`config/derived_capability.json`이 저장소 최초의 밸런스 Config다.
`data_model_part1_part2.md:40장`의 Config 그룹 목록에 대응한다.

```text
config/
  derived_capability.json   ← 이번 문서
  (이후) combat.json, actions.json, cardio.json, injury.json, ...
```

Definition Data이므로 `dist/`가 아니라 저장소 루트에 둔다.
시제품 `dist/engine.js`는 아직 이 파일을 읽지 않는다. Definition Data Loader는 로드맵 Phase 0 항목이다.

## 검증 가능한 불변식

- `capabilities` 항목 수 = 17
- 각 항목의 `weights` 합 = 1.0
- 모든 Base 이름이 18개 정식 명칭에 존재
- 18개 Base가 모두 최소 1회 사용

---

# 7. 미결 항목

- 가중치 실측 밸런싱. 현재 값은 설계 의도 표현이며 검증 전이다
- `base_floor` 확정값. 10이 적절한지 Monte Carlo로 확인
- 출력 스케일. Derived를 0~100으로 유지할지 Action Data와 곱해 실수로 둘지
- 체급 기준 체중·신장 테이블
- Skill Card의 Derived 보정 적용 지점. Derived 직후인지 Effective 계층인지
- Technique 숙련도가 Derived에 관여하는지. 현재는 Action Data 측에서만 작동한다고 가정

---

# 8. 검증 기준

- 편중형 선수의 주력 Derived가 균형형보다 낮게 나온다
- 모든 Base를 균등하게 올린 선수는 기하평균과 가중합이 일치한다
- Base 하나가 최저값이어도 Derived가 0이 되지 않는다
- 체급을 올렸을 때 `mass_ratio`가 상승하지 않는다
- 리치가 Range Control 값에 영향을 주지 않는다
- 스태미너·부상 상태가 Derived 값을 바꾸지 않는다
- Config 값만 바꿔 코드 수정 없이 Derived 결과가 변한다
