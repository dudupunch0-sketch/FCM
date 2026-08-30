# World of Mixed Martial Arts — FCM 벤치마킹

> 조사 기준: 2026-08-30  
> 목적: FCM의 격투 선수 데이터, 스카우팅, 계약, 랭킹, 매치메이킹, 커리어 세계 시뮬레이션 및 후반부 단체 운영 시스템 참고

## 현재 버전 상태

2026-08-30 기준 정식 출시된 최신작은 **World of Mixed Martial Arts 5(WMMA5)**다.
Grey Dog Software는 **WMMA6를 2026년 9월 출시 예정**으로 발표했으며 공개 Beta는 8월 말~9월 초 예정이라고 안내하고 있다.
따라서 현재 FCM 벤치마킹의 검증 가능한 기준은 WMMA5 공식 자료 및 최신 패치이며, WMMA6는 출시 이후 별도 확장 조사 대상으로 둔다.

---

## 1. 이 게임을 벤치마킹하는 이유

WMMA5는 MMA 단체를 운영하는 경영 시뮬레이션이다.

공식 설명에서 확인되는 핵심 요소:
- 세부 Fighter Attribute
- 전 세계 스카우팅
- 선수 계약 협상
- 매치메이킹
- 이벤트 개최
- 선수 Morale
- Promotional Work / Hype
- 매일 변화하는 게임 세계
- 랭킹 및 타이틀

FCM 초반부는 선수 개인 육성에 더 집중하지만 국제 무대와 3부 단체 운영에서는 구조적으로 매우 중요한 참고작이다.

---

## 2. Fighter Attribute와 Fight Simulator 연결

WMMA5는 세부 Fighter Attribute와 Blow-by-blow Fight Simulator를 함께 강조한다.

FCM 참고:

**선수 Parameter → 전투 행동/성공 → 경기 결과 → 기록/성장 → 선수 가치 변화**

선수 데이터와 전투 시뮬레이션을 별도 콘텐츠로 분리하지 않아야 한다.

---

## 3. 스카우팅은 세계 탐색 시스템

WMMA5에서는 Scouting Network를 통해 전 세계의 미래 스타를 찾고 계약할 수 있다.

FCM 적용:
- 1부: 지역 파이트클럽 / 체육관 / 아마추어 / 소개
- 2부: 국가 / 해외 리그 / 국제 유망주
- 3부: 전 세계 선수 / 타 단체 계약 상황 / 미래 흥행 스타

스카우팅 범위 자체가 플레이어 커리어 성장과 함께 확장될 수 있다.

---

## 4. 발견 → 계약 → 매치메이킹

WMMA5 공식 설명은 스카우팅으로 선수를 찾고 계약한 뒤 자신의 이벤트에서 상대를 매치시키는 흐름을 명시한다.

기본 루프:

발견 → 평가 → 계약 → 상대 선정 → 경기 → 가치 변화 → 재계약/다음 경기

FCM에서는 초반에 Promotion을 소유하지 않으므로 변형한다.

1부:
선수 발견 → Management 관계 → 훈련 → 외부 Fight Offer / Challenge → 경기

3부:
선수/참가자 발굴 → 계약 → 직접 Matchmaking → Event 개최

---

## 5. 살아 있는 격투 세계

WMMA5 세계는 플레이어가 개입하지 않아도 매일 변화한다.

FCM에서도 NPC 선수들이 독립적으로 다음을 수행해야 한다.
- 경기
- 랭킹 상승/하락
- 다른 체급/Ruleset 도전
- 부상
- 성장/쇠퇴
- 계약 변화
- 타이틀 획득/상실
- 은퇴

플레이어가 발견하지 않은 유망주도 시간이 지나 챔피언이나 라이벌이 될 수 있어야 한다.

---

## 6. 경기력과 흥행 가치는 다른 축

WMMA5는 계약, Morale, Promotional Work, Hype 등을 경기 능력과 별도로 다룬다.

FCM에서도 최소 다음을 분리할 가치가 있다.
- **Competitive Value**: 실제 경기력 / Rank
- **Commercial Value**: Fame / Marketability / Hype

강한 선수와 흥행 가치가 높은 선수는 반드시 같지 않아야 한다.

---

## 7. 랭킹 포인트와 Popularity의 분리 — 중요한 최신 참고점

WMMA5 최근 패치에는 Matchmaking과 Ranking의 상호작용을 보여주는 중요한 수정이 있다.

확인되는 방향:
- 선수가 새 체급으로 이동할 때 기존 체급 Ranking Point 감소량을 조정
- Champion / Challenger의 강약을 판단할 때 인접 체급 Ranking도 고려하도록 개선
- 상대가 충분히 더 높은 Ranking Point를 가진 경우 `not popular enough` 이유만으로 경기를 거부하는 제한을 완화
- 약한 Challenger를 붙이는 Penalty를 경기 Rating보다 Promotion의 Image에 영향을 주도록 조정

### FCM에 주는 교훈

**Rank와 Fame을 같은 숫자로 합치면 안 된다.**

예:
- 실력/Rank는 높은데 유명하지 않은 선수
- Rank는 상대적으로 낮지만 엄청난 스타

둘 다 Matchmaking에서 가치가 있지만 이유가 다르다.

또한 지나치게 약한 상대를 반복해서 붙이면 단순히 랭킹 시스템이 막는 것보다:
- 얻는 Ranking Reward 감소
- Fame 보상 감소
- Promotion / Manager Reputation 손상
- 관중 관심 감소

같은 여러 비용으로 억제하는 것이 자연스럽다.

---

## 8. 체급 이동과 랭킹

WMMA5 패치에서 체급 이동 시 기존 Ranking Point와 인접 체급 Rank가 고려된다는 점은 FCM에 특히 중요하다.

FCM에서도 선수가 증량/감량했다고 새 체급에서 완전히 무명 취급되거나 기존 Rank를 그대로 복사하는 양극단은 피하는 것이 좋다.

향후 설계 후보:
- 기존 Ruleset Rank
- 이전 체급 성과
- 인접 체급 성과
- Fame
- 최근 활동

을 이용해 새 체급의 초기 Position / Eligibility를 산출한다.

---

## 9. 약한 상대 보호와 Matchmaking 악용 방지

FCM에서는 유망주에게 약한 상대를 붙여 경험을 쌓는 것이 합리적인 전략이어야 한다.
LEATHER 역시 젊은 복서에게 Journeyman을 붙여 능력을 검증한 뒤 점진적으로 강한 상대에게 올리는 구조를 핵심 특징으로 설명한다.

하지만 약한 상대만 무한 반복하는 것이 최적 전략이 되어서는 안 된다.

WMMA의 `weak challenger` 관련 시스템은 다음 아이디어에 참고할 수 있다.
- 경쟁 가치가 낮은 승리의 Rank Reward 감소
- 반복적인 Padding에 대한 Fame/흥행 가치 감소
- 상위 단계에서는 Manager/Promotion Reputation 비용

즉 약한 상대는 **육성 수단**이지 **무한 성장 exploit**이 아니어야 한다.

---

## 10. 계약 / Morale / Hype가 Matchmaking에 연결

WMMA5는 계약과 Morale뿐 아니라 Promotional Work와 Hype도 운영 핵심으로 둔다.

FCM 적용:
Fight Offer와 상대 선정은 단순 Rank 비교가 아니라 다음을 동시에 고려할 수 있다.
- Rank
- Fame
- Rivalry
- Purse
- Career Need
- Contract
- Injury / Availability
- 준비기간
- Event Hype

이렇게 해야 격투기가 순수 스포츠 랭킹표가 아니라 엔터테인먼트 산업이라는 감각이 살아난다.

---

## 11. FCM 진행 단계와 WMMA의 관계

### Part 1 — 지하 파이트클럽
- 선수 탐색
- Fight Offer
- Challenge
- 지역/비공식 랭킹
- Fame 형성

### Part 2 — 국제 리그
- 공식 계약
- 랭킹
- 타이틀
- 국제 선수 풀
- Fame / Hype 확대

### Part 3 — Promotion 운영
- 대규모 선수/계약 풀
- Matchmaking
- Event Card
- Promotional Work
- Hype
- 경쟁 Promotion
- 타이틀/랭킹 관리

---

## 12. FCM이 강하게 참고할 부분

- Rank와 Popularity/Hype를 분리하는 사고방식
- Matchmaking이 계약/랭킹/흥행/선수 의사를 동시에 다루는 구조
- 체급 이동 시 기존 커리어의 가치가 완전히 사라지지 않는 구조
- 약한 상대를 붙이는 전략은 허용하되 장기적 비용을 주는 구조
- 세계가 플레이어와 독립적으로 변화하는 구조
- 상세 데이터가 실제 Fight Simulator와 연결되는 구조

---

## 13. FCM에서 조심할 부분

WMMA는 상세한 Promotion 경영 게임이므로 FCM 1~2부에 너무 많은 행정 시스템을 넣으면 선수 육성의 감정적 재미가 희석될 수 있다.

특히 피할 것:
- 초반부터 복잡한 Promotion 회계
- 수십 명 선수의 미세 계약 반복
- Rank/Fame/Hype 숫자가 너무 많아 선수 자체가 안 보이는 UI
- Matchmaking을 단순 Spreadsheet Optimizer로 만드는 구조

3부에서도 핵심 판타지는 회계가 아니라 **내가 키운 격투 세계를 운영하는 것**이다.

---

## Sources

- Grey Dog Software — World of Mixed Martial Arts 5
  - https://greydogsoftware.com/title/world-of-mixed-martial-arts-5/
- Grey Dog Software — WMMA5 Latest Patch
  - https://greydogsoftware.com/wmma5-latest-patch/
- Grey Dog Software — Home / WMMA6 announcement status
  - https://greydogsoftware.com/
- LEATHER Features
  - https://leatherthegame.com/features/

---

## 리서치 신뢰도 메모

공식 제품 소개와 공식 Patch Note에서 확인 가능한 사실을 우선 사용한다.
WMMA6는 2026-08-30 현재 정식 출시 전이므로 구체 기능을 추정해 FCM 설계 근거로 사용하지 않는다. 정식/공개 Beta 자료가 안정화되면 별도 문서 또는 본 문서에 추가한다.
