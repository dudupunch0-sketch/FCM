# EA SPORTS UFC 6 — FCM 벤치마킹 노트

> 조사 기준: 2026-08-30  
> 목적: FCM 전투/선수 개성/전투 Context/밸런스/커리어 선택 시스템 참고

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

FCM 적용:
- Base Parameter는 중요하지만 절대적인 Overall 우위가 되지 않게 한다.
- Skill Card, Technique, 전투 Context, 거리, Setup, Rule Familiarity, 체중 상태, 상대 상성이 실제 경기력에 큰 영향을 준다.
- 동일 Rating 수준에서도 전혀 다른 스타일과 상성을 가진 선수가 만들어져야 한다.

---

## 2. Flow State — 참고하되 FCM에는 별도 시스템으로 넣지 않음

UFC 6는 선수별 고유 Flow State를 통해 자신의 스타일에 맞게 싸울 때 보상을 제공한다.

FCM 참고점:
- 선수의 강점과 실제 운영 방식이 일치할 때 강해지는 철학은 유용하다.
- 그러나 FCM에서는 별도 Momentum/Flow 게이지를 만들지 않는다.
- Skill Card / Ring Name / Setup / Combat Memory / Strategy Fit 등 기존 시스템의 상호작용으로 같은 감각을 만든다.

---

## 3. Real-Time Contact 및 Context 기반 타격

UFC 6는 Real-Time Contact 시스템을 통해 접촉 위치, 타이밍, 데미지, Hit Reaction 등을 더 세밀하게 처리한다.

FCM 장기 3D 전투 프로젝트 참고 구조:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

타격 결과를 Damage Rating 하나로 결정하지 않는다.

---

## 4. Range와 타격 효율

UFC 6 공식 가이드는 같은 타격도 거리 Context에 따라 Stopping Power가 달라질 수 있다고 설명한다.

FCM 적용:
- 각 Action에 Optimal Range
- Optimal Range에서 Impact 최대 발휘
- 너무 멀거나 가까우면 Impact Efficiency 감소
- Range Control은 본래 화력을 실제로 꺼내는 핵심 Derived Capability

---

## 5. Counter와 Vulnerability

공격을 시도하는 순간 Attack Vulnerability Window가 발생한다.
큰 공격일수록 일반적으로 더 긴 노출/리스크를 가질 수 있다.

FCM 적용:
- Critical 확률보다 Context 기반 Counter
- Action별 Vulnerability / Recovery / Risk
- 무리한 공격 반복 → 명확한 Counter 원인 제공

---

## 6. Head Movement와 Counter

Head Movement 성공 이후 즉각적인 Counter가 강한 보상으로 연결된다.

FCM 적용:
- Reflex는 공격 인지/판별/타이밍
- Evasion 성공 → Counter Window 생성 가능
- Fight IQ는 Window를 이용할 행동 선택에 관여

---

## 7. Target Mixing과 Pattern

UFC 6는 Head / Body / Leg 타깃을 섞는 것을 중요한 전략으로 다룬다.

FCM Setup System 적용:
- 특정 공격/타깃/Sequence 반복 → Opponent Expectation 증가
- Pattern Exposure와 Read Confidence 형성
- Feint / Counter / Level Change / Takedown Setup으로 역이용

---

## 8. Takedown은 기술 하나로 결정되지 않음

UFC 6에서는 상대가 다른 행동에 반응하고 있을 때 Takedown이 유리하며 거리와 Grapple Advantage가 중요하다.

FCM 적용:
- Takedown Technique 하나로 성공률 결정 금지
- Fight IQ / Explosiveness / Strength / Range / Setup / 상대 자세 / 순간 Advantage를 함께 반영
- Takedown Entry/Finish를 하나의 Derived Capability로 통합하더라도 Context로 깊이를 만든다.

---

## 9. Stamina와 실패 비용

2026년 8월 밸런스 방향에서는 빗나가거나 회피된 공격의 Stamina 비용을 높여 무리한 압박의 비용을 강화했다.

FCM 적용:
- Miss / 실패는 Stamina, Position, Vulnerability, Pattern Exposure 등의 실제 비용 생성
- Cardio가 떨어지면 단순 공격력뿐 아니라 방어/반응/테이크다운 방어 등 전체 시스템이 무너지는 Curve 사용

---

## 10. Player Agency / Cause Before Randomness

UFC 6 개발진은 Ground responsiveness, Automatic Parry 등에서 의도하지 않은 시스템 개입으로 Player Agency가 손상되는 문제를 중요하게 다룬다.

FCM 적용:
- 직접 조작 게임이 아니어도 플레이어 전략의 결과가 합리적으로 보여야 함
- 난수/자동 시스템이 전략을 무효화하는 느낌 금지
- 경기 후 인과관계를 분석할 수 있어야 함

핵심 원칙:
**Randomness creates variation, not causation.**

---

## 11. UFC 6 Career Mode — 선택, Calendar, Hype

UFC 6는 Career Mode를 `모든 결정이 더 의도적으로 느껴지고 progression과 legacy에 더 큰 영향을 주는 구조`로 재설계했다고 설명한다.

공식 Career Hub에는 다음 요소가 함께 노출된다.
- Calendar
- Sparring / Training 정보
- Contract Bonuses
- Social Media / Hype
- Milestones
- Career Stats
- Rivalry / Opportunity

또한 UFC 5의 주간 Point 구조를 보다 실제 일정에 가까운 Calendar로 교체했다.

### FCM 적용

FCM 역시 주간 Calendar가 단순 훈련 배분표가 아니라 다음 자원이 경쟁하는 공간이어야 한다.
- Training
- Recovery
- 상대 Video Analysis
- 사생활 / Stress 관리
- Media / Fan Activity
- Fame / Sponsor 활동
- Fight Camp

선수에게 주어진 한 주의 선택이 단기 능력치뿐 아니라:
- 경기 준비 상태
- Stress
- Fame
- 계약 가치
- Sponsor
- 다음 Fight Offer
- 장기 Career Legacy

에 연결되도록 한다.

---

## 12. Rivalry와 큰 경기의 커리어 가치

UFC 6는 Career에서 Rivalry, Opportunity, Dual-title, BMF 등 특정 조건의 큰 커리어 이벤트를 강조한다.

FCM 적용:
- 모든 경기가 동일한 가치가 아니어야 한다.
- 유명 선수 상대
- 라이벌전
- 챔피언전
- 재대결
- 불리한 조건의 큰 경기

등은 Rank 외에도 Fame, Growth, Ring Name, Skill Card, Breakthrough, Fight Purse에 더 큰 영향을 줄 수 있다.

즉 `강한 상대를 이겼다`와 `사람들이 보고 싶어 하는 상대를 이겼다`는 별개의 가치축으로 관리할 수 있다.

---

## FCM에 특히 유용한 설계 원칙

### Ratings are not identity
수치는 선수의 일부일 뿐 스타일과 Context가 실전 강함을 결정한다.

### Contextual Power
강한 기술도 거리, 타이밍, 현재 상태가 나쁘면 최대 성능을 발휘하지 못한다.

### Reward setup and reads
상대 패턴을 읽거나 반응을 유도한 뒤 공격하는 행위에 보상을 준다.

### Failure should have cost
무리한 공격, Miss, 잘못된 거리 선택에는 실제 비용이 발생한다.

### Cause before randomness
결과가 바뀌었다면 난수보다 경기 중 원인이 먼저 존재해야 한다.

### Career choices should connect systems
훈련, 경기 선택, Fame, Rivalry, 계약, 커리어 목표가 별도 미니게임이 아니라 같은 Calendar/커리어 시스템에서 연결되어야 한다.

---

## 공식 참고자료

- EA SPORTS UFC 6 Gameplay: https://www.ea.com/games/ufc/ufc-6/features/ufc-6-gameplay
- UFC 6 Gameplay Deep Dive: https://www.ea.com/games/ufc/news/ufc-6-gameplay-deep-dive
- UFC 6 Flow States Explained: https://www.ea.com/games/ufc/news/ufc-6-flow-states-explained
- UFC 6 Ratings Evolution: https://www.ea.com/games/ufc/news/ufc-6-ratings-all-you-need-to-know
- UFC 6 Game Modes Deep Dive: https://www.ea.com/games/ufc/ufc-6/news/ufc-6-game-modes-deep-dive
- UFC 6 August 2026 Gameplay Updates: https://www.ea.com/games/ufc/ufc-6/news/ufc-6-august-2026-gameplay-updates
- UFC 6 September 2026 Gameplay Updates: https://www.ea.com/ko/games/ufc/ufc-6/news/ufc-6-september-2026-gameplay-updates
- UFC 6 Attack Vulnerability Guide: https://www.ea.com/games/ufc/ufc-6/ufc-6-tips-and-tricks-hub/ufc-6-how-attack-vulnerability-works
- UFC 6 Stopping Power Context Guide: https://www.ea.com/games/ufc/ufc-6/ufc-6-tips-and-tricks-hub/ufc-6-how-context-affects-stopping-power
- UFC 6 Takedown Guide: https://www.ea.com/games/ufc/ufc-6/ufc-6-tips-and-tricks-hub/ufc-6-how-to-attempt-takedowns
