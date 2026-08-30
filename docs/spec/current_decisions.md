# FCM Current Decisions — Authoritative Specification Register

> 프로젝트 가제: **Fight Club Manager (FCM)**  
> 역할: 인터뷰에서 확정된 **최신 결정만 모아두는 단일 기준 문서(SSOT)**  
> 관리 원칙: `docs/interviews/`는 결정의 역사와 맥락을 보존하고, 이 문서는 변경된 결정이 생길 때 항상 최신값으로 교체한다.

---

# 1. 프로젝트 핵심 방향

## 핵심 플레이 판타지
1. 애정을 가지고 키운 선수가 전략과 성장을 거쳐 괴물급 선수로 성장하는 경험
2. 숨겨진 유망주를 발굴하는 경험
3. 실패한 전직 MMA 선수가 제자를 키워 궁극적으로 격투 단체의 회장/프로모터가 되는 성장 서사

## 진행 구조
- 1부: 지하 파이트클럽
- 2부: 국제 리그 / 공식 무대
- 3부: 직접 대회 및 격투 단체 운영

## 플레이어 캐릭터
- 부상으로 커리어가 꺾인 전직 MMA 선수
- 특정 파이트클럽 소속이 아닌 독립 코치/매니저
- 직접 선수를 발굴하고 여러 파이트클럽/대회에 출전시킴
- 장기적으로 코치 → 국제 무대 지도자 → 프로모터/단체 회장으로 성장

## 세계관 톤
- 조직범죄 중심 아님
- 성인들의 합의된 일탈성 격투 문화
- 폭력, 배팅, 비공식 경기, 음지 문화는 존재 가능
- 갱단/조폭/강제 범죄 가담은 중심 소재에서 제외

---

# 2. 경기 규칙 / 랭킹

Ruleset은 4개:
- MMA
- Boxing
- Kickboxing
- No Rules

각 Ruleset은 독립 랭킹을 가진다.
선수는 자유롭게 다른 Ruleset에 출전/전향할 수 있다.

각 선수는 다음 Familiarity를 가진다.
- MMA Familiarity
- Boxing Familiarity
- Kickboxing Familiarity
- No Rules Familiarity

Familiarity 및 패널티는 내부 수치화하며 행동 선택, Tactical Execution, 거리 감각, 규칙 적응 등에 영향을 준다.

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
- 시스템의 존재와 주요 작동 원리는 플레이어에게 공개한다.
- 정확한 내부값은 숨길 수 있다.
- 튜토리얼, 툴팁, 도움말, 관찰, 코치 리포트로 시스템을 설명한다.

## 소속 선수도 완전 공개되지 않음
선수를 직접 키우고 있어도 능력치는 일정 범위의 추정값으로 유지될 수 있다.
관련 훈련/경기/활동에서 반복적으로 능력을 증명하면 추정 범위가 좁아진다.

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

### Reflex
신체 이동속도가 아니라 인지, 판별, 예측, 반응의 속도다.
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
Tactical Execution은 플레이어/코치가 준 전략과 시퀀스를 얼마나 충실하게 수행하는지 나타내며 Fight IQ와 독립적으로 관리한다.

---

# 6. 전투 계산 계층

확정 구조:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

## Derived Capability
- Base Parameter와 신체조건의 조합으로 계산
- 독립 성장값 아님
- Base가 바뀌면 재계산
- 존재는 공개하되 정확한 내부값은 숨길 수 있음

## Effective Performance
다음 Context가 반영된 순간 성능:
- Cardio / Stamina
- 부상 / 부위 손상
- 체중 / 증량 / 감량
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

실제 Counter/Feint 성공은 고정 스탯 하나가 아니라 Vulnerability, Setup, Range, Read Confidence, Opponent Expectation 등 Context와 함께 계산한다.

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
좋은 그래플러는 Advantage를 자동으로 받는 게 아니라 만들어진 Advantage를 더 잘 활용한다.

---

# 8. Range / Optimal Range

Range Control은 자신에게 유리한 거리를 만들고 유지하는 능력이다.
각 Action에는 Optimal Range와 Range Tolerance를 둘 수 있다.
Optimal Range에서 Punch/Kick Impact를 최대한 발휘하며 너무 멀거나 가까우면 효율이 감소한다.
Reach는 무조건적인 플러스가 아니라 Range 전략과 함께 작동한다.

---

# 9. Setup / Combat Memory

Setup은 고정 스탯이 아니라 전투 History/Context 시스템이다.

## Pattern 단위
단일 기술 빈도보다 Combo/Sequence에 집중한다.
예:
- Jab → Jab → Cross
- Jab → 우측 이동
- Body Straight → Low Kick
- Punch Combo → Takedown

## Combat Memory
- 선수는 현재 경기 전체 패턴을 기억한다.
- 오래된 Pattern의 영향은 감소할 수 있다.
- 상대의 과거 경기 습관도 사전 비디오 분석으로 활용 가능하다.

## Setup 흐름
반복 행동 → Pattern Exposure → Opponent Expectation / Read Confidence → Pattern Break / Feint / Counter / Takedown Setup

Setup은 선수의 자율 수행과 플레이어 직접 지시 모두 가능하다.
Setup 성공/실패 판정이 존재한다.

Fight IQ는 패턴 학습, 노출 인지, Setup 타이밍, Pattern Break 판단에 관여한다.
Tactical Execution은 지시한 Setup Sequence와 전략 유지에 관여한다.

별도의 Momentum / Flow State 게이지는 넣지 않는다.

---

# 10. 상대 비디오 분석 / 코칭 / 경기 후 분석

## 상대 비디오 분석
주간 활동으로 상대 습관과 Combo/Sequence를 조사한다.
정보에는 Confidence, Freshness, Evidence Amount를 둘 수 있다.
정보는 오래됐거나 잘못 해석됐거나 상대가 만든 가짜 Pattern일 수 있다.
잘못된 정보를 선수에게 전략으로 전달하면 실제 경기에서 고전할 수 있다.

## 코너 개입
플레이어/코치진이 라운드 사이 Pattern 정보를 선수에게 전달해 Pattern Awareness를 높일 수 있다.

## 경기 후 리포트
2종류 제공:
1. 심판 점수 리포트
2. 코치진 인과관계 분석 리포트

분석 리포트 품질은 플레이어/코치진 분석 능력, 데이터량, 비디오 분석 활동 등에 영향을 받는다.

---

# 11. Universal Judging Engine

Ruleset마다 별도 채점 공식을 만들지 않는다.
하나의 공통 Judging Core를 사용하고 해당 규칙에서 발생 불가능한 항목만 비활성화한다.

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
내부적으로 Energy Capacity, Energy Efficiency, Short Recovery, Between-Round Recovery 등을 파생할 수 있다.

## Stamina Curve
0~100 기준:
- 80 이상: 최상 상태, 페널티 거의 없음
- 80 미만: 성능 저하 Curve 시작
- 50 미만: 눈에 띄는 경기력 저하
- 30 미만: 거의 좀비 상태

연속 Curve로 설계하며 낮아질수록 감소 기울기가 급격해진다.
정확한 함수는 Parameter화한다.

---

# 13. Damage / Durability / Finish

전신 HP는 없다.
Base Parameter는 Durability 하나지만 실제 상태는 부위별로 관리한다.

예시 부위:
- Head
- Body
- Left Arm / Right Arm
- Left Leg / Right Leg

부위별 상태에는 훈련, 노화, 과거 KO, Injury, Permanent Damage, Skill Card 등이 별도로 적용된다.

Finish는 HP 0이 아니라 부위 손상 + 순간 Impact + Cardio + Effective Durability + Vulnerability 등의 누적 결과다.

상태 예:
정상 → Stagger → Groggy → Knockdown → KO / TKO

---

# 14. Randomness 철학

**Randomness creates variation, not causation.**

난수는 작은 실행 편차를 만들 수 있지만 사건의 근본 원인이 되어서는 안 된다.
강한 선수가 패배하는 경우에도 전략, 상성, 거리, Cardio, Injury, Damage, Setup, Counter, 체중, Ruleset Familiarity 등의 인과관계가 경기 로그로 설명되어야 한다.

사실상 매우 높은 승산은 존재할 수 있으나 시스템적으로 절대 패배 불가능을 강제하지 않는다.
완전한 0% 승산도 지양한다.

---

# 15. Action Data

각 Action/Technique은 선수 Base Parameter와 별도의 Data를 가진다.

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

특정 Action의 밸런스는 선수 능력치를 직접 건드리지 않고 Action Data로 조절 가능해야 한다.

---

# 16. Technique System

Technique은 Skill Card와 분리한다.

## 숙련도
- 각 Technique은 내부 정밀 숙련도 수치를 가짐
- UI는 별 1~5개로 표시
- 실제 계산은 내부값 사용

새 Technique은 항상 최저 숙련도에서 시작하지 않는다.
관련 Base Technique, Growth Aptitude, 유사 기술 경험 등에 따라 초기 숙련도 보너스를 받을 수 있다.
예: Punch Technique이 높은 선수가 새로운 Punch 계열 기술을 배우면 별 3 수준에서 시작 가능.

## 구조
### Fundamental Action
기본 사용 가능. 예: Jab, Cross, Hook, 기본 Low Kick, 기본 Clinch, 기본 Takedown

### Learnable Technique
별도 훈련으로 습득. 예: Spinning Backfist, Question Mark Kick, Flying Knee, 특정 Throw/Submission

### Signature Technique
장기간 높은 수준으로 사용하고 특정 실전/업적 조건을 만족하면 대표 기술로 발전 가능.

## Technique 학습 적성
관련 Base Technique, Physical Parameter, Growth Aptitude, 예외 Modifier, 기존 유사 Technique, 코치/훈련 품질의 영향을 받는다.
특정 기술군에 Hidden Affinity를 둘 수 있으며 Evidence를 통해 힌트로 파악한다.

---

# 17. Technique / Combo 경험치

Technique는 훈련, Sparring, 실전 사용으로 성장한다.
실전 경험은 훈련보다 훨씬 큰 성장 자극을 준다.
현재 초기 가정은 `Match Technique EXP ≈ Training 대비 10배`이며 반드시 Parameter로 관리한다.

특정 Technique으로 Finish하면 해당 Technique에 매우 큰 추가 경험 보상을 준다.
Finish Bonus 역시 Parameter화한다.

## Combo / Sequence Proficiency
사전 정의된 주요 Combo/Sequence는 독립 숙련도를 가질 수 있다.
모든 가능한 조합을 저장하지 않는다.
Combo 숙련은 실행 안정성, Tactical Execution, Setup, 연결 속도, Energy 효율 등에 관여할 수 있다.

---

# 18. Skill Card

Skill Card는 기술 자체가 아니라 플레이 스타일 / 조건부 특성 / 행동 연결 특성이다.
예: Liver Hunter, Chain Wrestler, 무쇠 팔 계열.

- 선수는 커리어 동안 여러 장 보유 가능
- 한 경기에서 동시에 활성화 가능한 카드: 기본 최대 5장
- 경기 규칙, 상대, 전략에 따라 활성 세트를 변경
- 활성 한도도 Parameter화

Skill Card는 성장 가능하다.
성장은 카드 고유 정체성을 유지한 채 그 특별한 효과를 증폭한다.
공통적인 `Damage +N%` 카드 양산은 지양한다.

카드 획득은 선수의 실제 역사와 연결한다.
특정 Target 공격, 스타일 반복, Technique 숙련, 특정 승리/Finish, 업적 등이 조건이 될 수 있다.

---

# 19. Ring Name

Ring Name은 Skill Card보다 희귀한 커리어 업적/칭호다.

계층:
1. Technique — 자주 습득/성장
2. Skill Card — 스타일과 경력이 굳어지며 획득
3. Ring Name — 커리어를 대표하는 희귀 업적

Ring Name은 Combat Effect, Reputation, Fame, Market Value, Matchmaking, 상대 반응 등에 영향을 줄 수 있다.
같은 Ring Name을 사용하는 선수를 동시에 배치할 수 없다.
일부 라이벌은 Unique Ring Name을 가진다.
Unique Ring Name 자체를 탈취하지는 않지만 특정 조건으로 해당 NPC를 격파하면 대응 업적 Ring Name을 해금할 수 있다. 예: The King 격파 → Kingslayer 계열.

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

큰 영역 후보:
- Physical Aptitude
- Striking Aptitude
- Grappling Aptitude
- Combat Intelligence Aptitude

Base Parameter마다 별도 Potential 숫자를 기본으로 두지 않는다.
Potential의 정확한 상한은 플레이어에게 공개하지 않는다.

Potential은 Hard Cap이 아니다.
한계 부근에서 성장 효율 Curve가 급격히 나빠져 사실상 정지처럼 느껴지지만 완전히 멈추지는 않는다.
장기간 이 Curve를 극복하면서 중요한 경기/훈련 사건을 겪으면 Breakthrough가 가능하다.

Breakthrough는 내부적으로 수치화한다.
후보: Progress, Threshold, Potential Proximity, Strong Opponent Experience, Match Importance, Adversity, Technique Mastery, Style Commitment, Coach/Age Modifier.
정확한 Progress는 UI에 숨기고 힌트만 제공한다.

극한 경기 중 *Darkest Dungeon*의 영웅의 기상과 비슷한 특별 성장 사건이 발생할 수 있다.

---

# 22. 노화

- 신체 능력은 나이에 따라 저하
- 완전 극복은 어렵고 나이가 들수록 대응 난이도 증가
- Fight IQ, Technique, 경험은 유지되거나 장점이 될 수 있음
- 노령 선수는 젊은 시절과 다른 전략/스타일로 경쟁력을 유지 가능

---

# 23. 주간 Training / Life Management

주 단위 Calendar를 사용한다.
훈련 횟수를 인위적인 슬롯 수로 제한하지 않고 선수의 삶 전체가 시간 자원을 경쟁하게 한다.

주간 활동 후보:
- 훈련 / Sparring / Technique 학습
- Recovery
- 상대 비디오 분석
- 사생활 / 스트레스 관리
- Fame / 팬 / 미디어 / 외부 활동
- Sponsor / 수익 활동
- 경기 준비

훈련만 반복하면 Fatigue, Stress, Injury Risk, Fight Readiness 저하, 사생활/만족도 악화, Fame/Market Value 성장 기회 손실이 발생할 수 있다.

## 훈련 성장
반통제형이다.
훈련 품질, Talent, Growth Aptitude, 현재 능력, 나이, 코치, 시설, Sparring Partner, Fatigue, Stress, Potential과의 거리, 선수-훈련 적합도가 성장량에 영향을 준다.
질 낮거나 부적합하거나 과도한 훈련은 성장 실패, 유지, 스트레스, 피로, 부상, 내구 악화를 만들 수 있다.

---

# 24. 실제 경기와 성장

실제 경기는 훈련 캠프보다 더 큰 성장폭을 제공할 수 있다.
특히 Fight IQ, Tactical Execution, Rule Familiarity, 실전 대응, Technique/Combo Proficiency의 성장 자극이 크다.
강한 상대 및 중요한 경기는 높은 성장 보상과 높은 위험을 함께 제공한다.

---

# 25. 육성 밸런스 원칙

> **육각형 선수는 있어도 만능 선수는 없다.**

선수의 강함은 Base Parameter 총합이 아니다.
신체조건, Technique, Combo, Skill Card, Ring Name, Rule Familiarity, 체급, 성장 적성, Opportunity Cost, 감독 전략, Setup, 상성, Cardio, Damage가 상호작용한다.
Overall은 UI 편의용 평가값일 수 있으나 실제 전투 계산에는 사용하지 않는다.

---

# 26. World Fighter DB / Known Fighter DB

전체 세계 Fighter DB와 플레이어가 알고 있는 Known Fighter DB를 분리한다.
플레이어는 처음부터 전체 선수 목록을 검색할 수 없다.
미발견 선수도 세계 안에서 성장, 경기, 부상, 체급 변경, 계약 변화를 경험한다.

Known Fighter 발견 경로:
- 직접 경기 관람 / 상대 선수로 조우
- 체육관 / 아마추어 대회
- 코치/선수/지인 소개
- SNS / 영상 / 소문
- Scout 보고
- Fame에 의한 자연 발견

---

# 27. Scouting 활동 / Knowledge

선수 발견은 단일 Scout 버튼이 아니라 여러 활동과 정보 경로를 통해 발생한다.
초반에는 플레이어가 직접 주간 시간을 쓰고, 후반에는 Scout와 Scouting Focus에 위임한다.

단일 `Scouting %`는 사용하지 않고 분야별 Knowledge를 둔다.
후보:
- Physical / Striking / Grappling / Combat Intelligence
- Technique
- Rule Familiarity
- Weight Adaptation
- Potential
- Market / Reputation

주요 정보에는 다음 내부값을 둔다.
- Confidence
- Freshness
- Evidence Amount

---

# 28. Raw Evidence / Interpretation

> **Raw Evidence는 사실이며 Interpretation은 틀릴 수 있다.**

실제 행동은 사실로 저장한다.
그 행동으로부터 능력을 추정하는 해석은 Scout/Coach/플레이어의 능력, 표본 부족, 오래된 정보, 상대 수준 오판, SNS Highlight 편향, 최근 스타일 변화 등으로 틀릴 수 있다.
게임이 임의로 거짓 수치를 보여주는 것보다 불완전한 해석으로 정보 비대칭을 만든다.

---

# 29. Trial / Watchlist / Scout

## Trial Camp / Sparring
영입 전 직접 테스트 가능.
Base Parameter Evidence, Technique/Combo, Cardio, Tactical Execution, Weight 상태, Training Adaptation, Hidden Affinity 힌트를 얻을 수 있다.
시간, 시설, 비용, 선수 동의, Injury Risk를 소비한다.

## Scouting Report
`★★★★★ 영입 추천` 같은 단일 최종 추천 점수는 사용하지 않는다.
Current Combat Level, Growth Potential, Strategy Fit, Ruleset Fit, Marketability, Confidence, Acquisition Difficulty 등 복수 축으로 평가한다.

## Trade-off
정보를 더 모으는 동안 다른 매니저가 먼저 접근할 수 있다.
불확실한 조기 영입과 충분히 검증한 늦은 영입 사이 Trade-off를 만든다.

## Watchlist
관심 선수의 경기, Technique, 체급, 연승/연패, 부상, Fame, 계약, 경쟁 관심, 스타일 변화를 추적한다.
관찰이 없으면 Freshness가 감소한다.

## Scout 직원
Discovery, Evaluation, Potential Evaluation, Region Knowledge, 분야별 평가, Network/Access 등의 Parameter를 가진다.

## 진행에 따른 진화
- 1부 초반: 직접 지역 탐색
- 1부 후반: 지역 네트워크 / 간단한 위임
- 2부: 전문 Scout / 국제 Scouting Focus
- 3부: 소속 선수뿐 아니라 대회의 미래 스타와 시장 발굴

---

# 30. Fighter Management Agreement / Dual Contract

플레이어는 선수를 소유하는 구단주가 아니라 **매니저 겸 코치**다.

계약 구조를 두 층으로 분리한다.

1. **Player ↔ Fighter**: Management / Coaching Agreement
2. **Fighter ↔ Promotion / Fight Club**: 출전 / Fight Contract

1부는 경기 단위 Fight Offer 중심, 2부 이후에는 Promotion과 다경기 계약 가능.
3부에는 플레이어가 Promotion을 운영해 양쪽 관점을 경험할 수 있다.

선수 Transfer Fee / 소유권 매매는 기본 시스템에 포함하지 않는다.

---

# 31. 선수단 규모 / 직접 관리 / 위임

선수단 규모는 게임 진행과 조직 성장에 따라 단계적으로 확장한다.

현재 초기 목표값:
- 1부: `Organization Roster Capacity ≤ 3`
- 2부: `≤ 10`
- 3부: `≤ 100`

모두 Data Parameter로 관리하고 밸런싱 가능하게 한다.

## Direct Management Capacity
플레이어가 높은 세밀도로 직접 관리하는 핵심 선수는 기본 **5명 이하** 수준을 목표로 한다.
직접 관리 선수는 훈련, Technique, Skill Card, 비디오 분석, 체중, 스트레스, 일정, 전략 등을 깊게 설정할 수 있다.

## Delegated Management
선수단이 커지면 코치진/직원/관리 도구를 통해 자동 훈련, 컨디션/스트레스 경고, 경기 추천, 분석, 일정 및 계약 보조를 위임한다.

> 선수단 확대는 클릭 수 증가가 아니라 조직의 관리 능력 증가여야 한다.

---

# 32. 영입 관심도 / Career Need

정식 협상 전 선수의 `Join Interest`를 대화/힌트 형태로 파악할 수 있다.
정확한 값은 내부 수치화한다.

영향 후보:
- Player Reputation
- 선수 Fame / Rank
- 코치진 / 시설
- 기존 선수 성공
- 계약 조건
- 다른 매니저 관심
- Career Need

돈만 많이 주면 모든 선수가 오는 구조는 피한다.
고정 Personality 대신 **현재 커리어 상황에서 생기는 Career Need**를 사용한다.

예:
- 유망주: 좋은 성장 환경
- 전성기 선수: 타이틀/강한 상대
- 노장: 높은 Purse / 효율적인 일정
- 연패 선수: 재기 기회
- 스타: 큰 무대 / Fame / 높은 수익

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

게임 진행에 따라 계약 복잡도를 증가시킬 수 있다.

## Promise
돈 이외의 협상 카드로 Promise를 사용한다.
예:
- 일정 기간 내 경기 제공
- 타이틀 도전 기회
- 특정 Ruleset 중심 육성
- 특정 체급 유지
- 좋은 코치 영입 / 훈련 환경 개선

Promise에는 상태, 기한, 중요도, 이행 여부를 기록한다.
이행은 Trust 상승, 반복 불이행은 관계/재계약 악화로 이어진다.

---

# 34. Relationship / Stress

별도 Personality 시스템은 만들지 않는다.
플레이어와 선수 사이 관계 상태는 내부 Parameter로 관리한다.

후보:
- Trust
- Respect
- Satisfaction

좋은 계약인데 감독을 신뢰하지 않을 수 있고, 감독을 존중하지만 현재 대우에는 불만일 수 있으므로 관계 축은 분리 가능하다.

## Stress
Stress를 주간 관리의 핵심 상태값으로 둔다.

원인 후보:
- 과도한 훈련
- 연패 / 큰 경기 압박
- Injury
- 계약 불만 / Promise 불이행
- 잦은 감량
- 사생활 부족
- 미디어/팬 활동

플레이어는 휴식, 일정, 활동 선택, 경기 배치, 커뮤니케이션으로 Stress를 관리한다.

## Stress Resistance
선수마다 Stress에 대한 저항력/적응력이 다르다.
이는 Personality가 아니라 내부 선수 특성 Parameter로 관리한다.
정확한 값은 완전 공개하지 않고 사건 반응/관찰로 힌트를 얻을 수 있다.

---

# 35. 재협상 / 경쟁 매니저 / Loyalty

선수의 Rank, Fame, 최근 성적, Finish 기록, Title, Marketability, 다른 매니저/Promotion 관심에 따라 `Expected Value`가 변한다.
성장한 선수는 재협상을 요구할 수 있다.

계약 만료 또는 불만족 상태에서는 다른 매니저가 접근할 수 있다.
계약 중 즉시 강제로 빼앗기는 구조는 제한하되 경쟁 Offer와 재계약 압박은 존재한다.

고정 `Loyalty` Personality Parameter는 두지 않는다.
장기 잔류는 오랜 동행, Promise 이행, 커리어 성공, Trust/Satisfaction, 좋은 대우의 결과로 발생한다.

---

# 36. 협상 실패의 비용

계약 협상에서 계속 최저 조건을 찔러보는 플레이를 막는다.
지나치게 낮은 Offer나 무리한 협상은 다음을 만들 수 있다.
- Trust 하락
- 협상 태도 악화
- 요구 조건 상승
- 일정 기간 재협상 제한
- 다른 매니저 탐색

협상 행동 자체가 관계 History에 남을 수 있다.

---

# 37. Fight Offer / Risk-Reward / Fame

Fight Offer는 단순 파이트머니 선택이 아니다.

데이터 후보:
- Base Purse
- Win Bonus
- Finish Bonus
- Opponent / Opponent Strength
- Ruleset
- Ranking Effect
- Event Fame
- Short Notice
- Weight Requirement
- Title / Contender Implication
- Injury Risk
- Expected Audience

경기 선택은 돈, 랭킹, 성장, 부상 위험, Fame을 동시에 비교하는 의사결정이 된다.

## Fame
격투기는 스포츠이자 엔터테인먼트이므로 Fame을 적극 관리한다.
Fame 가치가 높은 경기 예:
- 유명한 상대
- 악명 높은 상대
- 라이벌전
- 챔피언전
- 큰 이벤트
- 화제성 높은 매치업
- 재대결

Fame은 향후 Fight Purse, Sponsor, Matchmaking, 선수 Market Value, 계약 요구에 연결할 수 있다.

---

# 38. Management Business

선수를 사고파는 Transfer Market은 기본적으로 없다.

핵심 루프:
**발견 → 평가 → 설득 → 계약 → 신뢰 형성 → 육성 → 경기/커리어 성장**

플레이어는 선수의 Fight Purse, Sponsor, 기타 활동 수익에서 Management Agreement에 따른 몫을 얻고 자신의 Management Business와 조직을 키운다.

---

# 39. Data-Driven / 확장성 원칙

모든 핵심 시스템은 가능한 한 Data/Parameter 중심으로 구현한다.

원칙:
- 하드코딩 최소화
- 가중치 / Curve / Threshold 조절 가능
- Ruleset / Action별 설정 가능
- Technique / Combo / Skill Card / Ring Name 추가 가능
- 성장/밸런스 튜닝 가능
- Roster Capacity / Direct Management Capacity 조절 가능
- Relationship / Stress / Fame / Contract 조건 조절 가능

목표는 밸런스 문제가 생겼을 때 코드 구조를 다시 설계하지 않고 데이터 조정으로 대응하는 것이다.

주요 Data 후보:
- SkillCard Unlock/Trigger/Modifier/AIWeight/Setup/Growth/MaxLevel
- RingName Unlock/Combat/Fame/Market/Matchmaking/Opponent Modifier
- Technique Proficiency/StarThreshold/InitialFormula/Growth/MatchExp/FinishBonus
- Scouting KnowledgeGain/FreshnessDecay/InterpretationError/Competition
- Contract JoinInterest/CareerNeed/Promise/ExpectedValue
- RosterCapacity/DirectManagementCapacity/DelegationEfficiency
- StressGain/StressRecovery/StressResistance
- FameGain/MatchFame/OpponentFame/RivalryModifier

---

# 변경 이력 / Superseded Decisions

## 인터뷰 05 → 인터뷰 06: Judging
이전의 "규칙별 평가 기준이 다를 수 있다"는 표현을 폐기.
최신 결정은 Universal Judging Engine + Ruleset에서 발생 불가능한 항목만 비활성화.

## 인터뷰 04 → 인터뷰 06: Counter / Feint
초기 Counter Ability는 Counter Conversion과 실제 Context 기반 Counter Success로 구체화.
Feint Ability는 Feint Execution / Feint Recognition으로 구체화.

## 인터뷰 02의 초기 능력치 예시
`Punch Power`, `Speed`, `Endurance`, `Recovery` 등의 예시는 현재 18개 Base Parameter 확정안으로 대체.

## 인터뷰 01 → 인터뷰 08: Skill Card 보유 구조
초기: 선수 한 명당 최대 5개 보유.
최신: 여러 장 보유 가능, 한 경기에서 동시에 활성화 가능한 카드만 기본 최대 5장.

## 인터뷰 01 → 인터뷰 08: Technique / Skill Card 분리
최신 구조:
- Technique: 실제 개별 기술 + 숙련도
- Combo/Sequence Proficiency: 주요 연속 기술 숙련
- Skill Card: 스타일/조건부 특성
- Ring Name: 희귀 커리어 업적/칭호

## 인터뷰 09: Overall / Recruitment Recommendation
Overall은 UI 편의값으로 존재 가능하나 영입 추천을 단일 별점으로 압축하지 않는다.
영입은 여러 축으로 평가한다.

## 인터뷰 10: 선수단 규모
1부 3명 / 2부 10명 / 3부 100명은 현재 목표값이며 고정 하드코딩 값이 아니다.
`Organization Roster Capacity`와 `Direct Management Capacity`를 분리하며 직원/관리 도구가 조직 확장을 지원한다.

---

# 문서 관리 규칙

1. `docs/interviews/`는 인터뷰 당시의 결정과 맥락을 보존한다.
2. 결정이 바뀌면 이 `current_decisions.md`를 즉시 최신값으로 수정한다.
3. 이전 결정과 충돌하면 `Superseded Decisions`에 변경 출처를 기록한다.
4. 실제 구현/밸런싱 시 인터뷰 파일보다 이 문서를 우선한다.
5. 벤치마킹 조사 내용은 `docs/benchmark/`의 게임별 파일에 누적한다.
6. 새 인터뷰 완료 시 인터뷰 문서와 SSOT를 함께 갱신한다.
7. 모든 주요 배율/Curve/Threshold/성장 보상/관리 한도는 코드 상수가 아니라 Data Parameter로 관리한다.
8. 반영 후 GitHub 디렉터리/SSOT를 다시 조회해 실제 저장 여부를 검증한다.
