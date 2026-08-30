# FCM 기획 인터뷰 09 — Scouting / Fighter Discovery / Recruitment Intelligence

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 목적: 유망주 발견, 정보 비대칭, 스카우팅 Evidence, Watchlist, 스카우트 직원 및 게임 진행에 따른 스카우팅 진화 구조 확정  
> 상태: **9차 인터뷰 확정안 — A~L 전 항목 승인**

---

# 0. 핵심 철학

FCM의 유망주 발굴은 단순히 전체 선수 DB를 열고 높은 능력치를 정렬하는 기능이 아니다.

세계에는 실제 선수 DB가 존재하지만 플레이어가 알고 있는 선수 집합과 정보는 별도로 관리한다.

핵심 목표:

> **좋은 선수를 찾는 것뿐 아니라, 그 선수가 정말 좋은 선수인지 알아내는 과정 자체가 콘텐츠가 되어야 한다.**

기존 Evidence / Known Mechanic Unknown Value 원칙을 스카우팅 전체로 확장한다.

---

# A. World Fighter DB / Known Fighter DB 분리

승인.

게임 세계에는 플레이어가 알지 못하는 선수를 포함한 전체 Fighter DB가 존재한다.

플레이어는 처음부터 이 전체 DB를 검색하거나 열람할 수 없다.

플레이어가 접근할 수 있는 것은 별도의 `Known Fighter Database`다.

Known Fighter가 되는 경로 예:
- 직접 경기 관람
- 상대 선수로 만남
- 다른 코치/선수에게 소개
- 체육관 방문
- 소문
- SNS/영상
- 스카우트 보고
- 공식적으로 유명한 선수

아직 발견하지 못한 선수는 세계 안에서 존재하고 성장하지만 플레이어 UI에는 나타나지 않을 수 있다.

---

# B. Fighter Discovery 경로 다양화

승인.

선수 발견은 하나의 Scout 버튼으로 통일하지 않는다.

## 1부 후보
- 파이트클럽 직접 관람
- 지역 체육관 방문
- 아마추어 대회 관람
- 코치/지인의 소개
- 선수 추천
- SNS / 영상
- 지인 제보
- 지역 소문
- 상대 선수로 직접 조우

## 게임 진행 이후 후보
- 전문 Scout 고용
- 지역/국가 담당 Scout
- 국제 아마추어 대회
- 다른 단체 경기 분석
- Agent 제안
- Scouting Focus

발견 경로는 최초 Evidence의 양과 편향, 신뢰도에 영향을 준다.

예:
- SNS Highlight: 타격 장면은 많이 보이지만 Cardio/Grappling Evidence 부족
- 직접 풀경기 관전: 다양한 상황 Evidence 획득
- 신뢰도 낮은 소개: Interpretation 오류 가능

---

# C. 초반 플레이어 직접 스카우팅 / 후반 위임

승인.

초반 플레이어는 직접 시간 자원을 사용해 선수를 찾고 관찰한다.

예:
- 이번 주 지역 파이트클럽 관람
- 특정 체육관 유망주 확인
- 아마추어 대회 참석

이는 기존 주간 Life Management와 같은 시간 자원을 경쟁한다.

게임 진행 후에는 전문 Scout를 고용해 이 과정을 위임할 수 있다.

후반에는 조건 기반 `Scouting Focus`를 설정할 수 있다.

예:
- 젊은 선수
- 특정 체급
- 타격형
- 특정 Ruleset 적합
- 낮은 Fame / 높은 성장 가능성
- 특정 지역

---

# D. 단일 Scouting Progress 금지 / 분야별 Knowledge

승인.

`Scouting 73%` 같은 단일 진행도 하나로 선수 전체 정보를 대표하지 않는다.

정보는 분야별 Knowledge로 나눈다.

후보:
- Physical Knowledge
- Striking Knowledge
- Grappling Knowledge
- Combat Intelligence Knowledge
- Technique Knowledge
- Rule Familiarity Knowledge
- Weight Adaptation Knowledge
- Potential Knowledge
- Market / Reputation Knowledge

실제로 관찰한 행동에 해당하는 분야만 Knowledge가 증가한다.

예:
- 복싱 경기만 관찰 → Striking 정보 높음 / Grappling 정보 낮음
- 장기전 경기 관찰 → Cardio Evidence 증가
- MMA 경기에서 바텀 상황이 없었음 → Ground Bottom 정보는 여전히 불확실

---

# E. Scouting Information의 3개 핵심 상태

승인.

모든 주요 스카우팅 정보에는 다음 내부값을 사용할 수 있다.

## Confidence
현재 해석이 얼마나 확실한가.

## Freshness
정보가 얼마나 최근의 것인가.

## Evidence Amount
판단 근거가 얼마나 많이 축적되었는가.

예:
- Punch Technique `72~86`, Confidence 높음, Freshness 낮음
  - 과거에는 확실했지만 현재 변화 가능
- Cardio `55~91`, Confidence 낮음, Freshness 높음
  - 최근 정보지만 Evidence 부족

세 값은 Data Parameter로 관리한다.

---

# F. Raw Evidence와 Interpretation 분리

승인.

핵심 원칙:

> **Raw Evidence는 실제 발생한 사실이고, Interpretation은 틀릴 수 있다.**

예:
- 선수가 경기에서 특정 Counter를 성공했다 → Raw Evidence
- 이를 보고 Scout가 `Reflex가 매우 높다`고 판단 → Interpretation

Interpretation 오류 원인 후보:
- 낮은 Scout 능력
- 적은 표본
- 상대 수준 착각
- 오래된 데이터
- 특정 상황에 편향된 영상
- SNS Highlight
- 선수의 최근 스타일 변화
- 상대 또는 선수가 의도적으로 만들어낸 잘못된 인상

따라서 게임 자체가 임의로 거짓 스탯을 보여주는 방식보다, 관찰자/분석자의 해석 오류로 불확실성을 만든다.

---

# G. Trial Camp / Sparring Evaluation

승인.

영입 전 선수를 Trial Camp 또는 Sparring에 초대할 수 있다.

획득 가능 Evidence 후보:
- Base Parameter 관련 Evidence
- Technique / Combo Proficiency
- Cardio
- Tactical Execution
- Weight 상태
- Training Adaptation
- Hidden Affinity 힌트

비용/리스크:
- 플레이어/코치 시간
- 시설 점유
- 비용
- 선수의 관심/동의 필요
- Sparring Injury Risk

이를 통해 다음 선택을 만든다.

> 불확실하지만 경쟁자보다 먼저 확보할 것인가  
> vs  
> Trial을 통해 더 확인한 뒤 영입할 것인가

---

# H. 단일 최종 추천 별점 금지

승인.

스카우팅 결과를 `★★★★★ 영입 추천` 같은 단일 최종 점수로 압축하지 않는다.

복수 축 평가를 제공한다.

후보:
- Current Combat Level
- Growth Potential
- Our Strategy Fit
- MMA Fit
- Boxing Fit
- Kickboxing Fit
- No Rules Fit
- Marketability
- Information Confidence
- Contract / Acquisition Difficulty

추가로 Scout/Coach의 자연어 의견을 제공할 수 있다.

예:
> 현재 완성도는 부족하지만 이 정도 리치와 Footwork를 가진 젊은 선수는 흔치 않습니다.

최종 판단은 플레이어에게 남긴다.

※ 기존 `Overall`이 UI 편의용 평가값으로 존재할 수 있다는 결정과 별개다. Overall은 전투 계산에 사용하지 않으며, 영입 의사결정을 단일 추천 점수로 대체하지 않는다.

---

# I. 정보 확인과 선수 선점의 Trade-off

승인.

유망주를 오래 관찰하는 동안 다른 매니저/팀이 먼저 접근하거나 계약할 수 있다.

따라서:

- 부족한 정보로 빠르게 영입
- 충분한 Evidence를 모아 안전하게 판단

사이에 긴장감을 만든다.

선수의 Fame, 최근 성적, 시장 관심 증가에 따라 경쟁 강도가 증가할 수 있다.

---

# J. Watchlist / Fighter Tracking

승인.

관심 선수는 영입하지 않아도 Watchlist에서 장기 추적할 수 있다.

추적 이벤트 예:
- 최근 경기 결과
- Technique 변화
- 체급 변경
- 연승/연패
- 부상
- Fame 변화
- 다른 매니저 관심
- 계약 변화
- 스타일 변화

관찰하지 않는 시간이 길어지면 기존 정보의 Freshness가 감소한다.

Watchlist는 단순 Bookmark가 아니라 시간에 따라 변하는 선수 커리어를 추적하는 시스템이다.

---

# K. Scout 직원 능력치 / 전문 분야

승인.

후반부 Scout는 서로 다른 능력과 전문 분야를 가진다.

후보 Parameter:
- Discovery
- Evaluation
- Potential Evaluation
- Region Knowledge
- Striking Evaluation
- Grappling Evaluation
- Physical Evaluation
- Combat Intelligence Evaluation
- Network / Access

Scout는 성격 시스템이 아니라 직원 능력치와 지식/네트워크로 차별화한다.

예:
- 지역 유망주 발견에 강한 Scout
- Striking 분석 전문
- Potential 판단 전문
- 국제 네트워크 전문

Scout의 능력은 Interpretation 품질과 Discovery 범위에 영향을 준다.

---

# L. 게임 진행에 따른 Scouting System 진화

승인.

동일한 스카우팅 Core가 플레이어 성장에 따라 역할과 규모를 확장한다.

## 1부 초반
- 플레이어 직접 탐색
- 지역 파이트클럽/체육관 중심
- 소문과 소개
- 직접 관찰 비중 큼

## 1부 후반
- 지역 네트워크 형성
- 체육관/코치가 먼저 유망주 제보
- 간단한 위임 가능

## 2부 국제 리그
- 전문 Scout 고용
- 국가/지역별 Scouting Focus
- 국제 아마추어/프로 시장
- 유망주 영입 경쟁

## 3부 자체 단체 운영
- 자신의 팀 선수를 찾는 기능을 넘어 단체의 미래 스타와 흥행 자원을 발굴
- 대회 참가 선수 발굴
- 새로운 시장/지역 탐색

---

# 스카우팅 시스템 루프

**세계 Fighter DB**  
→ Discovery Event  
→ Known Fighter 등록  
→ 초기 Evidence / Interpretation  
→ Watchlist 또는 즉시 접근  
→ 직접 관찰 / 비디오 / Trial / Scout 조사  
→ 분야별 Knowledge 증가  
→ Confidence / Freshness / Evidence Amount 변화  
→ 복수 축 평가  
→ 영입 판단  
→ 기다리는 동안 타 팀 경쟁 / 선수 성장  
→ 영입 또는 지속 추적

---

# 확정 설계 원칙

1. 전체 Fighter DB와 플레이어 Known Fighter DB는 분리한다.
2. 발견 자체가 게임플레이 활동이다.
3. 스카우팅은 하나의 진행도가 아니라 분야별 Knowledge와 Evidence로 작동한다.
4. 정보에는 Confidence / Freshness / Evidence Amount가 있다.
5. Raw Evidence는 사실이며 Interpretation은 틀릴 수 있다.
6. Trial/Sparring으로 더 많은 Evidence를 얻을 수 있다.
7. 단일 추천 별점으로 영입 판단을 자동화하지 않는다.
8. 정보가 많아질 때까지 기다리면 선수를 경쟁자에게 빼앗길 수 있다.
9. Watchlist를 통해 선수의 세계 내 커리어를 장기간 추적한다.
10. Scout 직원은 발견/평가/잠재력/지역 지식 등의 정량 Parameter를 가진다.
11. 스카우팅 시스템은 1부 직접 탐색 → 2부 전문 조직 → 3부 단체 Talent Pipeline으로 확장된다.
12. 스카우팅 관련 가중치, 정보 감쇠, 경쟁 강도, 평가 오차 등은 Data Parameter로 관리한다.
