# FCM 기획 인터뷰 06 — Derived Capability / Action / Damage / Scoring

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: Derived Capability, Action Data, Cardio Curve, Damage/Finish, Technique/Skill Card, 심판 채점 구조 확정  
> 상태: **6차 인터뷰 확정안**

---

## 0. 전투 계산 기본 계층

기존에 승인한 다음 계층을 유지한다.

**Base Parameter → Derived Capability → Effective Performance → Action Result**

- Base Parameter: 직접 훈련/성장하는 선수의 근본 능력치
- Derived Capability: Base Parameter들의 조합으로 언제든 재계산되는 실전 역량
- Effective Performance: 피로, 부상, 체중, 거리, Setup, 규칙 숙련도 등 현재 Context가 반영된 순간 성능
- Action Result: 특정 기술을 실제로 사용한 결과

Derived Capability는 독립 성장 스탯으로 저장하지 않는 것을 기본 원칙으로 한다.

---

## A. Derived Capability 관리 원칙

승인.

- 훈련 가능한 값은 Base Parameter다.
- Derived Capability는 Base Parameter 및 신체 데이터에서 계산한다.
- Base 값이 변하면 Derived 값도 자동 갱신된다.
- Derived 값을 직접 훈련하거나 독립 성장시키지 않는다.
- 모든 공식과 가중치는 데이터/Parameter로 조절 가능하게 설계한다.

---

## B. Striking Derived Capability

승인.

주요 파생값 후보:

- Punch Impact
- Punch Execution Speed
- Kick Impact
- Kick Execution Speed
- Range Control
- Guard Efficiency
- Evasion Capability

Accuracy는 고정 파생 스탯으로 두지 않고, 공격 Technique / Fight IQ / Reflex / 거리 / 상대 방어 / 피로 / Setup 등의 Context를 이용해 Action Result 단계에서 계산한다.

각 Action에는 별도의 기술 데이터가 존재하며, 같은 선수라도 기술에 따라 Impact, Speed, Energy Cost, Optimal Range 등이 달라진다.

---

## C. Counter / Feint 구조

승인.

### Counter Conversion

카운터 기회가 생겼을 때 실제 공격으로 전환하는 능력.

주요 영향:
- Reflex
- Fight IQ
- 해당 Technique

실제 Counter Success에는 추가로 다음 Context가 반영된다.
- 상대 Vulnerability
- Read Confidence
- Setup
- Range
- 현재 피로/부상

### Feint Execution

주요 영향:
- Fight IQ
- 해당 Technique

### Feint Recognition

주요 영향:
- Fight IQ
- Reflex
- Combat Memory

실제 Feint 성공은 상대의 Expectation과 해당 순간의 Setup Context를 함께 비교한다.

---

## D. Grappling Derived Capability

승인.

주요 파생값 후보:

- Takedown Capability
- Takedown Defense
- Clinch Control
- Top Control
- Bottom Escape
- Submission Threat
- Submission Defense

Takedown Entry와 Finish는 하나의 `Takedown Capability`로 통합한다.

실제 Takedown 성공은 단순 능력치 대결이 아니라 다음과 같은 Context를 추가 반영한다.
- 거리
- 상대 자세
- Setup
- 상대 Expectation
- Grapple Advantage
- Cardio
- 순간 상태

---

## E. Grapple Advantage

승인.

`Grapple Advantage`는 선수의 고정 스탯이 아니라 현재 순간의 전투 상태값이다.

예:
- 상대의 큰 공격이 빗나감
- 상대 자세가 무너짐
- 타격 Setup으로 가드가 상체에 집중됨
- 클린치에서 상대 균형이 깨짐

좋은 그래플러라는 이유만으로 Advantage가 자동 발생하는 것이 아니라, 좋은 그래플러는 만들어진 Advantage를 더 잘 활용한다.

---

## F. Cardio 내부 파생 구조

승인.

Base Parameter는 `Cardio` 하나로 유지한다.

내부적으로 필요에 따라 다음 성능을 계산한다.
- Energy Capacity
- Energy Efficiency
- Short Recovery
- Between-Round Recovery

이 값들은 독립 성장 스탯이 아니라 Cardio를 기반으로 한 파생값이다.

---

## G. Cardio / Stamina 성능 저하 Curve

스태미너 총량을 0~100 기준으로 표현할 경우 다음 철학을 사용한다.

- **80 이상:** 최상의 상태. 실질적인 성능 페널티가 거의 없는 구간.
- **80 미만:** Effective Performance 감소 Curve가 시작됨.
- **50 미만:** 관전과 실제 성능 모두에서 명확히 체감되는 저하 구간.
- **30 미만:** 사실상 '좀비 상태'. 공격, 방어, 이동, 판단 등 전반적인 경기력이 심각하게 무너짐.

### Curve 원칙

- 계단식 임계값 디버프가 아니라 연속적인 Curve를 사용한다.
- 80 아래부터 감소 기울기가 발생하고 내려갈수록 영향이 커진다.
- 50 아래에서 감소가 크게 체감된다.
- 30 아래에서는 매우 가파른 성능 저하가 발생한다.
- 정확한 함수와 계수는 추후 시뮬레이션/밸런싱 단계에서 Parameter로 튜닝한다.

### 영향을 받는 영역 후보

- Execution Speed
- Explosiveness Effective Value
- Guard Efficiency
- Evasion Capability
- Takedown Defense
- Reaction/판단 오류
- Damage Vulnerability
- Recovery

---

## H. HP 없는 Damage / Finish 구조

승인.

FCM에는 전신 HP를 두지 않는다.

대신 다음 요소를 이용해 선수의 현재 상태와 Finish 가능성을 계산한다.

- 부위별 현재 내구 상태
- 누적 Fight Damage
- 기존 부상 / Permanent Damage
- 순간 Impact
- Effective Durability
- 현재 Cardio / Stamina
- 그로기 및 직전 상태
- Counter / Vulnerability Context

### 부위별 Damage

예시:
- Head
- Body
- Left Arm
- Right Arm
- Left Leg
- Right Leg

부위 손상은 실제 기능 저하로 연결한다.

예:
- Leg Damage 누적 → Footwork / Kick / Takedown Defense 저하
- Body Damage 누적 → Energy Recovery / Cardio 관련 Effective Performance 악화
- Head Damage 누적 → Reflex/인지 성능 및 Knockdown/KO 위험 악화

### Finish 상태

HP가 0이 되어서 KO되는 구조가 아니다.

현재 상태에 따라 다음과 같은 Finish 가능성이 증가한다.

**정상 → Stagger → Groggy → Knockdown → KO / TKO**

그로기, 기절, Knockdown, KO는 단순 난수 이벤트가 아니라 누적 손상과 현재 Context가 만들어낸 결과여야 한다.

---

## I. Action Data 시스템

승인.

각 Technique/Action은 선수의 Base Parameter와 별도의 Action Data를 가진다.

예시 데이터:
- ImpactCoefficient
- SpeedCoefficient
- EnergyCost
- OptimalRange
- RangeTolerance
- VulnerabilityWindow
- RecoveryTime
- SetupTags
- TargetOptions
- RuleAvailability
- 기타 기술별 Parameter

이 구조를 통해 선수 능력치를 직접 변경하지 않고도 특정 기술의 밸런스를 독립적으로 조절할 수 있게 한다.

모든 Action Data는 확장성과 밸런싱을 위해 가능한 한 데이터 기반 Parameter로 관리한다.

---

## J. Technique와 Skill Card 분리

기술 자체는 Skill Card로 취급하지 않는다.

### Technique

선수가 실제로 사용할 수 있는 격투 기술.

예:
- Jab
- Cross
- Hook
- Uppercut
- Low Kick
- High Kick
- Flying Knee
- Spinning Backfist
- Double Leg
- Single Leg
- Armbar

Technique은 별도의 훈련/학습 시스템을 통해 습득한다.

### Skill Card

선수의 전투 스타일, 조건부 강점, 행동 연결 방식 등에 변화를 주는 특성.

예:
- Liver Hunter
- Chain Wrestler

Skill Card는 단순 기술 해금용 카드가 아니며, 이미 습득한 행동을 특별한 방식으로 활용하거나 특정 조건에서 전투 로직을 변화시키는 역할을 중심으로 한다.

즉:

**Technique = 무엇을 할 수 있는가**  
**Skill Card = 그 행동을 어떤 방식으로 특별하게 활용하는가**

---

## K. Universal Judging Engine

규칙별로 완전히 별개의 심판 Scoring Formula를 만들지 않는다.

하나의 **공통 채점 코어(Universal Judging Engine)**를 사용한다.

전체 채점 엔진에는 가능한 모든 평가 항목이 존재한다.

후보:
- Effective Striking
- Damage Quality
- Knockdown / Finish Threat
- Effective Grappling
- Submission Threat
- Ground Control
- Clinch Control
- Fight Control
- 기타 추후 확정 항목

### Ruleset Masking

각 경기 규칙에서 사용할 수 없는 행동 및 채점 항목만 비활성화한다.

예:

#### Boxing
- Punch 관련 채점 활성
- Kick 관련 행동/채점 비활성
- Grappling 관련 행동/채점 비활성

#### Kickboxing
- Punch 활성
- Kick 활성
- Grappling 비활성

#### MMA
- Punch 활성
- Kick 활성
- Grappling 활성
- Submission 활성

#### No Rules
- 허용되는 Action 범위가 가장 넓은 Ruleset으로 구성

즉 채점 철학은 공통으로 유지하면서, 해당 규칙에서 발생 불가능한 항목만 Scoring에서 제외한다.

이 방식은 향후 새로운 Ruleset 추가 시에도 기존 판정 엔진을 재사용할 수 있게 한다.

---

## 확정 설계 원칙

1. **Base Parameter만 직접 성장한다.** 파생 성능은 계산 결과다.
2. **Action은 자체 Parameter를 가진다.** 선수 능력과 기술 특성을 분리한다.
3. **Cardio 저하는 비선형 Curve다.** 낮아질수록 경기 전체가 급격히 무너진다.
4. **HP를 사용하지 않는다.** 손상은 부위 기능 저하와 Finish 가능성으로 연결한다.
5. **Technique과 Skill Card는 별개의 시스템이다.**
6. **판정은 Universal Judging Engine을 공유하고 Ruleset별로 불가능 항목만 Masking한다.**
7. **모든 공식, 임계값, 계수는 가능한 한 Parameter화하여 밸런싱과 확장이 쉽도록 설계한다.**
