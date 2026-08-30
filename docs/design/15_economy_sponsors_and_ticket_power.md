# FCM Delegated Design 15 — Economy / Sponsors / Ticket Power

> 상태: **사용자가 1~2부 잔여 시스템 설계 결정을 위임한 뒤 확정한 설계안**
> 범위: Part 1 Underground / Part 2 International League

---

# 1. 경제 설계 원칙

FCM은 회계 시뮬레이터가 아니다.

돈은 다음 선택을 어렵게 만드는 자원이다.
- 좋은 유망주에게 투자할까
- 코치를 고용할까
- 더 좋은 Camp를 구성할까
- 부상 치료에 돈을 쓸까
- 국제 스카우팅을 확대할까

핵심은 세부 장부가 아니라 **선수 커리어에 무엇을 투자할지**다.

---

# 2. Fighter Money와 Management Money 분리

선수는 플레이어의 소유물이 아니다.

## Fighter Income
- Fight Purse
- Win Bonus
- Finish / Performance Bonus
- Sponsor Income
- Media / Appearance Income

## Management Business Income
- Management Share
- 계약된 Sponsor Revenue Share
- 일부 Coaching / Appearance Revenue

선수 수익이 자동으로 플레이어 돈이 되지 않는다.
Management Agreement에 따라 정해진 몫만 플레이어 조직에 들어온다.

---

# 3. Management Business 지출

핵심 비용만 관리한다.

- Staff Salary
- Facility Rent / Maintenance / Upgrade
- Fight Camp Support
- Travel / International Camp
- Medical / Rehab
- Scouting / Trial
- External Sparring Partner
- Contracted Training Support
- Weight / Specialist Support

지출 항목을 지나치게 세분화하지 않는다.

---

# 4. Part 1 Economy

Part 1은 작은 독립 매니저의 생존과 성장 단계다.

특징:
- Fight Purse가 작음
- Staff가 적음
- 작은 Gym / 임대 시설
- Trial과 Scouting을 직접 수행
- 높은 비용의 전문 Staff 접근 제한

초기에는 한 명의 유망주에게 너무 많은 자원을 쓰면 다른 선수/시설 투자가 어려워지는 구조를 만든다.

단, 경제난 때문에 게임 진행 자체가 막히는 Hard Fail보다는:
- 저품질 시설
- 직접 업무 증가
- 성장 속도 저하
- 좋은 Staff 영입 지연

같은 Soft Pressure를 우선한다.

---

# 5. Part 2 Economy

International League 진입 후:
- Fight Purse 상승
- Sponsor 활성화
- Travel / Camp 비용 상승
- 전문 Staff Salary 증가
- 국제 Scouting 비용 증가
- 선수 계약 요구 증가

즉 수익과 비용이 함께 커진다.

Top Fighter 하나가 큰 돈을 벌어도 그 선수를 유지하기 위한 Camp / Staff / Contract 비용도 증가한다.

---

# 6. Ticket Power — 공개 흥행 가치

기존 결정 유지:

**Actual Strength ≠ Ranking ≠ Record ≠ Ticket Power**

Ticket Power는 선수의 공개 흥행가치를 0~100 범위로 표시 가능하다.

등급 예:
- Local Draw
- Regional Draw
- National Star
- International Star
- Global Icon

Ticket Power는 Fighter Base Parameter가 아니다.
전투 엔진의 직접 Damage/Success 계산에 사용하지 않는다.

---

# 7. Ticket Power 증가 원인

## 경기 관련
- 높은 Ticket Power 상대와 경기
- Champion / Contender 경기
- Upset
- 명경기
- 화려한 Finish
- Performance Bonus
- Rivalry
- Undefeated Streak
- 재기 / Adversity Story

## 경기 외 활동
- Media
- Fan Event
- Social Content
- Sponsor Campaign
- 공개 인터뷰
- Rivalry 홍보

## 서사
- Ring Name
- 특정 Rival 격파
- 장기간 무패
- 첫 패배 후 복귀
- 다체급 도전

---

# 8. Ticket Power 감소 / 정체

Ticket Power는 단순 누적 경험치가 아니다.

감소/정체 후보:
- 장기간 Inactivity
- 반복적인 낮은 관심 Match
- 약속된 Media 의무 미이행
- 지속적인 경기 취소 / Weight Miss
- 큰 경기에서 기대 이하의 반복적인 소극적 퍼포먼스

단, 패배 자체를 큰 Ticket Power 감소로 직결하지 않는다.
명경기 패배는 오히려 Ticket Power가 오를 수 있다.

---

# 9. Performance Bonus

UFC의 Performance of the Night와 유사한 보상 계층을 둔다.

후보:
- Performance of the Night
- Fight of the Night
- Upset of the Event
- Finish Highlight

효과:
- Fighter Cash
- Ticket Power
- Technique / Skill Card / Ring Name 조건
- Player Reputation
- Promotion Relationship

선정은 단순 KO 여부가 아니라:
- 상대 수준
- Finish Context
- 경기 내용
- Damage / Risk
- 화려함
- Crowd / Event Interest

등을 평가한다.

---

# 10. Sponsor 구조

Sponsor는 돈만 주는 Passive Buff가 아니다.

## Fighter Sponsor
선수 개인의 Ticket Power / 이미지 / Ruleset / 시장에 관심.

## Management Sponsor
2부에서 플레이어 조직 Reputation이 성장하면 가능.
시설/캠프/조직 비용을 지원.

---

# 11. Sponsor Offer Data

후보:
- Base Payment
- Duration
- Performance Bonus
- Appearance Requirement
- Media Requirement
- Exclusivity
- Ruleset / Region Preference
- Minimum Activity
- Ticket Power Requirement

스폰서 계약은 시간과 Stress 비용을 만들 수 있다.

예:
높은 돈을 주는 Sponsor
→ 매달 Media Event 요구
→ Ticket Power 상승 가능
→ Fight Camp 시간 / Stress 증가

---

# 12. Sponsor Fit

모든 유명 선수가 모든 Sponsor에게 같은 가치가 있지 않다.

Fit 후보:
- Ticket Power
- 활동 지역
- Ruleset
- 체급
- Record / Undefeated
- Ring Name / Rivalry
- 최근 Performance

고정 Personality / Morality Alignment 시스템은 만들지 않는다.
Sponsor Fit은 커리어 상태와 시장 조건에서 결정한다.

---

# 13. Market Value

`Market Value`는 Fight Acceptance / 계약 요구 / Sponsor 가치에 쓰이는 내부 평가다.

개념 입력:
- Ranking
- Ticket Power
- Record
- Title
- Age
- Activity
- Ruleset Demand
- Rivalry
- Recent Performance

플레이어에게 반드시 정확한 0~100 숫자로 노출할 필요는 없다.
협상 요구와 Scout/Agent Report로 체감하게 한다.

---

# 14. Purse

Fight Purse는 상대 강함만으로 정하지 않는다.

영향 후보:
- Fighter Ranking
- Ticket Power
- Event Value
- Opponent
- Rivalry
- Title
- Short Notice
- Contract Status
- Promotion Need

같은 강함의 경기라도 Rivalry / Star Match는 더 높은 Purse를 제공할 수 있다.

---

# 15. Risk / Reward UI

Fight Offer에서 최소한 다음을 한 화면에서 비교한다.

- 예상 Purse
- Ranking Opportunity
- Ticket Power Opportunity
- Opponent Risk
- Growth Opportunity
- Weight / Short Notice Risk
- Injury / Camp Risk
- Rivalry / Title Implication

정확한 `승률 63.4%`는 기본 UI로 제공하지 않는다.
스카우팅과 코치진의 평가를 통해 위험을 해석한다.

---

# 16. Relationship과 돈

돈이 관계의 전부가 아니다.

낮은 Management Share라도:
- 좋은 커리어 기회
- 약속 이행
- 좋은 Coach / Facility
- 높은 Trust

로 선수를 유지할 수 있다.

반대로 좋은 돈을 줘도:
- 경기 기회 부족
- 반복적인 Weight 실패
- 부상 관리 실패
- Promise 위반

이 누적되면 선수가 떠날 수 있다.

---

# 17. Financial Failure

플레이어 조직 Cash가 부족하면 바로 Game Over시키지 않는다.

단계적 압박:
1. Facility Upgrade 중단
2. Staff 신규 고용 제한
3. Staff 계약 재협상
4. Scouting / Camp 품질 감소
5. 선수 Training Support 축소
6. 심하면 Staff 이탈 / 시설 축소

회복 경로:
- Fight 수락
- Sponsor
- 비용 구조 축소
- 스타 선수 성공

게임의 실패는 경제 숫자 0보다 **선수 커리어 선택지가 좁아지는 것**으로 표현한다.

---

# 18. Data Parameter 후보

- ManagementShare
- StaffSalaryCurve
- FacilityMaintenance
- CampCost
- TravelCost
- MedicalCost
- SponsorPaymentCurve
- SponsorRequirementWeights
- TicketPowerGain
- TicketPowerDecay
- OpponentTicketPowerMultiplier
- RivalryTicketPowerMultiplier
- PerformanceAwardThreshold
- PerformanceAwardTicketPowerBonus
- MarketValueWeights
- PurseCalculationWeights
- FinancialPressureThreshold

---

# 19. 핵심 연결

`경기 / Media / Rivalry`
→ `Ticket Power`
→ `Purse / Sponsor / Fight Acceptance`
→ `Management Income`
→ `Staff / Facility / Scouting / Medical 투자`
→ `선수 성장과 관리 품질`
→ `더 큰 경기`

경제는 선수 육성 루프를 지원하는 연료이며 그 자체가 최종 목적이 아니다.
