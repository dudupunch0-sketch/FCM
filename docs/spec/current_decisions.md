# FCM Current Decisions — Authoritative Specification Register

> 프로젝트 가제: **Fight Club Manager (FCM)**
> 상태: **Part 1~2 Initial Full Game Specification v1**
> 역할: 현재 유효한 결정만 모아두는 단일 기준 문서(SSOT)
> 상세 통합 명세: `docs/spec/game_spec_part1_part2.md`
> 개념 데이터 모델: `docs/spec/data_model_part1_part2.md`
> 구현 순서: `docs/spec/implementation_roadmap_part1_part2.md`
> 인터뷰 History: `docs/interviews/`
> 사용자 위임 후 확정 설계: `docs/design/12_*.md` ~ `17_*.md`


## 콤보형 턴제 전투 — 최신 승인 방향

- 8칸 시간축에 1~4칸 동작카드를 배치하고 양측 콤보를 동시에 실행한다.
- 짧은/긴 가드, 스웨이·위빙, 페이크와 스태미너 관리로 순서와 타이밍을 공략한다.
- 회피 성공은 짧은 카운터 기회, 블록 성공은 효율적인 스태미너 교환을 제공한다.
- Skill Card는 상대 행동 일부를 조건부로 공개할 수 있다. Action Card(기술 사용)와 구분한다.
- 상대 계획 확정 → 정보 공개 → 플레이어 계획 확정 → 동시 실행. AI는 현재 플레이어 계획을 몰래 읽고 재계획하지 않는다.
- 확정 공개는 진짜 계획과 일치하며 페이크도 식별한다. 추정 예고는 페이크에 속할 수 있고 UI에서 구분한다.
- 정보 카드가 없어도 관찰한 과거 콤보와 반복 습관을 볼 수 있다.
- 초반 간파·강타 감지·수비 분석·패턴 독해·카운터 본능은 카드 콘텐츠 초안이다. 공개량/비용/중첩/성장 수치는 미확정이다.
- 선수 성장, 기존 전투 계산 계층, 부위별 손상과 전신 HP 없는 피니시는 유지한다.
- 초기 검증은 복싱 중심 자유 배치 시제품과 간단한 측면 연출로 진행한다. 무작위 드로우는 초기 범위에서 제외한다.
- 실시간 3D 대전 통합을 필수 개발 경로에서 제거하고 판정과 애니메이션을 분리한다.

상세 규칙과 미결정 항목: [콤보형 턴제 전투와 정보 공개 스킬카드](../design/18_combo_turn_combat_and_information_cards.md).


---

# 1. 현재 Scope

현재 상세 명세와 초기 개발 범위는 **Part 1과 Part 2까지**다.

## Part 1 — Underground Fight Club
- 플레이어가 직접 볼 수 있는 지하 파이트클럽은 1개
- 독립 코치/매니저로 시작
- Roster 목표 최대 약 3명
- 대부분 직접 관리

## Part 2 — International Fight Circuit
- 국제 공식 격투 무대
- Roster 목표 최대 약 10명
- 전문 Staff / Scout / Delegation 확대
- 공식 Ranking / Weight / Contract / Sponsor

## Future Scope
Part 3 직접 Promotion 운영은 장기 비전으로 유지하지만 현재 상세 명세/초기 개발에서는 제외한다.
1~2부 개발 후 재설계한다.

---

# 2. 핵심 플레이 판타지

우선순위:

1. **애정을 가지고 키운 Fighter가 전략과 성장을 거쳐 괴물급 Fighter로 성장하는 경험**
2. **숨겨진 Prospect를 직접 발견하는 경험**
3. 부상으로 선수 커리어가 꺾인 전직 MMA Fighter가 제자를 통해 새로운 커리어를 만드는 서사

핵심 원칙:

> 높은 숫자 총합이 게임의 정답이 되어서는 안 된다.

Fighter의 실제 강함은 Base Parameter뿐 아니라 Body, Technique, Skill Card, Ring Name, Rule Familiarity, Weight, Cardio, Injury, Setup, Strategy, Opponent Matchup이 결합해 결정한다.

---

# 3. Player Character

- 전직 MMA Fighter
- Injury로 본인의 선수 커리어가 내리막
- 지인의 권유로 Underground 코칭 시작
- Fight Club 직원이 아니라 독립 Coach / Manager
- 직접 Fighter를 발견하고 계약하여 출전시킴

Player Capability 5축:
- Coaching
- Analysis
- Scouting
- Negotiation
- Management

실제 활동 History로 성장한다.

`Player Reputation`은 실제 Capability와 별도이며 Fighter Join Interest, Staff Hiring, Promotion, Sponsor, Fight Opportunity 등에 영향을 준다.

---

# 4. Ruleset / Competition

Ruleset 4개:
- MMA
- Boxing
- Kickboxing
- No Rules

각 Fighter는 Ruleset별 Familiarity를 가진다.

Part 2 Ranking Key:

**Ruleset × Weight Division**

Champion은 #1과 별도 상태.

플레이어용 별도 `Ranking Point`는 사용하지 않는다.
내부 순위 계산용 Score는 허용하지만 Gameplay Resource/UI 핵심값으로 만들지 않는다.

Ranking 핵심 입력:
- 승패
- 상대 Ranking
- Activity
- 경쟁적 중요도

화려한 Finish는 Ranking보다 Ticket Power/Performance 보상에 더 크게 작용한다.

---

# 5. Part 1 Progression

플레이어가 직접 경험하는 Underground Fight Club은 1개다.
다른 Fight Club의 상세 Ranking/UI는 Part 1에서 보여주지 않는다.

일반 진행:

`Newcomer`
→ `실전 검증`
→ `Club Regular`
→ `Top Challenger`
→ `Fight Club Champion`

Club 내부에 4 Ruleset이 모두 존재한다.
Part 1 Weight는 공식 2부보다 느슨한 `Weight Band / Agreed Weight` 중심으로 운영 가능하다.

Part 1 메인 목표:

> 관리 Fighter 한 명을 Fight Club Champion으로 만든다.

---

# 6. Part 1 → Part 2 전환

Fight Club Champion 배출 후:

**플레이어 Fighter vs 외부 Underground Fight Club Champion**

특별전을 진행한다.

이를 통해 다른 Fight Club과 더 넓은 국제 격투 세계를 처음 강하게 Reveal한다.

승리 시 International Entry 기회를 얻는다.
패배해도 Save를 영구 봉쇄하지 않으며 재도전/다른 Fighter Route를 제공한다.

---

# 7. Part 2 Progression / Completion

체감 Ladder:

`International Entry / Unranked`
→ `Ranked Fighter`
→ `Top Rank`
→ `Contender`
→ `International Champion`

Title Shot은 #1 자동 지급이 아니다.
먼저 Competitive Eligibility를 충족해야 한다.
후보 간 우선도:
- Rank
- Activity
- 최근 경기력
- Ticket Power
- Rivalry
- Champion Story
- Event Value

현재 메인 Narrative Completion:

> 플레이어가 직접 발굴/관리한 Fighter 한 명을 International Champion으로 만든다.

그 후 Sandbox 계속 가능.

---

# 8. Fighter Base Parameter — 18개

직접 훈련/성장하는 Base Parameter만 아래 18개로 둔다.

## Physical
- Strength
- Explosiveness
- Agility
- Cardio
- Durability
- Reflex

Reflex는 신체 이동속도가 아니라 인지/판별/예측/반응 속도.

## Striking
- Punch Technique
- Guard Technique
- Kick Technique
- Footwork Technique

Punch/Kick Accuracy는 Technique에 포함.
Punch/Kick Defense는 Guard Technique으로 통합.
Block과 Evasion은 별도 행동이지만 Guard Technique은 둘 모두에 도움.

## Grappling
- Takedown Technique
- Takedown Defense Technique
- Clinch Technique
- Ground Bottom Technique
- Ground Top Technique
- Submission Technique

Submission 공격/방어는 하나의 Base Parameter.
Ground Striking은 별도 Base Parameter를 두지 않는다.

## Combat Intelligence
- Fight IQ
- Tactical Execution

Fight IQ는 상황 판단, Pattern 학습, Setup/Feint/Counter 활용, 예측, 행동 선택 품질에 폭넓게 관여.
Tactical Execution은 Player/Coach Strategy와 Sequence를 충실히 수행하는 정도.

내부 정밀값 사용 가능, UI는 0~100.

---

# 9. Fighter Identity

별도 Personality / Weakness 시스템은 두지 않는다.

Fighter Identity:

**Base Parameter + Body + Technique + Combo + Skill Card + Ring Name + Career History**

## Body Data
- Height
- Reach
- Natural Weight
- Current Weight
- Age
- Stance

숨겨진 체질 Parameter 허용:
- Weight Cut Resistance
- Weight Gain Adaptability
- Stress Resistance

완전 비공개가 아니라 관찰/대화/경험으로 Hint 제공.

---

# 10. Technique / Combo

Technique은 Skill Card와 분리한다.

각 Technique:
- 내부 정밀 숙련도
- UI 별 1~5

관련 Base Technique이 높은 Fighter는 새로운 관련 Technique을 더 높은 초기 숙련도에서 시작 가능.

3단 구조:
- Fundamental Action
- Learnable Technique
- Signature Technique

실전 Technique EXP는 Training보다 훨씬 높게 설정한다.
현재 초기 밸런스 기준은 **Training 대비 약 10배**이며 Parameter로 관리한다.

특정 Technique으로 Finish 시 매우 큰 해당 Technique EXP Bonus.

주요 Combo / Sequence는 별도 Proficiency를 가진다.
모든 가능한 조합은 저장하지 않는다.

---

# 11. Skill Card / Ring Name

## Skill Card
기술 자체가 아니라 스타일 / 조건부 특성 / 행동 연결 특성.

예:
- Liver Hunter
- Chain Wrestler

여러 장 보유 가능.
한 경기 동시 활성 기본 최대 5장.
카드별 고유 효과를 유지하면서 성장 가능.
획득은 Fighter의 실제 History와 연결.

## Ring Name
Skill Card보다 희귀한 커리어 업적/칭호.
Combat, Ticket Power, Matchmaking, Reputation에 영향 가능.

일부 NPC는 Unique Ring Name 보유.
그 이름 자체를 탈취하지 않고 해당 NPC 격파 업적에 대응하는 Ring Name 해금 가능.

---

# 12. Potential / Growth / Breakthrough

Potential 구조:
- Overall Talent
- Physical Aptitude
- Striking Aptitude
- Grappling Aptitude
- Combat Intelligence Aptitude
- 일부 예외 Modifier

Base Parameter마다 별도 Potential 숫자를 기본 구조로 두지 않는다.
정확한 Potential Ceiling은 공개하지 않는다.

Potential은 Hard Cap이 아니다.
한계 부근에서 성장 효율 Curve가 급격히 나빠져 사실상 정지처럼 느껴진다.
완전히 멈추지는 않는다.

지속적으로 한계를 두드리며 강한 상대, 중요한 경기, Adversity, Technique Mastery 등을 경험하면 Breakthrough 가능.

Breakthrough는 내부적으로 수치화하되 Progress는 UI에 직접 공개하지 않는다.

극한 경기 / 첫 패배 극복 등에서 *Darkest Dungeon*의 영웅의 기상과 같은 특별 긍정 성장 Event가 발생 가능.

---

# 13. Combat Architecture

확정 구조:

**Base Parameter → Derived Capability → Effective Performance → Action Result**

## Derived Capability
세부 기준: `docs/design/24_base_to_derived_mapping.md`
실물 Config: `config/derived_capability.json`

Base + Body 조합으로 계산.
독립 성장값이 아니다.

계산 형태:
- **가중 기하평균**을 사용한다. 가중합이 아니다. 약한 Base 하나가 Derived 전체를 끌어내리는 병목형이며 "총합이 정답이 되면 안 된다"는 핵심 원칙의 직접 구현이다.
- 각 Derived의 가중치 합은 1.0이며 `base_floor`로 클램프해 0 붕괴를 막는다.
- Body는 `mass_ratio`·`height_ratio` 곱셈 보정으로만 들어간다. 체급 내 상대값이므로 체급 상승만으로 유리해지지 않는다.
- Cardio, Durability, Tactical Execution은 Derived 기여가 의도적으로 작다. Effective Performance와 계획 수행 계층에서 작동한다.
- **이중계산 방지**: Reach는 거리 판정에서만, Age는 Base 감소로만, Stance는 매치업 계층에서만 작동한다. Derived는 손상·피로가 없는 기준 능력이며 현재 상태 반영은 Effective Performance의 몫이다.

주요 Derived:
- Punch Impact
- Punch Execution Speed
- Kick Impact
- Kick Execution Speed
- Range Control
- Guard Efficiency
- Evasion Capability
- Counter Conversion
- Feint Execution
- Feint Recognition
- Takedown Capability
- Takedown Defense
- Clinch Control
- Top Control
- Bottom Escape
- Submission Threat
- Submission Defense

System 존재와 주요 영향은 공개하되 정확한 내부값은 숨길 수 있다.

## Effective Performance
세부 기준: `docs/design/25_effective_performance.md`
실물 Config: `config/effective_performance.json`

Stamina, Damage, Injury, Weight, Familiarity, Skill Card 등 선수의 현재 상태를 반영.

- **Derived별 민감도 계수**를 곱셈 적용한다. 단일 전역 계수를 쓰지 않는다. 지쳤을 때 회피가 먼저 사라지고 가드는 오래 버티는 차이가 카디오 압박형/방어형 캐릭터를 만든다.
- 스태미너 곡선은 80 이상에서 완전히 평평하고 그 아래로 가속 하락한다. 계수는 "스태미너 0일 때의 최대 손실률"로 표현한다.
- 부위 손상은 해당 부위가 실제로 쓰이는 능력만 깎는다. 좌우는 Stance를 통해 lead/rear로 해석한다.
- Body 손상과 체중 스트레스는 개별 능력이 아니라 스태미너 경제(회복량·소모량·최대치)에 작용한다.
- 라운드 인터벌 회복이 이 계층에서 정의되며 상한이 있어 완전 회복은 없다.
- `Effective Durability`는 17개 Derived에 없으며 이 계층의 산출물이다. Head Wear가 여기서 전투 결과로 연결된다.
- **거리와 Setup은 이 계층이 아니다.** 선수 상태가 아니라 순간 상황이므로 Action Result 계층에서 다룬다.
- Effective는 Derived 원본을 변형하지 않는다. 캐시는 한 칸 안에서만 유효하다.

## Action Result
세부 기준: `docs/design/26_action_result_resolution.md`
실물 Config: `config/action_resolution.json`

실제 Action 시도/성공/실패/Impact/Position/Damage를 계산.

- 판정 단위는 **칸**이며 칸 시작 시점 스냅샷으로 판정한다. 서브비트 차이가 허용 오차 이내인 타격은 함께 반영되므로 동시 KO가 성립한다.
- 판정 순서: 비용 지불 → 이동 → 타격 시점 → 방어 → 상황 보정 → 결과 반영 → 상태 전이.
- 스태미너 부족은 해당 동작만 실패시키고 후속 동작은 예정 시점에 재시도한다. 자원은 음수가 되지 않는다.
- **난수는 최종 Impact 크기에만 좁은 대칭 편차로 들어간다.** 명중·블록·회피·피니시·승자를 뽑는 Roll은 금지 목록으로 Config에 명시한다.
- 방어 우선순위는 회피 → 가드 → 무방비이며 먼저 성립한 방어가 교환을 종결한다. 회피는 궤도 상성과 타이밍으로, 가드는 활성 구간과 보호 부위로 결정한다.
- Read Confidence는 방어 타이밍 허용폭을 좁히지만 상한이 있다. **읽기는 우위이지 확실성이 아니다.**
- 상태 전이는 순간 Impact와 Effective Durability의 비율로 결정한다. 누적 손상이 분모를 깎으므로 같은 펀치가 후반에 다운을 만든다.
- 모든 결과 이벤트는 `cause_tags`를 반드시 채운다. Debug Mode에서 전체 계산 근거를 볼 수 있어야 한다.
- Judge Metric은 이 계층에서 칸 단위로 누적되며 라운드 집계가 이를 받는다. 별도 경기 요약을 다시 계산하지 않는다.

## 콤보 경계와 서브비트
세부 기준: `docs/design/30_combo_boundary_and_sub_beat.md`

- **콤보(턴) 경계와 라운드 경계는 다르다.** 콤보 경계는 끊기지 않은 연속 동작이므로 **이월하고**, 라운드 경계는 실제 휴식이므로 소멸·리셋한다. 겹치면 라운드 규칙이 우선한다.
- 콤보 경계 이월 대상: 상태(Stagger/Groggy/Knockdown)와 회복 잔여 칸, 카운터 기회, 페이크 빈틈, 회수 취약, 거리 `gap`, Grapple Advantage, 서브미션 단계.
- 이월은 **창이 길어지는 것이 아니라 칸 경계에서 잘리지 않는 것**이다. 카운터 기회는 여전히 짧다.
- 이월이 과도해지지 않는 이유는 상대 계획이 자신의 그로기 상태를 알고 생성되기 때문이다(`28번`의 상태 반응). 이월의 보상은 공짜 타격이 아니라 상대를 수비로 모는 주도권이다. 두 규칙은 함께 있어야 한다.
- **속도는 별도 우선권 규칙이 아니라 서브비트 타이밍이다.** 칸 안의 타격 위치를 실수로 세분하고 Execution Speed가 그것을 앞당긴다. 우선권은 그 결과이며 8칸 구조와 카드 점유 길이는 바뀌지 않는다.
- 선타는 후속 타격을 **약화**시킬 뿐 지우지 않는다. 취소는 Knockdown 이상에서만. 완전 무효화는 속도의 이중 보상이 된다.
- **회피에 Execution Speed를 입력하지 않는다.** Agility가 이미 Execution Speed와 Evasion Capability 양쪽에 들어가 있어 세 번 계산된다. 대신 Evasion Capability가 회피 활성 구간의 서브비트 정렬과 폭을 결정한다.

## 라운드 구조
세부 기준: `docs/design/23_round_structure_and_judging.md`

- 한 라운드는 **고정된 개수의 콤보 턴**으로 구성한다. 경기 = R 라운드 × T 턴, 콤보 턴 = 8칸.
- 시간은 연출과 UI 표기 전용이며 **판정 로직이 읽지 않는다**. `R`과 `T`는 Ruleset/Part별 Config다.
- 콤보 턴은 라운드 경계에서 잘리지 않는다. 모든 턴은 8칸을 완주하거나 피니시로 즉시 종료된다.
- 경계 이월: 부위 손상, Permanent Wear, Combat Memory, Read Confidence는 이월한다.
- 경계 소멸: 카운터 기회, 페이크 빈틈, 피격 경직은 소멸하고 거리 `gap`은 리셋한다.
- 스태미너는 부분 회복한다. 회복 폭은 Cardio·누적 손상·Recovery Debt·코너 품질에 의존하며 완전 회복은 없다.
- 라운드 사이가 코너 지시의 정규 개입 창이다. 반영률은 Tactical Execution에 의존한다.
- 판정은 턴별 Judge Metric → 라운드 집계 → 경기 합산의 2단이며 라운드 격차를 내부 보존한다.

---

# 14. Action Data

각 Action은 Fighter Stat과 별도 Data를 가진다.

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

Technique 밸런스는 Fighter Base Parameter를 직접 수정하지 않고 Action Data 조절로 해결 가능해야 한다.

---

# 15. Range / Setup / Combat Memory

## Range
세부 기준: `docs/design/22_combat_range_model.md`

각 Action의 Optimal Range에서 Impact를 최대한 발휘.
Range Control은 자신의 유리한 거리를 만드는 능력.
Reach는 Range Strategy와 결합.

콤보 타임라인에서의 거리 표현:
- 두 선수 사이 간격을 단일 스칼라 `gap`으로 둔다. 선수별 위치 좌표와 링 이동은 현재 범위 밖이다.
- 거리는 별도 스텝 카드가 아니라 **동작카드에 내장된 이동**으로 변화한다. Action Data에 `range_shift`, `shift_timing`, `reach_bonus`를 추가한다.
- 잽 / 플리커잽 / 전진훅처럼 같은 기술군의 변형을 Fighter 능력치 수정 없이 Action Data만으로 생성한다.
- 같은 칸의 양측 이동은 합산하고 Clinch 하한과 Outside 상한으로 클램프한다.
- Range Control은 의도한 이동의 실제 반영률을 결정한다. 상대 이동을 완전히 무효화하는 값은 허용하지 않는다.
- 계획 UI의 예상 거리는 상대 이동을 제외해 계산하며 그 사실을 명시한다.

## Setup
영구 Fighter Stat이 아닌 Combat Context.

단일 Action 빈도보다 Combo / Sequence Pattern 중심.

흐름:
`Pattern Exposure`
→ `Opponent Expectation / Read Confidence`
→ `Pattern Break / Feint / Counter / Takedown Setup`

Fight IQ가 Pattern 학습/활용에 영향.
Tactical Execution이 Player가 지시한 Setup 수행에 영향.

AI 자동 활용과 Player 직접 지시 모두 가능.

## 선수 계획 생성
세부 기준: `docs/design/28_fighter_plan_generation.md`
실물 Config: `config/combat_ai.json`

- **모든 난수는 계획 확정 이전에만 존재한다.** 확정 후 판정은 완전히 결정론적이다. 난수가 승패가 아니라 시도를 흔든다.
- Fight IQ는 숨겨진 정보를 사지 않는다. 예측 정확도·탐색 폭·기억 창을 산다. 낮으면 직전 한 턴에 과반응하고 그것이 읽힌다. 예측 신뢰도 상한은 1.0 미만이다.
- Tactical Execution은 선택한 계획의 충실도와 코치 지시 반영률을 결정한다. 좋은 지시가 곧 좋은 실행이 아니다.
- 성향은 평가 함수의 가중치 세트이며 고정 Personality 데이터가 아니다. 저스태미너·그로기의 회복 전환은 성격이 아니라 상태 반응이다.
- 평가 함수에 반복 패널티를 둔다. 없으면 평가가 정확해질수록 하나의 최적 루프로 수렴해 완전히 읽히는 상대가 된다.
- **NPC 정보 카드는 회고적으로만 작동한다.** 현재 턴 계획 열람과 공개 후 재계획은 금지 목록으로 Config에 명시한다. 확정 순서를 깨지 않기 위한 구조적 비대칭이다.

별도 Momentum / Flow State 게이지는 사용하지 않는다.

---

# 16. Randomness

**Randomness creates variation, not causation.**

승자를 마지막 확률 Roll로 뽑지 않는다.
Upset은 Strategy, Matchup, Range, Setup, Counter, Stamina, Injury, Weight 등의 인과관계에서 발생해야 한다.

매우 강한 Favorite가 운 하나 때문에 억지로 패배하는 느낌을 크게 제한한다.

---

# 17. Cardio / Damage / Finish

Stamina 0~100 Curve:
- 80+: 거의 최상
- <80: 성능 저하 시작
- <50: 눈에 띄는 저하
- <30: 거의 좀비 상태

낮은 Stamina는 공격력 하나가 아니라 Speed, Explosiveness, Guard, Evasion, Takedown Defense, 판단, Damage Vulnerability 등에 복합 영향.

전신 HP 없음.

부위:
- Head
- Body
- L/R Arm
- L/R Leg

Finish는 HP 0이 아니라 Damage + Impact + Cardio + Effective Durability + Vulnerability의 결과.

상태 예:
Normal → Stagger → Groggy → Knockdown → KO/TKO

---

# 18. Injury / Medical / Wear

세부 기준: `docs/design/12_injury_medical_weight.md`

상태 4계층:
1. Fight Damage
2. Injury
3. Permanent Wear
4. Current Body Part Condition

Injury Risk는 원인이 먼저 존재해야 한다.
훈련 Load, Recovery Debt, 기존 Injury, Damage, Hard Sparring, Age, Weight Stress 등이 위험을 형성.

Diagnosis에도 Knowledge/Confidence가 존재.

일부 Injury는 안고 출전 가능:
- Effective Performance 하락
- Reinjury Risk
- Permanent Wear Risk

심각한 상태는 Medical Suspension 가능.

반복 KO / Knockdown은 Head Wear에 장기 영향.

---

# 19. Weight / Aging

## Weight
Part 1은 느슨한 Agreed Weight / Weight Band 가능.
Part 2는 공식 Division / Weigh-In.

Weight Cut Plan:
- Conservative
- Normal
- Aggressive

현실 감량 방법을 재현하는 미니게임이 아니라 시간/부담 관리.

Weight Stress 영향:
- Cardio
- Recovery
- Durability
- Stress
- Injury
- Fight Readiness

Weight Miss:
- Catchweight / Purse Cut / Opponent Refusal
- 심하면 Fight Cancellation / Reputation 문제

체급 상승도 즉시 상위호환 아님.
적응 전 Agility/Cardio/Footwork 비용 발생 가능.

## Aging
- Physical Decline
- Recovery 느려짐
- Injury/Wear 증가
- Cut 부담 증가

Fight IQ / Technique / 경험은 Veteran 장점이 될 수 있다.

---

# 20. Scouting / Knowledge

세계 True Fighter DB와 Player Known Fighter DB를 분리한다.

Player는 처음부터 모든 Fighter를 볼 수 없다.

발견:
- 직접 관람
- 상대 Fighter
- 체육관 / 대회
- 소개
- SNS / Video
- 소문
- Scout
- 높은 Ticket Power

단일 Scouting % 없음.
분야별 Knowledge:
- Physical
- Striking
- Grappling
- Combat Intelligence
- Technique
- Rule Familiarity
- Weight Adaptation
- Potential
- Market

각 정보:
- Confidence
- Freshness
- Evidence Amount

핵심:

> **Raw Evidence는 사실이며 Interpretation은 틀릴 수 있다.**

Player/Scout/Coach는 실제 행동을 잘못 해석할 수 있다.

소속 Fighter도 해당 능력과 관련된 훈련/경기 Evidence가 쌓여야 추정 범위가 좁아진다.

## Evidence → Knowledge 변환
세부 기준: `docs/design/29_evidence_and_knowledge.md`
실물 Config: `config/knowledge.json`

- 추정이 틀리는 형태를 **범위의 넓음(모른다)** 과 **중심의 치우침(잘못 안다)** 으로 분리한다. 원인이 다르다. 범위는 Evidence 부족·오래됨·영역 난이도에서, 치우침은 해석자 능력 부족과 편향된 Evidence에서 나온다.
- **편향은 무작위가 아니라 방향이 있다.** 약한 상대 활약은 과대평가, 유리한 상성은 실력으로 오해, 신체 조건은 기술보다 과대 반영된다. 플레이어가 학습할 수 있어야 한다. 전투의 Randomness 원칙에 대응하는 정보 버전이다.
- **`confidence`는 정확도가 아니라 해석자가 믿는 정도다.** 능력이 낮으면 좁은 범위를 자신 있게 제시하고 틀린다. 나쁜 Scout는 쓸모없는 게 아니라 위험하다.
- 모순되는 Evidence는 추정을 뒤집지 않고 넓힌다. 믿음이 진동하면 플레이어가 정보 시스템을 무시하게 된다.
- 오래된 정보는 넓어지는 동시에 중심이 과거에 고정된다. 관찰 후 성장한 선수는 모르는 선수가 아니라 **과소평가된 선수**가 되며 이것이 발굴 기회가 된다.
- 추정 범위는 0으로 수렴하지 않는다. Potential은 상한 수치를 노출하지 않으며 **Breakthrough 가능성은 추정 자체가 불가능하다.**
- `EvidenceRecord.raw_fact`는 변조하지 않는다. 편향은 해석 단계에서만 적용되므로 더 좋은 해석자로 과거 자료를 재분석할 수 있다.

---

# 21. Weekly Calendar / Fight Camp

세부 기준: `docs/design/13_fight_camp_and_weekly_calendar.md`

기본 시간 단위는 Week.

인위적인 훈련 횟수 제한 대신 실제 일정 / Training Load / Recovery / Stress로 제약.

활동:
- Growth Training
- Technical Training
- Sparring
- Tactical Drill
- Video Analysis
- Recovery
- Weight Management
- Personal / Stress Relief
- Media / Fan
- Sponsor

Training Load가 Recovery Capacity를 계속 넘으면 Recovery Debt 누적.

Fight Camp 준비 5축:
- Physical Fitness
- Tactical Preparation
- Technical Sharpness
- Weight Readiness
- Mental / Life State

Peak Condition은 마법 Buff가 아니라 위 상태들이 좋은 조합에 도달한 결과.

---

# 22. Fight Readiness / Analysis

Fight Readiness는 전투 Base Stat이 아닌 상태 Summary.
UI 예:
- Excellent
- Good
- Questionable
- Poor
- Not Cleared

세부 원인을 보여준다.

Opponent Video Analysis는 주간 활동.
오래되거나 잘못 해석된 정보가 잘못된 Camp/Strategy로 이어질 수 있다.

경기 후 Report:
1. Judge Score Report
2. Coach Causal Analysis

Causal Report 품질은 Player Analysis, Staff, Evidence, Post-Fight Review에 영향받는다.

---

# 23. Contract / Relationship

Player는 Fighter를 소유하지 않는다.

Dual Contract:
1. Player ↔ Fighter: Management / Coaching Agreement
2. Fighter ↔ Fight Club / Promotion: Fight Contract

Management 조건 후보:
- Share
- Duration
- Fight Commitment
- Training Support
- Termination
- Bonus
- Sponsor Share

고정 Personality 대신 현재 `Career Need` 사용.

Promise 가능:
- 일정 기간 내 Fight
- Title Opportunity
- Ruleset
- Weight
- Staff / Facility

Relationship:
- Trust
- Respect
- Satisfaction

고정 Loyalty 없음.
장기 잔류는 실제 History 결과.

---

# 24. Stress / Life

Fighter는 훈련만 하는 객체가 아니다.

Stress 원인:
- 과훈련
- Injury
- 연패
- 큰 경기 압박
- 계약/Promise 문제
- Weight Cut
- 사생활 부족
- Media
- Undefeated 압박 / First Loss

Stress Resistance는 숨겨진 체질 Parameter 가능.

Player는 휴식, 일정, Match 선택, 커뮤니케이션으로 Stress 관리.

---

# 25. Roster / Staff / Delegation

세부 기준: `docs/design/14_staff_facilities_delegation_and_player_progression.md`

Roster 목표:
- Part 1 ≤ 약 3
- Part 2 ≤ 약 10

Direct Management 기본 목표 ≤ 약 5.
모두 Parameter화.

Staff Role:
- General / Assistant Coach
- Striking Coach
- Grappling Coach
- S&C
- Analyst
- Scout
- Medical
- Weight Specialist

Staff는 단순 Combat Buff가 아니라 Training/Analysis/Risk Detection/Delegation Quality에 영향.

Staff Workload / Capacity 존재.

Delegation:
- Manual
- Assisted
- Delegated
- Auto with Policy

시설 Module:
- Core Gym
- Striking
- Grappling
- S&C
- Recovery / Medical
- Analysis

Roster 확대는 클릭 수 증가가 아니라 조직 관리 능력 증가여야 한다.

---

# 26. Matchmaking / Fight Offer

Fight Offer Data 후보:
- Purse
- Win / Finish Bonus
- Opponent
- Ruleset / Weight
- Ranking Opportunity
- Event Value
- Short Notice
- Title Implication
- Injury Risk
- Rivalry
- Opponent Ticket Power

Inbound / Outbound Offer 모두 존재.

Fight Acceptance 영향:
- Competitive Value
- Ticket Power
- Purse
- Risk
- Career Need
- Rivalry
- Injury / Camp

낮은 Rank라도 높은 Ticket Power로 강자 Match를 얻을 수 있지만 Competitive Title Eligibility를 무시할 수는 없다.

---

# 27. Weak Opponent / Upset / Performance

약한 상대를 붙이는 육성 전략 허용.
일반적인 Ranking/Combat EXP 효율은 낮아질 수 있다.

그러나:
- 높은 Ticket Power 상대
- 악명
- Rivalry
- 화려한 Finish
- 명경기

라면 별도 가치 가능.

Performance of the Night / Fight of the Night 유사 보상 사용 가능.

Underdog Upset은 큰 이벤트:
- Ranking
- Ticket Power
- EXP
- Fight IQ
- Skill Card
- Ring Name
- Breakthrough

실제 극복한 불리함을 평가.

---

# 28. Weight Division Move / Activity

일반 Ranker / Unranked가 새 체급으로 이동하면 기본적으로 밑바닥부터 시작.

Champion / Top Elite는 Prestige 덕분에 첫 경기부터 강한 상대 / Contender / Title급 Opportunity 가능.
그 Fight를 이기면 상대 수준에 맞는 높은 Ranking에서 시작.

과거 Rank 자체를 복사하지 않는다.

장기 Inactivity:
- Ranking 하락
- Ranking 제외 가능

---

# 29. Rivalry / Record

Rivalry는 버튼으로 생성하지 않는다.
History에서 발생:
- 접전
- 판정 논란
- Rematch
- Title
- 큰 Finish
- 도발

효과:
- Ticket Power
- Purse
- Stress
- Rematch
- Ring Name

분리 원칙:

**Actual Strength ≠ Ranking ≠ Ticket Power ≠ Fight Record**

Undefeated Record는 큰 Premium과 동시에 Stress를 만든다.
첫 패배 후 극복은 Adversity / Legend Event의 핵심 소재.

---

# 30. Ticket Power / Economy / Sponsor

세부 기준: `docs/design/15_economy_sponsors_and_ticket_power.md`

기존 `Fame` 명칭은 **Ticket Power**로 통일.
공개 0~100 흥행 가치.
전투 Engine의 직접 Combat Stat 아님.

영향:
- Fight Acceptance
- Purse
- Sponsor
- Title Candidate 우선도
- Contract Expected Value

패배 자체보다 경기 Story / Performance가 중요.
명경기 패배로 상승 가능.

Fighter Cash와 Management Cash 분리.
Player 수입은 Management Agreement에 따른 Share.

지출:
- Staff
- Facility
- Camp
- Travel
- Medical
- Scouting

Sponsor:
- Fighter Sponsor
- Management Sponsor

Sponsor는 돈과 Media/Appearance 일정 의무를 함께 줄 수 있어 Calendar / Stress와 Trade-off를 만든다.

---

# 31. International League / World Simulation

세부 기준: `docs/design/16_international_league_and_world_simulation.md`

Part 2는 하나의 **International Fight Circuit** 중심.
여러 Promotion/Event Organizer는 존재 가능하지만 Ranking을 Promotion마다 분리하지 않는다.

Promotion 차이:
- Prestige
- Budget
- Region
- Ruleset Focus
- Contract Style
- Ticket Power Preference

NPC Fighter도 동일한 핵심 Fighter Data Model 사용.

Simulation Tier:
- A: Player Relevant
- B: Known World
- C: Background World

Relevant할수록 세부적으로 Simulation.

NPC도:
- 경기
- 성장
- Injury
- Weight / Ruleset 변경
- 계약
- 은퇴

신규 Prospect 지속 생성.

Fighter는 Player가 발견될 때 생성되는 것이 아니라 이미 살아온 History를 가진 채 발견되어야 한다.

---

# 32. Data Architecture

개념 모델: `docs/spec/data_model_part1_part2.md`

가장 중요한 구현 규칙:

**Fighter True State와 Player Knowledge State를 처음부터 분리한다.**

Definition Data와 Runtime State도 분리.

주요 Definition:
- Ruleset
- Action
- Technique
- Combo
- Skill Card
- Ring Name
- Training Activity
- Injury Type
- Facility

모든 주요 Weight / Curve / Threshold / Multiplier는 Data/Config로 조절 가능해야 한다.

## 현재 존재하는 Config

Definition Data이므로 `dist/`가 아니라 저장소 루트 `config/`에 둔다.

| 파일 | 대상 | 명세 |
|---|---|---|
| `derived_capability.json` | Base → Derived 가중치 | `docs/design/24_*.md` |
| `effective_performance.json` | 상태 민감도, 스태미너 경제, 인터벌 회복 | `docs/design/25_*.md` |
| `action_resolution.json` | 칸 판정 순서, 난수 경계, 상태 전이 | `docs/design/26_*.md` |
| `grappling.json` | 포지션, 그래플 우위, 서브미션, Ruleset 게이팅 | `docs/design/27_*.md` |
| `combat_ai.json` | 계획 생성, Fight IQ / Tactical Execution | `docs/design/28_*.md` |
| `knowledge.json` | Evidence 변환, 편향, Confidence 보정 | `docs/design/29_*.md` |

**아직 어떤 코드도 이 파일들을 읽지 않는다.** Definition Data Loader는 로드맵 Phase 0 항목이며
시제품 `dist/engine.js`는 여전히 자체 상수를 쓴다. 이 구간은 명세가 코드를 앞선 상태다.

---

# 33. Development Priority

구현 순서: `docs/spec/implementation_roadmap_part1_part2.md`

최우선:
1. Data / Save / Deterministic RNG
2. Fighter True / Knowledge State
3. Headless Combat
4. Setup / Combat Memory
5. Damage / Injury / Weight
6. Growth / Calendar / Fight Camp
7. One Fighter Vertical Slice
8. Scouting / Contract
9. Part 1
10. Staff / Delegation
11. Economy / Ticket Power
12. Part 2 World

전투는 콤보형 턴제 엔진과 이벤트 기반 연출로 구현한다. 실시간 3D 통합은 필수 개발 범위에서 제외한다.

---

# 34. 개발에서 현재 제외할 것

- Part 3 Promotion 운영
- 100명 Roster
- 전투용 Overall
- Fighter Personality 시스템
- Weakness 별도 시스템
- 전신 HP
- Player에게 보이는 Ranking Point
- 승자를 직접 뽑는 Win Probability Roll
- 모든 Combo 조합 자동 저장
- 모든 Derived 수치 공개
- 현실적 위험 행동을 세부 재현하는 Weight Cut 미니게임
- 세밀한 회계 시뮬레이션

---

# 35. 화면 표현과 플랫폼

세부 기준: `docs/design/21b_mobile_pixel_combat.md`, `docs/design/21a_character_model_foundation.md`

이 장은 시제품의 현재 상태를 기록한다. 최종 상용 플랫폼 확정이 아니다.

- 실행 형태는 설치가 필요 없는 브라우저 정적 앱이며 **모바일 세로 화면**을 기준 레이아웃으로 한다.
- 렌더링은 **Canvas 도트 스프라이트**(`dist/ring-pixel.js`)를 사용한다. `dist/ring.js`는 조건 없이 이것을 로드한다.
- Three.js 입체 렌더러는 도트 전환으로 대체되었다. `ring-3d.js`, `fighter-model.js`, `character-head.js`와 `dist/vendor/three.*`(약 717KB)는 **현재 앱에서 도달 불가능**하며 테스트에서만 실행된다. 제거할지 되살릴지는 미결이다.
- **WebGL 초기화 실패 시 Canvas로 전환하는 경로는 현재 존재하지 않는다.** 과거 문서의 해당 기술은 유효하지 않다.
- 판정과 연출을 분리하는 원칙은 유지한다. 재생 속도·스킵·일시정지는 결과에 영향을 주지 않는다.
- 캐릭터 외형은 링크 레퍼런스 기반 도트 시안이며 **사용자 최종 승인 상태가 아니다**. 외형 작업 기준은 `AGENTS.md`를 따른다.
- 실기기 및 브라우저에서의 화면·성능 QA는 아직 수행하지 않았다.

---

# 36. Superseded Decisions

## Design 20 → 21b: 렌더링
Three.js 입체 렌더러와 WebGL 실패 시 기본 Canvas 전환 방식을 모바일 세로 도트 스프라이트 렌더러로 대체한다.
`docs/design/20_fighter_visual_upgrade.md`는 History로 보존한다. 해당 문서의 렌더러 구성과 전환 동작은 현재 코드와 일치하지 않는다.

## 콤보형 턴제 전환
기존 라운드 중심 제한 개입 및 별도 실시간 3D 전투 통합 방향을 콤보마다 계획하는 동시 실행 턴제로 대체한다.
과거 인터뷰는 History로 보존한다. 정보 공개 Skill Card는 기존 기술/특성 분리 원칙을 유지하는 확장이다.


## Interview 05 → 06: Judging
규칙별 별도 Judging Formula 아이디어 폐기.
Universal Judging Core + Ruleset별 불가능 Category 비활성화.

## Interview 04 → 06: Counter / Feint
`Counter Ability` → `Counter Conversion + Combat Context`로 세분화.
`Feint Ability` → Feint Execution / Recognition.

## Interview 02 초기 예시 Stat
Punch Power / Speed / Endurance / Recovery 예시는 현재 18 Base Parameter 구조로 대체.

## Interview 01 → 08: Skill Card
초기 최대 5개 보유 → 여러 장 보유 가능, 경기 활성 최대 기본 5장.

## Interview 01 → 08: Technique
Technique은 Skill Card와 완전 분리.

## Interview 09: Recruitment Rating
Overall UI는 가능하지만 영입 추천을 단일 별점으로 압축하지 않는다.

## Interview 10 → 11: Scope
3부까지 상세 명세 → 1~2부만 현재 Full Game Scope.

## Interview 10 → 11: Roster
3부 100명 아이디어는 Future Scope로 이동.

## Interview 11: Underground Visibility
여러 Fight Club 탐색/지역 통합 Ranking 아이디어 폐기.
Part 1 직접 가시 Fight Club은 1개.

## Interview 11: Ranking Point
플레이어용 Ranking Point 폐기.

## Interview 11: Fame
흥행 관련 최신 명칭 `Ticket Power`.

---

# 37. 문서 관리 규칙

1. 본 파일이 **현재 결정 SSOT**다.
2. `docs/interviews/`는 결정 당시 History를 보존한다.
3. `docs/design/`은 사용자 위임 이후 확정한 상세 설계를 보존한다.
4. 충돌 시 최신 SSOT와 `game_spec_part1_part2.md`를 우선한다.
5. 변경된 결정은 Superseded Decisions에 남긴다.
6. 모든 핵심 밸런스 값은 Data Parameter로 관리한다.
7. 새 설계 반영 후 GitHub 파일 존재와 SSOT를 재검증한다.
8. 현재 범위는 Part 1~2이며 Part 3는 Future Scope다.
9. `docs/design/` 번호는 작성 순서 식별자다. 같은 시점에 갈라진 문서는 `21a` / `21b`처럼 접미 문자로 구분하고 뒤 번호를 밀지 않는다.
10. 코드와 문서가 어긋나면 어느 쪽이 앞섰는지를 명시한다. 명세가 앞선 경우와 코드가 앞선 경우를 구분해 기록한다.
