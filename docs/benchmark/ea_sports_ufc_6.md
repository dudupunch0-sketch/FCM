# EA SPORTS UFC 6 — FCM 벤치마킹 노트

> 조사 기준: 2026-08-30  
> 목적: FCM 전투/선수 개성/전투 Context/밸런스 시스템 참고

---

## 핵심 참고 포인트

### 1. Ratings are only part of the story

UFC 6는 선수 Rating만으로 선수의 정체성과 실전 강함을 결정하지 않는 방향을 명확히 강조한다.

공식 설명에서는 선수별로 다음 요소들이 함께 경기 정체성을 만든다고 설명한다.

- Attribute / Ratings
- Tendencies
- Rhythm
- Signature Moves
- Movement
- Fighting Style
- Flow State

이 방향은 FCM의 목표인 **'숫자만 높은 선수를 고르는 것이 정답이 되지 않는 구조'**와 직접적으로 연결된다.

FCM 적용 아이디어:
- Base Parameter는 중요하지만 절대적인 Overall 우위가 되지 않게 한다.
- 선수의 Skill Card, 전투 Context, 거리, Setup, Rule Familiarity, 체중 상태, 상대 상성이 실제 경기력에 큰 영향을 준다.
- 동일 Rating 수준에서도 전혀 다른 스타일과 상성을 가진 선수가 만들어져야 한다.

---

## 2. Flow State — 스타일을 따를수록 보상되는 구조

UFC 6는 선수별 고유 Flow State를 도입했다.

핵심 철학:
- 선수의 강점과 실제 스타일에 맞게 싸우면 Momentum이 쌓인다.
- 압박형, 카운터형, 그래플링형 등 선수의 정체성과 일치하는 플레이가 실전 이점으로 연결된다.

FCM 참고점:
- FCM의 Skill Card / Ring Name / Strategy Fit과 유사한 역할을 할 수 있다.
- 단순히 높은 스탯보다 **'이 선수를 어떤 방식으로 운영하느냐'**가 중요하게 만들어야 한다.
- 선수의 Base Parameter 조합과 Skill Card가 자연스럽게 특정 전투 스타일을 형성하도록 설계할 수 있다.

---

## 3. Real-Time Contact 및 Context 기반 타격

UFC 6는 Real-Time Contact 시스템을 통해 접촉 위치, 타이밍, 데미지, Hit Reaction 등을 더 세밀하게 처리한다.

FCM의 3D 전투 프로젝트에서 장기적으로 참고 가치가 높다.

FCM 적용 철학:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

같은 계층 구조를 통해 타격의 결과를 단순 Damage Rating 하나로 결정하지 않는다.

---

## 4. Range와 타격 효율

UFC 6의 공식 가이드에서는 동일한 타격이라도 거리 Context에 따라 Stopping Power가 달라질 수 있다고 설명한다.

예:
- Cross를 너무 가까운 거리에서 사용하면 원래의 Stopping Power를 충분히 발휘하지 못함
- 올바른 거리와 타이밍에서 사용하면 상대 공격을 효과적으로 끊을 수 있음

FCM 적용:
- 각 공격에 Optimal Range 개념을 둔다.
- Optimal Range에서 Punch/Kick Impact를 최대 효율로 발휘한다.
- 너무 멀거나 가까우면 Impact Efficiency가 감소한다.
- Range Control은 본인의 실전 화력을 실제로 끌어내는 핵심 Derived Capability가 된다.

---

## 5. Counter와 Vulnerability

UFC 6에서는 공격을 시도하는 순간 Attack Vulnerability Window가 발생한다.

- 빠른 공격은 상대적으로 짧은 Vulnerability
- 크고 강한 공격은 더 긴 Vulnerability
- 공격 중간과 직후에 Counter 위험이 증가
- 무리한 공격은 상대에게 명확한 Counter 기회를 제공

FCM 적용:
- 단순 Critical Hit 확률보다 Context 기반 Counter를 중요하게 한다.
- 공격 종류마다 Risk / Vulnerability / Recovery 특성이 존재할 수 있다.
- 강한 공격을 반복하면 랜덤 패배가 아니라 **명확한 리스크 누적으로 인해 Counter를 허용하는 구조**를 만든다.

---

## 6. Head Movement와 Counter

UFC 6에서는 Head Movement 성공 후 즉각적인 Counter가 강한 보상으로 연결된다.

FCM 참고:
- Reflex는 단순 이동 속도가 아니라 공격 인지 및 타이밍 판별에 사용한다.
- Evasion 성공 → Counter Window 생성 구조를 활용할 수 있다.
- Fight IQ는 해당 Window를 실제로 활용할 행동 선택에 관여할 수 있다.

---

## 7. Target Mixing과 Pattern

UFC 6는 Head / Body / Leg 타깃을 섞는 것이 상대 방어를 무너뜨리는 핵심 전략이라고 설명한다.

- 동일 타깃 반복은 예측되기 쉬움
- Body 누적 공격은 Stamina에 영향을 줌
- Leg Damage는 장기적인 이동능력 저하로 이어짐
- 타깃 전환은 방어 읽기를 어렵게 만듦

FCM의 Setup System에 직접 참고 가능하다.

FCM 적용:
- 선수 AI가 경기 History를 기억한다.
- 특정 공격/타깃/타이밍 반복 → 상대의 Expectation 증가
- 반복 패턴에 대한 방어 적응이 일어남
- 이를 역이용한 Feint / Counter / Level Change / Takedown Setup이 가능

---

## 8. Takedown은 기술만으로 결정되지 않는다

UFC 6 공식 가이드에서 Takedown은 상대가 다른 행동에 반응하고 있을 때 더 성공적이며, Grapple Advantage와 거리 상태가 성공에 영향을 준다고 설명한다.

FCM 적용:
- Takedown Technique 수치 하나만으로 성공률을 결정하지 않는다.
- Fight IQ
- Explosiveness
- Strength
- Range
- 상대 상태
- Setup
- 상대 반응

등을 함께 반영한다.

이는 FCM에서 Takedown Entry/Finish를 하나의 Derived Capability로 통합하더라도 전투 Context를 통해 충분히 깊게 표현할 수 있다는 근거가 된다.

---

## 9. Stamina 밸런스와 '실패에 대한 비용'

2026년 8월 업데이트에서 UFC 6는 빗나가거나 회피된 공격의 Stamina Cost를 증가시켰다.

개발진 의도:
- 정확한 공격을 보상
- 상대 공격을 회피하는 플레이를 보상
- Miss를 반복하는 무리한 압박을 억제
- 상대가 지친 뒤 Counter Damage가 더 의미 있게 작동하도록 함

FCM 참고:
- 공격 실패 자체에 전술적 비용이 존재해야 한다.
- 단순 Damage 교환이 아니라 Stamina, Position, Vulnerability, Pattern Exposure 등의 비용을 만들 수 있다.
- 후반 라운드 운영이 Cardio와 전략에 따라 달라져야 한다.

---

## 10. 최신 밸런스 방향: Player Agency와 시스템 정합성

2026년 8월 28일 공개된 다음 업데이트 안내에서 EA는 다음 문제들을 다루고 있다.

- Ground Game Responsiveness
- Wrestling Stamina Cost
- 의도하지 않은 Automatic Parry
- Submission Entry Stamina Exploit

특히 자동 Parry 문제에 대해 개발진은 **Player Agency 손실을 중요하게 본다**고 설명한다.

FCM 참고:
- 시뮬레이션 게임이라 플레이어가 직접 조작하지 않더라도, 플레이어의 전략 지시와 선수 능력이 결과에 합리적으로 반영되어야 한다.
- 시스템 버그나 난수 때문에 작전의 의미가 사라지는 느낌을 피해야 한다.
- 경기 결과를 사후 분석했을 때 원인을 설명할 수 있어야 한다.

---

## FCM에 특히 유용한 설계 원칙

### Ratings are not identity
수치는 선수의 일부일 뿐이며 스타일과 Context가 실전 강함을 결정한다.

### Contextual Power
강한 기술도 거리, 타이밍, 현재 상태가 나쁘면 최대 성능을 발휘하지 못한다.

### Reward setup and reads
상대 패턴을 읽거나 특정 반응을 유도한 뒤 공격하는 행위에 명확한 보상을 준다.

### Failure should have cost
무리한 공격, Miss, 잘못된 거리 선택 등에는 Stamina/Vulnerability 등의 비용이 발생한다.

### Cause before randomness
결과가 바뀌었다면 단순 난수보다 경기 중 발생한 원인이 먼저 존재해야 한다.

---

## 공식 참고자료

- EA SPORTS UFC 6 Gameplay: https://www.ea.com/games/ufc/ufc-6/features/ufc-6-gameplay
- UFC 6 Gameplay Deep Dive: https://www.ea.com/games/ufc/news/ufc-6-gameplay-deep-dive
- UFC 6 Flow States Explained: https://www.ea.com/games/ufc/news/ufc-6-flow-states-explained
- UFC 6 Ratings Evolution: https://www.ea.com/games/ufc/news/ufc-6-ratings-all-you-need-to-know
- UFC 6 August 2026 Gameplay Updates: https://www.ea.com/games/ufc/ufc-6/news/ufc-6-august-2026-gameplay-updates
- UFC 6 September 2026 Gameplay Updates: https://www.ea.com/ko/games/ufc/ufc-6/news/ufc-6-september-2026-gameplay-updates
- UFC 6 Attack Vulnerability Guide: https://www.ea.com/games/ufc/ufc-6/ufc-6-tips-and-tricks-hub/ufc-6-how-attack-vulnerability-works
- UFC 6 Stopping Power Context Guide: https://www.ea.com/games/ufc/ufc-6/ufc-6-tips-and-tricks-hub/ufc-6-how-context-affects-stopping-power
- UFC 6 Takedown Guide: https://www.ea.com/games/ufc/ufc-6/ufc-6-tips-and-tricks-hub/ufc-6-how-to-attempt-takedowns
