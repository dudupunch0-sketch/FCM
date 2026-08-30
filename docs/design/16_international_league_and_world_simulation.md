# FCM Delegated Design 16 — International League / World Simulation

> 상태: **사용자가 1~2부 잔여 시스템 설계 결정을 위임한 뒤 확정한 설계안**
> 범위: Part 2 International League 중심, Part 1과의 연결 포함

---

# 1. 설계 목표

2부의 세계는 플레이어만 움직이는 정적 스테이지가 아니다.

플레이어가 모르는 선수도:
- 경기한다
- 성장한다
- 패배한다
- 부상당한다
- 체급을 바꾼다
- Ruleset을 바꾼다
- 계약한다
- 은퇴한다

몇 년 뒤 처음 발견한 선수가 이미 챔피언이나 라이벌이 되어 있을 수 있어야 한다.

---

# 2. Part 1 세계 가시성

Part 1에서 플레이어가 직접 경험하는 Underground Fight Club은 **1개**다.

외부 Underground World는 상세 UI/Ranking으로 노출하지 않는다.

다만 세계에는 외부 파이트클럽/선수 Pool이 존재하며 내부적으로 간단히 진행될 수 있다.
Part 1 종료 시:

**플레이어 측 Club Champion vs 외부 Fight Club Champion**

특별전으로 외부 세계를 처음 강하게 보여준다.

이 경기는 단순 보스전이 아니라 2부 세계가 이미 존재했다는 Reveal 역할을 한다.

---

# 3. International League 기본 구조

2부는 하나의 **International Fight Circuit**를 중심으로 운영한다.

플레이어 UI 관점에서 핵심은:
- Ruleset × Weight Division Ranking
- Champion / Contender
- Fight Offer
- Promotion Contract
- Event
- Ticket Power

여러 Promotion/이벤트 주최자가 존재할 수 있지만 Ranking 시스템을 Promotion마다 중복시키지 않는다.

즉 2부의 경쟁적 위치는 하나의 이해 가능한 국제 랭킹으로 통일한다.
Promotion은 계약/이벤트/보상/흥행 조건을 차별화하는 역할을 한다.

---

# 4. Promotion 역할

Promotion은 Fighter를 소유하지 않는다.
Fighter와 Fight Contract / Multi-Fight Contract를 체결한다.

Promotion Data 후보:
- Prestige
- Budget Tier
- Ruleset Focus
- Region
- Event Frequency
- Ticket Power Preference
- Competitive Preference
- Contract Style

큰 Promotion은:
- 높은 Purse
- 높은 Ticket Power 기회
- 강한 Opponent
- 까다로운 계약

작은 Promotion은:
- 낮은 Purse
- 경기 기회 많음
- 성장용 Match 확보 용이

플레이어는 선수마다 어느 Promotion / Event Path가 좋은지 판단한다.

---

# 5. Unified Ranking

2부 Ranking Key:

`Ruleset × Weight Division`

예:
- MMA / Lightweight
- Boxing / Welterweight

Champion은 #1과 분리한다.

별도 플레이어용 Ranking Point는 없다.
내부 알고리즘은 순위를 결정하기 위한 계산값을 사용할 수 있지만 UI/경제 자원으로 취급하지 않는다.

Ranking Update의 핵심 입력:
- 승패
- 상대 Ranking
- 최근 활동
- 경쟁적 중요도

화려함/흥행은 Ticket Power에 더 크게 반영한다.

---

# 6. NPC Fighter Simulation

NPC Fighter는 플레이어 Fighter와 같은 핵심 Fighter Data Model을 사용한다.

공통:
- Base Parameter
- Technique
- Skill Card
- Ring Name
- Body / Weight
- Rule Familiarity
- Injury / Wear
- Age
- Ticket Power
- Rank / Record

다만 모든 NPC에게 플레이어 수준의 주간 Camp 세부 시뮬레이션을 돌리지 않는다.

---

# 7. Simulation Fidelity Tier

성능과 복잡도 관리를 위해 세계 시뮬레이션을 단계화한다.

## Tier A — Player Relevant
- 플레이어 소속 선수
- 다음 상대
- Watchlist
- Top Rank / Champion / Rival

세부 Growth / Injury / Camp / Match 시뮬레이션.

## Tier B — Known World
플레이어가 알고 있는 국제 선수.
주 단위 상태는 추상화하지만 경기/성장/부상/계약은 구체적으로 처리.

## Tier C — Background World
아직 플레이어가 모르는 먼 선수.
월/이벤트 단위 압축 시뮬레이션.

선수가 Relevant해지면 더 상세한 Tier로 승격한다.

실제 Fighter의 누적 History는 유지해야 한다.

---

# 8. NPC Growth

NPC도 다음에 따라 성장한다.
- Talent / Growth Aptitude
- Age
- 경기 경험
- Training Environment 추상값
- Activity
- Injury
- Potential Curve

플레이어가 개입하지 않아도 Hidden Prospect가 성장할 수 있다.

실전 경험은 NPC에게도 중요한 성장 자극이다.

NPC에게도 Breakthrough / Adversity Event가 낮은 빈도로 발생 가능하다.
단, 플레이어가 보지 못한 사건은 뉴스/History로 요약한다.

---

# 9. NPC Matchmaking

NPC Matchmaking은 완전 랜덤이 아니다.

영향:
- Rank 근접도
- Activity
- Ticket Power
- Promotion 계약
- Rivalry
- Title Eligibility
- Weight
- Injury / Availability

세계가 자연스럽게 Ranking을 갱신하도록 충분한 Match가 자동 생성된다.

---

# 10. NPC Career Decision

NPC는 현재 상태에 따라 다음을 선택할 수 있다.
- Fight 수락 / 거절
- 체급 이동
- Ruleset 변경
- 휴식
- 계약 이동
- 은퇴

고정 Personality 시스템은 사용하지 않는다.
판단은 Career Need / Age / Rank / Ticket Power / Injury / Contract / Opportunity 기반으로 한다.

---

# 11. Fighter Generation / New Prospects

장기 세이브를 위해 새로운 Fighter가 지속적으로 등장한다.

생성 시:
- Region / Background
- Age
- Body Data
- Base Parameter 분포
- Talent / Aptitude
- Hidden Affinity
- Stress Resistance
- Weight Adaptation
- 초기 Technique

를 Data-Driven Generator로 만든다.

모든 신인이 즉시 Known Fighter DB에 들어오지 않는다.
Scouting Network를 통해 발견한다.

---

# 12. Retirement

은퇴 판단 후보:
- Age
- Physical Decline
- Injury / Permanent Wear
- 최근 경쟁력
- Fight Opportunity
- Career Earnings
- Title / Goal 달성

은퇴 역시 고정 나이 하나로 정하지 않는다.

유명 선수의 은퇴는 World News / Ticket Power 이벤트가 될 수 있다.

---

# 13. World News / Feed

세계 변화를 전부 메뉴에서 찾게 하지 않는다.

News Feed 후보:
- Champion 교체
- 큰 Upset
- Undefeated Streak 종료
- 유명 Fighter 부상
- 체급 이동
- Rivalry
- 신인 급부상
- 은퇴
- 계약 이동

Player Known DB / Watchlist / Ruleset 관심도에 따라 뉴스 우선순위를 조절한다.

---

# 14. Scouting과 World 연결

Scouting은 이미 존재하는 세계 Simulation을 읽는 창이다.

예:
Background Fighter가 5연승
→ Ticket Power 조금 상승
→ Scout Network에 걸릴 확률 상승
→ Player Known DB 등록
→ 과거 Fight History를 조사 가능

즉 Fighter가 플레이어가 발견될 때 생성되는 것이 아니라 **이미 살아온 History를 가진 채 발견**되어야 한다.

---

# 15. Cross-Ruleset Career

선수는 여러 Ruleset Ranking에 도전 가능하다.

Ruleset 전환 시:
- Familiarity
- Technique Availability
- 체급
- 계약
- 기존 Ticket Power

가 영향을 준다.

높은 Ticket Power는 새로운 Ruleset에서도 좋은 Fight Offer를 얻는 데 도움을 줄 수 있지만 Competitive Rank는 자동 이전하지 않는다.

---

# 16. Cross-Division Prestige

기존 결정 유지:

일반 Ranker / Unranked
→ 새 체급 밑바닥부터 시작.

Champion / 최상위 Top Rank
→ 첫 경기부터 강한 Opponent / Contender / Title 수준 기회를 받을 수 있음.

이 첫 경기를 이기면 상대 수준에 맞는 높은 Ranking에서 시작한다.

과거 성과는 Ranking 숫자를 복사하는 것이 아니라 **큰 기회를 얻는 Prestige**로 전환한다.

---

# 17. Promotion Relationship

Promotion과 플레이어/선수 사이에도 관계 History가 존재한다.

좋아질 수 있는 행동:
- Short Notice 수락
- 좋은 Performance
- 계약 이행
- 높은 Ticket Power Event 제공

악화:
- 반복 Weight Miss
- Fight Cancellation
- 계약 위반
- 잦은 거절

효과:
- Fight Offer 품질
- 계약 조건
- Short Notice 기회
- Title Opportunity

별도 Personality가 아니라 History 기반 관계다.

---

# 18. World Difficulty / Power Inflation

시간이 흐른다고 모든 신인의 능력치가 계속 상승해서 세계가 무한 인플레이션하면 안 된다.

Generation Distribution과 성장 Ceiling은 시대 전체에서 대체로 안정적으로 유지한다.

다만 매우 희귀한 Exceptional Prospect / Legend Candidate는 발생할 수 있다.

플레이어의 오래 키운 스타가 단순 세대교체 때문에 자동으로 쓸모없어지지 않아야 한다.

---

# 19. Save History / Legacy Data

1~2부에서도 세계 History를 축적한다.

기록:
- Champion History
- Fight Record
- Major Upsets
- Performance Awards
- Rivalries
- Ring Names
- Undefeated Streaks
- Player-trained Champions

이는 향후 3부를 추가할 경우 그대로 Promotion/Legacy 시스템의 기반 데이터가 된다.

---

# 20. Data Parameter 후보

- SimulationTierDistance
- BackgroundGrowthRate
- NPCFightFrequency
- NPCMatchmakingWeights
- NPCWeightChangeThreshold
- NPCRuleSwitchThreshold
- RetirementCurve
- ProspectGenerationRate
- ProspectQualityDistribution
- WorldTicketPowerDistribution
- PromotionPrestige
- PromotionOfferWeights
- PromotionRelationshipGain
- RankingUpdateWeights
- NewsPriorityWeight

---

# 21. 핵심 목표

2부에 진입했을 때 플레이어가 느껴야 하는 변화:

Part 1:
> 작은 Fight Club 안에서 내가 직접 한 명 한 명 키운다.

Part 2:
> 내가 알지 못하는 곳에서도 수많은 선수들이 움직이는 국제 격투계 안에서 내 선수의 자리를 만든다.

세계 Simulation은 복잡함을 보여주기 위한 것이 아니라 **내 선수의 커리어가 더 큰 세계에서 의미 있게 느껴지게 하기 위한 시스템**이다.
