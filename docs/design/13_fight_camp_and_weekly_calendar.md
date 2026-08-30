# FCM Delegated Design 13 — Fight Camp / Weekly Calendar / Peak Condition

> 상태: **사용자가 1~2부 잔여 시스템 설계 결정을 위임한 뒤 확정한 설계안**
> 범위: Part 1 Underground / Part 2 International League

---

# 1. 설계 목표

Fight Camp는 단순히 Training Point를 소비하는 화면이 아니다.

플레이어는 제한된 현실 시간 안에서 다음을 동시에 관리한다.
- 성장
- 상대 맞춤 준비
- Technique / Combo 학습
- Weight
- Recovery
- Injury
- Stress
- 사생활
- Ticket Power / 미디어
- Sponsor 의무

핵심은 **무엇을 더 할까**보다 **무엇을 포기할까**의 선택이다.

---

# 2. Calendar 기본 단위

게임 시간의 기본 진행 단위는 **주(Week)**다.

각 주 안에는 실제 일정 블록이 존재한다.
- Morning
- Afternoon
- Evening
- Rest / Personal time

하지만 게임은 `주당 훈련 3회 제한` 같은 인위적인 슬롯 규칙을 사용하지 않는다.

각 활동은 실제로 다음 자원을 소비한다.
- 시간
- Training Load
- Recovery Capacity
- Stress Capacity
- Facility / Coach Availability

따라서 원한다면 훈련을 많이 잡을 수 있지만 결과적으로 Fatigue, Stress, Injury Risk, 생활 불만, Ticket Power 기회 손실이 발생한다.

---

# 3. Fight Camp 시작

Fight Offer를 수락하면 해당 선수의 일정은 `Fight Camp` 상태로 전환된다.

Fight Camp 길이는 고정하지 않는다.
영향:
- Offer까지 남은 시간
- Short Notice 여부
- Weight 상태
- Injury
- 선수 경험
- 상대 위험도
- Promotion 일정

일반 Camp는 수 주간 진행되지만 정확한 권장 길이는 Data Parameter로 둔다.

---

# 4. Camp의 5가지 준비 축

Fight Readiness를 하나의 숫자로만 보지 않고 다음 축을 별도로 관리한다.

## 4.1 Physical Fitness
- Cardio / Conditioning
- Fatigue
- Recovery
- Training Adaptation

## 4.2 Tactical Preparation
- 상대 Pattern 분석
- 전략 숙지
- Rule Familiarity
- Tactical Execution 준비

## 4.3 Technical Sharpness
- 실제 사용할 Technique / Combo의 최근 반복
- Sparring에서의 실전 감각
- 특정 Game Plan Sequence 안정성

## 4.4 Weight Readiness
- Current Weight
- Target Weight
- Weight Stress
- Weigh-In Risk

## 4.5 Mental / Life State
- Stress
- Satisfaction
- 사생활
- Rivalry 압박
- 무패 압박
- 미디어 부담

`Fight Readiness` 요약 UI는 이 다섯 축을 종합하지만 세부 원인을 항상 확인할 수 있어야 한다.

---

# 5. 활동 유형

## Growth Training
장기 Base Parameter 성장 중심.
경기 준비 효율보다 장기 육성 효율이 높다.

예:
- Strength
- Explosiveness
- Cardio
- Fundamental Technique

## Technical Training
특정 Technique / Combo / Sequence 숙련.

## Sparring
높은 실전성.
효과:
- Technique / Combo Experience
- Fight IQ Evidence
- Tactical Execution
- Sharpness
- 상대 스타일 재현

비용:
- 높은 Fatigue
- Injury Risk
- Damage Residue 가능

## Tactical Drill
지시한 전략, Setup Sequence, 거리 운영을 반복.
Fight IQ보다 Tactical Execution 및 특정 Game Plan 안정성에 큰 영향.

## Video Analysis
상대 Habit / Pattern / Technique / Weak Context에 대한 Evidence 획득.
선수에게 전달하면 Tactical Preparation 증가.

## Recovery
Fatigue / Recovery Debt / Injury 회복 중심.

## Weight Management
훈련 강도와 체중 목표를 함께 조정.
별도의 위험한 현실 감량 조작을 재현하지 않는다.

## Personal / Stress Relief
사생활, 휴식, 관계, 심리 회복.

## Media / Fan Activity
Ticket Power 증가 기회.
Stress / 시간 비용.

## Sponsor Activity
계약된 외부 일정 수행.
수익/관계 유지와 시간/Stress Trade-off.

---

# 6. Training Load / Recovery Debt

각 활동에는 `TrainingLoad`가 있다.

한 주의 Training Load가 선수의 Recovery Capacity를 지속적으로 초과하면 `Recovery Debt`가 쌓인다.

Recovery Debt 영향:
- 다음 훈련 성장 효율 감소
- Injury Risk 증가
- Stress 증가
- Fight Readiness 악화
- Technique Sharpness의 실전 재현성 감소 가능

선수의 Cardio가 높다고 Recovery Debt가 완전히 면제되지는 않는다.
Recovery 관련 파생값, Age, Injury, Weight Stress, 시설, Medical Staff가 함께 작용한다.

---

# 7. Peak Condition / Taper

Fight Week에 가장 강한 상태를 만들려면 Camp 전체에서 Training Load를 조절해야 한다.

핵심 원칙:
- 너무 적게 훈련 → Fitness / Sharpness 부족
- 끝까지 Hard Training → Fatigue / Injury / Weight Stress
- 적절한 시점에 Load 감소 → Peak Condition

별도 마법 버프 `Peak +10%`를 지급하지 않는다.
Peak Condition은 실제 상태들이 좋은 조합에 도달한 결과다.

예:
- 높은 Fitness
- 낮은 Fatigue
- 충분한 Sharpness
- Weight 안정
- Injury 없음
- 낮거나 관리된 Stress
- 충분한 Tactical Preparation

---

# 8. Camp Phase는 권장 프리셋으로 제공

초보 플레이어를 위해 다음 Camp Template을 제공할 수 있다.

1. Base Build
2. Skill / Tactical Build
3. Hard Sparring / Fight Simulation
4. Taper / Final Weight
5. Fight Week

하지만 강제 단계는 아니다.
숙련 플레이어는 자유롭게 Calendar를 수정한다.

코치진은 선수 상태와 상대에 맞는 Camp Template을 추천할 수 있다.

---

# 9. 상대 맞춤 Camp

상대 분석이 충분하면 Camp Activity를 상대 특성에 맞춰 바꿀 수 있다.

예:
- 상대가 Pressure Boxer → Back-foot Footwork / Counter Drill
- Wrestler → Takedown Defense / Wall Escape Sparring
- Low Kick Heavy → Check / Stance Recovery Drill

잘못되거나 오래된 Scouting 정보에 의존하면 잘못된 Camp를 준비할 수 있다.

이는 기존 `Raw Evidence / Interpretation` 시스템과 연결한다.

---

# 10. Setup Training

플레이어가 경기에서 사용할 Setup Sequence를 Camp에서 지정 가능.

예:
- Jab → Jab → Cross Pattern 노출
- Body Attack → Head Finish
- Punch Pressure → Double Leg

Camp에서 충분히 반복하면:
- Sequence Proficiency 증가
- Tactical Execution 안정화
- 선수 AI가 해당 Pattern을 사용할 확률/타이밍 품질 증가

하지만 실제 경기에서는 상대 반응이 다르므로 자동 성공하지 않는다.

---

# 11. Hard Sparring

Hard Sparring은 높은 보상과 실제 비용을 가진다.

보상:
- Sharpness
- Technique / Combo Experience
- Fight IQ Evidence
- 실전 압박 적응

비용:
- Injury Risk
- Head / Body Damage Residue
- Fatigue
- Stress

경기 직전까지 Hard Sparring을 반복하는 것은 위험한 전략이 된다.

---

# 12. Camp Event

Camp 동안 완전히 스크립트된 랜덤 이벤트보다 현재 상태에서 파생되는 사건을 우선한다.

예:
- 특정 Technique가 갑자기 잘 맞기 시작함
- Sparring Partner에게 반복적으로 Setup 성공
- 체중 감소 정체
- 누적 피로 경고
- 선수의 스트레스 증가
- 숨겨진 Affinity 발견
- Breakthrough 조짐

이벤트는 시스템 상태를 설명하고 새로운 선택을 제시한다.

---

# 13. Short Notice Camp

Short Notice Fight는 일반 Camp를 압축한다.

플레이어는 무엇을 버릴지 결정해야 한다.
예:
- Weight를 우선 → Tactical Prep 부족
- 상대 분석 우선 → Physical Fitness 부족
- Hard Sparring 생략 → Sharpness 부족

좋은 코치진 / 높은 Fight IQ / Rule Familiarity / 기존 Fitness가 Short Notice 리스크를 줄일 수 있다.

---

# 14. 직접 관리 / 위임

## Direct Managed Fighter
플레이어가 Calendar를 세부 수정 가능.
- Activity
- Intensity
- 상대 맞춤 Drill
- Weight Plan
- Media / Personal 일정

## Delegated Fighter
플레이어는 우선순위만 지정.
예:
- `성장 우선`
- `다음 경기 준비 우선`
- `부상 회복 우선`
- `Ticket Power 우선`
- `Weight 안정화`

담당 Coach가 Calendar를 생성한다.
Coach 능력에 따라 계획 품질과 위험 감지 품질이 달라진다.

---

# 15. Player Notification

모든 주를 직접 열어보지 않아도 중요한 예외만 알림으로 올라온다.

예:
- Injury Risk 급증
- Weight Miss 예상
- Stress 위험
- Technique 학습 완료
- Camp Plan 실패 가능성
- Sponsor 일정 충돌
- 상대 Pattern 분석 갱신

관리 도구가 좋아질수록 Notification 품질이 증가한다.

---

# 16. Data Parameter 후보

- ActivityDuration
- ActivityTrainingLoad
- ActivityStressGain
- ActivityTicketPowerGain
- ActivityGrowthWeights
- ActivitySharpnessGain
- RecoveryDebtCurve
- SparringInjuryMultiplier
- HardSparringDamageResidue
- FitnessDecayRate
- SharpnessDecayRate
- TacticalPreparationGain
- TaperLoadModifier
- ShortNoticePreparationPenalty
- CoachPlanQualityWeight
- DirectManagementCapacity
- NotificationThreshold

---

# 17. 핵심 루프

`Fight Offer 수락`
→ `상대 분석`
→ `Camp 목표 설정`
→ `주간 Calendar 운영`
→ `성장 / Fitness / Weight / Stress / Injury Trade-off`
→ `Taper`
→ `Fight Readiness 확인`
→ `경기`
→ `경기 결과와 Damage를 다음 Camp에 반영`

Fight Camp는 성장 게임과 전투 게임 사이를 연결하는 가장 중요한 관리 화면 중 하나다.
