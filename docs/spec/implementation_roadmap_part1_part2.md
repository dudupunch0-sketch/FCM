# FCM Part 1~2 — Implementation Roadmap

> 목표: 명세를 실제 개발 순서로 변환
> 최우선 원칙: **3D 전투보다 Headless Simulation과 Management Core를 먼저 완성**
> 현재 범위: Part 1 + Part 2
> Part 3는 제외

---

# 1. 개발 전략

처음부터 모든 UI / 콘텐츠 / 3D를 동시에 만들지 않는다.

개발 순서:

**Data Foundation**
→ **Headless Fighter / Combat**
→ **한 Fighter의 전체 육성 Loop**
→ **Part 1 Vertical Slice**
→ **Staff / Delegation**
→ **Part 2 World Simulation**
→ **Content / Balance / Presentation**

핵심 질문은 항상:

> 이 시스템을 3D 화면 없이 숫자/로그만으로 재미와 인과관계를 검증할 수 있는가?

---

# 2. Phase 0 — Project Foundation

## 구현
- Save / Load
- Game Date / Week
- Deterministic RNG Seed
- Definition Data Loader
- Runtime State
- Event System
- ID / Reference 관리
- Config Versioning

## Definition Data 최소셋
- Ruleset
- Weight Division / Underground Weight Band
- Base Parameter
- Action
- Technique
- Training Activity

## 완료 기준
- 같은 Seed + 같은 입력으로 같은 결과 재현
- Config 값 변경 후 코드 수정 없이 결과 변화

---

# 3. Phase 1 — Fighter Core Model

## 구현
- 18 Base Parameter
- Body Data
- Rule Familiarity
- Growth Aptitude
- Technique Proficiency
- Combo Proficiency
- Skill Card State
- Ring Name State
- Career / Record

## Knowledge 분리
반드시 동시에 구현:
- True State
- Player Knowledge State
- Estimate Range
- Confidence
- Freshness
- Evidence

스카우팅을 나중에 붙이겠다고 True State를 UI에 직접 연결하지 않는다.

## 완료 기준
Fighter 한 명을 생성하고:
- 실제 능력
- Player가 보는 추정치
- Technique 별 숙련

을 독립적으로 출력 가능.

---

# 4. Phase 2 — Headless Combat Skeleton

3D 없음.
텍스트/로그 기반.

## 최소 Action
모든 Ruleset 핵심 검증을 위해 소수 Action부터 시작.

예:
- Jab
- Cross
- Hook
- Low Kick
- Guard
- Evasion
- Takedown
- Takedown Defense
- Ground Control
- Ground Escape
- Basic Submission

## 구현
- Base → Derived
- Effective Performance
- Action Result
- Range
- Stamina
- Damage
- Vulnerability
- Simple Strategy
- Ruleset Action Mask

## 완료 기준
- 강한 Fighter가 대체로 우세
- 상성/전략으로 Upset 가능
- 이유 없는 큰 Upset 빈도 낮음
- 전투 로그에서 원인 추적 가능

---

# 5. Phase 3 — Setup / Combat Intelligence

## 구현
- Combat Memory
- Pattern Sequence
- Exposure
- Opponent Expectation
- Read Confidence
- Feint
- Counter Conversion
- Pattern Break
- Tactical Execution
- Corner Instruction

## 테스트
같은 Fighter라도:
- Fight IQ 차이
- Tactical Execution 차이
- Strategy 차이

가 실제 행동 패턴으로 관찰되어야 한다.

## 완료 기준
전투 로그만 보고도:
> 상대가 반복 패턴을 읽고 Counter했다

를 설명 가능.

---

# 6. Phase 4 — Damage / Injury / Weight

## 구현
- Body Part Damage
- Stagger / Groggy / Knockdown / KO
- Injury
- Recovery
- Reinjury
- Permanent Wear
- Medical Knowledge
- Current / Target Weight
- Weight Stress
- Weight Miss

## 완료 기준
- HP 0 없이 Finish 가능
- Low Kick 누적이 실제 Footwork 등에 영향
- 심한 감량이 Fight Readiness에 영향
- 부상 상태의 출전 Trade-off 작동

---

# 7. Phase 5 — Growth / Training / Weekly Calendar

## 구현
- Week Progression
- Activity Schedule
- Training Load
- Recovery Debt
- Growth
- Technique EXP
- Match EXP Multiplier
- Finish EXP Bonus
- Stress
- Personal / Recovery Activity

## Fight Camp
- Physical Fitness
- Tactical Preparation
- Technical Sharpness
- Weight Readiness
- Mental / Life State
- Taper

## 완료 기준
한 Fighter에 대해:

`8주 운영 → Fight Camp → 경기 → Damage/성장 → 다음 주`

의 전체 루프 가능.

---

# 8. Milestone A — One Fighter Vertical Slice

여기서 처음 플레이 가능 버전을 만든다.

범위:
- Fighter 1명
- Opponent 자동 생성
- Scouting 일부
- Training
- Camp
- Strategy
- Headless Fight
- Post-Fight Report
- Growth / Injury

아직:
- Staff 없음
- 큰 World 없음
- Sponsor 없음

## 목적
가장 중요한 질문 확인:

> 한 Fighter를 몇 달 키워 Fight 하나를 준비하는 과정 자체가 재미있는가?

여기가 재미없으면 후반 시스템을 추가하지 말고 Core부터 수정한다.

---

# 9. Phase 6 — Scouting / Recruitment / Contract

## 구현
- Known Fighter DB
- Discovery
- Scouting Activity
- Watchlist
- Trial
- 분야별 Knowledge
- Scout Report
- Join Interest
- Career Need
- Management Contract
- Promise
- Trust / Respect / Satisfaction

## 완료 기준
플레이어가 숫자 정답이 아니라 불확실한 Evidence를 보고 Prospect를 고를 수 있어야 한다.

---

# 10. Phase 7 — Part 1 Underground Game

## 구현
- Underground Fight Club
- Club Fighter Pool
- Club Competition Ladder
- Fight Offer Inbound/Outbound
- Purse
- Ticket Power 초기 버전
- Rivalry
- Performance Award
- 3명 Roster
- Player Reputation

## Story Gate
- Club Champion
- External Club Champion Reveal Fight

## 완료 기준
Part 1 시작부터 외부 Champion 관문까지 플레이 가능.

---

# 11. Milestone B — Part 1 Alpha

이 단계가 **첫 번째 진짜 게임**이다.

필수 Loop:

`Discover`
→ `Recruit`
→ `Train`
→ `Fight`
→ `Recover`
→ `Grow`
→ `Club Champion`

이 Milestone 전에 Part 2 대규모 세계를 만들지 않는다.

---

# 12. Phase 8 — Staff / Facility / Delegation

## 구현
- Coach Roles
- Scout
- Analyst
- Medical
- Staff Capability
- Workload / Capacity
- Facility Module
- Responsibility
- Manual / Assisted / Delegated / Auto Policy
- Direct Management Fighter

## 완료 기준
Roster 10명을 운영해도 플레이어가 10명 일정을 모두 수동 입력할 필요 없어야 한다.

좋은 Staff와 나쁜 Staff의 차이가:
- Report
- Risk Detection
- Plan Quality

에서 체감되어야 한다.

---

# 13. Phase 9 — Economy / Ticket Power / Sponsor

## 구현
- Fighter Cash
- Management Cash
- Management Share
- Staff / Facility Cost
- Travel / Camp / Medical Cost
- Ticket Power
- Sponsor Offer
- Sponsor Calendar Requirement
- Market Value
- Fight Purse Calculation

## 완료 기준
돈이 독립 목적이 아니라:
> 누구에게 투자할까

의 선택을 만들 것.

---

# 14. Phase 10 — Part 2 World Simulation

## 구현
- International Fighter Pool
- Promotion
- Unified Ranking
- Champion / Contender
- NPC Fight Scheduling
- NPC Growth / Injury / Retirement
- Prospect Generation
- Simulation Tier A/B/C
- World News
- International Scouting

## 완료 기준
플레이어가 아무 행동을 하지 않아도:
- Ranking 변화
- Champion 교체
- Prospect 성장
- 은퇴

가 발생해야 한다.

---

# 15. Phase 11 — Part 2 Career Systems

## 구현
- Multi-Fight Contract
- Official Weigh-In
- Medical Suspension
- Promotion Relationship
- Title Eligibility
- Title Shot Priority
- Cross-Division Prestige
- Short Notice
- High Ticket Power Event
- International Sponsor

## 완료 기준
Unranked Fighter가 실제 커리어를 통해 Champion까지 올라갈 수 있음.

---

# 16. Milestone C — Initial Full Game

완료 조건:

Part 1 시작
→ Club Champion
→ External Champion Fight
→ International Entry
→ Ranking
→ Contender
→ International Champion

전체 플레이 가능.

첫 International Champion 배출 시 Narrative Completion.
Sandbox 계속 가능.

---

# 17. Phase 12 — Balance Tools

게임 밸런스는 수작업 몇 판으로 맞추지 않는다.

필수 Headless Tool:

## Combat Batch Simulation
- Fighter A vs B 1,000+회
- Strategy별 결과
- Win Method
- Damage
- Stamina

## Growth Simulation
- 18세 Prospect 5년 성장
- 30세 Veteran Decline
- Training Policy 비교

## Injury Simulation
- Fight Frequency별 Wear
- Hard Sparring 정책
- Weight Cut 위험

## World Simulation
- 10년 Fast Forward
- Ranking 안정성
- Fighter Population
- Champion Turnover

정확한 횟수는 개발 성능에 따라 조절.

---

# 18. Balance 핵심 지표

## Combat
- Favorite Win Rate
- Upset Cause Breakdown
- Finish Rate
- Decision Rate
- Stamina Collapse Timing
- Action Usage Distribution

## Growth
- 평균 Peak Age
- Prospect 성공률
- Breakthrough 발생 빈도
- Technique 5★ 도달 시간

## Management
- Injury Frequency
- Weight Miss Frequency
- Fighter Turnover
- Contract Renewal Rate
- Staff Workload

## Economy
- Management Cash Flow
- Staff/Facility 투자 시기
- Sponsor 의존도

## World
- Champion 평균 재임기간
- Ranking Activity
- Prospect Replacement Rate

---

# 19. Content Pipeline

Engine과 Content를 분리한다.

초기 Action/Technique 수를 작게 시작하고 엔진 검증 후 확대.

권장 순서:
1. Fundamental Action
2. 일반 Learnable Technique
3. Combo
4. Skill Card
5. Ring Name
6. Rare / Signature Content

많은 콘텐츠로 엔진 문제를 가리지 않는다.

---

# 20. UI 구현 우선순위

## 먼저
- Fighter Profile
- Calendar
- Fight Offer
- Strategy
- Fight Log / Placeholder View
- Post-Fight Report
- Scouting Report

## 이후
- Staff / Facility
- World Ranking
- News
- Sponsor

## 마지막
- 고급 Animation / 3D Integration

---

# 21. 3D Combat Interface Boundary

FCM Management Project와 3D Combat Project를 분리한다.

FCM → Combat Project Input:
- Fighter True Combat Data
- Technique / Skill Cards
- Strategy
- Ruleset
- Pre-Fight Condition

Combat Project → FCM Output:
- Action Log
- Damage
- Stamina History
- Position History
- Judge Metrics
- Result
- Generated Evidence

3D Animation이 결과를 결정하는 구조보다 **Combat Simulation 결과를 표현하는 Presentation Layer**로 시작하는 것을 권장한다.

추후 Real-Time 물리/접촉이 Gameplay에 들어가더라도 Interface Contract는 유지한다.

---

# 22. 테스트 원칙

각 시스템에는 반드시 이유 추적 로그를 둔다.

예:

```text
Takedown Success
+ Takedown Capability 72
+ Setup Advantage 18
+ Opponent Expectation Penalty 11
- Distance Penalty 4
- Fatigue Penalty 7
→ Result
```

실제 Player UI에 모든 숫자를 보여줄 필요는 없지만 Debug Mode에서는 볼 수 있어야 한다.

이 기능은:
- 밸런스
- 버그
- Causal Report

모두에 필요하다.

---

# 23. 최우선 개발 원칙 10개

1. True State와 Knowledge State를 처음부터 분리한다.
2. 모든 밸런스 수치는 Data화한다.
3. 전투는 Headless로 먼저 만든다.
4. 결과보다 원인 로그를 먼저 남긴다.
5. Overall을 Combat 입력으로 쓰지 않는다.
6. Randomness는 원인이 되지 않는다.
7. 한 Fighter Vertical Slice를 가장 먼저 재미 검증한다.
8. Part 1이 재미있기 전 Part 2를 크게 만들지 않는다.
9. Staff/Delegation은 로스터 증가 후 클릭 수를 줄여야 한다.
10. 3D는 Core Simulation이 검증된 뒤 붙인다.

---

# 24. 개발 시작점

실제 코딩 첫 작업 추천:

1. `DefinitionData` 구조
2. `FighterTrueState`
3. `FighterKnowledgeState`
4. Base Parameter 18개
5. Technique / Action Definition
6. Deterministic Headless Fight Loop

여기부터 시작한다.

Part 1의 화면부터 먼저 만드는 것보다 **Fighter Data와 전투 인과관계를 먼저 증명하는 것**이 FCM의 전체 리스크를 가장 빠르게 낮춘다.
