# FCM 기획 인터뷰 11 — Ranking / Matchmaking / Title / Ticket Power

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: 1~2부의 랭킹, 매치메이킹, 타이틀전, 체급 이동, 라이벌, 무패, 흥행 가치 구조 확정  
> 상태: **11차 인터뷰 확정안**

---

# 0. 현재 명세 범위 변경

현재 상세 명세 작성 목표는 **1부 지하 파이트클럽 + 2부 국제 리그**까지로 제한한다.

3부의 직접 대회/격투 단체 운영은 장기 비전으로 유지하되, 현재 상세 명세/초기 개발 범위에서는 제외한다.

개발을 진행하면서 1~2부 시스템이 실제로 작동하는 것을 확인한 뒤 필요 시 3부를 추가 설계한다.

---

# A. Ranking Key

2부 공식 랭킹의 기본 단위는 다음과 같다.

**Ruleset × Weight Division**

예:
- MMA / Welterweight #7
- Boxing / Middleweight #18

동일 선수가 여러 Ruleset / Weight Division 랭킹에 동시에 존재할 수 있다.

---

# B. 1부 Underground 구조

1부에서 플레이어가 직접 접할 수 있는 지하 파이트클럽은 **1개**다.

따라서 여러 지하 파이트클럽의 통합 지역 랭킹은 만들지 않는다.

플레이어는 한 개의 파이트클럽 안에서 선수를 발굴하고 키우며 그 무대의 정상에 오른다.

## 2부 진입 연출

1부의 마지막 또는 2부의 시작에서:

**플레이어가 키운 파이트클럽 우승자 vs 다른 파이트클럽 우승자**

의 특별 경기를 배치한다.

이 경기를 통해 플레이어가 처음으로 다른 파이트클럽/더 넓은 격투 세계의 존재를 명확하게 인식한다.

이후 국제 리그 / 공식 무대로 진입한다.

다른 파이트클럽의 세부 랭킹은 플레이어가 관리하지 않는다.
2부의 국제 선수들이 과거 출신 이력으로 특정 지하 파이트클럽을 언급하는 정도는 가능하다.

---

# C. Ranking Point 제거

별도의 `Ranking Point` UI/시스템은 사용하지 않는다.

플레이어가 이해해야 하는 핵심 값은 **Ranking Number 자체**다.

예:
- Champion
- #1
- #2
- #3
- Unranked

내부 매치메이킹/순위 갱신 알고리즘은 필요한 정밀 계산값을 사용할 수 있으나, 그것을 독립적인 게임 자원/진척 수치로 플레이어에게 보여주지 않는다.

랭킹은 다음 요소를 종합해 움직인다.
- 승패
- 상대 랭킹
- 상대 수준
- 최근 활동
- 경기 결과의 중요도

Finish나 압도적 퍼포먼스는 랭킹 자체보다 Fame/Ticket Power/보너스에 더 크게 반영한다.

---

# D. 약한 상대 / Performance Reward

약한 상대를 선택하는 육성 전략은 허용한다.

상대가 크게 약할 경우 일반적으로:
- Ranking 상승 효율 감소
- Combat/Technique 성장 보상 감소
- 평범한 승리의 흥행 보상 감소

하지만 약한 상대라도 다음 조건이면 별도의 가치가 발생할 수 있다.
- 상대 자체의 스타성 / 유명도 / 악명
- Rivalry
- 화려하고 압도적인 Finish
- 특별한 Technique Finish
- 명경기 / 인상적인 퍼포먼스

`Performance of the Night`와 유사한 퍼포먼스 보너스/이벤트를 둘 수 있다.

따라서 약자를 이겼다는 사실만으로 보상을 완전히 차단하지 않는다.
**누구를 어떻게 이겼는가**를 함께 평가한다.

---

# E. Upset / Underdog Reward

언더독이 강한 상대를 꺾는 Upset은 매우 큰 사건이다.

보상 후보:
- Ranking 대폭 상승
- Ticket Power / Fame 대폭 상승
- Technique/Combat EXP 증가
- Fight IQ 실전 성장
- Skill Card 획득/성장 조건
- Ring Name 조건
- Breakthrough Progress
- 특별 성장 이벤트

단순 승패만이 아니라 실제로 극복한 불리함과 경기 Context를 평가한다.

---

# F. Fight Acceptance

아무 상대나 클릭하면 자동으로 경기가 성립하지 않는다.

상대/Promotion은 Fight Acceptance를 판단한다.

영향 후보:
- 상대 Rank / Competitive Value
- Ticket Power
- Fight Purse
- Risk
- Career Need
- Rivalry
- 현재 Injury / Recovery / Fight Camp 상태
- Ruleset / Weight
- Title/Contender 가치

낮은 랭커의 도전은 거절될 수 있지만, Ticket Power나 흥행 가치가 매우 높으면 받아들일 이유가 생길 수 있다.

---

# G. Fight Offer는 양방향

## Inbound Offer
Fight Club / Promotion / 다른 측에서 경기 제안이 들어온다.

## Outbound Challenge
플레이어가 원하는 상대에게 경기 제안/도전을 보낼 수 있다.

1부와 2부 모두 기본적으로 양방향 구조를 사용할 수 있다.
2부에서는 Promotion 계약/랭킹/대회 구조 때문에 선택 자유도가 제한될 수 있다.

---

# H. Title Shot Eligibility

단순히 Rank #1이면 자동으로 타이틀전을 받는 구조는 아니다.

먼저 **Competitive Eligibility**를 충족해야 한다.

후보 조건:
- 일정 수준 이상의 Ranking
- 최근 활동
- 충분한 Competitive Resume

Eligibility를 충족한 후보들 사이에서 실제 Title Shot 우선도는 다음 요소를 반영할 수 있다.
- Rank
- 최근 경기력
- Ticket Power
- Rivalry
- Champion과의 Story
- Event Value
- 활동성

원칙:
- Ticket Power만 높은 약자가 무조건 타이틀 직행하는 것은 제한
- 하지만 비슷한 경쟁력을 가진 후보라면 흥행/라이벌 요소가 Title Shot 순서를 바꿀 수 있음

---

# I. Champion / #1 Contender 분리

Champion은 Ranking #1과 별도로 표시한다.

예:
- Champion — Viktor Volkov
- #1 Contender — Kim
- #2 — Smith

#1은 챔피언과 싸울 가장 강력한 자격을 가진 도전자 위치이며 Champion 자체는 별도의 상태다.

---

# J. 체급 이동 / 월장

일반적인 랭커/Unranked 선수가 새로운 체급으로 이동하면 기본적으로 **새 체급의 밑바닥부터 시작**한다.

단, 기존 체급의 Champion 또는 최상위 Top Rank 선수에게는 예외적 Prestige Advantage를 준다.

예:
- Champion / 최상위 랭커가 월장
- 첫 경기부터 강한 랭커 / 유명 선수 / Contender / 경우에 따라 Title Shot 기회 제공 가능
- 그 첫 고난도 경기를 이기면 해당 상대 수준에 걸맞은 높은 랭킹에서 새 체급 커리어를 시작

즉 기존 체급의 위상을 새 체급 랭킹 숫자로 자동 이전하지 않고, **좋은 첫 기회를 얻을 자격**으로 전환한다.

---

# K. Activity / Inactivity

랭킹 유지에는 활동성이 필요하다.

내부 상태 후보:
- LastFightDate
- Activity
- InactiveDuration

오랫동안 경기하지 않으면:
- Inactive 표시
- Ranking 하락
- 장기간이면 Ranking 제외 가능

Injury로 인한 휴식과 의도적 장기 회피는 필요 시 다른 Modifier를 적용할 수 있다.

---

# L. Rivalry

Rivalry는 버튼 한 번으로 생성하는 고정 상태가 아니라 **경기/커리어 History에서 발생**한다.

`Rivalry Progress`는 내부 수치화 가능하다.

증가 이벤트 후보:
- 접전
- 논란의 판정
- 재대결
- 서로에게 첫 패배 제공
- Title 탈취/방어
- 큰 KO/Finish
- 반복 Match
- 인터뷰/도발/외부 활동
- 중요한 커리어 충돌

Rivalry 효과 후보:
- Ticket Power 상승
- Fight Purse 상승
- 관중 관심
- 재대결 수요
- Stress 상승 가능
- Ring Name 조건
- 특별 이벤트

플레이어는 미디어/외부 활동으로 이미 존재하는 Rivalry를 홍보하거나 강화할 수 있다.

---

# M. Short Notice Fight

갑작스러운 대체 출전 / Short Notice Fight를 허용한다.

장점 후보:
- Purse Bonus
- Ticket Power/Fame 상승 기회
- Ranking 기회
- 강한 상대와 빠르게 만날 기회
- Promotion 관계 개선

단점 후보:
- Fight Camp 부족
- Weight Cut 위험
- Strategy 준비 부족
- 상대 Video Analysis 부족
- Injury Risk
- Stress 증가

따라서 큰 기회와 실제 준비 리스크 사이의 커리어 선택이 된다.

---

# N. Fame 명칭 — Ticket Power

FCM의 선수 흥행/인지도 핵심 값은 **Ticket Power**로 명명한다.

Ticket Power는 실제 전투 실력/Rank와 분리한다.

예:
- 강하지만 흥행성이 낮은 Top Rank
- 실력은 조금 낮지만 엄청난 스타
- 악명/라이벌/스타일 때문에 티켓을 파는 선수

Ticket Power는 0~100 같은 공개 수치로 표시할 수 있으며 정확한 공개 정보로 취급한다.

영향 후보:
- Fight Offer
- Fight Purse
- Sponsor
- Title Shot 우선도(Competitive Eligibility 이후)
- Event Value
- Matchmaking Acceptance
- 계약 요구
- 선수 Market Value

UI 등급 후보:
- Local Draw
- Regional Draw
- National Star
- International Star
- Global Icon

정확한 명칭/Threshold는 추후 Data Parameter로 조절한다.

---

# O. Record / Undefeated / Adversity

다음 네 축은 분리한다.

**Actual Strength ≠ Ranking ≠ Ticket Power ≠ Fight Record**

무패 기록은 매우 어렵고 별도 프리미엄을 가진다.

Undefeated Streak 효과 후보:
- Ticket Power 상승
- Fight Interest 상승
- Purse/협상 가치 상승
- 상대가 이 선수를 꺾을 때 Upset/Legacy 가치 상승
- 선수 자신에게 심리적 압박/Stress 생성 가능

첫 패배 시:
- Undefeated Premium 상실
- Stress 급증 가능
- 커리어 Crisis / Adversity 상태 발생 가능

하지만 패배 자체가 커리어 파괴를 의미하지 않는다.

패배 이후 다시 성장하고 극복하면 *Darkest Dungeon*의 영웅의 기상과 같은 **Adversity → Positive Transformation / Legend Event**의 주요 조건이 될 수 있다.

즉 FCM은 "무패 유지"뿐 아니라 **패배를 어떻게 극복했는가**도 전설적인 선수 서사의 일부로 만든다.

---

# 핵심 루프

1~2부의 핵심 루프는 다음으로 정리한다.

**유망주 발견 → 평가 → 계약 → 주간 육성/생활 관리 → Fight Offer/Challenge → Fight Camp/전략 → 경기 → Ranking/Ticket Power/Record/성장 변화 → 더 큰 경기**

---

# Data-Driven 후보

- RankUpdateWeights
- RankOpponentStrengthWeight
- RankActivityDecay
- UpsetRewardCurve
- PerformanceBonusThreshold
- PerformanceTicketPowerBonus
- FightAcceptanceWeights
- TitleEligibilityThreshold
- TitleShotPriorityWeights
- CrossDivisionPrestigeThreshold
- CrossDivisionOpportunityTier
- InactivityDecayCurve
- RivalryGainEvents / RivalryDecay
- ShortNoticePurseModifier
- ShortNoticeStressModifier
- TicketPowerGainCurve
- OpponentTicketPowerModifier
- RivalryTicketPowerModifier
- UndefeatedPremiumCurve
- FirstLossStressModifier
- AdversityEventThreshold

모든 값은 코드 상수보다 Data Parameter로 관리한다.
