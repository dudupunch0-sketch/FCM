# FCM 기획 인터뷰 04 — Derived Performance 및 전투 Context 구조

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: Derived Performance, Effective Performance, 전투 Context 및 확률 철학 확정  
> 상태: 인터뷰 답변 기반 1차 확정안

---

## 전투 계산 계층

다음 4단계 구조를 승인한다.

**Base Parameter → Derived Capability → Effective Performance → Action Result**

### Base Parameter
- 선수의 근본적인 성장 능력치
- 훈련과 성장의 직접 대상

### Derived Capability
- 여러 Base Parameter와 신체조건의 조합으로 산출되는 실전 역량
- 플레이어가 직접 성장시키는 능력치가 아님

### Effective Performance
- 부상, 피로, 감량/증량, 부위 손상, Skill Card, 거리, 경기 규칙 등 현재 Context가 반영된 순간 성능

### Action Result
- 실제 공격/방어/이동/그래플링 행동의 시도, 성공, 실패, 피해 및 후속 상태

---

## A. Derived Capability의 정보 공개 원칙

- Derived Capability는 내부적으로 수치화하여 관리한다.
- 정확한 내부 수치는 플레이어에게 직접 공개하지 않는 것을 기본으로 한다.
- 다만 **Derived Capability라는 시스템 자체가 존재한다는 사실은 플레이어가 명확하게 알아야 한다.**
- 즉 `Hidden Mechanic`이 아니라 **Known Mechanic / Unknown Value** 구조를 지향한다.

### 전달 방식 후보

- 튜토리얼에서 Base Parameter의 조합이 실전 능력으로 변환된다는 구조를 명시
- 도움말/게임 내 백과사전에서 각 Derived Capability의 의미와 주요 영향 요소 제공
- 선수 프로필에서 Derived Capability 항목 자체는 노출하되 정확한 숫자는 미공개
- 관찰 및 Evidence가 쌓일수록 텍스트 평가와 추정 등급이 정교해짐
- 훈련/경기 후 코치 노트 및 분석 리포트에서 관련 힌트를 제공

### 핵심 원칙

플레이어가 패배 원인을 시스템을 몰라서 이해하지 못하는 상황은 피한다.

숨기는 것은 **값과 정확도**이지, **규칙의 존재와 작동 원리 자체가 아니다.**

---

## B. Striking Derived Capability

### Punch Impact
주요 영향 요소:
- Strength
- Explosiveness
- Punch Technique
- 현재 체중 및 신체조건
- 거리 보정

### Punch Execution Speed
주요 영향 요소:
- Explosiveness
- Agility
- Punch Technique

### Kick Impact
주요 영향 요소:
- Strength
- Explosiveness
- Kick Technique
- 현재 체중 및 신체조건
- 거리 보정

### Kick Execution Speed
주요 영향 요소:
- Explosiveness
- Agility
- Kick Technique

### Accuracy
- 고정 Derived Capability로 별도 정의하지 않는다.
- 공격 Technique, Fight IQ, Reflex, 거리, 상대 Guard, 상대 Footwork, 피로, Setup 등의 Context를 이용하여 Action Result 단계에서 계산한다.

---

## C. Range Control 및 Impact 효율

### Range Control

정의:
- 단순히 거리를 벌리는 능력이 아니라 **자신에게 유리한 거리를 만들고 유지하는 능력**

주요 영향 요소:
- Footwork Technique
- Agility
- Fight IQ
- Reach 및 신체조건

### Optimal Range

- 각 타격에는 힘을 가장 효율적으로 전달할 수 있는 거리 조건이 존재한다.
- 선수가 자신의 Optimal Range에서 타격할 경우 본인의 Punch/Kick Impact를 최대 효율로 발휘할 수 있다.
- 너무 멀거나 너무 가까운 거리에서는 Impact Efficiency가 감소한다.
- 따라서 Range Control은 타격 위력을 직접 올리는 능력이 아니라 **본래 보유한 Impact를 실제로 발휘하게 만드는 핵심 역량**이 된다.

---

## D. Counter / Feint / Setup

### Counter Ability
주요 영향 요소:
- Reflex
- Fight IQ
- 해당 공격 Technique
- Setup Context

### Feint Ability
주요 영향 요소:
- Fight IQ
- 해당 Technique
- Setup Context

### Feint Recognition
주요 영향 요소:
- Reflex
- Fight IQ
- 상대 Setup Context

### Setup System

`Setup`은 선수 고정 스탯으로 두지 않고 **전투 중 누적되고 변화하는 Context 시스템**으로 구현하는 방향을 우선 채택한다.

정의:
- 한 경기 안에서 반복되는 행동, 거리, 공격 타이밍, 타깃 선택 등에 상대가 적응하는 현상을 역으로 이용해 다음 행동의 성공 가능성을 높이는 과정

예:
- 잽을 반복적으로 보여준 뒤 잽 모션에서 테이크다운 진입
- 바디 공격을 누적한 뒤 헤드 공격으로 전환
- 특정 카운터를 반복하여 상대의 대응을 유도한 뒤 다른 공격으로 연결
- 일정한 타이밍의 공격을 반복한 뒤 Feint로 반응을 끌어냄

### Fight IQ와 Setup

Fight IQ는 다음에 크게 관여한다.
- 상대 패턴 학습 속도
- 상대가 자신의 패턴에 적응했는지 판단
- 의도적인 반복 패턴 생성
- Setup을 이용한 Feint/Counter 선택
- 상대 Setup을 역으로 읽는 능력

Setup 자체는 별도 성장 스탯이 아니라 전투 History에서 생성되는 동적 값으로 관리한다.

---

## E. Defense

### Strike Guard Efficiency
주요 영향 요소:
- Guard Technique
- Reflex
- Fight IQ

### Evasion Ability
주요 영향 요소:
- Agility
- Footwork Technique
- Reflex
- Fight IQ
- Guard Technique도 보조적으로 긍정적 영향을 줄 수 있음

### 원칙
- Block과 Evasion은 서로 다른 방어 행동이다.
- Guard Technique은 Block에 강하게 관여하지만, 전반적인 방어 기술의 숙련이라는 의미에서 Evasion에도 일정한 긍정 효과를 줄 수 있다.

---

## F. Grappling Derived Capability

### Takedown Capability
기존의 Entry와 Finish를 통합한다.

주요 영향 요소:
- Takedown Technique
- Explosiveness
- Strength
- Fight IQ
- 거리 및 Setup Context

### Takedown Defense
주요 영향 요소:
- Takedown Defense Technique
- Strength
- Reflex
- Footwork Technique
- Fight IQ

### Clinch Control
주요 영향 요소:
- Clinch Technique
- Strength
- Fight IQ

### Top Control
주요 영향 요소:
- Ground Top Technique
- Strength
- Fight IQ

### Bottom Escape
주요 영향 요소:
- Ground Bottom Technique
- Agility
- Fight IQ

### Submission Threat / Defense
- 동일한 Submission Technique Base Parameter를 공격과 방어 모두에 사용한다.
- 현재 포지션, Ground Top/Bottom Technique, Fight IQ 등이 Context에 따라 추가된다.

### Ground Striking
- 별도 Base Parameter를 두지 않는다.
- Punch Technique, Ground Top/Bottom Technique, Strength, Fight IQ, 현재 포지션 등을 조합하여 계산한다.

---

## G. Cardio Derived Structure

Base Parameter는 Cardio 하나로 유지한다.

내부적으로 다음과 같은 파생값을 계산할 수 있다.
- Maximum Energy
- Energy Consumption Efficiency
- Short-term Recovery
- Between-round Recovery

프로필은 간결하게 유지하면서 전투 엔진은 세밀하게 동작하도록 한다.

---

## H. Durability 및 부위별 상태

Base Parameter:
- Durability 하나

선수 객체에는 별도의 부위별 상태값을 둔다.

예시 부위:
- Head
- Body
- Left Arm
- Right Arm
- Left Leg
- Right Leg

각 부위에는 필요에 따라 다음과 같은 내부 Modifier를 적용할 수 있다.
- 선천적 부위 내구 보정
- 훈련 보정
- 노화
- Permanent Damage
- Current Injury
- Fight Damage
- Skill Card Modifier

따라서 동일한 Durability를 가진 선수라도 경기 이력과 훈련, Skill Card에 따라 부위별 실제 내구도가 달라질 수 있다.

---

## I. 증량/감량 및 체질 정보

- Natural Weight와 Current Weight를 구분한다.
- 두 값의 차이와 선수 특성에 따라 Weight Stress를 계산한다.
- Weight Stress는 Effective Performance에 영향을 준다.

영향 후보:
- Cardio
- Durability
- Strength
- Explosiveness
- Agility

### 개인차

- 감량 및 증량 적응에는 선수별 내부 체질 Parameter를 허용한다.
- 내부적으로는 정량화하여 관리한다.
- 그러나 완전히 비공개하지 않는다.
- 대화, 훈련 관찰, 과거 경기, 스카우팅 리포트 등을 통해 **힌트 형태로 추정 정보**를 제공한다.
- 확정 수치가 아닌 불확실한 관찰 정보로 제공하는 것이 기본이다.

---

## J. Evidence 기반 스카우팅

승인.

선수의 실제 행동은 경기 결과뿐 아니라 **스카우팅 Evidence**를 생성한다.

예:
- 반복적인 성공적 카운터 → Reflex / Fight IQ / Punch Technique 추정 정확도 상승
- 헤비백 훈련 및 스파링 → Strength / Explosiveness / Punch Technique 관련 Evidence 축적
- 지속적인 후반 라운드 경기력 → Cardio 관련 Evidence 축적
- 테이크다운 방어 반복 성공 → Takedown Defense Technique / Reflex / Fight IQ Evidence 축적

### 핵심 원칙

선수는 숫자를 공개해서 자신의 능력을 증명하는 것이 아니라 **행동을 반복하여 자신의 능력을 증명한다.**

Evidence가 충분히 축적되면 해당 Base Parameter의 추정 범위가 좁아지고 최종적으로 확정에 가까워질 수 있다.

---

## K. 변동성과 이변의 철학

변동성 자체는 허용한다.

그러나 다음 원칙을 강하게 지킨다.

### 승패에는 인과관계가 있어야 한다

강한 선수가 단순 난수 때문에 약한 선수에게 억지로 패배하는 느낌은 최대한 제거한다.

이변은 다음과 같은 실제 경기 Context에서 발생해야 한다.
- 잘못된 전략
- 상대 상성
- 거리 실패
- 체력 고갈
- 부상
- 누적 데미지
- Setup에 읽힘
- 카운터 허용
- 과도한 공격으로 인한 Vulnerability
- 체중 조절 실패
- 규칙 숙련도 차이
- Skill Card 상호작용
- 특정 순간의 작은 실행 오차

### 확률 철학

- 플레이어 관점에서 승률이 사실상 매우 높은 매치업은 존재할 수 있다.
- 그러나 절대적인 패배 불가능 상태를 시스템적으로 강제하지 않는다.
- 반대로 완전한 승산 부재도 만들지 않는다.
- 낮은 확률의 결과가 발생하더라도 반드시 전투 로그와 경기 상황을 통해 납득 가능한 원인을 추적할 수 있어야 한다.

즉 **Randomness가 원인이 아니라, Context가 원인이고 Randomness는 미세한 실행 편차만 제공한다.**

---

## 현재 핵심 설계 원칙

1. **Known Mechanic / Unknown Value** — 시스템은 공개하되 정확한 내부값은 숨긴다.
2. **Base는 단순하게, Engine은 깊게** — 선수 프로필은 읽기 쉽고 실제 전투 계산은 복합적으로 한다.
3. **Context matters** — 거리, Setup, 피로, 부상, 체중, 상대 행동이 실제 성능을 변화시킨다.
4. **Evidence reveals ability** — 선수는 행동으로 능력을 증명한다.
5. **Cause before chance** — 이변과 패배에는 항상 추적 가능한 인과관계가 있어야 한다.
