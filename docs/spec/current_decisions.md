# FCM Current Decisions — Authoritative Specification Register

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 역할: 인터뷰에서 확정된 **최신 결정만 모아두는 단일 기준 문서(SSOT)**  
> 관리 원칙: `docs/interviews/`는 결정의 역사와 맥락을 보존하고, 이 문서는 변경된 결정이 생길 때 항상 최신값으로 교체한다.

---

# 1. 현재 명세 범위 / 핵심 방향

## 현재 상세 명세 및 초기 개발 목표

**현재 상세 명세 작성 범위는 1부와 2부까지다.**

- 1부: 하나의 지하 파이트클럽
- 2부: 국제 리그 / 공식 격투 무대

3부의 직접 대회 개최 / 격투 단체 운영은 장기 비전으로 유지하지만 **현재 상세 명세 및 초기 개발 범위에서는 제외**한다.
1~2부를 실제 개발하면서 시스템을 검증한 뒤 필요할 때 3부를 추가 설계한다.

## 핵심 플레이 판타지
1. 애정을 가지고 키운 선수가 전략과 성장을 거쳐 괴물급 선수로 성장하는 경험
2. 숨겨진 유망주를 발굴하는 경험
3. 부상으로 선수 커리어가 꺾인 전직 MMA 선수가 제자를 키우며 새로운 커리어를 만드는 서사

장기적으로는 단체 회장/프로모터까지 성장하는 비전이 있으나 현재 범위는 2부까지다.

## 플레이어 캐릭터
- 부상으로 커리어가 꺾인 전직 MMA 선수
- 특정 파이트클럽의 직원이 아닌 독립 코치/매니저
- 1부에서는 한 지하 파이트클럽 무대를 중심으로 선수를 발굴/육성
- 2부에서는 국제 공식 무대로 진출하여 더 큰 선수 풀과 경쟁

## 세계관 톤
- 조직범죄 중심 아님
- 성인들의 합의된 일탈성 격투 문화
- 폭력, 배팅, 비공식 경기, 음지 문화는 존재 가능
- 갱단/조폭/강제 범죄 가담은 중심 소재에서 제외

---

# 2. Ruleset / Weight Division / Ranking

Ruleset은 4개:
- MMA
- Boxing
- Kickboxing
- No Rules

2부의 공식 Ranking 기본 단위는:

**Ruleset × Weight Division**

예:
- MMA / Welterweight #7
- Boxing / Middleweight #18

동일 선수가 여러 Ruleset/Weight Division 랭킹에 동시에 존재할 수 있다.

각 선수는 다음 Familiarity를 가진다.
- MMA Familiarity
- Boxing Familiarity
- Kickboxing Familiarity
- No Rules Familiarity

Familiarity 및 패널티는 내부 수치화하며 행동 선택, Tactical Execution, 거리 감각, 규칙 적응 등에 영향을 준다.

## 1부 Underground 구조
- 플레이어가 직접 볼 수 있는 지하 파이트클럽은 **1개**다.
- 여러 지하 파이트클럽의 지역 통합 랭킹은 만들지 않는다.
- 다른 지하 파이트클럽은 1부 동안 사실상 플레이어 시야 밖에 존재할 수 있다.

## 1부 → 2부 전환
1부의 마지막 또는 2부 시작에서:

**플레이어가 키운 파이트클럽 우승자 vs 타 파이트클럽 우승자**

의 특별전을 통해 다른 파이트클럽과 더 넓은 격투 세계의 존재를 처음 강하게 드러낸다.
그 후 국제 리그 / 공식 무대로 진출한다.

다른 지하 파이트클럽의 상세 랭킹은 관리하지 않으며 2부 선수들의 출신 이력/대사 등에 등장하는 정도로 활용 가능하다.

## Ranking Number
별도의 플레이어용 `Ranking Point`는 두지 않는다.
플레이어가 이해하는 핵심 경쟁 수치는 Champion / #1 / #2 / ... / Unranked 같은 **랭킹 숫자 자체**다.

내부 순위 갱신 알고리즘은 필요한 계산값을 사용할 수 있지만 독립 게임 자원으로 노출하지 않는다.

랭킹 변화의 핵심:
- 승패
- 상대 랭킹/수준
- 최근 활동
- 경기의 경쟁적 중요도

Finish/화려한 퍼포먼스는 랭킹보다 Ticket Power/퍼포먼스 보상에 더 크게 작용한다.

---

# 3. 경기 조작 방식

- 라운드별 상세 전략 지시
- 라운드 중에는 실제 코너에서 소리치는 수준의 제한적 개입
- 직접 조작형 액션이 아닌 감독/코치 중심 시뮬레이션
- 최종적으로 3D 전투 시뮬레이션 사용 예정
- 3D 전투는 별도 프로젝트에서 개발 후 이식
- 초기 개발은 임시 전투 화면으로 진행하고 매니지먼트/엔진 로직을 우선

---

# 4. 선수 정보 / 정보 비대칭

## Base Parameter 표시
- 내부: 정밀 실수값 등 세밀한 수치
- UI: 0~100

## Known Mechanic / Unknown Value
- 시스템 존재와 주요 작동 원리는 플레이어에게 공개
- 정확한 내부값은 숨길 수 있음
- 튜토리얼, 툴팁, 도움말, 관찰, 코치 리포트로 시스템 설명

## 소속 선수도 완전 공개되지 않음
소속 선수를 직접 키워도 능력치는 일정 범위의 추정값으로 남을 수 있다.
관련 활동에서 반복적으로 능력을 증명하면 추정 범위가 좁아진다.

> 선수는 숫자를 공개해서 능력을 증명하는 것이 아니라 행동으로 자신의 능력을 증명한다.

## Evidence System
행동은 능력치 추정을 위한 Evidence를 생성한다.
예:
- 반복 카운터 성공 → Reflex / Fight IQ / Punch Technique 정보 정밀화
- 후반 라운드 안정적 경기력 → Cardio 정보 정밀화
- 반복 테이크다운 방어 성공 → Takedown Defense Technique / Reflex / Fight IQ 정보 정밀화

---

# 5. Base Parameter — 18개

Base Parameter만 직접 훈련/성장한다.

## Physical
- Strength
- Explosiveness
- Agility
- Cardio
- Durability
- Reflex

Reflex는 신체 이동속도가 아니라 인지, 판별, 예측, 반응의 속도다.
Counter, Feint Recognition, 갑작스러운 공격/태클 대응 등에 관여한다.

## Striking
- Punch Technique
- Guard Technique
- Kick Technique
- Footwork Technique

`Punch Power`, `Punch Accuracy`, `Kick Accuracy`는 Base Parameter로 두지 않는다.
정확도는 Technique에 포함하고 실제 명중은 Action Result 단계에서 Context와 함께 계산한다.
Punch/Kick Defense는 Guard Technique으로 통합한다.
Block과 Evasion은 별도 행동이지만 Guard Technique은 둘 다 긍정적 영향을 줄 수 있다.

## Grappling
- Takedown Technique
- Takedown Defense Technique
- Clinch Technique
- Ground Bottom Technique
- Ground Top Technique
- Submission Technique

Submission 공격/방어는 하나의 Submission Technique을 사용한다.
Ground Striking은 별도 Base Parameter를 두지 않는다.

## Combat Intelligence
- Fight IQ
- Tactical Execution

Fight IQ는 상황 판단, 패턴 학습, 예측, Setup/Feint/Counter 활용, 위험 판단, 행동 선택 품질 등에 폭넓게 관여한다.
Tactical Execution은 플레이어/코치가 준 전략과 Sequence를 얼마나 충실히 수행하는지를 나타내며 Fight IQ와 독립적으로 관리한다.

---

# 6. 전투 계산 계층

**Base Parameter → Derived Capability → Effective Performance → Action Result**

## Derived Capability
- Base Parameter와 신체조건 조합으로 계산
- 독립 성장값 아님
- Base 변화 시 재계산
- 존재는 공개하되 정확한 내부값은 숨길 수 있음

## Effective Performance
Context를 반영한 순간 성능:
- Cardio / Stamina
- Injury / 부위 손상
- Current Weight / 증량 / 감량
- 거리
- Setup
- Ruleset Familiarity
- Skill Card
- 현재 상태

## Action Result
특정 기술의 실제 시도, 명중/실패, Impact, Position 변화, Damage, 후속 상태를 계산한다.

---

# 7. 주요 Derived Capability

## Striking
- Punch Impact
- Punch Execution Speed
- Kick Impact
- Kick Execution Speed
- Range Control
- Guard Efficiency
- Evasion Capability

## Counter / Feint
- Counter Conversion
- Feint Execution
- Feint Recognition

실제 Counter/Feint 성공은 Vulnerability, Setup, Range, Read Confidence, Opponent Expectation 등 Context와 함께 계산한다.

## Grappling
- Takedown Capability
- Takedown Defense
- Clinch Control
- Top Control
- Bottom Escape
- Submission Threat
- Submission Defense

Takedown Entry와 Finish는 하나의 Takedown Capability로 통합한다.

## Grapple Advantage
고정 스탯이 아니라 순간 Context 값이다.
좋은 그래플러는 Advantage를 자동 지급받는 게 아니라 만들어진 Advantage를 더 잘 활용한다.

---

# 8. Range / Optimal Range

Range Control은 자신에게 유리한 거리를 만들고 유지하는 능력이다.
각 Action에는 Optimal Range와 Range Tolerance를 둘 수 있다.
Optimal Range에서 Punch/Kick Impact를 최대한 발휘하며 너무 멀거나 가까우면 효율이 감소한다.
Reach는 무조건적인 플러스가 아니라 Range 전략과 함께 작동한다.

---

# 9. Setup / Combat Memory

Setup은 고정 스탯이 아니라 전투 History/Context 시스템이다.

## Pattern
단일 기술 빈도보다 Combo/Sequence에 집중한다.
예:
- Jab → Jab → Cross
- Jab → 우측 이동
- Body Straight → Low Kick
- Punch Combo → Takedown

## Combat Memory
- 현재 경기 전체 패턴을 기억
- 오래된 Pattern 영향은 감소 가능
- 상대 과거 경기 습관도 비디오 분석으로 사전 활용 가능

## Setup 흐름
반복 행동 → Pattern Exposure → Opponent Expectation / Read Confidence → Pattern Break / Feint / Counter / Takedown Setup

Setup은 선수 자율 수행과 플레이어 직접 지시 모두 가능하다.
Setup 성공/실패 판정이 존재한다.
Fight IQ는 패턴 학습/노출 인지/Setup 타이밍/Pattern Break에 관여한다.
Tactical Execution은 지시된 Setup Sequence와 전략 유지에 관여한다.

별도 Momentum / Flow State 게이지는 넣지 않는다.

---

# 10. 상대 비디오 분석 / 코칭 / 경기 후 분석

## 상대 비디오 분석
주간 활동으로 상대 습관과 Combo/Sequence를 조사한다.
정보에는 Confidence, Freshness, Evidence Amount를 둔다.
정보는 오래됐거나 잘못 해석됐거나 상대가 의도적으로 만든 가짜 Pattern일 수 있다.
잘못된 정보를 전략으로 전달하면 실제 경기에서 고전할 수 있다.

## 코너 개입
플레이어/코치진이 라운드 사이 Pattern 정보를 전달해 선수의 Pattern Awareness를 높일 수 있다.

## 경기 후 리포트
2종류:
1. 심판 점수 리포트
2. 코치진 인과관계 분석 리포트

분석 리포트 품질은 플레이어/코치진 분석 능력, 데이터량, 비디오 분석 활동에 영향받는다.

---

# 11. Universal Judging Engine

Ruleset마다 별도 채점 공식을 만들지 않는다.
공통 Judging Core를 사용하고 해당 규칙에서 발생 불가능한 항목만 비활성화한다.

평가 후보:
- Effective Striking
- Damage Quality
- Knockdown / Finish Threat
- Effective Grappling
- Submission Threat
- Ground Control
- Clinch Control
- Fight Control

예:
- Boxing: Punch 활성 / Kick, Grappling 비활성
- Kickboxing: Punch, Kick 활성 / Grappling 비활성
- MMA: Punch, Kick, Grappling, Submission 활성
- No Rules: 가장 넓은 Action 집합

---

# 12. Cardio / Stamina

Base Parameter는 Cardio 하나다.
내부적으로 Energy Capacity, Energy Efficiency, Short Recovery, Between-Round Recovery 등을 파생 가능하다.

## Stamina Curve — 0~100
- 80 이상: 최상 상태, 페널티 거의 없음
- 80 미만: 성능 저하 Curve 시작
- 50 미만: 눈에 띄는 경기력 저하
- 30 미만: 거의 좀비 상태

연속 Curve이며 낮아질수록 감소 기울기가 급격해진다.
정확한 함수는 Parameter화한다.

---

# 13. Damage / Durability / Finish

전신 HP는 없다.
Base Parameter는 Durability 하나지만 실제 상태는 부위별 관리한다.

예시 부위:
- Head
- Body
- Left Arm / Right Arm
- Left Leg / Right Leg

부위별 상태에는 훈련, 노화, 과거 KO, Injury, Permanent Damage, Skill Card 등이 별도 적용된다.

Finish는 HP 0이 아니라 부위 손상 + 순간 Impact + Cardio + Effective Durability + Vulnerability 등의 누적 결과다.

상태 예:
정상 → Stagger → Groggy → Knockdown → KO / TKO

---

# 14. Randomness 철학

**Randomness creates variation, not causation.**

난수는 작은 실행 편차를 만들 수 있지만 사건의 근본 원인이 되어서는 안 된다.
강한 선수가 패배해도 전략, 상성, 거리, Cardio, Injury, Damage, Setup, Counter, 체중, Ruleset Familiarity 등의 인과관계가 설명되어야 한다.

사실상 매우 높은 승산은 존재할 수 있으나 시스템적으로 절대 패배 불가능을 강제하지 않는다.
완전한 0% 승산도 지양한다.

---

# 15. Action Data

각 Action/Technique은 Base Parameter와 별도의 Data를 가진다.

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

특정 Action의 밸런스는 선수 Base Parameter를 건드리지 않고 Action Data로 조절 가능해야 한다.

---

# 16. Technique System

Technique은 Skill Card와 분리한다.

## 숙련도
- 각 Technique은 내부 정밀 숙련도 수치를 가짐
- UI는 별 1~5개
- 실제 계산은 내부값 사용

새 Technique은 항상 최저 숙련도에서 시작하지 않는다.
관련 Base Technique, Growth Aptitude, 유사 기술 경험에 따라 초기 숙련도 보너스를 받을 수 있다.
예: Punch Technique이 높은 선수가 새로운 Punch 계열 기술을 배우면 별 3 수준에서 시작 가능.

## 3단 구조
### Fundamental Action
기본 사용 가능. 예: Jab, Cross, Hook, 기본 Low Kick, 기본 Clinch, 기본 Takedown

### Learnable Technique
별도 훈련으로 습득. 예: Spinning Backfist, Question Mark Kick, Flying Knee, 특정 Throw/Submission

### Signature Technique
장기간 높은 수준으로 사용하고 특정 실전/업적 조건을 만족하면 대표 기술로 발전 가능.

## 학습 적성
관련 Base Technique, Physical Parameter, Growth Aptitude, 예외 Modifier, 기존 유사 Technique, 코치/훈련 품질 영향을 받는다.
특정 기술군에 Hidden Affinity를 둘 수 있고 Evidence로 힌트를 파악한다.

---

# 17. Technique / Combo 경험치

Technique은 훈련, Sparring, 실전 사용으로 성장한다.
실전 경험은 훈련보다 훨씬 큰 성장 자극을 준다.
현재 초기 가정은 `Match Technique EXP ≈ Training 대비 10배`이며 Data Parameter로 관리한다.

특정 Technique으로 Finish하면 매우 큰 추가 경험 보상을 준다.
Finish Bonus도 Parameter화한다.

## Combo / Sequence Proficiency
사전 정의 주요 Combo/Sequence는 독립 숙련도를 가질 수 있다.
모든 가능한 조합을 저장하지 않는다.
Combo 숙련은 실행 안정성, Tactical Execution, Setup, 연결 속도, Energy 효율 등에 관여 가능하다.

---

# 18. Skill Card

Skill Card는 기술 자체가 아니라 플레이 스타일 / 조건부 특성 / 행동 연결 특성이다.
예: Liver Hunter, Chain Wrestler, 무쇠 팔 계열.

- 커리어 동안 여러 장 보유 가능
- 한 경기에서 동시에 활성화 가능한 카드: 기본 최대 5장
- 경기 규칙, 상대, 전략에 따라 활성 세트 변경
- 활성 한도 Parameter화

Skill Card는 성장 가능하다.
성장은 카드 고유 정체성을 유지한 채 특별한 효과를 증폭한다.
공통 `Damage +N%` 카드 양산은 지양한다.

카드 획득은 선수의 실제 역사와 연결한다.
특정 Target 공격, 스타일 반복, Technique 숙련, 특정 승리/Finish, 업적 등이 조건이 될 수 있다.

---

# 19. Ring Name

Ring Name은 Skill Card보다 희귀한 커리어 업적/칭호다.

계층:
1. Technique
2. Skill Card
3. Ring Name

Ring Name은 Combat Effect, Reputation, Ticket Power, Market Value, Matchmaking, 상대 반응 등에 영향을 줄 수 있다.
같은 Ring Name을 사용하는 선수를 동시에 배치할 수 없다.
일부 라이벌은 Unique Ring Name을 가진다.
Unique Ring Name 자체는 탈취하지 않지만 해당 NPC를 특정 조건으로 격파하면 대응 업적 Ring Name을 해금 가능하다. 예: The King 격파 → Kingslayer 계열.

---

# 20. 신체 / 체중 관리

신체 데이터는 Base Parameter와 별도 관리한다.
후보: Height, Reach, Natural Weight, Current Weight, Age, Stance.

증량/감량은 실제 경기력에 영향을 준다.
개인차를 위해 Weight Cut Resistance, Weight Gain Adaptability 같은 숨겨진 체질 Parameter를 허용한다.
완전히 숨기지 않고 대화, 관찰, 과거 경험으로 힌트를 제공한다.

---

# 21. Potential / Growth Aptitude / Breakthrough

구조:
- Overall Talent
- 큰 영역별 Growth Aptitude
- 일부 예외 Modifier

영역 후보:
- Physical Aptitude
- Striking Aptitude
- Grappling Aptitude
- Combat Intelligence Aptitude

Base Parameter마다 별도 Potential 숫자를 기본으로 두지 않는다.
Potential 정확한 상한은 공개하지 않는다.

Potential은 Hard Cap이 아니다.
한계 부근에서 성장 효율 Curve가 급격히 나빠져 사실상 정지처럼 느껴지지만 완전히 멈추지는 않는다.
장기간 이 Curve를 극복하면서 중요한 경기/훈련 사건을 겪으면 Breakthrough 가능.

Breakthrough는 내부 수치화한다.
후보: Progress, Threshold, Potential Proximity, Strong Opponent Experience, Match Importance, Adversity, Technique Mastery, Style Commitment, Coach/Age Modifier.
정확한 Progress는 UI에 숨기고 힌트만 제공한다.

극한 경기/패배 극복 과정에서 *Darkest Dungeon*의 영웅의 기상과 비슷한 특별 긍정 성장 사건이 발생할 수 있다.

---

# 22. 노화

- 신체 능력은 나이에 따라 저하
- 완전 극복은 어렵고 나이가 들수록 대응 난이도 증가
- Fight IQ, Technique, 경험은 유지되거나 장점이 될 수 있음
- 노령 선수는 다른 전략/스타일로 경쟁력을 유지 가능

---

# 23. 주간 Training / Life Management

주 단위 Calendar 사용.
훈련 횟수를 인위적인 슬롯 수로 제한하지 않고 선수의 삶 전체가 시간 자원을 경쟁한다.

활동 후보:
- 훈련 / Sparring / Technique 학습
- Recovery
- 상대 비디오 분석
- 사생활 / Stress 관리
- Ticket Power / 팬 / 미디어 / 외부 활동
- Sponsor / 수익 활동
- Fight Camp / 경기 준비

훈련만 반복하면 Fatigue, Stress, Injury Risk, Fight Readiness 저하, 사생활/만족도 악화, Ticket Power/Market Value 성장 기회 손실이 발생할 수 있다.

## 훈련 성장
반통제형.
훈련 품질, Talent, Growth Aptitude, 현재 능력, 나이, 코치, 시설, Sparring Partner, Fatigue, Stress, Potential과의 거리, 선수-훈련 적합도가 성장량에 영향.
질 낮거나 부적합하거나 과도한 훈련은 성장 실패, 유지, Stress, 피로, Injury, 내구 악화를 만들 수 있다.

---

# 24. 실제 경기와 성장

실제 경기는 훈련 캠프보다 더 큰 성장폭을 제공할 수 있다.
특히 Fight IQ, Tactical Execution, Rule Familiarity, 실전 대응, Technique/Combo Proficiency의 성장 자극이 크다.
강한 상대 및 중요한 경기는 높은 성장 보상과 높은 위험을 함께 제공한다.

Underdog Upset, 극한 불리함 극복, 첫 패배 이후 재기 같은 사건은 Breakthrough/특별 성장 이벤트의 강한 재료가 된다.

---

# 25. 육성 밸런스 원칙

> **육각형 선수는 있어도 만능 선수는 없다.**

선수 강함은 Base Parameter 총합이 아니다.
신체조건, Technique, Combo, Skill Card, Ring Name, Rule Familiarity, 체급, 성장 적성, Opportunity Cost, 감독 전략, Setup, 상성, Cardio, Damage가 상호작용한다.
Overall은 UI 편의용 평가값일 수 있으나 실제 전투 계산에는 사용하지 않는다.

---

# 26. World Fighter DB / Known Fighter DB

전체 세계 Fighter DB와 플레이어가 알고 있는 Known Fighter DB를 분리한다.
플레이어는 처음부터 전체 선수 목록을 검색할 수 없다.
미발견 선수도 세계 안에서 성장, 경기, Injury, 체급 변경, 계약 변화를 경험한다.

Known Fighter 발견 경로:
- 직접 경기 관람 / 상대 선수로 조우
- 체육관 / 아마추어 대회
- 코치/선수/지인 소개
- SNS / 영상 / 소문
- Scout 보고
- 높은 Ticket Power로 인한 자연 발견

---

# 27. Scouting 활동 / Knowledge

선수 발견은 단일 Scout 버튼이 아니라 여러 활동과 정보 경로를 통해 발생한다.
1부 초반에는 플레이어가 직접 주간 시간을 쓰고, 진행하면서 Scout/Scouting Focus에 위임한다.

단일 `Scouting %`는 사용하지 않고 분야별 Knowledge를 둔다.
후보:
- Physical / Striking / Grappling / Combat Intelligence
- Technique
- Rule Familiarity
- Weight Adaptation
- Potential
- Market / Reputation

정보 내부값:
- Confidence
- Freshness
- Evidence Amount

---

# 28. Raw Evidence / Interpretation

> **Raw Evidence는 사실이며 Interpretation은 틀릴 수 있다.**

실제 행동은 사실로 저장한다.
그 행동으로부터 능력을 추정하는 해석은 Scout/Coach/플레이어의 능력, 표본 부족, 오래된 정보, 상대 수준 오판, SNS Highlight 편향, 최근 스타일 변화 등으로 틀릴 수 있다.

---

# 29. Trial / Watchlist / Scout

## Trial Camp / Sparring
영입 전 직접 테스트 가능.
Base Parameter Evidence, Technique/Combo, Cardio, Tactical Execution, Weight 상태, Training Adaptation, Hidden Affinity 힌트를 얻는다.
시간, 시설, 비용, 선수 동의, Injury Risk 소비.

## Scouting Report
`★★★★★ 영입 추천` 같은 단일 최종 추천 점수는 사용하지 않는다.
Current Combat Level, Growth Potential, Strategy Fit, Ruleset Fit, Marketability/Ticket Power 잠재, Confidence, Acquisition Difficulty 등 복수 축 평가.

## Trade-off
정보를 더 모으는 동안 다른 매니저가 먼저 접근 가능.
불확실한 조기 영입 vs 충분히 검증한 늦은 영입.

## Watchlist
경기, Technique, 체급, 연승/연패, Injury, Ticket Power, 계약, 경쟁 관심, 스타일 변화를 추적한다.
관찰이 없으면 Freshness 감소.

## Scout 직원
Discovery, Evaluation, Potential Evaluation, Region Knowledge, 분야별 평가, Network/Access Parameter.

## 1~2부 진행에 따른 진화
- 1부 초반: 플레이어 직접 지역 탐색
- 1부 후반: 지역 네트워크 / 간단한 위임
- 2부: 전문 Scout / 국제 Scouting Focus

3부의 글로벌 단체 스카우팅은 현재 명세 범위 밖.

---

# 30. Fighter Management Agreement / Dual Contract

플레이어는 선수를 소유하는 구단주가 아니라 **매니저 겸 코치**다.

계약 구조:
1. **Player ↔ Fighter**: Management / Coaching Agreement
2. **Fighter ↔ Fight Club / Promotion**: 출전 / Fight Contract

1부는 경기 단위 Fight Offer 중심.
2부에서는 Promotion과 다경기 계약 가능.
선수 Transfer Fee / 소유권 매매는 기본 시스템에 포함하지 않는다.

---

# 31. 선수단 규모 / 직접 관리 / 위임

현재 상세 범위의 목표값:
- 1부: `Organization Roster Capacity ≤ 3`
- 2부: `≤ 10`

모두 Data Parameter로 관리한다.

## Direct Management Capacity
플레이어가 높은 세밀도로 직접 관리하는 핵심 선수는 기본 **5명 이하** 수준을 목표로 한다.
훈련, Technique, Skill Card, 비디오 분석, 체중, Stress, 일정, 전략 등을 깊게 관리 가능.

## Delegated Management
선수단이 커지면 코치진/직원/관리 도구로 자동 훈련, 컨디션/Stress 경고, 경기 추천, 분석, 일정/계약 보조를 위임한다.

> 선수단 확대는 클릭 수 증가가 아니라 조직의 관리 능력 증가여야 한다.

장기 비전의 3부 100명 규모 아이디어는 현재 상세 명세에서 제외하며 추후 재검토한다.

---

# 32. 영입 관심도 / Career Need

정식 협상 전 `Join Interest`를 대화/힌트로 파악 가능.
정확한 값은 내부 수치화한다.

영향 후보:
- Player Reputation
- 선수 Ticket Power / Rank
- 코치진 / 시설
- 기존 선수 성공
- 계약 조건
- 다른 매니저 관심
- Career Need

돈만 많이 주면 모든 선수가 오는 구조는 피한다.
고정 Personality 대신 현재 커리어 상황에서 생기는 Career Need를 사용한다.

예:
- 유망주: 성장 환경
- 전성기: 타이틀/강한 상대
- 노장: 높은 Purse / 효율적인 일정
- 연패 선수: 재기 기회
- 스타: 큰 무대 / Ticket Power / 높은 수익

---

# 33. Management 계약 조건 / Promise

협상 항목 후보:
- Management Fee / Share
- Contract Duration
- Fight Commitment
- Training Support
- Termination Clause
- Champion / Win Bonus
- Sponsor Revenue Share

진행에 따라 계약 복잡도 증가 가능.

## Promise
돈 이외 협상 카드.
예:
- 일정 기간 내 경기 제공
- 타이틀 도전 기회
- 특정 Ruleset 중심 육성
- 특정 체급 유지
- 좋은 코치 영입 / 환경 개선

Promise에는 상태, 기한, 중요도, 이행 여부 기록.
이행은 Trust 상승, 반복 불이행은 관계/재계약 악화.

---

# 34. Relationship / Stress

별도 Fighter Personality 시스템은 만들지 않는다.
플레이어-선수 관계 상태는 내부 Parameter로 관리한다.

후보:
- Trust
- Respect
- Satisfaction

## Stress
주간 관리 핵심 상태값.
원인 후보:
- 과도한 훈련
- 연패 / 큰 경기 압박
- Injury
- 계약 불만 / Promise 불이행
- 잦은 감량
- 사생활 부족
- 미디어/팬 활동
- 무패 기록 유지 압박 / 첫 패배

플레이어는 휴식, 일정, 활동 선택, 경기 배치, 커뮤니케이션으로 Stress 관리.

## Stress Resistance
선수마다 Stress 저항력/적응력이 다르다.
Personality가 아니라 내부 특성 Parameter.
정확한 값은 숨기되 사건 반응/관찰로 힌트 제공.

---

# 35. 재협상 / 경쟁 매니저 / Loyalty

선수 Rank, Ticket Power, 최근 성적, Finish 기록, Title, Marketability, 다른 매니저/Promotion 관심에 따라 `Expected Value` 변화.
성장한 선수는 재협상을 요구할 수 있다.

계약 만료/불만족 상태에서 다른 매니저가 접근 가능.
계약 중 강제 빼앗김은 제한하되 경쟁 Offer/재계약 압박은 존재.

고정 `Loyalty` Personality Parameter는 두지 않는다.
장기 잔류는 오랜 동행, Promise 이행, 커리어 성공, Trust/Satisfaction, 좋은 대우의 결과.

---

# 36. 협상 실패의 비용

계속 최저 조건을 찔러보는 플레이를 막는다.
지나치게 낮은 Offer/무리한 협상은:
- Trust 하락
- 협상 태도 악화
- 요구 조건 상승
- 일정 기간 재협상 제한
- 다른 매니저 탐색

협상 행동은 Relationship History에 남을 수 있다.

---

# 37. Fight Offer / Matchmaking

Fight Offer는 단순 파이트머니 선택이 아니다.

데이터 후보:
- Base Purse
- Win Bonus
- Finish Bonus
- Opponent / Opponent Strength
- Ruleset / Weight
- Ranking Effect
- Event Value
- Short Notice
- Title / Contender Implication
- Injury Risk
- Expected Audience
- Rivalry
- Opponent Ticket Power

경기 선택은 돈, Ranking, 성장, Injury Risk, Ticket Power를 동시에 비교하는 의사결정이다.

## Fight Acceptance
상대/Promotion은 경기 수락 여부를 판단한다.
영향 후보:
- Competitive Value / Rank
- Ticket Power
- Purse
- Risk
- Career Need
- Rivalry
- Injury / Recovery / Fight Camp 상태
- Title/Contender 가치

낮은 랭커의 도전은 거절될 수 있지만 높은 Ticket Power/흥행가치가 수락 이유가 될 수 있다.

## 양방향 Offer
- Inbound: Fight Club/Promotion/상대 측 제안
- Outbound: 플레이어의 Challenge/협상

---

# 38. 약한 상대 / Performance / Upset

약한 상대를 붙이는 육성 전략은 허용한다.
상대가 크게 약하면 일반적으로 Ranking/Combat EXP/평범한 흥행 보상 효율이 떨어진다.

하지만 약한 상대라도 다음은 가치가 있다.
- 상대 Ticket Power/악명
- Rivalry
- 화려한 압도적 승리
- 특별 Technique Finish
- 명경기

`Performance of the Night`와 유사한 퍼포먼스 보너스/이벤트를 둘 수 있다.

## Upset
언더독의 강자 격파는 매우 큰 사건.
보상 후보:
- Ranking 대폭 상승
- Ticket Power 대폭 상승
- Technique/Combat EXP
- Fight IQ 성장
- Skill Card / Ring Name 조건
- Breakthrough Progress
- 특별 성장 이벤트

실제로 극복한 불리함과 Context를 평가한다.

---

# 39. Title / Champion / Contender

## Champion 분리
Champion은 #1과 별도 상태다.
예:
- Champion
- #1 Contender
- #2
- #3

## Title Shot
#1 자동 타이틀전이 아니다.
먼저 Competitive Eligibility를 충족해야 한다.

후보:
- 일정 수준 Ranking
- 최근 활동
- 충분한 Competitive Resume

Eligibility 후보 중 실제 우선도는:
- Rank
- 최근 경기력
- Ticket Power
- Rivalry
- Champion과의 Story
- Event Value
- Activity

원칙:
- Ticket Power만 높은 약자의 무제한 타이틀 직행 제한
- 비슷한 경쟁력을 가진 후보 사이에서는 흥행/라이벌이 순서를 바꿀 수 있음

---

# 40. 체급 이동 / 월장

일반 Ranker/Unranked가 새 체급으로 이동하면 기본적으로 밑바닥부터 시작한다.

기존 체급 Champion 또는 최상위 Top Rank에게는 **Prestige Advantage**를 준다.
- 첫 경기부터 강한 랭커 / 유명 상대 / Contender
- 경우에 따라 Title Shot 수준의 큰 기회

그 고난도 첫 경기를 이기면 해당 상대 수준에 걸맞은 높은 Ranking에서 새 체급 커리어를 시작한다.

즉 과거 Ranking 숫자를 자동 이전하지 않고 **좋은 첫 기회를 얻을 자격**으로 전환한다.

---

# 41. Activity / Inactivity

내부 상태 후보:
- LastFightDate
- Activity
- InactiveDuration

장기간 경기 없음:
- Inactive 표시
- Ranking 하락
- 장기간이면 Ranking 제외 가능

Injury 휴식과 의도적 회피는 필요 시 다른 Modifier를 적용 가능.

---

# 42. Rivalry

Rivalry는 버튼 한 번으로 생성하지 않고 경기/커리어 History에서 발생한다.
`Rivalry Progress`는 내부 수치화 가능.

증가 후보:
- 접전
- 판정 논란
- 재대결
- 첫 패배
- Title 탈취/방어
- 큰 KO/Finish
- 반복 Match
- 인터뷰/도발
- 중요한 커리어 충돌

효과 후보:
- Ticket Power ↑
- Fight Purse ↑
- 관중 관심 ↑
- 재대결 수요 ↑
- Stress ↑ 가능
- Ring Name 조건
- 특별 이벤트

플레이어가 외부 활동으로 이미 형성된 Rivalry를 홍보/강화할 수 있다.

---

# 43. Short Notice Fight

갑작스러운 대체 출전/Short Notice Fight 허용.

장점:
- Purse Bonus
- Ticket Power 상승 기회
- Ranking 기회
- 강자와 빠르게 만날 기회
- Promotion 관계 개선 가능

단점:
- Fight Camp 부족
- Weight Cut 위험
- Strategy 준비 부족
- Video Analysis 부족
- Injury Risk
- Stress 증가

큰 기회와 실제 준비 리스크 사이의 커리어 선택으로 만든다.

---

# 44. Ticket Power

기존 `Fame` 중심 표현은 **Ticket Power**로 통일한다.

Ticket Power는 실제 Strength/Ranking/Record와 별개의 공개 흥행 가치다.

예:
- 강하지만 Ticket Power 낮은 Top Rank
- 실력은 조금 낮지만 엄청난 스타
- 악명/라이벌/화려한 스타일로 티켓을 파는 선수

UI는 0~100 같은 정확한 공개 수치를 사용할 수 있다.
등급 후보:
- Local Draw
- Regional Draw
- National Star
- International Star
- Global Icon

영향 후보:
- Fight Offer / Acceptance
- Fight Purse
- Sponsor
- Competitive Eligibility 이후 Title Shot 우선도
- Event Value
- 계약 요구 / Expected Value
- 선수 Market Value

높은 Ticket Power 경기 조건 후보:
- 유명한 상대
- 악명 높은 상대
- Rivalry
- Champion전
- 큰 이벤트
- 화제성 높은 Matchup
- 재대결
- 화려한 Finish/Performance

---

# 45. Record / Undefeated / Adversity

다음은 완전히 분리한다.

**Actual Strength ≠ Ranking ≠ Ticket Power ≠ Fight Record**

무패 기록은 매우 어렵고 별도 프리미엄을 가진다.

Undefeated 효과 후보:
- Ticket Power 상승
- Fight Interest 상승
- Purse/협상 가치 상승
- 상대가 꺾을 경우 Upset/Legacy 가치 증가
- 선수 자신의 압박/Stress 증가 가능

첫 패배 시:
- Undefeated Premium 상실
- Stress 급증 가능
- Career Crisis / Adversity 상태 가능

하지만 패배 자체가 커리어 파괴는 아니다.
패배를 극복해 다시 성장하면 *Darkest Dungeon*의 영웅의 기상과 유사한 **Adversity → Positive Transformation / Legend Event**의 주요 조건이 될 수 있다.

---

# 46. Management Business — 1~2부

선수를 사고파는 Transfer Market은 기본적으로 없다.

핵심 루프:
**발견 → 평가 → 설득 → 계약 → 신뢰 형성 → 육성/생활 관리 → 경기 선택 → Ranking/Ticket Power/Record/성장 변화**

플레이어는 선수의 Fight Purse, Sponsor, 기타 활동 수익에서 Management Agreement에 따른 몫을 얻고 코치진/Scout/관리 조직을 확장한다.

---

# 47. Data-Driven / 확장성 원칙

모든 핵심 시스템은 가능한 한 Data/Parameter 중심으로 구현한다.

원칙:
- 하드코딩 최소화
- 가중치 / Curve / Threshold 조절 가능
- Ruleset / Action별 설정 가능
- Technique / Combo / Skill Card / Ring Name 추가 가능
- 성장/밸런스 튜닝 가능
- Roster / Direct Management Capacity 조절 가능
- Relationship / Stress / Ticket Power / Contract 조절 가능
- Ranking / Title / Rivalry / Short Notice 조절 가능

주요 Data 후보:
- SkillCard Unlock/Trigger/Modifier/AIWeight/Setup/Growth/MaxLevel
- RingName Unlock/Combat/TicketPower/Market/Matchmaking/Opponent Modifier
- Technique Proficiency/StarThreshold/InitialFormula/Growth/MatchExp/FinishBonus
- Scouting KnowledgeGain/FreshnessDecay/InterpretationError/Competition
- Contract JoinInterest/CareerNeed/Promise/ExpectedValue
- RosterCapacity/DirectManagementCapacity/DelegationEfficiency
- StressGain/StressRecovery/StressResistance
- TicketPowerGain/OpponentTicketPower/RivalryModifier
- RankUpdateWeights / RankActivityDecay
- UpsetRewardCurve
- PerformanceBonusThreshold / PerformanceTicketPowerBonus
- FightAcceptanceWeights
- TitleEligibilityThreshold / TitleShotPriorityWeights
- CrossDivisionPrestigeThreshold / OpportunityTier
- RivalryGain / RivalryDecay
- ShortNoticePurse / Stress Modifier
- UndefeatedPremiumCurve / FirstLossStressModifier
- AdversityEventThreshold

모든 주요 값은 코드 상수보다 Data Parameter로 관리한다.

---

# 변경 이력 / Superseded Decisions

## 인터뷰 05 → 06: Judging
이전의 "규칙별 평가 기준이 다를 수 있다"는 표현을 폐기.
최신 결정은 Universal Judging Engine + Ruleset에서 발생 불가능한 항목만 비활성화.

## 인터뷰 04 → 06: Counter / Feint
초기 Counter Ability는 Counter Conversion + Context 기반 Counter Success로 구체화.
Feint Ability는 Feint Execution / Feint Recognition으로 구체화.

## 인터뷰 02 초기 능력치 예시
`Punch Power`, `Speed`, `Endurance`, `Recovery` 예시는 현재 18개 Base Parameter로 대체.

## 인터뷰 01 → 08: Skill Card
초기: 선수 한 명당 최대 5개 보유.
최신: 여러 장 보유 가능, 한 경기에서 동시에 활성화 가능한 카드만 기본 최대 5장.

## 인터뷰 01 → 08: Technique / Skill Card 분리
최신:
- Technique: 실제 개별 기술 + 숙련도
- Combo/Sequence Proficiency
- Skill Card: 스타일/조건부 특성
- Ring Name: 희귀 커리어 업적

## 인터뷰 09: Overall / Recruitment Recommendation
Overall은 UI 편의값으로 존재 가능하나 영입 추천을 단일 별점으로 압축하지 않는다.
영입은 복수 축 평가.

## 인터뷰 10 → 11: 현재 명세 범위
이전 장기 구조에는 3부 직접 단체 운영까지 포함했으나 **현재 상세 명세/초기 개발 목표는 1~2부까지만**으로 변경.
3부는 장기 비전으로만 보존하고 개발 후 재설계한다.

## 인터뷰 10 → 11: Roster Capacity
1부 3명 / 2부 10명은 현재 목표값으로 유지.
3부 100명 아이디어는 현재 상세 명세에서 제외하고 추후 재검토.

## 인터뷰 11: Underground World Visibility
여러 지하 파이트클럽을 플레이어가 탐색/랭킹 비교하는 구조를 사용하지 않는다.
1부에서 직접 보이는 파이트클럽은 1개이며, 타 파이트클럽은 1부 우승자 간 특별전을 통해 처음 강하게 드러난다.

## 인터뷰 11: Ranking Point
독립적인 플레이어용 Ranking Point는 사용하지 않는다.
랭킹 숫자 자체에 경쟁적 위치를 담는다.

## 인터뷰 11: Fame → Ticket Power
기존 문서의 선수 흥행/인지도 `Fame` 개념은 최신 명칭 **Ticket Power**로 통일한다.

---

# 문서 관리 규칙

1. `docs/interviews/`는 인터뷰 당시 결정과 맥락을 보존한다.
2. 결정이 바뀌면 이 `current_decisions.md`를 즉시 최신값으로 수정한다.
3. 이전 결정과 충돌하면 `Superseded Decisions`에 변경 출처를 기록한다.
4. 실제 구현/밸런싱 시 인터뷰 파일보다 이 문서를 우선한다.
5. 벤치마킹 조사 내용은 `docs/benchmark/`의 게임별 파일에 누적한다.
6. 새 인터뷰 완료 시 인터뷰 문서와 SSOT를 함께 갱신한다.
7. 주요 배율/Curve/Threshold/보상/관리 한도는 코드 상수가 아니라 Data Parameter로 관리한다.
8. 반영 후 GitHub 디렉터리/SSOT를 다시 조회해 실제 저장 여부를 검증한다.
9. 현재 명세 범위는 1~2부이며 3부 아이디어는 별도 Future Scope로 취급한다.
