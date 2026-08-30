# FCM Current Decisions — Authoritative Specification Register

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 역할: 인터뷰에서 확정된 **최신 결정만 모아두는 단일 기준 문서(SSOT)**  
> 관리 원칙: `docs/interviews/`는 결정의 역사와 맥락을 보존하고, 이 문서는 변경된 결정이 생길 때 항상 최신값으로 교체한다.

---

# 1. 프로젝트 핵심 방향

## 장르 / 플레이 판타지

FCM은 지하 격투 세계에서 시작해 선수를 발굴하고 육성하여 정상에 올린 뒤, 장기적으로 국제 무대와 자체 격투 단체 운영까지 확장되는 격투 매니지먼트 게임이다.

핵심 재미 우선순위:
1. 애정을 가지고 키운 선수가 전략과 성장을 거쳐 괴물급 선수로 성장하는 경험
2. 숨겨진 유망주를 발굴하는 경험
3. 실패한 격투기 선수가 제자를 키워 궁극적으로 격투기 단체의 회장이 되는 성장 서사

## 게임 진행 큰 구조

- 1부: 지하 파이트클럽
- 2부: 국제 리그
- 3부: 직접 대회 / 격투 단체 운영

## 플레이어 캐릭터

- 전직 MMA 선수
- 부상 이후 선수 커리어가 내리막
- 파이트클럽 코치 활동 권유를 계기로 새로운 커리어 시작
- 특정 파이트클럽 소속이 아닌 독립 코치/매니저
- 직접 선수를 발굴해 여러 파이트클럽에 출전시킴
- 장기적으로 코치 → 국제 무대 지도자 → 단체 회장/프로모터로 성장

## 세계관 톤

- 조직범죄 중심 세계관 아님
- 성인들의 합의된 일탈성 격투 문화
- 폭력, 비공식 경기, 배팅, 음지 문화는 존재 가능
- 갱단/조폭/강제 범죄 가담은 중심 소재에서 제외

---

# 2. 경기 규칙

4개 Ruleset:
- MMA
- Boxing
- Kickboxing
- No Rules

각 규칙은 독립 랭킹을 가진다.

선수는 자유롭게 다른 규칙에 출전/전향할 수 있다.

각 선수는 다음 Familiarity를 가진다.
- MMA Familiarity
- Boxing Familiarity
- Kickboxing Familiarity
- No Rules Familiarity

Familiarity와 그 패널티는 내부적으로 수치화하며, 경기 규칙 적응, 행동 선택, Tactical Execution, 거리 감각 등에 영향을 줄 수 있다.

---

# 3. 경기 조작 방식

- 라운드별로 상세 전략 지시
- 라운드 중에는 실제 코너에서 소리치는 수준의 제한적 개입
- 직접 조작형 액션 게임이 아닌 감독/코치 중심 시뮬레이션
- 최종 전투 화면은 3D 격투 시뮬레이션 예정
- 3D 전투는 별도 프로젝트에서 개발 후 이식
- 초기 FCM 개발에서는 임시 전투 화면을 사용하고 매니지먼트 시스템을 우선 구현

---

# 4. 선수 데이터 표시 / 정보 비대칭

## Base Parameter 표시

- 내부: 정밀한 실수값 등 세밀한 수치 허용
- UI: 0~100 범위

## Known Mechanic / Unknown Value

- 시스템의 존재와 작동 원리는 플레이어에게 알려준다.
- 정확한 내부값은 숨길 수 있다.
- 툴팁, 튜토리얼, 인게임 도움말, 관찰, 코치 리포트를 통해 시스템 존재를 설명한다.

## 소속 선수도 완전 공개되지 않음

선수를 직접 키우고 있어도 능력치는 일정 범위의 추정값으로 유지될 수 있다.

해당 능력과 관련된 훈련/경기/활동에서 반복적으로 능력을 증명하면 추정 범위가 좁아진다.

핵심 원칙:
> 선수는 숫자를 공개해서 능력을 증명하는 것이 아니라 행동을 통해 자신의 능력을 증명한다.

## Evidence System

행동은 능력치 추정에 대한 Evidence를 생성한다.

예:
- 반복 카운터 성공 → Reflex / Fight IQ / Punch Technique 정보 정밀화
- 후반 라운드 안정적 경기력 → Cardio 정보 정밀화
- 반복 테이크다운 방어 성공 → Takedown Defense Technique / Reflex / Fight IQ 정보 정밀화

---

# 5. Base Parameter

Base Parameter만 직접 훈련/성장한다.

## Physical
- Strength
- Explosiveness
- Agility
- Cardio
- Durability
- Reflex

### Reflex

Agility와 별개다.

신체 이동속도가 아니라 인지, 판별, 예측, 반응의 속도.

주요 영향:
- Counter
- Feint Recognition
- 갑작스러운 공격 대응
- Takedown 반응

## Striking
- Punch Technique
- Guard Technique
- Kick Technique
- Footwork Technique

`Punch Power`, `Punch Accuracy`, `Kick Accuracy`는 Base Parameter로 두지 않는다.

Punch/Kick Accuracy는 각각 Technique에 포함하고 실제 명중은 Action Result 단계에서 Context와 함께 계산한다.

Punch/Kick Defense는 `Guard Technique`으로 통합한다.

Block과 Evasion은 별도 행동이지만 Guard Technique은 둘 모두에 긍정적인 영향을 줄 수 있다.

## Grappling
- Takedown Technique
- Takedown Defense Technique
- Clinch Technique
- Ground Bottom Technique
- Ground Top Technique
- Submission Technique

Submission 공격/방어는 하나의 Submission Technique을 사용한다.

Ground Striking은 별도 Base Parameter를 두지 않는다.

## Combat Intelligence
- Fight IQ
- Tactical Execution

### Fight IQ

FCM의 핵심 상위 중요 Parameter.

주요 영향:
- 상황 판단
- 상대 패턴 학습
- 자신의 패턴이 읽혔는지 인지
- Feint / Counter / Setup 활용
- 위험도 판단
- 행동 선택 품질
- 예측

### Tactical Execution

코치/플레이어가 준 전략과 시퀀스를 얼마나 충실하게 수행하는지 나타낸다.

Fight IQ와 독립적으로 관리한다.

---

# 6. 전투 계산 계층

확정 구조:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

## Derived Capability

- Base Parameter와 신체 데이터를 조합해 계산
- 독립 성장값 아님
- Base가 바뀌면 자동 재계산
- 정확한 내부값은 숨길 수 있으나 시스템의 존재는 공개

## Effective Performance

다음 Context를 반영한 현재 순간 성능:
- Cardio / Stamina
- 부상
- 부위 손상
- 체중
- 증량/감량
- 거리
- Setup
- Ruleset Familiarity
- Skill Card
- 현재 상태

## Action Result

특정 기술의 실제 시도/성공/실패/Impact/Position 변화/후속 상태.

---

# 7. 주요 Derived Capability

## Striking
- Punch Impact
- Punch Execution Speed
- Kick Impact
- Kick Execution Speed
- Range Control
- Guard Efficiency
- Evasion Capability

## Counter / Feint
- Counter Conversion
- Feint Execution
- Feint Recognition

Counter 성공은 고정 스탯 하나가 아니라 Vulnerability / Setup / Range / Read Confidence 등을 함께 사용한다.

## Grappling
- Takedown Capability
- Takedown Defense
- Clinch Control
- Top Control
- Bottom Escape
- Submission Threat
- Submission Defense

Takedown Entry / Finish는 하나의 Takedown Capability로 통합한다.

## Grapple Advantage

고정 선수 스탯이 아니라 순간 Context 값.

좋은 그래플러는 Advantage를 자동 생성하는 것이 아니라 만들어진 Advantage를 더 잘 활용한다.

---

# 8. Range / Optimal Range

Range Control은 단순히 멀리 떨어지는 능력이 아니라 **본인에게 유리한 거리를 만들고 유지하는 능력**이다.

각 기술에는 Optimal Range를 둘 수 있다.

Optimal Range에서 해당 Punch/Kick Impact를 최대한 발휘한다.

너무 멀거나 가까우면 Impact Efficiency가 감소한다.

Reach는 무조건적인 플러스 스탯이 아니라 Range 전략과 함께 작동한다.

---

# 9. Setup / Combat Memory

Setup은 고정 스탯이 아니라 전투 History/Context 시스템이다.

## Pattern 단위

단순 행동 빈도보다 콤보/시퀀스에 집중한다.

예:
- Jab → Jab → Cross
- Jab → 우측 이동
- Body Straight → Low Kick
- Punch Combo → Takedown

## 경기 전체 기억

선수는 현재 경기 전체의 패턴을 기억한다.

오래된 패턴의 영향은 감소 가능하다.

상대의 과거 경기 습관도 비디오 분석을 통해 사전 정보로 활용 가능하다.

## Setup 흐름

반복 행동 → Pattern Exposure → Opponent Expectation / Read Confidence 형성 → Pattern Break / Feint / Counter / Takedown Setup 활용

Setup은 자동 수행과 플레이어 직접 지시 모두 가능하다.

Setup 성공/실패 판정이 존재한다.

## Fight IQ 역할

- 패턴 학습 속도
- 유효 패턴 판별
- 자신의 패턴 노출 인지
- Setup 타이밍 판단
- Pattern Break 판단

## Tactical Execution 역할

- 플레이어가 지시한 Setup 시퀀스 수행
- 전략 유지

## Momentum / Flow State

별도 게이지/버프 시스템은 넣지 않는다.

경기 흐름은 Setup, Combat Memory, Skill Card, Cardio, Damage 등의 실제 시스템 상호작용으로 표현한다.

---

# 10. 상대 비디오 분석 / 코칭

## 상대 경기 비디오 분석

주간 활동으로 상대의 습관과 콤보/시퀀스를 조사할 수 있다.

정보에는 다음 내부값을 둘 수 있다.
- Confidence
- Freshness
- Evidence Amount

정보는 오래됐거나 잘못됐거나 상대에게 속은 것일 수 있다.

잘못된 정보를 선수에게 전략으로 전달하면 경기에서 고전할 수 있다.

## 코너 개입

플레이어/코치진이 라운드 사이 선수에게 패턴 정보를 전달할 수 있다.

코치의 분석 능력에 따라 선수가 혼자 발견하지 못한 Pattern Awareness를 높일 수 있다.

---

# 11. 경기 후 리포트

2종류를 제공한다.

## 심판 점수 리포트

공식 결과/점수 관점.

## 코치진 분석 리포트

경기의 인과관계를 분석한다.

정확도/상세도는 플레이어와 코치진의 분석 능력, 데이터 양, 추가 비디오 분석에 영향을 받는다.

지난 경기 비디오 분석에 시간을 쓰면 더 상세한 원인을 발견하고 Evidence를 추가 획득할 수 있다.

---

# 12. Universal Judging Engine

규칙별로 별개의 채점 공식을 만들지 않는다.

하나의 공통 Judging Core를 사용한다.

전체 평가 항목 후보:
- Effective Striking
- Damage Quality
- Knockdown / Finish Threat
- Effective Grappling
- Submission Threat
- Ground Control
- Clinch Control
- Fight Control

Ruleset에서 발생 불가능한 항목만 비활성화한다.

예:
- Boxing: Punch 활성 / Kick, Grappling 비활성
- Kickboxing: Punch, Kick 활성 / Grappling 비활성
- MMA: Punch, Kick, Grappling, Submission 활성
- No Rules: 가장 넓은 Action 집합 허용

---

# 13. Cardio / Stamina

Base Parameter는 `Cardio` 하나.

내부 파생 후보:
- Energy Capacity
- Energy Efficiency
- Short Recovery
- Between-Round Recovery

## Stamina Curve

0~100 총량 기준 설계 철학:
- 80 이상: 최상 상태, 페널티 거의 없음
- 80 미만: 성능 저하 Curve 시작
- 50 미만: 눈에 띄는 경기력 저하
- 30 미만: 거의 좀비 상태

연속 Curve를 사용하며 낮아질수록 감소 기울기가 커진다.

정확한 함수는 Parameter화해 추후 밸런싱한다.

---

# 14. Damage / Durability / Finish

전신 HP 없음.

Base Parameter는 `Durability` 하나지만 실제 상태는 부위별로 관리한다.

예시 부위:
- Head
- Body
- Left Arm
- Right Arm
- Left Leg
- Right Leg

부위별 상태에는 훈련, 노화, 과거 KO, 부상, Permanent Damage, Skill Card 등이 따로 적용될 수 있다.

예:
- 다리 훈련 → Leg 내구 상승
- 직전 KO 부상 → Head 내구 감소
- 노화 → 내구 감소
- 무쇠 팔 Skill Card → Arm 보정

## Finish

HP가 0이 되어서 끝나는 구조가 아니다.

부위 손상 + 순간 Impact + 현재 Cardio + Effective Durability + Vulnerability 등이 결합해 다음 상태가 발생할 수 있다.

정상 → Stagger → Groggy → Knockdown → KO / TKO

Finish는 인과관계가 있는 조건 누적의 결과다.

---

# 15. Randomness 철학

**Randomness creates variation, not causation.**

난수는 작은 실행 편차를 만들 수 있지만 사건의 근본 원인이 되어서는 안 된다.

강한 선수가 약자에게 패배할 수 있으나 그 원인을 전투 로그에서 설명할 수 있어야 한다.

원인 후보:
- 잘못된 전략
- 상성
- 거리 실패
- Cardio 고갈
- 부상
- 누적 Damage
- Setup에 읽힘
- Counter 허용
- 과도한 공격
- 체중 조절 실패
- Ruleset Familiarity
- Skill Card 상호작용

플레이어 입장에서 사실상 100%에 가까운 우세는 존재할 수 있지만, 시스템적으로 절대 패배 불가능을 강제하지 않는다.

완전한 0% 승산도 지양한다.

---

# 16. Action Data

각 Action/Technique에는 선수 Base Parameter와 별도의 데이터가 존재한다.

후보:
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

특정 기술 밸런스는 선수 스탯을 건드리지 않고 Action Data로 조절 가능해야 한다.

---

# 17. Technique System

Technique은 Skill Card와 분리한다.

## Technique 내부 숙련도 / UI

각 Technique은 독립적인 내부 숙련도 수치를 가진다.

UI에서는 숙련도를 **별 1~5개**로 표시한다.

실제 계산은 별 개수가 아니라 내부 정밀 수치를 사용한다.

## 신규 Technique 시작 숙련도

새 Technique은 항상 최저 숙련도에서 시작하지 않는다.

관련 Base Technique과 적성, 기존 유사 기술 경험 등에 따라 초기 숙련도 보너스를 받을 수 있다.

예:
- Punch Technique이 높은 선수가 새로운 펀치 계열 기술을 습득 → 별 3 수준에서 시작 가능

정확한 초기값 공식은 Parameter화한다.

## Base Parameter와 Technique Proficiency 분리

- Base Parameter: 해당 영역의 전반적 기본기
- Technique Proficiency: 특정 기술 자체의 숙련

실제 기술 성능에는 둘 다 관여한다.

## Technique 3단 구조

### Fundamental Action

기본적으로 사용할 수 있는 기술.

예:
- Jab
- Cross
- Hook
- 기본 Low Kick
- 기본 Clinch
- 기본 Takedown

### Learnable Technique

별도 훈련으로 습득.

예:
- Spinning Backfist
- Question Mark Kick
- Flying Knee
- 특정 Throw
- 특정 Submission

### Signature Technique

일반 Technique을 장기간 높은 수준으로 사용하고 특정 실전/업적 조건을 충족했을 때 대표 기술로 발전 가능.

## Technique 학습 적성

영향 후보:
- 관련 Base Technique
- 관련 Physical Parameter
- Growth Aptitude
- 일부 예외 Modifier
- 기존 유사 Technique 경험
- 코치 / 훈련 품질

일부 선수는 특정 기술 또는 기술군에 Hidden Affinity를 가질 수 있다.

Hidden Affinity는 내부 수치화하며 훈련/실전 Evidence를 통해 힌트로 파악한다.

---

# 18. Technique / Combo 경험치

Technique는 훈련, 스파링, 실전 사용으로 성장한다.

실전 경험은 훈련보다 훨씬 큰 성장 자극을 준다.

현재 초기 밸런스 가정:
- `Match Technique EXP Multiplier ≈ Training 대비 10배`

이 값은 확정 상수가 아니며 반드시 Data Parameter로 관리한다.

## Finish Bonus

특정 Technique로 Finish했을 경우 해당 Technique에 매우 큰 추가 경험 보상을 준다.

Finish Technique EXP Bonus 역시 독립 Parameter로 관리한다.

## Combo / Sequence Proficiency

단일 기술 숙련과 별개로 게임 데이터에 정의된 주요 Combo/Sequence는 독립 숙련도를 가질 수 있다.

예:
- Jab → Cross
- Jab → Jab → Cross
- Body Hook → Low Kick
- Cross → Double Leg

모든 가능한 조합을 저장하지 않고 의미 있는 사전 정의 Combo/Sequence만 관리한다.

Combo Proficiency는 실행 안정성, Tactical Execution, Setup, Pattern Break, Action 연결 속도, Energy 효율 등에 관여할 수 있다.

---

# 19. Skill Card

Skill Card는 기술 자체가 아니라 **선수의 플레이 스타일 / 조건부 특성 / 행동 연결 특성**이다.

예:
- Liver Hunter
- Chain Wrestler
- 무쇠 팔 계열

## 보유 / 활성 구조

선수는 커리어 동안 Skill Card를 여러 장 획득할 수 있다.

경기에서 동시에 활성화 가능한 Skill Card는 **최대 5장**이다.

따라서 카드 획득 시 기존 카드를 삭제할 필요가 없다.

경기 규칙, 상대, 전략에 따라 활성 카드 세트를 변경할 수 있다.

활성 카드 최대 수 역시 Parameter화 가능하게 한다.

## Skill Card 성장

Skill Card는 성장할 수 있다.

성장은 카드의 고유한 정체성을 유지한 채 해당 효과를 증폭하는 방식으로 설계한다.

단순한 공통 `Damage +N%` 카드의 반복은 지양한다.

예:
- Liver Hunter: Body Damage/Setup/Finish 관련 고유 로직 강화
- Chain Wrestler: Takedown 실패 후 후속 Grappling 연결 관련 고유 로직 강화

## Skill Card 획득

카드 획득은 선수의 실제 육성/경기 역사와 연결한다.

예:
- 특정 Target 공격 Evidence
- 특정 전투 스타일 반복
- 관련 Technique 숙련
- 특정 방식의 승리/Finish
- 업적

같은 초기 선수라도 플레이 역사에 따라 서로 다른 Skill Card 세트를 형성할 수 있어야 한다.

---

# 20. Ring Name

Ring Name은 Skill Card보다 훨씬 희귀한 커리어 업적/칭호다.

계층:
1. Technique — 비교적 자주 습득/성장
2. Skill Card — 스타일과 경력이 굳어지며 획득
3. Ring Name — 커리어를 대표하는 희귀 업적

Ring Name은 다음을 연결할 수 있다.
- Combat Effect
- Reputation
- Fame
- Market Value
- Matchmaking
- 상대 반응

같은 Ring Name을 사용하는 선수를 동시에 배치할 수 없다.

## Unique Ring Name

일부 적/라이벌은 일반 선수가 사용할 수 없는 Unique Ring Name을 가진다.

NPC의 Unique Ring Name 자체를 탈취하지 않는다.

대신 해당 NPC를 특정 조건으로 격파하면 그 업적에 대응하는 별도 Ring Name을 해금할 수 있다.

예:
- `The King`을 가진 라이벌 격파 → `Kingslayer` 계열 Ring Name 해금 가능

---

# 21. 신체 / 체중 관리

신체 데이터는 Base Parameter와 별도 관리한다.

후보:
- Height
- Reach
- Natural Weight
- Current Weight
- Age
- Stance

증량/감량은 실제 경기력에 영향을 준다.

개인차를 위해 숨겨진 체질 Parameter를 허용한다.

단, 완전히 숨기지 않고 대화/관찰/과거 경험을 통해 힌트로 제공한다.

정확한 내부값은 불확실할 수 있다.

---

# 22. Potential / Growth Aptitude

구조:
- Overall Talent
- 큰 영역별 Growth Aptitude
- 일부 예외 Modifier

큰 영역 후보:
- Physical Aptitude
- Striking Aptitude
- Grappling Aptitude
- Combat Intelligence Aptitude

Base Parameter마다 별도의 잠재력 숫자를 기본 구조로 두지 않는다.

특정 선수의 특이성을 표현하기 위한 일부 Parameter/Technique Growth Modifier는 허용한다.

Potential 정확한 상한은 플레이어에게 공개하지 않는다.

---

# 23. Potential Curve / Breakthrough

Potential은 Hard Cap이 아니다.

일정 성장 구간에 접근하면 성장 효율이 급격히 악화되어 사실상 정지처럼 느껴질 수 있다.

완전히 멈추지는 않는다.

장기간 이 비효율 Curve를 극복하며 중요한 경기/훈련 사건을 겪으면 Breakthrough 가능성이 생긴다.

Breakthrough는 내부적으로 완전히 수치화한다.

후보:
- Breakthrough Progress
- Breakthrough Threshold
- Potential Proximity
- Strong Opponent Experience
- Match Importance
- Adversity Overcome
- Technique Mastery
- Style Commitment
- Coach Modifier
- Age Modifier

정확한 Progress는 UI에 공개하지 않고 힌트로 전달한다.

---

# 24. 노화

- 신체 능력은 나이에 따라 저하
- 노화는 완전히 극복하기 어렵고 갈수록 대응 난이도 증가
- Fight IQ, Technique, 경험 등은 유지되거나 장점이 될 수 있음
- 노령 선수는 젊은 시절과 다른 운영 방식으로 경쟁력을 유지할 수 있음

---

# 25. 주간 Training / Life Management

주 단위 Calendar 사용.

훈련 횟수를 인위적인 슬롯 수로 제한하지 않는다.

선수의 삶 전체가 시간 자원을 경쟁한다.

주간 활동 후보:
- 훈련
- Sparring
- Technique 학습
- Recovery
- 상대 비디오 분석
- 사생활
- 스트레스 관리
- 외부 활동
- Fame 활동
- 팬/미디어 활동
- 스폰서/수익 활동
- 경기 준비

훈련만 반복하면:
- Fatigue 증가
- Stress 증가
- Injury Risk 증가
- Fight Readiness 감소
- 사생활/만족도 악화 가능
- Fame / Market Value 성장 기회 손실

---

# 26. 훈련 성장 방식

반통제형.

훈련은 여러 Base Parameter에 주/부 성장 효과를 줄 수 있다.

실제 성장량 영향 후보:
- 훈련 품질
- Talent
- Growth Aptitude
- 예외 Modifier
- 현재 능력치
- 나이
- 코치
- 시설
- Sparring Partner
- Fatigue
- Stress
- Potential과의 거리
- 선수-훈련 적합도

질 낮거나 부적합하거나 과도한 훈련은:
- 성장 실패
- 유지 수준
- 스트레스
- 피로
- 부상
- 내구 상태 악화

를 만들 수 있다.

---

# 27. 실제 경기와 성장

실제 경기는 훈련 캠프보다 더 큰 성장폭을 제공할 수 있다.

특히:
- Fight IQ
- Tactical Execution
- Rule Familiarity
- 실전 대응 능력
- Technique Proficiency
- Combo/Sequence Proficiency

등은 경기 경험 가치를 크게 가진다.

강한 상대와 중요한 경기에는 큰 성장 자극과 위험이 함께 존재한다.

경기 중 특별 성장 사건이 발생할 수 있다.

지향 감성은 *Darkest Dungeon*의 영웅의 기상과 같은 극한 상황에서의 긍정적 전환이다.

Technique 숙련도는 현재 초기 가정으로 실제 경기 경험 보상을 훈련 대비 약 10배 수준으로 두되, 반드시 Parameter로 관리해 추후 튜닝한다.

특정 Technique로 Finish한 경우 매우 큰 추가 Technique 경험 보상을 부여한다.

---

# 28. 육성 밸런스 원칙

> **육각형 선수는 있어도 만능 선수는 없다.**

선수 강함은 단순 Parameter 합계가 아니다.

상호작용 요소:
- Base Parameter 조합
- 신체조건
- Technique
- Combo/Sequence Proficiency
- Skill Card
- Ring Name
- Rule Familiarity
- 체급
- 성장 적성
- Opportunity Cost
- 감독 전략
- Setup
- 상대 상성
- Cardio
- Damage

Overall은 UI 편의용 평가값일 수 있으나 실제 전투 계산에 사용하지 않는다.

---

# 29. Data-Driven / 확장성 원칙

게임의 모든 핵심 시스템은 가능한 한 Parameter/Data 중심으로 구현한다.

원칙:
- 하드코딩 최소화
- 가중치 조절 가능
- Curve 조절 가능
- Threshold 조절 가능
- Ruleset별 설정 가능
- Action별 설정 가능
- Technique 추가 가능
- Combo/Sequence 추가 가능
- Skill Card 추가 가능
- Ring Name 추가 가능
- 성장/밸런스 튜닝 가능

목표는 밸런스 문제가 생겼을 때 코드 구조를 다시 설계하지 않고 데이터와 Parameter를 조정해 대응하는 것이다.

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

## Technique 관련 Data 후보
- InternalProficiency
- DisplayStarThreshold
- InitialProficiencyFormula
- RelatedBaseParameter
- GrowthAptitudeModifier
- HiddenAffinityModifier
- TrainingExpMultiplier
- MatchExpMultiplier
- FinishExpBonus

---

# 변경 이력 / Superseded Decisions

## 인터뷰 05 → 인터뷰 06

이전 표현:
> 규칙별로 심판 평가 기준이 다를 수 있다.

최신 결정:
> Universal Judging Engine 하나를 사용하고, Ruleset에서 발생 불가능한 채점 항목만 비활성화한다.

## 인터뷰 04 → 인터뷰 06

초기 `Counter Ability` 표현은 이후 구조가 정교화되면서 다음으로 구분한다.
- Counter Conversion: 선수의 카운터 기회 전환 역량
- 실제 Counter Success: Counter Conversion + Vulnerability + Setup + Range + Read Confidence 등 Context

초기 `Feint Ability` 표현도 다음으로 구체화한다.
- Feint Execution
- Feint Recognition

## 인터뷰 02의 예시 능력치 명칭

초기 문서의 `Punch Power`, `Speed`, `Endurance`, `Recovery` 등의 예시는 현재 Base Parameter 확정안으로 대체한다.

최신 Base Parameter는 본 문서의 **5. Base Parameter**를 기준으로 한다.

## 인터뷰 01 → 인터뷰 08: Skill Card 보유 구조

초기 표현:
> 한 선수는 최대 5개의 Skill Card를 가질 수 있다.

최신 결정:
> 선수는 Skill Card를 여러 장 보유할 수 있으며, 한 경기에서 동시에 활성화 가능한 Skill Card만 최대 5장이다.

## 인터뷰 01 → 인터뷰 08: 기술과 Skill Card 분리

초기에는 선수 특징을 Skill Card 중심으로 정의했으나, 최신 구조에서는 다음을 분리한다.
- Technique: 실제 사용 가능한 개별 기술 + 숙련도
- Combo/Sequence Proficiency: 사전 정의 연속 기술의 숙련도
- Skill Card: 스타일/조건부 특성
- Ring Name: 희귀 커리어 업적/칭호

---

# 문서 관리 규칙

1. `docs/interviews/`는 인터뷰 당시의 결정과 맥락을 보존한다.
2. 결정이 바뀌면 이 `current_decisions.md`를 즉시 최신값으로 수정한다.
3. 이전 결정과 충돌할 경우 `Superseded Decisions`에 변경 출처를 기록한다.
4. 실제 구현/밸런싱 시에는 인터뷰 파일보다 이 문서를 우선한다.
5. 새 벤치마킹 조사 내용은 `docs/benchmark/`의 게임별 파일에 누적한다.
6. 새 인터뷰를 완료할 때마다 인터뷰 문서와 SSOT를 함께 갱신한다.
7. 모든 주요 배율/Curve/Threshold/성장 보상은 코드 상수로 고정하지 않고 데이터 Parameter로 관리한다.
