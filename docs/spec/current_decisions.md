# FCM Current Decisions — Authoritative Specification Register

> 프로젝트 가제: **Fight Club Manager (FCM)**
> 상태: **Part 1~2 Initial Full Game Specification v1**
> 역할: 현재 유효한 결정만 모아두는 단일 기준 문서(SSOT)
> 상세 통합 명세: `docs/spec/game_spec_part1_part2.md`
> 개념 데이터 모델: `docs/spec/data_model_part1_part2.md`
> 구현 순서: `docs/spec/implementation_roadmap_part1_part2.md`
> 인터뷰 History: `docs/interviews/`
> 사용자 위임 후 확정 설계: `docs/design/12_*.md` ~ `17_*.md`

---

# 1. 현재 Scope

현재 상세 명세와 초기 개발 범위는 **Part 1과 Part 2까지**다.

## Part 1 — Underground Fight Club
- 플레이어가 직접 볼 수 있는 지하 파이트클럽은 1개
- 독립 코치/매니저로 시작
- Roster 목표 최대 약 3명
- 대부분 직접 관리

## Part 2 — International Fight Circuit
- 국제 공식 격투 무대
- Roster 목표 최대 약 10명
- 전문 Staff / Scout / Delegation 확대
- 공식 Ranking / Weight / Contract / Sponsor

## Future Scope
Part 3 직접 Promotion 운영은 장기 비전으로 유지하지만 현재 상세 명세/초기 개발에서는 제외한다.
1~2부 개발 후 재설계한다.

---

# 2. 핵심 플레이 판타지

우선순위:

1. **애정을 가지고 키운 Fighter가 전략과 성장을 거쳐 괴물급 Fighter로 성장하는 경험**
2. **숨겨진 Prospect를 직접 발견하는 경험**
3. 부상으로 선수 커리어가 꺾인 전직 MMA Fighter가 제자를 통해 새로운 커리어를 만드는 서사

핵심 원칙:

> 높은 숫자 총합이 게임의 정답이 되어서는 안 된다.

Fighter의 실제 강함은 Base Parameter뿐 아니라 Body, Technique, Skill Card, Ring Name, Rule Familiarity, Weight, Cardio, Injury, Setup, Strategy, Opponent Matchup이 결합해 결정한다.

---

# 3. Player Character

- 전직 MMA Fighter
- Injury로 본인의 선수 커리어가 내리막
- 지인의 권유로 Underground 코칭 시작
- Fight Club 직원이 아니라 독립 Coach / Manager
- 직접 Fighter를 발견하고 계약하여 출전시킴

Player Capability 5축:
- Coaching
- Analysis
- Scouting
- Negotiation
- Management

실제 활동 History로 성장한다.

`Player Reputation`은 실제 Capability와 별도이며 Fighter Join Interest, Staff Hiring, Promotion, Sponsor, Fight Opportunity 등에 영향을 준다.

---

# 4. Ruleset / Competition

Ruleset 4개:
- MMA
- Boxing
- Kickboxing
- No Rules

각 Fighter는 Ruleset별 Familiarity를 가진다.

Part 2 Ranking Key:

**Ruleset × Weight Division**

Champion은 #1과 별도 상태.

플레이어용 별도 `Ranking Point`는 사용하지 않는다.
내부 순위 계산용 Score는 허용하지만 Gameplay Resource/UI 핵심값으로 만들지 않는다.

Ranking 핵심 입력:
- 승패
- 상대 Ranking
- Activity
- 경쟁적 중요도

화려한 Finish는 Ranking보다 Ticket Power/Performance 보상에 더 크게 작용한다.

---

# 5. Part 1 Progression

플레이어가 직접 경험하는 Underground Fight Club은 1개다.
다른 Fight Club의 상세 Ranking/UI는 Part 1에서 보여주지 않는다.

일반 진행:

`Newcomer`
→ `실전 검증`
→ `Club Regular`
→ `Top Challenger`
→ `Fight Club Champion`

Club 내부에 4 Ruleset이 모두 존재한다.
Part 1 Weight는 공식 2부보다 느슨한 `Weight Band / Agreed Weight` 중심으로 운영 가능하다.

Part 1 메인 목표:

> 관리 Fighter 한 명을 Fight Club Champion으로 만든다.

---

# 6. Part 1 → Part 2 전환

Fight Club Champion 배출 후:

**플레이어 Fighter vs 외부 Underground Fight Club Champion**

특별전을 진행한다.

이를 통해 다른 Fight Club과 더 넓은 국제 격투 세계를 처음 강하게 Reveal한다.

승리 시 International Entry 기회를 얻는다.
패배해도 Save를 영구 봉쇄하지 않으며 재도전/다른 Fighter Route를 제공한다.

---

# 7. Part 2 Progression / Completion

체감 Ladder:

`International Entry / Unranked`
→ `Ranked Fighter`
→ `Top Rank`
→ `Contender`
→ `International Champion`

Title Shot은 #1 자동 지급이 아니다.
먼저 Competitive Eligibility를 충족해야 한다.
후보 간 우선도:
- Rank
- Activity
- 최근 경기력
- Ticket Power
- Rivalry
- Champion Story
- Event Value

현재 메인 Narrative Completion:

> 플레이어가 직접 발굴/관리한 Fighter 한 명을 International Champion으로 만든다.

그 후 Sandbox 계속 가능.

---

# 8. Fighter Base Parameter — 18개

직접 훈련/성장하는 Base Parameter만 아래 18개로 둔다.

## Physical
- Strength
- Explosiveness
- Agility
- Cardio
- Durability
- Reflex

Reflex는 신체 이동속도가 아니라 인지/판별/예측/반응 속도.

## Striking
- Punch Technique
- Guard Technique
- Kick Technique
- Footwork Technique

Punch/Kick Accuracy는 Technique에 포함.
Punch/Kick Defense는 Guard Technique으로 통합.
Block과 Evasion은 별도 행동이지만 Guard Technique은 둘 모두에 도움.

## Grappling
- Takedown Technique
- Takedown Defense Technique
- Clinch Technique
- Ground Bottom Technique
- Ground Top Technique
- Submission Technique

Submission 공격/방어는 하나의 Base Parameter.
Ground Striking은 별도 Base Parameter를 두지 않는다.

## Combat Intelligence
- Fight IQ
- Tactical Execution

Fight IQ는 상황 판단, Pattern 학습, Setup/Feint/Counter 활용, 예측, 행동 선택 품질에 폭넓게 관여.
Tactical Execution은 Player/Coach Strategy와 Sequence를 충실히 수행하는 정도.

내부 정밀값 사용 가능, UI는 0~100.

---

# 9. Fighter Identity

별도 Personality / Weakness 시스템은 두지 않는다.

Fighter Identity:

**Base Parameter + Body + Technique + Combo + Skill Card + Ring Name + Career History**

## Body Data
- Height
- Reach
- Natural Weight
- Current Weight
- Age
- Stance

숨겨진 체질 Parameter 허용:
- Weight Cut Resistance
- Weight Gain Adaptability
- Stress Resistance

완전 비공개가 아니라 관찰/대화/경험으로 Hint 제공.

---

# 10. Technique / Combo

Technique은 Skill Card와 분리한다.

각 Technique:
- 내부 정밀 숙련도
- UI 별 1~5

관련 Base Technique이 높은 Fighter는 새로운 관련 Technique을 더 높은 초기 숙련도에서 시작 가능.

3단 구조:
- Fundamental Action
- Learnable Technique
- Signature Technique

실전 Technique EXP는 Training보다 훨씬 높게 설정한다.
현재 초기 밸런스 기준은 **Training 대비 약 10배**이며 Parameter로 관리한다.

특정 Technique으로 Finish 시 매우 큰 해당 Technique EXP Bonus.

주요 Combo / Sequence는 별도 Proficiency를 가진다.
모든 가능한 조합은 저장하지 않는다.

---

# 11. Skill Card / Ring Name

## Skill Card
기술 자체가 아니라 스타일 / 조건부 특성 / 행동 연결 특성.

예:
- Liver Hunter
- Chain Wrestler

여러 장 보유 가능.
한 경기 동시 활성 기본 최대 5장.
카드별 고유 효과를 유지하면서 성장 가능.
획득은 Fighter의 실제 History와 연결.

## Ring Name
Skill Card보다 희귀한 커리어 업적/칭호.
Combat, Ticket Power, Matchmaking, Reputation에 영향 가능.

일부 NPC는 Unique Ring Name 보유.
그 이름 자체를 탈취하지 않고 해당 NPC 격파 업적에 대응하는 Ring Name 해금 가능.

---

# 12. Potential / Growth / Breakthrough

Potential 구조:
- Overall Talent
- Physical Aptitude
- Striking Aptitude
- Grappling Aptitude
- Combat Intelligence Aptitude
- 일부 예외 Modifier

Base Parameter마다 별도 Potential 숫자를 기본 구조로 두지 않는다.
정확한 Potential Ceiling은 공개하지 않는다.

Potential은 Hard Cap이 아니다.
한계 부근에서 성장 효율 Curve가 급격히 나빠져 사실상 정지처럼 느껴진다.
완전히 멈추지는 않는다.

지속적으로 한계를 두드리며 강한 상대, 중요한 경기, Adversity, Technique Mastery 등을 경험하면 Breakthrough 가능.

Breakthrough는 내부적으로 수치화하되 Progress는 UI에 직접 공개하지 않는다.

극한 경기 / 첫 패배 극복 등에서 *Darkest Dungeon*의 영웅의 기상과 같은 특별 긍정 성장 Event가 발생 가능.

---

# 13. Combat Architecture

확정 구조:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

## Derived Capability
Base + Body 조합으로 계산.
독립 성장값이 아니다.

주요 Derived:
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

System 존재와 주요 영향은 공개하되 정확한 내부값은 숨길 수 있다.

## Effective Performance
Stamina, Damage, Injury, Weight, Range, Setup, Familiarity, Skill Card 등 현재 Context 반영.

## Action Result
실제 Action 시도/성공/실패/Impact/Position/Damage를 계산.

---

# 14. Action Data

각 Action은 Fighter Stat과 별도 Data를 가진다.

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

Technique 밸런스는 Fighter Base Parameter를 직접 수정하지 않고 Action Data 조절로 해결 가능해야 한다.

---

# 15. Range / Setup / Combat Memory

## Range
각 Action의 Optimal Range에서 Impact를 최대한 발휘.
Range Control은 자신의 유리한 거리를 만드는 능력.
Reach는 Range Strategy와 결합.

## Setup
영구 Fighter Stat이 아닌 Combat Context.

단일 Action 빈도보다 Combo / Sequence Pattern 중심.

흐름:
`Pattern Exposure`
→ `Opponent Expectation / Read Confidence`
→ `Pattern Break / Feint / Counter / Takedown Setup`

Fight IQ가 Pattern 학습/활용에 영향.
Tactical Execution이 Player가 지시한 Setup 수행에 영향.

AI 자동 활용과 Player 직접 지시 모두 가능.

별도 Momentum / Flow State 게이지는 사용하지 않는다.

---

# 16. Randomness

**Randomness creates variation, not causation.**

승자를 마지막 확률 Roll로 뽑지 않는다.
Upset은 Strategy, Matchup, Range, Setup, Counter, Stamina, Injury, Weight 등의 인과관계에서 발생해야 한다.

매우 강한 Favorite가 운 하나 때문에 억지로 패배하는 느낌을 크게 제한한다.

---

# 17. Cardio / Damage / Finish

Stamina 0~100 Curve:
- 80+: 거의 최상
- <80: 성능 저하 시작
- <50: 눈에 띄는 저하
- <30: 거의 좀비 상태

낮은 Stamina는 공격력 하나가 아니라 Speed, Explosiveness, Guard, Evasion, Takedown Defense, 판단, Damage Vulnerability 등에 복합 영향.

전신 HP 없음.

부위:
- Head
- Body
- L/R Arm
- L/R Leg

Finish는 HP 0이 아니라 Damage + Impact + Cardio + Effective Durability + Vulnerability의 결과.

상태 예:
Normal → Stagger → Groggy → Knockdown → KO/TKO

---

# 18. Injury / Medical / Wear

세부 기준: `docs/design/12_injury_medical_weight.md`

상태 4계층:
1. Fight Damage
2. Injury
3. Permanent Wear
4. Current Body Part Condition

Injury Risk는 원인이 먼저 존재해야 한다.
훈련 Load, Recovery Debt, 기존 Injury, Damage, Hard Sparring, Age, Weight Stress 등이 위험을 형성.

Diagnosis에도 Knowledge/Confidence가 존재.

일부 Injury는 안고 출전 가능:
- Effective Performance 하락
- Reinjury Risk
- Permanent Wear Risk

심각한 상태는 Medical Suspension 가능.

반복 KO / Knockdown은 Head Wear에 장기 영향.

---

# 19. Weight / Aging

## Weight
Part 1은 느슨한 Agreed Weight / Weight Band 가능.
Part 2는 공식 Division / Weigh-In.

Weight Cut Plan:
- Conservative
- Normal
- Aggressive

현실 감량 방법을 재현하는 미니게임이 아니라 시간/부담 관리.

Weight Stress 영향:
- Cardio
- Recovery
- Durability
- Stress
- Injury
- Fight Readiness

Weight Miss:
- Catchweight / Purse Cut / Opponent Refusal
- 심하면 Fight Cancellation / Reputation 문제

체급 상승도 즉시 상위호환 아님.
적응 전 Agility/Cardio/Footwork 비용 발생 가능.

## Aging
- Physical Decline
- Recovery 느려짐
- Injury/Wear 증가
- Cut 부담 증가

Fight IQ / Technique / 경험은 Veteran 장점이 될 수 있다.

---

# 20. Scouting / Knowledge

세계 True Fighter DB와 Player Known Fighter DB를 분리한다.

Player는 처음부터 모든 Fighter를 볼 수 없다.

발견:
- 직접 관람
- 상대 Fighter
- 체육관 / 대회
- 소개
- SNS / Video
- 소문
- Scout
- 높은 Ticket Power

단일 Scouting % 없음.
분야별 Knowledge:
- Physical
- Striking
- Grappling
- Combat Intelligence
- Technique
- Rule Familiarity
- Weight Adaptation
- Potential
- Market

각 정보:
- Confidence
- Freshness
- Evidence Amount

핵심:

> **Raw Evidence는 사실이며 Interpretation은 틀릴 수 있다.**

Player/Scout/Coach는 실제 행동을 잘못 해석할 수 있다.

소속 Fighter도 해당 능력과 관련된 훈련/경기 Evidence가 쌓여야 추정 범위가 좁아진다.

---

# 21. Weekly Calendar / Fight Camp

세부 기준: `docs/design/13_fight_camp_and_weekly_calendar.md`

기본 시간 단위는 Week.

인위적인 훈련 횟수 제한 대신 실제 일정 / Training Load / Recovery / Stress로 제약.

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

Training Load가 Recovery Capacity를 계속 넘으면 Recovery Debt 누적.

Fight Camp 준비 5축:
- Physical Fitness
- Tactical Preparation
- Technical Sharpness
- Weight Readiness
- Mental / Life State

Peak Condition은 마법 Buff가 아니라 위 상태들이 좋은 조합에 도달한 결과.

---

# 22. Fight Readiness / Analysis

Fight Readiness는 전투 Base Stat이 아닌 상태 Summary.
UI 예:
- Excellent
- Good
- Questionable
- Poor
- Not Cleared

세부 원인을 보여준다.

Opponent Video Analysis는 주간 활동.
오래되거나 잘못 해석된 정보가 잘못된 Camp/Strategy로 이어질 수 있다.

경기 후 Report:
1. Judge Score Report
2. Coach Causal Analysis

Causal Report 품질은 Player Analysis, Staff, Evidence, Post-Fight Review에 영향받는다.

---

# 23. Contract / Relationship

Player는 Fighter를 소유하지 않는다.

Dual Contract:
1. Player ↔ Fighter: Management / Coaching Agreement
2. Fighter ↔ Fight Club / Promotion: Fight Contract

Management 조건 후보:
- Share
- Duration
- Fight Commitment
- Training Support
- Termination
- Bonus
- Sponsor Share

고정 Personality 대신 현재 `Career Need` 사용.

Promise 가능:
- 일정 기간 내 Fight
- Title Opportunity
- Ruleset
- Weight
- Staff / Facility

Relationship:
- Trust
- Respect
- Satisfaction

고정 Loyalty 없음.
장기 잔류는 실제 History 결과.

---

# 24. Stress / Life

Fighter는 훈련만 하는 객체가 아니다.

Stress 원인:
- 과훈련
- Injury
- 연패
- 큰 경기 압박
- 계약/Promise 문제
- Weight Cut
- 사생활 부족
- Media
- Undefeated 압박 / First Loss

Stress Resistance는 숨겨진 체질 Parameter 가능.

Player는 휴식, 일정, Match 선택, 커뮤니케이션으로 Stress 관리.

---

# 25. Roster / Staff / Delegation

세부 기준: `docs/design/14_staff_facilities_delegation_and_player_progression.md`

Roster 목표:
- Part 1 ≤ 약 3
- Part 2 ≤ 약 10

Direct Management 기본 목표 ≤ 약 5.
모두 Parameter화.

Staff Role:
- General / Assistant Coach
- Striking Coach
- Grappling Coach
- S&C
- Analyst
- Scout
- Medical
- Weight Specialist

Staff는 단순 Combat Buff가 아니라 Training/Analysis/Risk Detection/Delegation Quality에 영향.

Staff Workload / Capacity 존재.

Delegation:
- Manual
- Assisted
- Delegated
- Auto with Policy

시설 Module:
- Core Gym
- Striking
- Grappling
- S&C
- Recovery / Medical
- Analysis

Roster 확대는 클릭 수 증가가 아니라 조직 관리 능력 증가여야 한다.

---

# 26. Matchmaking / Fight Offer

Fight Offer Data 후보:
- Purse
- Win / Finish Bonus
- Opponent
- Ruleset / Weight
- Ranking Opportunity
- Event Value
- Short Notice
- Title Implication
- Injury Risk
- Rivalry
- Opponent Ticket Power

Inbound / Outbound Offer 모두 존재.

Fight Acceptance 영향:
- Competitive Value
- Ticket Power
- Purse
- Risk
- Career Need
- Rivalry
- Injury / Camp

낮은 Rank라도 높은 Ticket Power로 강자 Match를 얻을 수 있지만 Competitive Title Eligibility를 무시할 수는 없다.

---

# 27. Weak Opponent / Upset / Performance

약한 상대를 붙이는 육성 전략 허용.
일반적인 Ranking/Combat EXP 효율은 낮아질 수 있다.

그러나:
- 높은 Ticket Power 상대
- 악명
- Rivalry
- 화려한 Finish
- 명경기

라면 별도 가치 가능.

Performance of the Night / Fight of the Night 유사 보상 사용 가능.

Underdog Upset은 큰 이벤트:
- Ranking
- Ticket Power
- EXP
- Fight IQ
- Skill Card
- Ring Name
- Breakthrough

실제 극복한 불리함을 평가.

---

# 28. Weight Division Move / Activity

일반 Ranker / Unranked가 새 체급으로 이동하면 기본적으로 밑바닥부터 시작.

Champion / Top Elite는 Prestige 덕분에 첫 경기부터 강한 상대 / Contender / Title급 Opportunity 가능.
그 Fight를 이기면 상대 수준에 맞는 높은 Ranking에서 시작.

과거 Rank 자체를 복사하지 않는다.

장기 Inactivity:
- Ranking 하락
- Ranking 제외 가능

---

# 29. Rivalry / Record

Rivalry는 버튼으로 생성하지 않는다.
History에서 발생:
- 접전
- 판정 논란
- Rematch
- Title
- 큰 Finish
- 도발

효과:
- Ticket Power
- Purse
- Stress
- Rematch
- Ring Name

분리 원칙:

**Actual Strength ≠ Ranking ≠ Ticket Power ≠ Fight Record**

Undefeated Record는 큰 Premium과 동시에 Stress를 만든다.
첫 패배 후 극복은 Adversity / Legend Event의 핵심 소재.

---

# 30. Ticket Power / Economy / Sponsor

세부 기준: `docs/design/15_economy_sponsors_and_ticket_power.md`

기존 `Fame` 명칭은 **Ticket Power**로 통일.
공개 0~100 흥행 가치.
전투 Engine의 직접 Combat Stat 아님.

영향:
- Fight Acceptance
- Purse
- Sponsor
- Title Candidate 우선도
- Contract Expected Value

패배 자체보다 경기 Story / Performance가 중요.
명경기 패배로 상승 가능.

Fighter Cash와 Management Cash 분리.
Player 수입은 Management Agreement에 따른 Share.

지출:
- Staff
- Facility
- Camp
- Travel
- Medical
- Scouting

Sponsor:
- Fighter Sponsor
- Management Sponsor

Sponsor는 돈과 Media/Appearance 일정 의무를 함께 줄 수 있어 Calendar / Stress와 Trade-off를 만든다.

---

# 31. International League / World Simulation

세부 기준: `docs/design/16_international_league_and_world_simulation.md`

Part 2는 하나의 **International Fight Circuit** 중심.
여러 Promotion/Event Organizer는 존재 가능하지만 Ranking을 Promotion마다 분리하지 않는다.

Promotion 차이:
- Prestige
- Budget
- Region
- Ruleset Focus
- Contract Style
- Ticket Power Preference

NPC Fighter도 동일한 핵심 Fighter Data Model 사용.

Simulation Tier:
- A: Player Relevant
- B: Known World
- C: Background World

Relevant할수록 세부적으로 Simulation.

NPC도:
- 경기
- 성장
- Injury
- Weight / Ruleset 변경
- 계약
- 은퇴

신규 Prospect 지속 생성.

Fighter는 Player가 발견될 때 생성되는 것이 아니라 이미 살아온 History를 가진 채 발견되어야 한다.

---

# 32. Data Architecture

개념 모델: `docs/spec/data_model_part1_part2.md`

가장 중요한 구현 규칙:

**Fighter True State와 Player Knowledge State를 처음부터 분리한다.**

Definition Data와 Runtime State도 분리.

주요 Definition:
- Ruleset
- Action
- Technique
- Combo
- Skill Card
- Ring Name
- Training Activity
- Injury Type
- Facility

모든 주요 Weight / Curve / Threshold / Multiplier는 Data/Config로 조절 가능해야 한다.

---

# 33. Development Priority

구현 순서: `docs/spec/implementation_roadmap_part1_part2.md`

최우선:
1. Data / Save / Deterministic RNG
2. Fighter True / Knowledge State
3. Headless Combat
4. Setup / Combat Memory
5. Damage / Injury / Weight
6. Growth / Calendar / Fight Camp
7. One Fighter Vertical Slice
8. Scouting / Contract
9. Part 1
10. Staff / Delegation
11. Economy / Ticket Power
12. Part 2 World

3D Combat는 별도 프로젝트에서 개발 후 Integration.

---

# 34. 개발에서 현재 제외할 것

- Part 3 Promotion 운영
- 100명 Roster
- 전투용 Overall
- Fighter Personality 시스템
- Weakness 별도 시스템
- 전신 HP
- Player에게 보이는 Ranking Point
- 승자를 직접 뽑는 Win Probability Roll
- 모든 Combo 조합 자동 저장
- 모든 Derived 수치 공개
- 현실적 위험 행동을 세부 재현하는 Weight Cut 미니게임
- 세밀한 회계 시뮬레이션

---

# 35. Superseded Decisions

## Interview 05 → 06: Judging
규칙별 별도 Judging Formula 아이디어 폐기.
Universal Judging Core + Ruleset별 불가능 Category 비활성화.

## Interview 04 → 06: Counter / Feint
`Counter Ability` → `Counter Conversion + Combat Context`로 세분화.
`Feint Ability` → Feint Execution / Recognition.

## Interview 02 초기 예시 Stat
Punch Power / Speed / Endurance / Recovery 예시는 현재 18 Base Parameter 구조로 대체.

## Interview 01 → 08: Skill Card
초기 최대 5개 보유 → 여러 장 보유 가능, 경기 활성 최대 기본 5장.

## Interview 01 → 08: Technique
Technique은 Skill Card와 완전 분리.

## Interview 09: Recruitment Rating
Overall UI는 가능하지만 영입 추천을 단일 별점으로 압축하지 않는다.

## Interview 10 → 11: Scope
3부까지 상세 명세 → 1~2부만 현재 Full Game Scope.

## Interview 10 → 11: Roster
3부 100명 아이디어는 Future Scope로 이동.

## Interview 11: Underground Visibility
여러 Fight Club 탐색/지역 통합 Ranking 아이디어 폐기.
Part 1 직접 가시 Fight Club은 1개.

## Interview 11: Ranking Point
플레이어용 Ranking Point 폐기.

## Interview 11: Fame
흥행 관련 최신 명칭 `Ticket Power`.

---

# 36. 문서 관리 규칙

1. 본 파일이 **현재 결정 SSOT**다.
2. `docs/interviews/`는 결정 당시 History를 보존한다.
3. `docs/design/`은 사용자 위임 이후 확정한 상세 설계를 보존한다.
4. 충돌 시 최신 SSOT와 `game_spec_part1_part2.md`를 우선한다.
5. 변경된 결정은 Superseded Decisions에 남긴다.
6. 모든 핵심 밸런스 값은 Data Parameter로 관리한다.
7. 새 설계 반영 후 GitHub 파일 존재와 SSOT를 재검증한다.
8. 현재 범위는 Part 1~2이며 Part 3는 Future Scope다.
