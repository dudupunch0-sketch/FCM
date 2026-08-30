# FCM 기획 인터뷰 08 — Technique / Skill Card / Ring Name

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: 기술 숙련, 콤보 숙련, Skill Card, Ring Name의 역할 및 성장 구조 확정  
> 상태: **8차 인터뷰 확정안**

---

# 0. 핵심 분리 원칙

선수의 개성 및 전투 능력은 다음 계층을 서로 분리하여 관리한다.

- **Base Parameter**: 선수의 근본적인 능력과 기본기
- **Technique**: 실제 사용할 수 있는 개별 기술 및 해당 기술의 숙련도
- **Combo / Sequence Proficiency**: 정의된 주요 연속 기술의 숙련도
- **Skill Card**: 선수의 플레이 스타일과 조건부 특성
- **Ring Name**: 커리어와 업적을 대표하는 희귀 칭호

이 계층들은 서로 영향을 주지만 동일한 시스템으로 합치지 않는다.

---

# A. Technique 숙련도와 UI

각 Technique은 독립적인 **내부 숙련도 수치**를 가진다.

- 내부 숙련도는 정밀한 수치로 관리한다.
- 플레이어 UI에서는 **별 1~5개**로 단순화하여 표시한다.
- 별은 내부 숙련도를 가독성 있게 표현하는 UI이며, 실제 계산은 내부 수치를 사용한다.

## 신규 기술의 시작 숙련도

새로운 기술을 배울 때 항상 최저 숙련도에서 시작하지 않는다.

관련 Base Parameter와 기존 경험이 높은 선수는 높은 초기 숙련도에서 시작할 수 있다.

예:
- Punch Technique이 높은 선수가 새로운 펀치 계열 기술을 습득할 경우 별 3 수준에서 시작 가능
- Kick Technique이 높은 선수는 새로운 킥 기술의 초기 숙련도 보너스를 받을 수 있음
- 관련 Technique/Combo 경험 및 Growth Aptitude도 초기 숙련도에 영향을 줄 수 있음

정확한 초기 보너스 공식은 Parameter화하여 추후 밸런싱한다.

---

# B. Base Parameter와 Technique Proficiency 분리

승인.

Base Parameter는 해당 영역의 전반적인 기본기를 표현한다.

Technique Proficiency는 특정 기술의 구체적인 숙련도를 표현한다.

예:

- Punch Technique이 높아도 처음 배우는 Spinning Backfist는 미숙할 수 있음
- Spinning Backfist 숙련도가 높더라도 Punch Technique 자체가 낮으면 전반적 실행 품질에는 한계가 존재

실제 기술 성능은 다음 요소들을 함께 사용할 수 있다.

- 관련 Base Parameter
- 해당 Technique Proficiency
- Physical Parameter
- Action Data
- 현재 Effective Performance
- 전투 Context

---

# C. Technique의 3단 구조

승인.

## Fundamental Action

선수가 기본적으로 사용할 수 있는 동작.

예:
- Jab
- Cross
- Hook
- 기본 Low Kick
- 기본 Clinch
- 기본 Takedown 등

기본적으로 사용 가능하지만 선수마다 숙련도 차이는 존재한다.

## Learnable Technique

별도의 기술 훈련을 통해 습득하는 기술.

예:
- Spinning Backfist
- Question Mark Kick
- Flying Knee
- 특정 Throw
- 특정 Submission

## Signature Technique

일반 Technique을 장기간 높은 수준으로 사용하고 특정 조건을 충족했을 때 선수의 대표 기술로 발전할 수 있다.

예:
- Left Hook 장기간 사용
- 높은 숙련도 도달
- 실전에서 반복적인 결정적 성공
- 특정 업적 달성

→ Signature Left Hook 등으로 발전 가능

Signature의 정확한 효과 및 획득 조건은 추후 세부 설계한다.

---

# D. Technique 학습 적성

승인.

기술 습득 속도와 초기 숙련도에는 선수의 능력 및 적성이 영향을 준다.

영향 후보:
- 관련 Base Technique
- 관련 Physical Parameter
- 큰 영역별 Growth Aptitude
- 일부 예외 Modifier
- 기존 유사 Technique 경험
- 코치
- 훈련 품질

## Hidden Technique Affinity

일부 선수는 특정 기술 또는 기술군에 숨겨진 적성을 가질 수 있다.

이 정보는 처음부터 정확한 수치로 공개하지 않는다.

훈련 및 실전을 통해 Evidence가 쌓이면서 다음과 같은 힌트가 제공될 수 있다.

> 이 선수는 훅 계열 기술을 유난히 빠르게 익히는 것 같습니다.

Hidden Affinity 역시 내부적으로 수치화한다.

---

# E. 훈련과 실전의 Technique 경험치

Technique는 훈련뿐 아니라 **실제 사용을 통해 성장**한다.

기본 성장 흐름:

**학습 → 훈련 → 스파링 → 실제 경기 사용 → 실전 성공/피니쉬 → 높은 숙련**

## 실전 경험의 중요도

실제 경기에서 얻는 Technique 경험치는 훈련보다 훨씬 커야 한다.

현재 초기 밸런스 가정:

- `Match Technique EXP Multiplier = Training 대비 약 10배`

이 값은 확정 상수가 아니라 **밸런싱 Parameter**로 관리한다.

추후 테스트를 통해 자유롭게 조절 가능해야 한다.

## Finish Bonus

특정 기술로 피니쉬했을 경우 해당 Technique에 매우 큰 경험 보상을 준다.

예:
- 특정 Hook으로 KO
- 특정 Submission으로 Tap 획득
- 특정 Knee로 Finish

단순 성공보다 피니쉬는 선수에게 강한 실전 학습/자신감/숙련 Evidence를 제공하는 사건으로 취급한다.

Finish Technique EXP Bonus 역시 별도 Parameter로 관리한다.

---

# F. Combo / Sequence Proficiency

승인.

단일 Action 숙련과 별개로 **게임에 정의된 주요 Combo / Sequence**에 숙련도를 둘 수 있다.

예:
- Jab → Cross
- Jab → Jab → Cross
- Body Hook → Low Kick
- Cross → Double Leg

모든 가능한 행동 조합을 자동 생성하여 저장하지 않는다.

게임 데이터에 명시적으로 정의된 의미 있는 Combo/Sequence만 독립적으로 관리한다.

Combo Proficiency는 다음 시스템과 연결될 수 있다.

- 실행 안정성
- Tactical Execution
- Setup 축적
- Pattern Break
- Action 간 연결 속도
- Energy 효율

---

# G. Skill Card 보유 / 활성 구조

**G-2 승인.**

선수는 커리어 동안 Skill Card를 여러 장 획득할 수 있다.

그러나 경기에서 동시에 **활성화 가능한 Skill Card는 최대 5장**이다.

따라서:
- 카드 획득 시 기존 카드를 버릴 필요 없음
- 선수의 커리어 역사는 보유 카드로 축적됨
- 경기 규칙, 상대, 전략에 따라 활성 카드 구성을 변경 가능

예:
- Boxing 경기용 활성 카드 세트
- MMA 경기용 활성 카드 세트
- 특정 상대 카운터용 카드 세트

활성 카드 최대 수 역시 Data Parameter로 관리 가능하게 한다.

---

# H. Skill Card 성장

Skill Card는 성장할 수 있다.

다만 카드 성장의 목적은 동일한 숫자 보너스를 반복적으로 올리는 것에 있지 않다.

## 원칙

- 각 카드의 핵심 효과는 서로 질적으로 구분되어야 한다.
- 카드 레벨/성장은 **그 고유 효과를 증폭**한다.
- 모든 카드가 Damage +5%, +10%, +15% 같은 동일 구조가 되는 것은 지양한다.

예:

### Liver Hunter
핵심 정체성:
- Body Damage가 누적된 상대를 더 잘 공략하는 스타일

성장 시:
- 관련 행동 선택 가중치
- Setup 활용
- Finish Context 활용
- Body Target 관련 효율

등 카드 고유 로직이 강화될 수 있다.

### Chain Wrestler
핵심 정체성:
- 첫 Takedown이 막힌 뒤 후속 Grappling Sequence 연결

성장 시:
- 후속 연결 가능 조건 완화
- 연결 속도
- Energy 효율
- AI 선택 품질

등 고유 효과가 강화될 수 있다.

정확한 성장 구조는 카드별 Data로 정의한다.

---

# I. Skill Card 획득은 선수의 역사에서 발생

승인.

Skill Card는 단순 상점 구매 또는 임의 선택만으로 얻는 구조를 지양한다.

선수가 실제로 어떻게 훈련하고 싸웠는지가 카드 획득 조건에 반영되어야 한다.

예: `Liver Hunter`

- Body 공격 관련 Evidence 축적
- Body 공격 중심 운영
- 관련 Technique 숙련
- Body 공격을 이용한 승리
- 특정 Body Finish 업적

등을 통해 해금 가능.

따라서 동일한 초기 선수를 플레이하더라도 육성 및 경기 이력에 따라 서로 다른 Skill Card 세트가 형성될 수 있다.

---

# J. Ring Name 계층

승인.

희귀도 및 의미의 계층은 다음 방향을 사용한다.

1. **Technique** — 비교적 자주 습득/성장
2. **Skill Card** — 선수의 스타일 및 경력이 굳어지며 획득
3. **Ring Name** — 커리어를 대표하는 희귀 업적/칭호

Ring Name은 Skill Card보다 훨씬 희귀하게 획득한다.

Ring Name은 다음 두 영역을 연결할 수 있다.

- Combat Effect
- Reputation / Fame / Market Value / Matchmaking

예:
- The Underdog
- The Iron Man
- The Executioner

정확한 이름과 효과는 추후 콘텐츠 설계에서 확장한다.

---

# K. Unique Ring Name과 대응 칭호

승인.

일부 핵심 NPC / 라이벌은 일반 선수가 사용할 수 없는 **Unique Ring Name**을 가진다.

NPC의 Unique Ring Name 자체를 직접 빼앗는 구조는 사용하지 않는다.

대신 해당 선수를 특정 조건으로 꺾으면 그 업적에 대응하는 별도의 Ring Name을 해금할 수 있다.

예:

> Viktor "The King" Volkov 격파

→ `Kingslayer` 계열 Ring Name 해금 가능

이 구조를 통해 라이벌전과 고유 NPC가 플레이어 선수의 커리어 역사에 흔적을 남긴다.

---

# L. Skill Card / Ring Name의 Data-Driven 구현

승인.

Skill Card와 Ring Name은 가능한 한 데이터 기반으로 정의하여 신규 콘텐츠를 코드 구조 변경 없이 추가할 수 있도록 한다.

## Skill Card Data 후보

- UnlockCondition
- Trigger
- Condition
- Modifier
- ActionOverride
- AIWeightModifier
- SetupModifier
- GrowthCondition
- GrowthModifier
- MaxLevel
- RuleAvailability

## Ring Name Data 후보

- UnlockCondition
- CombatModifier
- FameModifier
- MarketValueModifier
- MatchmakingModifier
- OpponentModifier
- RuleModifier
- UniqueFlag

하드코딩된 개별 조건문을 최소화하고 공통 조건/효과 시스템으로 확장 가능하게 설계한다.

---

# 8차 인터뷰 핵심 확정사항

1. Technique는 독립 내부 숙련도를 가지며 UI에서는 별 1~5개로 표시한다.
2. 신규 Technique는 항상 최저 숙련도에서 시작하지 않고 관련 Base Parameter와 적성에 따라 초기 숙련도 보너스를 받는다.
3. Base Parameter와 개별 Technique Proficiency는 서로 다른 역할을 가진다.
4. Fundamental / Learnable / Signature Technique의 3단 구조를 사용한다.
5. Technique 학습에는 성장 적성과 Hidden Affinity가 작용한다.
6. Technique 경험은 실제 경기에서 훨씬 크게 얻으며 현재 초기 가정은 훈련 대비 약 10배이나 반드시 Parameter화한다.
7. 특정 Technique로 Finish하면 매우 큰 추가 숙련 보상을 준다.
8. 주요 Combo/Sequence는 별도의 Proficiency로 관리한다.
9. Skill Card는 여러 장 보유할 수 있으나 경기 활성은 최대 5장이다.
10. Skill Card는 성장 가능하며 각 카드 고유 효과가 강화되는 방식으로 설계한다.
11. Skill Card 획득은 선수의 실제 육성/경기 역사와 연결한다.
12. Ring Name은 Skill Card보다 희귀하며 커리어 업적과 Reputation을 연결한다.
13. Unique NPC Ring Name은 탈취하지 않고, 해당 라이벌을 쓰러뜨린 업적에서 대응 Ring Name을 해금한다.
14. Technique / Combo / Skill Card / Ring Name 관련 수치와 조건은 모두 Data Parameter 중심으로 구현한다.
