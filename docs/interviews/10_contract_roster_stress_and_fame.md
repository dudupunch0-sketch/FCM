# FCM 기획 인터뷰 10 — 계약 / 선수단 규모 / 스트레스 / 유명도

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: 선수 영입 이후의 매니지먼트 계약, 선수단 규모 확장, 관계/스트레스, 파이트머니와 유명도 구조 확정  
> 상태: **10차 인터뷰 확정안**

---

# A. 플레이어와 선수의 관계 — Management Agreement

FCM에서 플레이어와 선수의 관계는 축구 구단처럼 선수를 소유하는 고용관계가 아니다.

플레이어는 기본적으로 **매니저 겸 코치**이며 선수와 `Fighter Management Agreement` 성격의 계약을 맺는다.

선수는 경기에서 본인의 Fight Purse를 받고, 플레이어는 계약에 따라 Management Fee 또는 수익 배분을 받는다.

계약 핵심 후보:
- Management Share / Management Fee
- Contract Duration
- Fight Commitment
- Training Support
- Termination Clause
- Win / Champion Bonus
- Sponsor Revenue Share

모든 계약 조건과 계산은 Data/Parameter로 관리한다.

---

# A-2. 선수단 규모의 단계적 확장

처음부터 많은 선수를 직접 관리하지 않는다.

현재 초기 목표값:
- **1부: 최대 3명 이하**
- **2부: 최대 10명 이하**
- **3부: 최대 100명 이하**

이 수치는 밸런싱 가능한 Parameter로 관리하며 최종 고정 상수가 아니다.

## 직접 관리 선수

플레이어가 깊이 애정을 갖고 직접 관리하는 선수는 **5명 이하** 수준을 목표로 한다.

직접 관리 선수에게는 다음과 같은 세밀한 개입이 가능하다.
- 주간 일정 직접 설정
- 훈련 세부 선택
- Technique 학습
- Skill Card 활성 구성
- 상대 비디오 분석
- 체중 관리
- 스트레스/사생활 관리
- 경기 전략
- 경기 후 분석

## 위임 관리

선수단이 커질수록 모든 선수를 같은 깊이로 직접 관리하지 않는다.

코치진, 매니저, 스카우트, 분석 스태프 등 직원 고용을 통해 다음 관리 도구를 확장한다.
- 자동 훈련 계획
- 선수군별 운영 정책
- 컨디션/스트레스 경고
- 경기 추천
- 스카우팅 위임
- 계약/일정 보조
- 분석 리포트

따라서 게임 진행에 따른 선수단 확대는 단순 숫자 증가가 아니라 **조직 운영 능력의 성장**과 연결한다.

---

# B. Dual Contract 구조

계약을 두 층으로 분리한다.

## Player ↔ Fighter

매니지먼트/코칭 계약.

## Fighter ↔ Promotion / Fight Club

경기 출전 및 파이트 계약.

1부에서는 경기 단위 Fight Offer가 중심이며, 2부 이후에는 Promotion과 다경기 계약이 가능하다.

3부에서 플레이어가 직접 Promotion을 운영하면 선수 관리와 Promotion 계약 양쪽 관점을 모두 경험할 수 있다.

---

# C. 영입 전 관심도 파악

정식 계약 협상 전 선수와 접촉하여 플레이어와 함께할 관심도를 확인할 수 있다.

예시 표현:
- 관심 높음
- 관심 보통
- 관심 낮음

정확한 내부 `Join Interest`는 수치화하지만 UI에서는 대화와 힌트로 보여준다.

관심도 영향 후보:
- Player Reputation
- 선수 Fame / Rank
- 코치진 수준
- 시설 수준
- 기존 선수의 성공
- 계약 조건
- Career Need
- 타 매니저 관심
- 현재 커리어 상황

---

# D. Career Need

돈만 많이 주면 모든 선수를 영입할 수 있는 구조를 지양한다.

선수는 고정 Personality 대신 **현재 커리어 상황에서 발생하는 Career Need**를 가진다.

예:
- 무명 유망주 → 성장 환경 / 좋은 코칭
- 전성기 선수 → 타이틀 기회 / 강한 상대
- 노장 → 높은 Fight Purse / 효율적 경기 수
- 연패 선수 → 재기전 / 안전한 경기
- 스타 선수 → 큰 무대 / Fame / 높은 수익

Career Need는 상황에 따라 변하며 Data Parameter로 관리한다.

---

# E. Management 계약 조건

협상 가능 항목 후보:
- Management Fee %
- Contract Duration
- Fight Commitment
- Training Support
- Termination Clause
- Champion Bonus
- Win Bonus
- Sponsor Revenue Share

게임 진행에 따라 계약 복잡도를 단계적으로 증가시킬 수 있다.

1부 초반에는 단순 계약, 2부 이후에는 수익 배분과 조항을 세분화한다.

---

# F. Promise 시스템

계약/관계 협상에서 돈 이외에 Promise를 사용할 수 있다.

예:
- 일정 기간 안에 경기 제공
- 타이틀 도전 기회
- 특정 Ruleset 중심 육성
- 특정 체급 유지
- 좋은 코치 영입
- 훈련 환경 개선

Promise는 내부적으로 상태, 기한, 중요도, 이행 여부를 관리한다.

약속을 지키면 Trust가 상승하고, 반복적으로 어기면 관계와 재계약 가능성이 악화된다.

돈이 부족한 초반 플레이어가 좋은 선수를 설득하는 중요한 수단이 될 수 있다.

---

# G. Relationship State / Stress Management

별도의 Personality 시스템은 만들지 않는다.

그러나 플레이어와 선수 사이의 **관계 상태**는 필요하다.

주요 후보:
- Trust
- Respect
- Satisfaction

## Stress

선수의 `Stress` 역시 주간 관리의 핵심 상태값으로 포함한다.

Stress 영향 후보:
- 과도한 훈련
- 연패
- 높은 기대
- 큰 경기 압박
- 부상
- 불만족스러운 계약
- Promise 미이행
- 잦은 체중 감량
- 사생활 부족
- 미디어/팬 활동
- 팀 내 문제

플레이어가 휴식, 일정 조절, 활동 선택, 경기 배치, 커뮤니케이션 등을 통해 스트레스를 관리할 수 있다.

## Stress Resistance

선수마다 스트레스에 대한 저항력/적응력이 다를 수 있다.

이는 Personality가 아니라 내부적인 선수 특성 Parameter로 관리한다.

정확한 값은 반드시 완전 공개할 필요가 없으며, 장기간 관찰이나 사건 반응을 통해 힌트를 얻을 수 있다.

Stress 및 Stress Resistance의 정확한 전투/성장 영향은 추후 별도 설계한다.

---

# H. 선수 성장에 따른 재협상

무명 선수의 시장가치는 성장하면서 변화한다.

영향 후보:
- Rank
- Fame
- 최근 성적
- Finish 기록
- Title
- Marketability
- 다른 매니저 관심
- Promotion 관심

선수의 `Expected Value`가 상승하면 재협상 요구가 발생할 수 있다.

따라서 좋은 선수를 잘 키우는 것은 성공이지만, 동시에 유지 비용과 협상 난이도를 증가시킨다.

---

# I. 타 매니저의 접근

계약 만료 또는 불만족 상태의 선수에게 다른 매니저가 관심을 보일 수 있다.

계약 중 즉시 선수를 빼앗기는 구조는 제한하지만 다음은 가능하다.
- 계약 만료 접근
- 경쟁 Offer
- 재계약 요구 상승
- 선수의 이적 의사 증가

Trust, Satisfaction, 계약 조건, Promise 이행, 커리어 성과가 유지 가능성에 영향을 준다.

---

# J. 고정 Loyalty Parameter 없음

고정적인 `Loyalty` 성격 스탯은 두지 않는다.

장기 잔류는 다음 경험의 결과로 발생한다.
- 오랜 동행
- Promise 이행
- 커리어 성공
- 높은 Trust
- 높은 Satisfaction
- 좋은 대우

반대로 오래 함께했어도 커리어를 망치고 약속을 어기고 대우가 나쁘면 떠날 수 있다.

---

# K. 협상 실패의 결과

계약 협상은 무한히 최저 조건을 시험하는 퍼즐이 아니다.

지나치게 낮은 Offer 반복 또는 무리한 협상은 다음 결과를 만들 수 있다.
- Trust 하락
- 협상 태도 악화
- 요구 조건 상승
- 일정 기간 재협상 제한
- 다른 매니저 탐색

협상 행동 자체도 관계 History에 남을 수 있다.

---

# L. Fight Offer / Risk / Reward / Fame

Fight Offer는 단순 파이트머니 선택이 아니다.

주요 데이터 후보:
- Base Purse
- Win Bonus
- Finish Bonus
- Opponent
- Opponent Strength
- Ruleset
- Ranking Effect
- Event Fame
- Short Notice
- Weight Requirement
- Title / Contender Implication
- Injury Risk
- Expected Audience

## Fame Reward

격투기는 스포츠이면서 엔터테인먼트이므로 상대와 이벤트는 `Fame` 성장에도 영향을 준다.

Fame 보상이 높은 경기 예:
- 유명한 상대
- 악명 높은 상대
- 라이벌전
- 챔피언전
- 큰 이벤트
- 화제성이 높은 Ruleset/매치업
- 극적인 재대결

따라서 경기 선택은 돈 / 랭킹 / 성장 / 부상 위험 / Fame을 동시에 비교하는 의사결정이 된다.

Fame 관련 모든 가중치는 Parameter화한다.

---

# M. 선수의 소유권 / Transfer Fee 없음

FCM을 선수를 사고파는 게임으로 만들지 않는다.

기본 구조:

**발견 → 평가 → 설득 → 계약 → 신뢰 형성 → 육성 → 경기/커리어 성장**

선수 소유권을 사고파는 Transfer Market은 기본 시스템에 포함하지 않는다.

다른 매니저에게 선수를 판매해 Transfer Fee로 돈을 버는 구조도 없다.

플레이어의 수익은 선수의 Fight Purse, Sponsor, 기타 선수 활동 수익에서 계약된 몫을 얻는 **Management Business** 성장으로 연결한다.

---

# 10차 인터뷰 핵심 확정사항

1. 플레이어와 선수는 소유/고용이 아닌 Management Agreement 관계다.
2. 선수단 규모는 게임 진행과 직원 조직 성장에 따라 단계적으로 확장한다.
3. 초기 목표 관리 한도는 1부 3명, 2부 10명, 3부 100명이며 모두 Parameter화한다.
4. 플레이어가 세밀하게 직접 관리하는 핵심 선수는 약 5명 이하를 목표로 한다.
5. Fighter Management 계약과 Promotion 출전 계약을 분리한다.
6. 돈 외에 Career Need와 Promise가 영입/유지에 중요하다.
7. Relationship State와 Stress를 관리하며 선수마다 Stress Resistance 차이가 존재한다.
8. 선수가 성장하면 요구조건과 Expected Value도 성장한다.
9. 타 매니저와 계약 경쟁이 존재한다.
10. 고정 Loyalty 스탯 대신 실제 관계 History로 잔류를 설명한다.
11. 협상 실패와 낮은 제안에는 관계상 비용이 존재한다.
12. Fight Offer는 돈, 랭킹, 성장, 위험, Fame을 함께 평가한다.
13. 격투기 엔터테인먼트 특성상 유명 상대, 라이벌전, 큰 이벤트의 Fame 가치가 중요하다.
14. 선수 Transfer Fee / 소유권 거래를 기본 시스템에서 제외한다.
15. 모든 한도, 배율, 관계 변화량, Fame 보상은 Data/Parameter 중심으로 관리한다.
