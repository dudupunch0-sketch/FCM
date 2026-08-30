# FCM Delegated Design 14 — Staff / Facilities / Delegation / Player Progression

> 상태: **사용자가 1~2부 잔여 시스템 설계 결정을 위임한 뒤 확정한 설계안**
> 범위: Part 1 Underground / Part 2 International League

---

# 1. 설계 목표

선수단이 커질수록 플레이어의 클릭 수가 늘어나는 게임이 되어서는 안 된다.

핵심 성장 감각:

**내가 모든 것을 직접 함**
→ **좋은 사람을 고용해 일부를 맡김**
→ **조직이 나의 철학을 안정적으로 실행함**

직원과 시설은 단순 `훈련 +10%` 보너스가 아니라 다음을 바꾼다.
- 무엇을 위임할 수 있는가
- 위임 결과를 얼마나 믿을 수 있는가
- 한 번에 몇 명을 관리할 수 있는가
- 위험을 얼마나 빨리 발견하는가
- 어떤 Technique / Training을 제공할 수 있는가

---

# 2. Staff Role — 1~2부 핵심

## 2.1 Assistant / General Coach
초반 핵심 보조자.
여러 분야를 평균적으로 담당할 수 있으나 전문 Coach보다 Ceiling이 낮다.

## 2.2 Striking Coach
주요 영향:
- Punch / Kick / Guard / Footwork Training Quality
- Striking Technique Teaching
- Striking Sparring Plan
- 상대 Striking Pattern 분석 보조

## 2.3 Grappling Coach
- Takedown / Clinch / Ground / Submission Training Quality
- Grappling Technique Teaching
- Grappling Sparring Plan

## 2.4 Strength & Conditioning Coach
- Physical Training Quality
- Training Load 관리
- Fitness Build
- Recovery Debt 예방
- Weight 관련 Physical Plan 보조

## 2.5 Analyst
- Opponent Video Analysis
- Pattern / Combo Identification
- Post-Fight Causal Report
- 정보 Confidence 개선

## 2.6 Scout
기존 확정안 유지:
- Discovery
- Evaluation
- Potential Evaluation
- Region Knowledge
- 분야별 평가
- Network / Access

## 2.7 Medical / Physio Staff
- Injury Diagnosis
- Recovery Plan
- Return-to-Training 판단
- Reinjury Risk 분석

## 2.8 Weight / Nutrition Specialist
2부에서 전문화 가능.
- Weight Plan 품질
- Weight Stress 예측
- Weigh-In Risk 판단
- Weight Gain Adaptation Plan

초기 1부에서는 S&C 또는 Medical Staff가 일부 역할을 겸임할 수 있다.

---

# 3. Staff Parameter 철학

직원도 선수와 마찬가지로 숫자 하나로 평가하지 않는다.

후보:
- Teaching
- Evaluation
- Analysis
- Load Management
- Medical
- Weight Management
- Discipline / Plan Execution
- Fighter Capacity
- Specialty Knowledge
- Region Knowledge

직원마다 모든 Parameter를 갖게 만들기보다 Role에 필요한 핵심 Parameter만 노출한다.

직원 고용 화면에서도 단일 `Overall ★★★★★`만으로 정답을 만들지 않는다.

---

# 4. Staff Specialty / Knowledge

고정 Personality 대신 전문분야와 경력 History를 사용한다.

예:
- Boxing Specialist
- Southpaw Matchup Specialist
- Wrestling-heavy MMA Specialist
- Veteran Recovery Specialist
- Cutting Specialist
- Prospect Evaluation Specialist

Specialty는 단순 공통 보너스보다 특정 업무 Context에서 가중치를 준다.

---

# 5. Coach와 선수의 Fit

높은 능력의 Coach가 모든 선수에게 최적은 아니다.

Fit 영향 후보:
- 가르치는 Technique와 선수 목표의 일치
- 선수 Growth Aptitude
- 현재 수준과 Coach Teaching Ceiling
- Ruleset
- 체급 / 신체 스타일
- Camp 목표

예:
Elite Boxing Coach를 Ground-heavy 유망주에게 배치하는 것은 비용 대비 효율이 낮을 수 있다.

---

# 6. Staff Workload / Capacity

모든 Staff는 동시에 무한한 선수를 담당할 수 없다.

내부:
- AssignedFighters
- Workload
- FighterCapacity

Capacity를 넘으면:
- Training Plan 품질 감소
- 분석 업데이트 느려짐
- Injury / Stress 경고 누락 가능
- Report Confidence 감소

따라서 2부에서 로스터를 늘리려면 **Staff Capacity를 같이 키워야 한다.**

---

# 7. Delegation Level

선수/업무별로 책임 수준을 지정할 수 있다.

## Manual
플레이어 직접 결정.

## Assisted
직원이 추천하고 플레이어가 승인/수정.

## Delegated
직원이 기본 업무를 수행하고 중요 예외만 플레이어에게 보고.

## Auto with Policy
플레이어가 철학/정책만 정하고 직원이 장기 운영.

예:
- Training: 성장 우선 / 안전 우선 / Fight Prep 우선
- Matchmaking: 안전한 성장 / 균형 / 고위험 고보상
- Weight: Conservative / Normal
- Media: Ticket Power 우선 / Stress 보호

플레이어는 언제든 중요한 선수의 업무를 다시 가져올 수 있다.

---

# 8. Direct Management Capacity

기존 확정안 유지:
- 직접 세밀관리 기본 목표: **5명 이하**

1부 로스터 최대 3명 수준에서는 사실상 전원 직접 관리 가능.
2부 최대 10명 수준에서는 일부 선수를 Staff에게 맡기게 된다.

Direct Management Capacity는 단순 강제 잠금보다 UI/시간 복잡도와 Player Capability로 구현한다.

기본값은 Data Parameter로 관리한다.

---

# 9. Delegation은 완벽하지 않다

직원에게 맡긴 결과는 해당 직원 능력과 정보에 의해 결정된다.

예:
- 낮은 Analysis → 상대 Pattern 오판
- 낮은 Load Management → 과훈련
- 낮은 Medical → 조기 복귀 추천
- 낮은 Weight Management → 감량 리스크 과소평가

단, 직원 AI가 터무니없이 자해하는 느낌을 주면 안 된다.
낮은 능력은 **정밀도 / 최적화 / 위험 탐지**를 떨어뜨리는 형태가 기본이다.

---

# 10. Staff Recommendation UI

직원은 결과만 자동 처리하는 것이 아니라 이유를 설명해야 한다.

예:
> 이번 주 Hard Sparring을 줄이는 것을 권합니다.
> 최근 Recovery Debt와 오른손 상태가 좋지 않습니다.

> 상대는 Jab → Right Exit Pattern을 반복하는 경향이 있습니다. Confidence: 중간.

이를 통해 플레이어는 좋은 직원을 실제로 체감한다.

---

# 11. Facilities

시설은 하나의 `Gym Level` 숫자만 올리는 구조보다 **기능 모듈** 중심으로 설계한다.

## Core Gym Space
- 동시 훈련 인원
- Staff Capacity
- 기본 Training Quality Ceiling

## Striking Facility
- Striking Training Quality
- Striking Technique 학습 조건

## Grappling Facility
- Grappling Training Quality
- 특정 Grappling Technique 학습 조건

## Strength & Conditioning
- Physical Training
- Fitness Build
- Training Load 관리

## Recovery / Medical
- Recovery Rate
- Injury Rehab
- Diagnosis 지원

## Analysis Room
- Video Analysis 처리량
- Analyst 업무 품질
- Fight Tape 저장/비교

1부에서는 작은 체육관/임대 시설 수준으로 시작하고 2부에서 전문화한다.

---

# 12. 시설은 직접 Combat Buff를 주지 않는다

시설 업그레이드가 경기 당일 `Damage +5%`를 지급하지 않는다.

시설은 다음을 바꾼다.
- 훈련 효율
- Technique 접근성
- Injury Risk
- Recovery
- 분석 품질
- 동시 관리 Capacity

즉 시설 투자가 **육성과 준비 과정**을 통해 경기력에 영향을 준다.

---

# 13. Sparring Partner Network

좋은 Sparring Partner는 중요한 자원이다.

출처:
- 자신의 로스터
- 지역 체육관 관계
- 외부 초청
- 2부 국제 네트워크

상대 스타일을 잘 재현하는 Sparring Partner는 Tactical Preparation / Evidence에 큰 가치가 있다.

비용:
- 돈
- 일정
- 부상 위험
- Network 필요

Sparring Partner 자체를 별도 영구 Staff로 만들 필요는 없고 Fighter/External Resource로 관리한다.

---

# 14. Player Capability

플레이어 캐릭터 역시 성장한다.
다만 RPG 스탯 수십 개가 아니라 **매니저/코치 역할에 필요한 소수 역량**으로 제한한다.

확정 권장 5축:

## Coaching
직접 Training / Tactical Drill / Corner Instruction 품질.

## Analysis
직접 Video Analysis / 경기 중 Pattern 판단 / Post-Fight Analysis 품질.

## Scouting
직접 유망주를 볼 때 Evidence 획득/해석 품질.

## Negotiation
계약/Promise/Fight Offer 협상 범위와 효율.

## Management
동시에 다루는 업무량, Staff Delegation, 조직 운영 효율.

플레이어 능력 역시 0~100 내부값을 둘 수 있지만 UI 표현 방식은 구현 단계에서 단순화 가능하다.

---

# 15. Player Capability 성장

플레이어 능력은 Skill Point 구매보다 **실제 활동 History** 중심으로 성장한다.

예:
- 직접 코칭 / 선수 성장 성공 → Coaching
- Video Analysis / 정확한 Corner Read → Analysis
- Prospect 발견 → Scouting
- 좋은 계약 / 재계약 → Negotiation
- Staff 고용 / 다수 선수 운영 → Management

중요한 커리어 사건은 큰 성장 자극을 줄 수 있다.

Potential처럼 무한 성장은 아니며 성장 Curve는 Parameter화한다.

---

# 16. Player Reputation

Player Capability와 Reputation을 분리한다.

Capability = 실제 능력
Reputation = 세계가 플레이어를 얼마나 인정하는가

Reputation 증가 후보:
- 챔피언 배출
- Upset 승리
- 유망주 성공
- 장기적인 좋은 선수 관리
- 높은 Ticket Power 선수 관리
- 약속 이행

영향:
- Fighter Join Interest
- Staff Hiring
- Fight Offer 품질
- Sponsor
- Promotion 관계

실력 좋은 무명 코치와 유명하지만 실무 능력이 부족한 코치가 구분 가능하다.

---

# 17. Staff Hiring

직원도 영입 경쟁이 존재할 수 있다.

영향 후보:
- Player Reputation
- Salary
- Facility
- 담당 선수 수준
- Role / Responsibility
- 국제 무대 여부

좋은 Staff는 2부 진입 이후 조직 성장의 주요 투자 대상이다.

---

# 18. 운영 UI

핵심 화면:

## Staff Responsibility
- 업무별 담당자
- Manual / Assisted / Delegated

## Workload
- 직원별 담당 선수
- 과부하 경고

## Fighter Management
- Direct Managed 여부
- 담당 Coach
- 자동화 Policy

## Facility
- 현재 기능
- Capacity
- 업그레이드 비용 / 유지비

FM식 책임 위임 철학을 참고하되 FCM에서는 선수 수가 적기 때문에 더 간결하게 구성한다.

---

# 19. Data Parameter 후보

- StaffTeaching
- StaffAnalysis
- StaffEvaluation
- StaffLoadManagement
- StaffMedical
- StaffWeightManagement
- StaffCapacity
- WorkloadPenaltyCurve
- CoachFighterFitWeight
- DelegationErrorCurve
- FacilityTrainingModifier
- FacilityCapacity
- FacilityRecoveryModifier
- AnalysisThroughput
- DirectManagementCapacity
- PlayerCoachingGrowth
- PlayerAnalysisGrowth
- PlayerScoutingGrowth
- PlayerNegotiationGrowth
- PlayerManagementGrowth
- PlayerReputationGain

---

# 20. 핵심 성장 감각

Part 1:
> 내가 직접 선수를 본다 / 가르친다 / 분석한다.

Part 2:
> 내가 가장 중요한 선수는 직접 챙기고, 좋은 Staff를 통해 여러 선수를 동시에 성장시킨다.

조직 성장은 플레이어의 역할을 없애는 것이 아니라 **플레이어가 더 중요한 결정을 하게 만드는 방향**으로 설계한다.
