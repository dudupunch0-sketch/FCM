# FCM 기획 인터뷰 03 — Base Parameter 구조

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: 선수의 기본 능력치(Base Parameter) 구조 1차 확정  
> 상태: **인터뷰 답변 반영본**

---

## 핵심 원칙 — Base Parameter / Derived Performance 분리

FCM의 선수 데이터는 **Base Parameter**와 **Derived Performance**를 분리한다.

- **Base Parameter**: 훈련과 성장의 직접 대상이 되는 선수 본체의 능력.
- **Derived Performance**: Base Parameter, 신체조건, 현재 체중, 부상, 피로, 규칙 숙련도, 스킬 카드, 전략 등 여러 요소를 조합하여 계산되는 실제 경기 성능.

예를 들어 `Punch Power`는 직접 성장시키는 스탯으로 두지 않는다. 실제 펀치 위력은 `Strength`, `Explosiveness`, `Punch Technique`, 체중, 피로도, 부상, 스킬 카드 등의 영향을 받아 산출한다.

이 구조의 목적은 단순히 숫자 총합이 높은 선수가 항상 강해지는 것을 방지하고, 선수의 스탯 조합과 상대 상성, 전략, 성장 방향을 함께 고려하도록 만드는 것이다.

---

# 1. Physical Parameter

## Strength — 근력

순수한 물리적 힘.

주요 영향 후보:
- 타격 위력 산출
- 클린치 힘싸움
- 그래플링 압박
- 상대를 밀거나 제압하는 능력

---

## Explosiveness — 폭발력

짧은 순간에 큰 힘과 속도를 만들어내는 능력.

`Strength`와 별개의 Parameter로 유지한다.

주요 영향 후보:
- 순간적인 타격 위력
- 태클 진입
- 공격 가속
- 순간적인 폭발적 움직임

---

## Agility — 민첩성

신체 자체를 빠르게 움직이고 방향을 바꾸는 능력.

`Reflex`와 명확히 구분한다.

주요 영향 후보:
- 이동 속도
- 방향 전환
- 회피 동작
- 포지셔닝 수행 속도

---

## Cardio — 카디오

기존에 분리하려 했던 `Endurance`와 `Recovery`를 하나의 스탯으로 통합한다.

Cardio는 장시간 운동을 지속하는 능력과 라운드 사이 및 경기 중 회복 능력을 함께 표현한다.

주요 영향 후보:
- 최대 활동량
- 피로 누적 속도
- 라운드 사이 회복
- 강도 높은 연속 행동 이후 회복

Derived Performance에서는 필요에 따라 Cardio 하나를 기반으로 `Stamina Capacity`, `Fatigue Resistance`, `Recovery Rate` 등 여러 파생값으로 다시 분리할 수 있다.

---

## Durability — 내구성

Base Parameter는 하나의 `Durability`로 유지한다.

그러나 실제 신체 내구도는 **부위별 Derived State**로 분리한다.

예시 부위:
- Head Durability
- Body Durability
- Arm Durability
- Leg Durability

각 부위의 내구도는 기본 Durability를 기반으로 하되 별도의 수정값을 가질 수 있다.

예:
- 다리 강화 훈련 → Leg Durability 상승
- 직전 경기 KO 및 부상 → Head Durability 감소
- 노화 → 특정 또는 전체 부위 내구도 감소
- Skill Card `무쇠 팔` → Arm Durability 증가

즉, **훈련 가능한 기본 능력치는 단순화하고 실제 경기 상태는 세밀하게 관리**한다.

---

## Reflex — 반사신경

단순한 신체 이동 속도가 아니라 **상황을 인지하고 예측하며 반응하는 속도**를 표현한다.

Agility와 구분한다.

주요 영향 후보:
- 카운터 타이밍
- 상대 공격 인지
- 페이크 판별
- 페이크에 대한 반응
- 갑작스러운 공격 및 태클 대응
- 위험 상황에서의 초기 반응 시간

Reflex는 단순 Reaction Speed뿐 아니라 일부 예측 계통 시스템에도 보정값을 제공한다.

---

# 2. Striking Parameter

`Punch Power`와 같은 결과형 능력치는 Base Parameter로 두지 않는다.

## Punch Technique — 펀치 테크닉

펀치 기술 전반을 표현한다.

다음 요소는 별도의 Parameter로 분리하지 않고 Punch Technique에 포함한다.
- 펀치 정확도
- 타격 자세
- 힘 전달 기술
- 펀치 기본 완성도
- 콤비네이션 수행 기반 능력

실제 펀치 위력 및 속도는 Strength, Explosiveness 등 다른 Parameter와 조합하여 Derived Performance로 산출한다.

---

## Guard Technique — 가드 테크닉

펀치 방어와 킥 방어를 통합한다.

기존의 `Punch Defense`와 `Kick Defense`를 하나의 Parameter로 합친다.

주요 영향 후보:
- 가드
- 패링
- 블로킹
- 킥 체크
- 방어 자세 유지

---

## Kick Technique — 킥 테크닉

킥 공격 기술 전반을 표현한다.

킥 정확도는 별도 Parameter로 두지 않고 Kick Technique에 포함한다.

주요 영향 후보:
- 킥 정확도
- 킥 자세
- 힘 전달
- 킥 종류 수행 완성도

실제 킥 위력과 속도는 Physical Parameter 및 기타 상태값과 조합하여 산출한다.

---

## Footwork Technique — 풋워크 테크닉

격투 상황에서 거리와 각도를 만드는 기술.

`Agility`와 분리한다.

- Agility: 신체 자체의 이동 및 방향전환 능력
- Footwork Technique: 그 신체 능력을 격투 상황에서 효과적으로 사용하는 기술

주요 영향 후보:
- 거리 유지
- 진입 및 이탈
- 각도 만들기
- 케이지/링 공간 활용
- 상대 추적

---

# 3. Grappling Parameter

## Takedown Technique — 테이크다운 테크닉

상대를 넘어뜨리고 그라운드로 전환하는 공격 기술.

---

## Takedown Defense Technique — 테이크다운 디펜스 테크닉

상대의 테이크다운 시도를 방어하는 기술.

공격 테이크다운과 독립 Parameter로 유지한다.

---

## Clinch Technique — 클린치 테크닉

스탠딩 클린치 상황에서의 기술 전반.

Strength 등 Physical Parameter와 함께 실제 클린치 성능을 산출한다.

---

## Ground Bottom Technique — 그라운드 바텀 테크닉

그라운드에서 아래 포지션에 있을 때의 기술.

주요 영향 후보:
- 불리한 포지션에서의 방어
- 포지션 회복
- 스윕
- 탈출
- 바텀 상황에서의 움직임

---

## Ground Top Technique — 그라운드 탑 테크닉

그라운드에서 위 포지션을 확보했을 때의 기술.

주요 영향 후보:
- 탑 포지션 유지
- 상대 움직임 억제
- 포지션 전환
- 파운딩 기반 성능

`Ground Striking`은 별도의 Base Parameter로 두지 않고 Ground Top Technique, Punch Technique, Strength, Fight IQ 등 여러 요소의 조합으로 Derived Performance를 계산한다.

---

## Submission Technique — 서브미션 테크닉

서브미션 공격과 방어를 하나의 기술 체계로 통합한다.

별도의 `Submission Defense` Parameter는 두지 않는다.

주요 영향 후보:
- 서브미션 시도
- 피니시 능력
- 상대 서브미션 인지
- 서브미션 방어
- 탈출

공격/방어 상황에 따라 같은 Parameter를 다른 공식과 가중치로 활용한다.

---

# 4. Combat Intelligence Parameter

## Fight IQ

FCM에서 매우 중요한 핵심 Parameter로 설정한다.

단순한 전투 판단력뿐 아니라 **상황 이해, 예측, 적응 능력 전반**을 포함한다.

주요 영향 후보:
- 유리하거나 위험한 상황 판단
- 상대의 피로와 상태 인지
- 공격/방어 전환 판단
- 상대 패턴 분석 및 적응
- 페이크 시도 성공 보정
- 상대 페이크 판별
- 행동 선택의 전반적인 품질
- 전략적 의사결정

Fight IQ가 높다고 단순히 피해량이 증가하는 방식은 지양한다.

대신 다양한 행동 선택 및 상황 판단 공식에 폭넓게 관여하도록 설계한다.

---

## Tactical Execution — 전술 수행력

코치가 지시한 전략을 실제 경기에서 얼마나 충실하고 정확하게 수행할 수 있는지를 나타낸다.

Fight IQ와 독립적으로 관리한다.

예:
- Fight IQ 높음 + Tactical Execution 낮음
  - 스스로 좋은 판단을 내릴 수 있지만 코치 지시에서 벗어날 가능성이 높음.
- Fight IQ 보통 + Tactical Execution 높음
  - 플레이어가 좋은 전략을 제공할 경우 그 전략을 매우 안정적으로 수행.

이 구조를 통해 별도의 성격 시스템 없이도 선수별 경기 운영 차이를 만든다.

---

# 5. Base Parameter 1차 확정안

## Physical
- Strength
- Explosiveness
- Agility
- Cardio
- Durability
- Reflex

## Striking
- Punch Technique
- Guard Technique
- Kick Technique
- Footwork Technique

## Grappling
- Takedown Technique
- Takedown Defense Technique
- Clinch Technique
- Ground Bottom Technique
- Ground Top Technique
- Submission Technique

## Combat Intelligence
- Fight IQ
- Tactical Execution

현재 1차 확정안은 총 18개의 Base Parameter로 구성한다.

---

# 6. 숫자 총합 중심 플레이 방지 원칙

FCM에서는 단순히 높은 Parameter를 많이 가진 선수가 항상 최선의 선수가 되지 않도록 한다.

실제 경기 성능에는 다음 요소들이 동시에 관여한다.

- Base Parameter 조합
- Derived Performance
- 신체조건
- 체중 및 증량/감량 상태
- 경기 규칙 숙련도
- 전략 적합성
- 상대 선수와의 상성
- Skill Card
- 부상
- 피로
- 나이 및 노화
- 현재 컨디션

따라서 선수 평가는 단순한 Overall 또는 Parameter 총합만으로 끝나지 않도록 설계한다.

---

# 7. 잠재력 돌파 — Breakthrough 방향

기존 잠재력 한계를 뛰어넘을 수 있는 별도 성장 시스템을 마련한다.

임시 명칭은 `Breakthrough`.

핵심 원칙:
- 일반적인 성장과 분리한다.
- 매우 어렵고 드문 사건이어야 한다.
- 애정을 가지고 오래 육성한 선수가 기존 한계를 넘는 강한 카타르시스를 제공한다.
- 단순 연출이나 완전한 비정량 이벤트로 처리하지 않는다.

## 내부 수치화 원칙

Breakthrough 역시 내부에서는 명시적인 수치와 Parameter로 관리한다.

향후 후보 데이터:
- Breakthrough Threshold
- Breakthrough Progress
- Breakthrough Chance
- Potential Extension Amount
- Trigger Weight
- Event Difficulty Modifier
- Age Modifier
- Training Modifier
- Match Importance Modifier
- Opponent Strength Modifier

실제 UI에서 이 값을 모두 공개할 필요는 없지만, 내부 시스템에서는 수치화하여 다음을 가능하게 한다.

- 밸런스 조절
- 확률 및 조건 테스트
- 선수별 차별화
- 향후 시스템 확장
- 콘텐츠 추가
- 세이브 데이터 분석

Breakthrough의 구체적인 발생 조건과 공식은 성장 시스템 인터뷰에서 별도로 설계한다.

---

# 8. 다음 설계 단계

다음 단계에서는 Base Parameter를 기반으로 실제 전투에서 사용될 **Derived Performance** 목록을 설계한다.

예시 후보:
- Punch Power
- Punch Speed
- Kick Power
- Kick Speed
- Movement Speed
- Counter Ability
- Fake Effectiveness
- Fake Recognition
- Stamina Capacity
- Recovery Rate
- Takedown Success
- Takedown Defense
- Clinch Control
- Ground Control
- Ground Escape
- Submission Offense
- Submission Defense
- KO Resistance
- 부위별 내구도

각 Derived Performance는 하나의 Base Parameter에 직접 대응시키는 것이 아니라 여러 Parameter와 신체조건, 상태값을 조합하여 산출하는 방향으로 설계한다.
