# FCM Delegated Design 17 — Part 1 / Part 2 Progression & Completion

> 상태: **사용자가 1~2부 잔여 시스템 설계 결정을 위임한 뒤 확정한 설계안**
> 목적: 현재 상세 명세의 시작, 성장 단계, 1→2부 전환, 2부 완료 조건을 하나로 연결

---

# 1. 현재 게임 범위

상세 명세 / 초기 개발 범위:

## Part 1 — Underground Fight Club
하나의 지하 파이트클럽에서 독립 코치/매니저로 시작.
최대 약 3명의 선수를 직접 발굴/육성.

## Part 2 — International Fight Circuit
국제 공식 무대로 진출.
최대 약 10명의 선수와 전문 Staff / Scout / 시설을 운영.

## Future Scope
직접 Promotion을 운영하는 Part 3는 현재 명세/초기 개발에서 제외.

---

# 2. Part 1 시작

플레이어 캐릭터:
- 전직 MMA Fighter
- Injury로 선수 커리어가 사실상 끝남
- 지인의 제안으로 Underground Fight Club에서 코칭 시작
- Fight Club 직원이 아니라 독립 코치/매니저

초기 자원:
- 낮은 Player Reputation
- 작은 자금
- 제한된 시설
- 거의 없는 Staff / Scout
- 직접 아는 Fighter Pool만 존재

핵심 감정:
> 아무것도 없는 상태에서 한 명의 선수를 발견하고 함께 올라간다.

---

# 3. Onboarding 철학

메뉴 설명을 한꺼번에 던지지 않는다.

시스템을 실제 상황으로 순차 도입한다.

예:
1. 첫 Fighter 발견 → Scouting / Information
2. 첫 훈련 → Base Parameter / Growth
3. 첫 Fight Offer → Matchmaking
4. 첫 Camp → Calendar / Weight / Strategy
5. 첫 Injury → Medical / Recovery
6. 첫 유명 상대 → Ticket Power
7. 첫 재계약 → Relationship / Contract

UFC 6의 Legacy처럼 내러티브 진행이 메타 시스템의 자연스러운 튜토리얼 역할을 하도록 한다.

---

# 4. Part 1 Fight Club 경쟁 구조

플레이어가 직접 볼 수 있는 Underground Fight Club은 1개다.

Club 내부에서는 4 Ruleset이 모두 존재한다.
- MMA
- Boxing
- Kickboxing
- No Rules

각 Ruleset은 독립 경쟁 위치를 가진다.

체중은 공식 2부보다 느슨하지만 공정한 Matchmaking을 위해 `Weight Band / Agreed Weight`를 사용한다.

Club 내부 UI는 복잡한 세계 Ranking보다 간단한:
- Champion
- Top Fighters
- Challenger
- Newcomer

구조로 보여줄 수 있다.

정확한 Ranking Number 사용 여부는 UI 구현 단계에서 조정 가능하지만 **다른 Fight Club의 Ranking은 Part 1에서 노출하지 않는다.**

---

# 5. Part 1 Fighter Progression

선수의 일반적인 경로:

`Unknown / Newcomer`
→ `약한 상대를 통한 실전 검증`
→ `Club Regular`
→ `Top Challenger`
→ `Title Fight`
→ `Fight Club Champion`

플레이어는 안전한 성장을 선택할 수도 있고 강자를 빠르게 도전할 수도 있다.

약한 상대:
- 성장/Ranking 일반 보상 감소
- 그러나 Ticket Power 상대, 화려한 Performance, 특정 Finish면 별도 가치 존재

강한 상대:
- 높은 Injury / 패배 Risk
- 높은 실전 EXP / Upset / Breakthrough / Ticket Power 기회

---

# 6. Part 1의 목표

메인 진행 목표는 **플레이어가 관리하는 Fighter 한 명을 Fight Club Champion으로 만드는 것**이다.

Ruleset과 Weight Path는 플레이어가 선택한다.

다른 선수들은 같은 Club에서 별도 커리어를 계속 진행할 수 있다.

한 번의 패배로 진행이 막히지 않는다.
패배는 Ranking / Stress / Injury / Adversity를 만들지만 재도전 가능하다.

---

# 7. Part 1 → Part 2 Reveal Match

Fight Club Champion을 배출하면 외부에서 Challenge가 들어온다.

**다른 Underground Fight Club Champion vs 플레이어가 키운 Champion**

이 경기를 통해 처음으로:
- 다른 Fight Club
- 더 넓은 Fighter World
- 외부 Scout / Promotion
- 국제 무대

의 존재를 강하게 보여준다.

Part 1 동안 외부 Club의 상세 Ranking이나 운영 화면은 보여주지 않는다.
외부 출신은 이후 Fighter Bio / 대사 / History에 흔적으로 남는다.

---

# 8. Reveal Match 결과

## 승리
- 큰 Player Reputation 상승
- Fighter Ticket Power 상승
- International League Invitation / Qualifier 확보
- 특별 Ring Name / Skill Card / Breakthrough 조건 가능

## 패배
게임 진행을 영구 봉쇄하지 않는다.
- 큰 Stress / Adversity
- 상대에 대한 Rivalry 가능
- 재도전 Route
- 다른 Champion Fighter로 다시 기회 확보 가능

즉 이 경기는 중요한 관문이지만 Save를 죽이는 단발성 RNG Gate가 아니다.

Part 2 진입에는 최종적으로 외부 Champion / Qualifier 수준의 경쟁을 통과해야 한다.

---

# 9. Part 2 진입 시 변화

## World
- International Ranking 공개
- Known Fighter Pool 급확대
- Watchlist / Scout 중요도 증가

## Contracts
- Multi-Fight Promotion Contract
- 높은 Purse
- 복잡한 Promise / Contract

## Management
- Roster Capacity 약 10명
- 전문 Coach / Analyst / Scout / Medical Staff
- Delegation 필요

## Preparation
- 공식 Weigh-In
- Medical Suspension
- Travel
- 더 긴 Fight Camp

## Entertainment
- Ticket Power
- Sponsor
- Media
- Rivalry

Part 1 시스템을 폐기하는 것이 아니라 **같은 Core가 규모와 압력만 커진다.**

---

# 10. Part 2 Competition Ladder

2부의 체감 단계를 다음처럼 나눈다.

## Entry / Unranked
국제무대 적응.
Ruleset Familiarity / Weight / 계약 / Travel을 배움.

## Ranked Fighter
공식 Ranking 진입.
상대 선택과 Activity가 중요해짐.

## Top Rank
강한 Opponent / 높은 Purse / Ticket Power 경쟁.

## Contender
Title Eligibility 획득.
Ticket Power / Rivalry / Activity가 Title Shot 순서에 영향.

## Champion
국제 챔피언.

정확한 #Rank 구간 Threshold는 Data Parameter로 둔다.

---

# 11. Player Progression Gate

시스템 Unlock을 임의 Level보다 Player Career State와 연결한다.

예:
- 첫 Champion 배출 → Player Reputation 대폭 상승
- 일정 Reputation → 전문 Scout 고용 가능
- International Entry → Sponsor / Travel / Multi-Fight Contract
- 다수 Fighter 관리 → Delegation 도구 해금
- 높은 Ticket Power 선수 → 상위 Sponsor / Event

플레이어의 실제 성공이 새로운 관리 도구를 연다.

---

# 12. Part 2 메인 목표

현재 상세 명세의 **메인 스토리 완료 조건**:

> 플레이어가 직접 발굴/관리한 Fighter를 International Circuit의 공식 Champion으로 만든다.

Ruleset / Weight Division은 자유.

이 목표는 처음부터 함께한 Fighter일 필요는 없다.
플레이어가 중간에 발견한 유망주도 가능하다.

하지만 초기 Fighter가 여기까지 도달한다면 가장 강한 감정적 보상을 제공하도록 Achievement / Ring Name / Narrative Event를 둘 수 있다.

---

# 13. Ending / Continue

첫 International Champion 배출 시 Part 2 메인 Narrative Completion을 보여준다.

이후:
- Save는 종료되지 않음
- Sandbox 계속 가능
- Title Defense
- 다른 Ruleset Champion
- Cross-Division Challenge
- Undefeated Legacy
- 다른 Fighter 육성

을 계속 즐길 수 있다.

향후 Part 3가 개발되면 이 Save History를 그대로 이어 Promotion 운영으로 확장 가능하다.

---

# 14. 실패와 회복

FCM은 한 번의 패배 때문에 수십 시간의 육성이 무의미해지는 구조를 피한다.

패배의 결과는 실제로 크다.
- Ranking 하락
- Injury
- Stress
- Undefeated Premium 상실
- Contract / Fight Offer 변화

하지만 동시에:
- Adversity
- 새로운 Skill Card
- Breakthrough
- Rivalry
- 재기 Story

의 재료가 된다.

> 패배는 진행 중단이 아니라 커리어 방향을 바꾸는 사건이다.

---

# 15. Game Over

기본적으로 경기 패배 / Fighter 이탈 / 무관 하나로 Game Over되지 않는다.

Management Business가 심각한 재정난을 겪어도 단계적으로 축소/회복 기회를 제공한다.

Hard Game Over는 최소화한다.
게임의 실패는:
- 유망주를 놓침
- 스타가 떠남
- 챔피언 기회 상실
- 커리어 조기 은퇴

같은 **세계 History의 손실**로 체감하게 한다.

---

# 16. Replayability

매 Save에서 달라지는 요소:
- Prospect 생성
- Talent / Affinity
- Rival
- Injury / Adversity
- Technique 습득 경로
- Skill Card / Ring Name
- World Champion 변화
- Ticket Power 스타
- Promotion Contract

고정 스토리는 시작과 1→2부 전환의 큰 뼈대만 제공한다.
선수 커리어 자체는 Simulation에서 발생한다.

---

# 17. 핵심 게임 루프 — Part 1

`선수 발견`
→ `정보 확인`
→ `Management 계약`
→ `주간 훈련/삶 관리`
→ `Fight Offer`
→ `Camp / 상대 분석 / 전략`
→ `경기`
→ `성장 / Damage / Ticket Power / 관계 변화`
→ `더 강한 상대`
→ `Fight Club Champion`

---

# 18. 핵심 게임 루프 — Part 2

`국제 Prospect / 기존 Fighter 관리`
→ `Staff / Scout / Delegation`
→ `Promotion 계약 / Fight Offer`
→ `Camp / Weight / Sponsor / Media`
→ `Ranked Fight`
→ `Ranking / Ticket Power / Record / Rivalry 변화`
→ `Contender`
→ `Title Shot`
→ `International Champion`

---

# 19. 현재 상세 명세 종료점

Part 2 Champion 배출까지를 **FCM Initial Full Game Scope**로 취급한다.

이 시점에서 Part 3를 위해 필요한 History/Data는 이미 축적되어 있다.
하지만 Promotion 운영은 현재 구현에 포함하지 않는다.

먼저 1~2부의 Fighter Management 게임을 실제로 재미있게 만드는 것이 최우선이다.
