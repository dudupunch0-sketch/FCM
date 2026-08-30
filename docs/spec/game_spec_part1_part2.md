# Fight Club Manager (FCM) — Part 1~2 통합 게임 명세

> 상태: **Initial Full Game Specification v1**
> 현재 범위: **Part 1 Underground Fight Club + Part 2 International Fight Circuit**
> 제외: Part 3 Promotion 운영은 Future Scope
> 기준 문서: `docs/spec/current_decisions.md`
> 세부 결정 History: `docs/interviews/`
> 위임 설계 세부안: `docs/design/12_*.md` ~ `17_*.md`

---

# 0. 한 문장 정의

**FCM은 숨겨진 가능성을 가진 격투 선수를 직접 발견하고, 삶·훈련·체중·부상·전략을 관리해 실제 경기에서 성장시키며, 작은 지하 파이트클럽에서 국제 챔피언까지 올려보내는 장기 격투 매니지먼트 시뮬레이션이다.**

---

# 1. 핵심 플레이 판타지

우선순위는 다음과 같다.

1. **애정을 가지고 키운 선수가 전략과 성장을 거쳐 괴물급 선수로 성장하는 경험**
2. **숨겨진 유망주를 발견하는 경험**
3. 부상으로 선수 커리어가 꺾인 전직 MMA Fighter가 제자를 통해 새로운 커리어를 만드는 서사

게임은 선수의 현재 능력치를 정답처럼 읽고 최적 수치를 구매하는 게임이 아니다.

플레이어가 반복해서 해야 하는 질문은 다음이어야 한다.

- 이 선수는 실제로 어떤 선수인가?
- 무엇을 키우는 것이 이 선수에게 맞는가?
- 부족한 부분을 보완할 것인가, 강점을 극단적으로 밀 것인가?
- 이 상대를 지금 붙여도 되는가?
- 이번 Camp에서 성장을 택할 것인가, 경기 준비를 택할 것인가?
- 내가 본 상대 정보는 믿을 만한가?
- 위험을 감수하고 큰 기회를 잡을 것인가?

---

# 2. 전체 진행 구조

## Part 1 — Underground Fight Club

- 플레이어가 직접 볼 수 있는 지하 파이트클럽은 1개
- 독립 코치/매니저로 활동
- 초기 Roster 목표 최대 약 3명
- 대부분 직접 관리
- 낮은 자금 / 작은 시설 / 제한적 Staff
- Scouting도 직접 수행
- 4 Ruleset 존재
- Club Champion 배출이 1차 목표

Part 1 종료 관문:

**플레이어가 키운 Fight Club Champion vs 외부 Fight Club Champion**

이 특별전을 통해 외부 격투 세계의 존재를 Reveal한다.

## Part 2 — International Fight Circuit

- 국제 공식 Ranking 공개
- 여러 Promotion/Event Organizer와 계약
- Roster 목표 최대 약 10명
- Direct Managed Fighter는 기본 5명 이하
- Coach / Scout / Analyst / Medical Staff를 활용한 Delegation
- 공식 Weight Division / Weigh-In / Medical Suspension
- Sponsor / Ticket Power / Rivalry 확대
- 세계 선수들이 독립적으로 성장/경쟁

메인 스토리 완료:

**플레이어가 직접 발굴/관리한 Fighter 한 명을 International Champion으로 만든다.**

이후 Save는 Sandbox로 계속 가능하다.

---

# 3. Ruleset

4개 Ruleset:

1. MMA
2. Boxing
3. Kickboxing
4. No Rules

각 Fighter는 Ruleset별 Familiarity를 가진다.

- MMA Familiarity
- Boxing Familiarity
- Kickboxing Familiarity
- No Rules Familiarity

Familiarity는 전투 중:
- 행동 선택
- 거리 감각
- 규칙 적응
- Tactical Execution
- 허용/금지 Action 대응

등에 영향을 준다.

규칙은 Action Data의 `RuleAvailability`로 관리한다.

Judging은 별도 엔진을 4개 만드는 대신 **Universal Judging Engine** 하나를 사용하고 해당 Ruleset에서 불가능한 평가축만 비활성화한다.

---

# 4. Fighter 핵심 데이터 모델

## 4.1 Base Parameter — 18개

### Physical
- Strength
- Explosiveness
- Agility
- Cardio
- Durability
- Reflex

### Striking
- Punch Technique
- Guard Technique
- Kick Technique
- Footwork Technique

### Grappling
- Takedown Technique
- Takedown Defense Technique
- Clinch Technique
- Ground Bottom Technique
- Ground Top Technique
- Submission Technique

### Combat Intelligence
- Fight IQ
- Tactical Execution

UI는 0~100.
내부 Engine은 더 정밀한 실수값 사용 가능.

Base Parameter만 직접 훈련/성장한다.

`Punch Power`, `Punch Accuracy`, `Kick Accuracy`, `Ground Striking` 등은 별도 Base로 만들지 않는다.

---

# 5. Fighter Identity

Fighter Identity는 다음의 조합이다.

**Base Parameter + Body + Technique + Combo Proficiency + Skill Card + Ring Name + Career History**

별도 Personality / Weakness 시스템은 두지 않는다.

## Technique
개별 실제 기술.
- 내부 숙련도
- UI 별 1~5

높은 관련 Base Technique을 가진 Fighter는 새 기술을 높은 초기 숙련도로 시작할 수 있다.

3종:
- Fundamental Action
- Learnable Technique
- Signature Technique

## Combo / Sequence Proficiency
사전 정의된 의미 있는 Combo만 별도 숙련.
Setup과 Tactical Execution에 연결.

## Skill Card
기술 자체가 아닌 스타일/조건부 특성.

예:
- Liver Hunter
- Chain Wrestler

여러 장 보유 가능.
한 경기 활성 기본 최대 5장.
카드마다 고유 효과를 유지한 채 성장 가능.

## Ring Name
Skill Card보다 희귀한 커리어 칭호.
Combat / Ticket Power / Matchmaking / Reputation과 연결.
Unique Rival의 Ring Name 자체는 빼앗지 않고 격파 업적에 대응하는 Ring Name을 획득 가능.

---

# 6. 전투 계산 Architecture

확정 4계층:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

## Derived Capability
Base와 신체조건을 통해 계산되는 실전 능력.
독립 성장값이 아니다.

대표:
- Punch Impact
- Punch Execution Speed
- Kick Impact
- Kick Execution Speed
- Range Control
- Guard Efficiency
- Evasion Capability
- Counter Conversion
- Feint Execution
- Feint Recognition
- Takedown Capability
- Takedown Defense
- Clinch Control
- Top Control
- Bottom Escape
- Submission Threat
- Submission Defense

존재와 작동 원리는 플레이어가 알지만 정확한 내부값은 숨길 수 있다.

## Effective Performance
현재 상태를 반영한 실제 순간 성능.

영향:
- Stamina
- Fatigue
- Injury
- Body Part Damage
- Current Weight
- Weight Stress
- Range
- Ruleset Familiarity
- Skill Card
- Setup / Context

## Action Result
특정 Action의 실제 결과.

---

# 7. Action Data

모든 기술은 선수 능력과 별도로 Action 고유 Parameter를 가진다.

대표 Data:
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

따라서 강한 Fighter가 모든 기술을 같은 효율로 쓰지 않는다.

예:
Jab은 빠르고 저비용, 낮은 Vulnerability, 높은 Setup Value.
Overhand는 높은 Impact, 높은 Energy Cost, 긴 Vulnerability.

선수 능력치를 건드리지 않고 Action Data만으로 기술 밸런스를 조절 가능해야 한다.

---

# 8. Range / Setup / Combat Memory

## Range
각 기술은 Optimal Range에서 자신의 Impact를 가장 잘 발휘한다.

Range Control은 단순 후퇴 능력이 아니라 **자신에게 유리한 거리를 만들고 유지하는 능력**이다.

Reach는 자동 플러스가 아니라 전략과 결합한다.

## Setup
Setup은 스탯이 아니라 경기 History에서 생기는 Context다.

중요한 단위는 Combo / Sequence.

흐름:

`Pattern Exposure`
→ `Opponent Expectation`
→ `Read Confidence`
→ `Pattern Break / Feint / Counter / Takedown Setup`

Fight IQ:
- 상대 Pattern 학습
- 자신의 Pattern 노출 감지
- Setup 생성/활용 판단

Tactical Execution:
- 플레이어가 지시한 Sequence 실행

Setup은 AI 자동 활용과 플레이어 지시 모두 가능하다.

별도의 Momentum / Flow State 버프 게이지는 사용하지 않는다.

---

# 9. Randomness 철학

**Randomness creates variation, not causation.**

난수는 실행의 작은 편차를 만들 수 있지만 사건의 원인이 되어서는 안 된다.

Upset은 가능하지만 원인이 있어야 한다.

예:
- 상성
- 잘못된 Strategy
- 거리 지배 실패
- Pattern Read
- Counter
- Cardio 고갈
- Injury
- Weight Cut 실패
- 누적 Damage

승자 자체를 마지막에 확률 Roll로 뽑지 않는다.
Action들의 인과관계가 결과를 만든다.

---

# 10. Cardio / Damage / Finish

## Stamina Curve — 0~100
- 80 이상: 거의 최상 상태
- 80 미만: 성능 저하 시작
- 50 미만: 눈에 띄는 저하
- 30 미만: 거의 좀비 상태

Curve는 연속적이며 낮아질수록 급격해진다.

낮은 Stamina는 단순 Damage 감소가 아니라:
- Execution Speed
- Explosiveness
- Guard
- Evasion
- Takedown Defense
- 판단 오류
- Damage Vulnerability

등을 복합적으로 악화시킨다.

## Damage
전신 HP 없음.

부위:
- Head
- Body
- L/R Arm
- L/R Leg

Damage는 해당 기능을 실제로 망가뜨린다.

Finish는 HP 0이 아니라:

`Body Part Damage + Impact + Cardio + Effective Durability + Vulnerability`

등의 조건으로:

Stagger → Groggy → Knockdown → KO/TKO

로 이어진다.

---

# 11. Injury / Medical / Permanent Wear

4계층:

1. Fight Damage
2. Injury
3. Permanent Wear
4. Current Body Part Condition

Injury는 원인이 먼저 존재해야 한다.

훈련 Injury Risk:
- Training Load
- Recovery Debt
- 최근 Damage
- 기존 Injury
- Hard Sparring
- Age
- Weight Stress

경기 Injury Risk:
- 해당 부위 Damage
- Impact
- Reinjury
- Body Part Condition

부상 진단에도 정보 비대칭이 존재한다.
좋은 Medical Staff가 Recovery Estimate와 Risk 판단을 정밀하게 만든다.

일부 Injury 상태에서 출전 가능하지만:
- Effective Performance 감소
- Reinjury
- Permanent Wear

위험이 증가한다.

심각한 상태는 Medical Suspension 가능.

---

# 12. Body / Weight / Aging

Body Data:
- Height
- Reach
- Natural Weight
- Current Weight
- Age
- Stance

숨겨진 체질 Parameter 예:
- Weight Cut Resistance
- Weight Gain Adaptability
- Stress Resistance

완전 비공개가 아니라 행동/대화/관찰을 통해 힌트를 제공한다.

## Weight Cut
Fight Camp에서 Conservative / Normal / Aggressive 같은 추상 Plan을 선택.

Weight Stress는:
- Natural / Current / Target Weight
- 남은 기간
- Cut Resistance
- Age
- 현재 상태

등으로 계산.

높은 Weight Stress:
- Cardio / Recovery / Durability 악화
- Stress / Injury Risk 상승

## Weight Gain
체급 상승이 즉시 상위호환이 아니다.
힘/Impact 잠재력은 오르지만 적응 전 Agility/Cardio/Footwork 부담이 생길 수 있다.

## Aging
- Physical decline
- Recovery 느려짐
- Injury / Wear 증가
- Cut 부담 증가

Fight IQ / Technique / 경험은 노장의 장점이 될 수 있다.

---

# 13. Scouting / Information Asymmetry

세계 실제 Fighter DB와 Player Known Fighter DB를 분리한다.

플레이어는 처음부터 모든 선수를 검색할 수 없다.

발견 경로:
- 직접 관람
- 상대 선수
- 체육관 / 아마추어 대회
- 소개
- SNS / Video
- 소문
- Scout
- 높은 Ticket Power

## 분야별 Knowledge
단일 Scouting % 없음.

- Physical
- Striking
- Grappling
- Combat Intelligence
- Technique
- Ruleset
- Weight Adaptation
- Potential
- Market

정보 상태:
- Confidence
- Freshness
- Evidence Amount

핵심:

**Raw Evidence는 사실이며 Interpretation은 틀릴 수 있다.**

좋은 Scout / Coach는 진실을 생성하는 것이 아니라 더 정확하게 해석한다.

Trial / Sparring으로 영입 전 직접 Evidence를 얻을 수 있다.

Recruitment Report는 단일 별점 대신:
- Current Level
- Growth Potential
- Strategy Fit
- Ruleset Fit
- Ticket Power Potential
- Confidence
- Acquisition Difficulty

등 복수 축으로 표현한다.

---

# 14. Growth / Potential / Breakthrough

훈련은 반통제형이다.

Growth 영향:
- Training Quality
- Talent
- 영역별 Growth Aptitude
- 일부 예외 Modifier
- Current Ability
- Age
- Coach
- Facility
- Fatigue
- Stress
- Potential Proximity

Potential 구조:
- Overall Talent
- Physical Aptitude
- Striking Aptitude
- Grappling Aptitude
- Combat Intelligence Aptitude
- 일부 Technique/Parameter 예외 Modifier

정확한 Potential Ceiling은 공개하지 않는다.

Potential은 Hard Cap이 아니다.
한계 구간에서 성장 효율이 급격히 나빠진다.

꾸준히 한계를 두드리고 중요한 실전/Adversity를 극복하면 Breakthrough 가능.

## 실전 성장
실전은 훈련보다 훨씬 높은 Technique 경험치를 준다.
현재 초기 기준값은 Training 대비 약 10배이며 Parameter화.

특정 Technique으로 Finish하면 매우 큰 해당 Technique 경험 보상.

Underdog Upset / 큰 경기 / 극한 상황은 Fight IQ, Breakthrough와 특별 성장 Event의 핵심 자극이다.

*Darkest Dungeon*의 영웅의 기상과 같은 드라마틱한 긍정적 전환 감성을 목표로 한다.

---

# 15. Weekly Calendar / Fight Camp

기본 시간 단위: Week.

인위적인 `훈련 3회 제한` 대신 실제 일정 충돌과 상태 비용으로 제한한다.

활동:
- Growth Training
- Technical Training
- Sparring
- Tactical Drill
- Video Analysis
- Recovery
- Weight Management
- Personal / Stress Relief
- Media / Fan
- Sponsor

모든 활동은 시간과 Training Load를 소비한다.

## Recovery Debt
Training Load가 회복능력을 계속 넘으면 누적.

결과:
- 성장 효율 감소
- Injury Risk
- Stress
- Fight Readiness 악화

## Fight Camp 준비 5축
- Physical Fitness
- Tactical Preparation
- Technical Sharpness
- Weight Readiness
- Mental / Life State

## Peak Condition
마법 버프가 아니다.
높은 Fitness + 낮은 Fatigue + 충분한 Sharpness + Weight 안정 + Injury 관리 + Tactical Prep의 조합이다.

---

# 16. Opponent Analysis / Corner / Reports

상대 Video Analysis는 주간 활동.

오래된 정보나 잘못된 해석은 잘못된 Camp/Strategy를 만들 수 있다.

경기 중:
- Fighter 스스로 Pattern을 학습
- Player/Coach가 Corner에서 추가 정보 전달

경기 후 2종 Report:

1. Judge Score Report
2. Coach Causal Analysis

Causal Report는:
- Player Analysis
- Analyst / Coach 능력
- 수집 Evidence
- 추가 Post-Fight Video Review

에 따라 정밀해진다.

---

# 17. Contract / Relationship

플레이어는 구단주가 아니라 Manager + Coach.

Dual Contract:

1. Player ↔ Fighter: Management / Coaching Agreement
2. Fighter ↔ Fight Club / Promotion: Fight Contract

Management 조건 후보:
- Management Share
- Duration
- Fight Commitment
- Training Support
- Termination
- Bonus
- Sponsor Share

## Career Need
고정 Personality 대신 현재 상황에서 발생.

예:
- Prospect: 성장 환경
- Prime: Title
- Veteran: 높은 Purse / 효율적 일정
- Losing Streak: 재기전
- Star: 큰 무대

## Promise
- 일정 기간 내 Fight
- Title Opportunity
- Ruleset
- Weight
- Coach / Facility

## Relationship
- Trust
- Respect
- Satisfaction

고정 Loyalty 스탯 없음.
오랜 동행/약속 이행/성공의 결과로 잔류 가능성이 높아진다.

---

# 18. Stress / Life

Fighter는 훈련만 하는 객체가 아니다.

Stress 원인:
- 과훈련
- Injury
- 연패
- 큰 경기 압박
- 계약 불만
- Promise 위반
- 감량
- 사생활 부족
- Media
- Undefeated 압박 / 첫 패배

플레이어는 일정, 휴식, Fight 선택, 커뮤니케이션으로 관리한다.

Stress Resistance는 숨겨진 선수 특성으로 존재 가능.

---

# 19. Staff / Facility / Delegation

Part 1에서는 플레이어가 대부분 직접 수행.
Part 2에서는 전문 Staff를 이용한다.

Role:
- General / Assistant Coach
- Striking Coach
- Grappling Coach
- S&C Coach
- Analyst
- Scout
- Medical / Physio
- Weight Specialist

Staff는 단순 Combat Buff를 주지 않는다.

영향:
- Training Quality
- Technique Teaching
- 분석 정확도
- Load Management
- Injury / Weight Risk 탐지
- Delegation 품질

## Staff Capacity
한 Staff가 무한 Fighter를 관리할 수 없다.
과부하 시 Report / Plan 품질이 저하.

## Delegation
- Manual
- Assisted
- Delegated
- Auto with Policy

## Facility Module
- Core Gym
- Striking
- Grappling
- S&C
- Recovery / Medical
- Analysis

시설 역시 경기 당일 직접 +Damage를 주지 않고 준비/육성 품질을 높인다.

---

# 20. Player Character Progression

소수 5축:
- Coaching
- Analysis
- Scouting
- Negotiation
- Management

실제 활동 History로 성장한다.

Player Reputation과 Capability는 분리한다.

Reputation 영향:
- Fighter Join Interest
- Staff Hiring
- Promotion Offer
- Sponsor
- Fight Opportunity

---

# 21. Roster Management

현재 목표값:
- Part 1: 최대 약 3명
- Part 2: 최대 약 10명

Data Parameter로 조절.

Direct Management:
- 기본 5명 이하

Direct Fighter는 세밀한 Calendar/Strategy/Weight/Technique 관리.
나머지는 Coach Policy로 위임.

**Roster 확대 = 클릭 수 증가**가 아니라 **조직 관리 능력 증가**여야 한다.

---

# 22. Ranking / Matchmaking / Title

## Part 2 Ranking
Key:

**Ruleset × Weight Division**

Champion은 #1과 별도.

플레이어용 Ranking Point 없음.

## Matchmaking
Fight Acceptance 영향:
- Rank / Competitive Value
- Ticket Power
- Purse
- Risk
- Career Need
- Rivalry
- Injury / Camp

Inbound / Outbound Fight Offer 모두 존재.

## 약한 상대
허용.
성장/Ranking 보상은 줄어들 수 있음.

하지만:
- 유명 상대
- 악명
- Rivalry
- 화려한 Finish
- Performance Award

때문에 가치가 생길 수 있다.

## Upset
강자를 꺾는 Underdog 승리는 큰 사건.
- Ranking
- Ticket Power
- EXP
- Skill Card / Ring Name
- Breakthrough

## Title Shot
#1 자동 지급 아님.
Competitive Eligibility가 먼저 필요.
그 후보군에서 Rank + Activity + Ticket Power + Rivalry + Story + Event Value로 우선도 결정.

---

# 23. Weight Class Move

일반 Ranker / Unranked:
새 체급에서 밑바닥부터 시작.

Champion / Top Elite:
과거 Prestige 덕분에 첫 경기부터 강한 상대 / Contender / Title급 기회를 받을 수 있음.

이 큰 기회를 이기면 상대 수준에 맞는 Ranking에서 시작.

과거 Rank 숫자를 그대로 복사하지 않는다.

---

# 24. Activity / Rivalry / Record

## Activity
장기 Inactivity:
- Ranking 하락
- 결국 Ranking 제외 가능

## Rivalry
History에서 생성.
- 접전
- 판정 논란
- 재대결
- Title
- 큰 Finish
- 도발 / Media

효과:
- Ticket Power
- Purse
- Stress
- Rematch
- Ring Name

## Record

**Actual Strength ≠ Ranking ≠ Ticket Power ≠ Record**

Undefeated는 강한 프리미엄.
첫 패배는 Stress와 Career Crisis를 만들 수 있으나 커리어 종료가 아니다.
극복 과정이 Legend Event가 될 수 있다.

---

# 25. Ticket Power / Entertainment

Ticket Power는 공개 0~100 흥행 수치.

영향:
- Purse
- Sponsor
- Fight Acceptance
- Title Candidate 우선도
- Contract Expected Value

상승:
- 유명 상대
- Upset
- Rivalry
- Title
- Undefeated
- Performance
- Media
- Ring Name

패배 자체보다 **경기의 이야기와 내용**이 중요하다.
명경기 패배로 Ticket Power가 오를 수 있다.

Performance of the Night / Fight of the Night 유사 Event를 사용 가능.

---

# 26. Economy / Sponsor

Fighter Cash와 Management Business Cash 분리.

Player 수입:
- Management Share
- Sponsor Share
- 일부 계약 수익

지출:
- Staff
- Facility
- Camp
- Travel
- Medical
- Scouting
- Sparring Partner

경제난은 즉시 Game Over보다 선택지 축소로 나타낸다.

Sponsor:
- Fighter Sponsor
- Management Sponsor

Sponsor는 돈과 함께 Media/Appearance 의무를 제공해 Calendar와 Stress를 압박한다.

---

# 27. International World Simulation

2부는 하나의 International Fight Circuit을 중심으로 한다.

여러 Promotion은 존재할 수 있지만 Ranking을 각각 따로 만들지 않는다.
차이는:
- Prestige
- Purse
- Region
- Ruleset Focus
- Contract
- Ticket Power 선호

## NPC World
NPC도 같은 핵심 Fighter Data를 사용.

Simulation Tier:
- A: Player Relevant
- B: Known World
- C: Background World

Relevant Fighter일수록 상세 시뮬레이션.
배경 세계는 압축.

NPC도:
- 성장
- Injury
- Weight Move
- Rule Switch
- Match
- Retirement

한다.

신규 Prospect가 지속적으로 생성된다.

---

# 28. Core Loop

## Part 1

`유망주 발견`
→ `불확실한 정보 평가`
→ `계약`
→ `훈련 / 생활 관리`
→ `Fight Offer`
→ `Camp / Strategy`
→ `Fight`
→ `Growth / Damage / Ticket Power / 관계 변화`
→ `더 강한 상대`
→ `Club Champion`
→ `외부 Champion 특별전`

## Part 2

`국제 Fighter / Prospect 관리`
→ `Staff / Scout / Delegation`
→ `Promotion Contract / Fight Offer`
→ `Camp / Weight / Sponsor`
→ `Ranked Fight`
→ `Ranking / Ticket Power / Record / Rivalry`
→ `Contender`
→ `Title Shot`
→ `International Champion`

---

# 29. UX 핵심 원칙

## 숫자를 숨기기만 하지 않는다
System 존재와 주요 영향은 반드시 설명한다.

Known Mechanic / Unknown Value.

## 원인을 설명한다
패배/성장/부상/정보 변화는 Report에서 이유를 추적 가능해야 한다.

## 단일 Overall 정답 금지
- Fighter Overall은 UI 참고 가능
- 전투 엔진에 사용하지 않음
- Scouting 추천도 단일 별점 금지

## 직접관리와 위임 모두 지원
가장 아끼는 Fighter는 세밀하게.
나머지는 신뢰하는 Staff에게.

---

# 30. Data-Driven 원칙

모든 시스템은 가능한 한 Data / Parameter화한다.

반드시 조절 가능해야 하는 것:
- Weight / Curve
- Growth
- EXP Multiplier
- Injury Risk
- Cardio Curve
- Action Data
- Ranking Update
- Ticket Power
- Contract
- Staff Capacity
- Facility
- Delegation
- World Generation
- NPC Simulation

코드에 특정 숫자를 직접 박아 밸런스를 해결하지 않는다.

---

# 31. 초기 개발에서 하지 않을 것

- Part 3 Promotion 운영
- 100명 규모 Roster
- 3D Combat 완성
- 세밀한 회계
- Fighter Personality 시스템
- Weakness 별도 스탯
- 모든 Combo 자동 생성
- 모든 Derived 수치 UI 공개
- 승패 확률 Roll 기반 전투

3D Combat는 별도 프로젝트에서 개발 후 Interface를 통해 이식한다.

---

# 32. 명세 완료 기준

이 문서와 세부 설계 문서를 기준으로 Part 1~2의 **기능적 게임 설계는 v1 완료**로 취급한다.

다음 단계는 추가 인터뷰가 아니라:

1. 데이터 스키마
2. Headless Simulation
3. Part 1 Vertical Slice
4. 밸런스 실험
5. UI / Content 확장

순으로 실제 개발에 들어간다.

개발 과정에서 재미가 검증되지 않는 부분은 Parameter와 시스템을 수정한다.
명세는 완성본이지만 불변 법전이 아니라 **실험 가능한 첫 구현 기준**이다.
