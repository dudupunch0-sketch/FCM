# FCM Delegated Design 12 — Injury / Medical / Weight Management

> 상태: **사용자가 1~2부 잔여 시스템 설계 결정을 위임한 뒤 확정한 설계안**
> 우선순위: 선수 육성, Fight Camp, 전투 인과관계를 연결하는 핵심 시스템
> 범위: Part 1 Underground / Part 2 International League

---

# 1. 설계 원칙

1. Injury는 임의의 랜덤 벌칙이 아니라 선행 원인의 결과여야 한다.
2. 전신 HP는 사용하지 않는다.
3. 경기 중 Damage와 경기 후 Injury를 분리한다.
4. 회복되지 않는 커리어 마모를 별도로 누적한다.
5. 부상 진단에도 Knowledge / Confidence가 존재한다.
6. 부상을 안고 출전하는 선택은 허용하되 실제 성능과 커리어 리스크를 동반한다.
7. 체중 관리는 현실 감량법 재현이 아니라 **시간 / 부담 / 경기력 Trade-off**를 관리하는 추상 시스템으로 만든다.
8. 모든 Threshold / Curve / Risk Weight는 Data Parameter로 관리한다.

---

# 2. 신체 상태 4계층

## 2.1 Fight Damage
현재 경기에서 발생한 단기 손상.

부위별로 관리:
- Head
- Body
- Left Arm
- Right Arm
- Left Leg
- Right Leg

경기 중 Effective Performance와 Finish 가능성에 즉시 영향을 준다.
경기 종료 후 상당 부분 자연 회복되지만 심한 Damage는 Injury로 전환될 수 있다.

## 2.2 Injury
경기 후에도 남는 실제 부상 상태.

각 Injury Data 후보:
- BodyPart
- InjuryType
- SeverityInternal
- FunctionalPenalty
- RecoveryProgress
- EstimatedRecoveryRange
- ReinjuryRisk
- TrainingRestriction
- FightRestriction
- MedicalConfidence

UI는 정밀 내부 Severity 대신 이해 가능한 등급/설명으로 노출한다.
예:
- 경미
- 주의 필요
- 중등도
- 심각
- 출전 불가

## 2.3 Permanent Wear
완전히 회복되지 않는 커리어 마모.

증가 원인 후보:
- 반복 KO / Knockdown
- 심각한 Injury
- 불완전 회복 상태의 재부상
- 과도한 누적 경기
- 나이
- 반복적인 극단적 Weight Cut

Permanent Wear는 Base Parameter 자체를 직접 깎는 방식보다 **부위별 Condition Ceiling / Recovery / Vulnerability**를 악화시키는 쪽을 우선한다.

## 2.4 Body Part Condition
현재 시점에서 실제로 사용할 수 있는 부위 상태.

개념식:

`BodyPartCondition = Durability + BodyPartModifier + TrainingAdaptation - FightDamage - Injury - PermanentWear - AgingPenalty + SkillCardModifier`

정확한 식과 가중치는 Parameter화한다.

---

# 3. Injury 발생 원칙 — Cause Before Randomness

Injury에는 Random Variance가 있을 수 있지만 위험을 만드는 원인이 먼저 존재해야 한다.

## 경기 Injury Risk 예
- 해당 부위 Fight Damage
- 순간 Impact
- 현재 Body Part Condition
- Stamina / Fatigue
- 이전 Injury / Reinjury Risk
- Action Vulnerability
- 선수 Durability

## 훈련 Injury Risk 예
- Training Load
- Fatigue / Recovery Debt
- 최근 Fight Damage
- 기존 Injury
- Training Quality
- 선수-훈련 적합도
- Sparring Intensity
- Coach Load Management
- Age

게임은 단순히 `이번 주 2% 확률로 부상`을 굴리는 것이 아니라 위 원인으로 Risk가 형성된 뒤 작은 불확실성을 적용한다.

---

# 4. Diagnosis / Medical Knowledge

부상 직후 플레이어가 모든 정보를 즉시 알 수 없다.

초기 표시 예:
> 오른손에 문제가 있는 것으로 보입니다.

검사 / 경과 관찰 / 의료진 분석 후:
> 오른손 중등도 부상
> 예상 회복: 2~4주
> 재부상 위험: 높음

좋은 Medical Staff는 다음을 개선한다.
- Diagnosis Confidence
- Recovery Estimate 정확도
- 숨은 심각도 탐지
- Training Restriction 추천 품질
- Return-to-Fight 판단

핵심 원칙:
> 실제 Injury State는 사실이지만, 플레이어의 진단은 Interpretation이다.

Scouting의 Raw Evidence / Interpretation 구조와 동일한 철학을 사용한다.

---

# 5. Recovery / Rehab

Recovery는 단순 시간 경과만으로 결정되지 않는다.

영향 후보:
- Injury Severity
- Medical / Recovery Staff
- Facility
- Rest Allocation
- Training Load
- Age
- Stress
- Nutrition / Weight Stress
- Reinjury 여부

회복 중에도 허용 범위 내의 다른 훈련은 가능하다.
예:
- 손 부상 → 하체 / Cardio / 일부 Grappling 가능
- 다리 부상 → 상체 Technique / Video Analysis 가능

따라서 Injury는 전체 게임을 강제 정지시키기보다 **훈련 계획을 재구성하게 만드는 사건**이다.

---

# 6. 부상을 안고 출전

선수는 일부 Injury 상태에서 출전할 수 있다.

출전 시:
- 관련 Effective Performance 감소
- Reinjury Risk 상승
- Permanent Wear Risk 상승
- 경기 중 해당 부위 Vulnerability 상승

대안:
- 경기 연기
- Fight Offer 포기
- 상대/Promotion과 일정 재협상

심각한 Injury, 공식 Medical Suspension, 규정상 위험 상태에서는 강제 출전 불가가 가능하다.

Part 1 Underground는 공식 의료 규제가 느슨하지만 실제 커리어 Risk는 더 클 수 있다.
Part 2 International League는 Medical Suspension / Clearance 규칙이 적용된다.

---

# 7. Reinjury

불완전 회복 부위는 재사용 강도에 따라 Reinjury Risk가 크게 증가한다.

예:
- Right Hand 70% 회복
- Heavy Bag + Hard Sparring 반복
- Reinjury 발생

결과 후보:
- Recovery 기간 연장
- Injury Severity 증가
- Permanent Wear 증가
- 선수 Stress 증가
- Trust / Satisfaction 영향 가능

플레이어가 무리한 복귀를 반복하면 단기 성장과 장기 커리어를 교환하는 선택이 된다.

---

# 8. Head Wear / KO 누적

Head는 별도의 HP가 아니라 Body Part Condition의 한 부위다.

다음 사건은 `Head Wear` 증가에 큰 영향을 준다.
- 큰 Head Impact
- Knockdown
- Groggy 상태에서 추가 피격
- KO / TKO
- 짧은 회복기간 후 재출전

Head Wear 증가 효과 후보:
- Head Effective Durability 감소
- Groggy Threshold 악화
- Knockdown / KO Vulnerability 증가
- Recovery Time 증가

단순 `KO 횟수 = 고정 패널티`가 아니라 실제 Damage / 회복 과정 / 심각도를 반영한다.

심한 KO 이후 Mandatory Recovery / Medical Suspension을 둘 수 있다.

---

# 9. Fight Readiness

Fight Readiness는 전투 Base Parameter가 아니라 **경기 준비 상태 요약 UI**다.

UI 예:
- Excellent
- Good
- Questionable
- Poor
- Not Cleared

내부 구성 후보:
- Injury State
- Residual Fight Damage
- Fitness / Physical Condition
- Fatigue / Recovery Debt
- Stress
- Weight Status
- Fight Camp Specificity
- Opponent Preparation

세부 화면에서는 원인을 분해해 보여준다.
예:
- 체력 상태 좋음
- 오른손 부상 주의
- 감량 부담 높음
- 상대 분석 부족

하나의 숫자로 모든 원인을 숨기지 않는다.

---

# 10. Weight Management

핵심 데이터:
- Natural Weight
- Current Weight
- Target Fight Weight
- Remaining Time
- Weight Cut Resistance
- Weight Gain Adaptability

## Part 1
Underground에서는 공식 체급보다 경기별 합의 체중 / 비교적 느슨한 Weight Band를 사용할 수 있다.
체중 차이가 커질수록 Fight Acceptance / Purse / Risk에 영향을 준다.

## Part 2
공식 Weight Division과 Weigh-In을 사용한다.

---

# 11. Weight Cut Plan

Fight Camp에서 플레이어는 감량의 방향과 강도를 선택한다.

예시 Preset:
- Conservative
- Normal
- Aggressive

이 Preset은 현실의 구체적인 탈수 방법을 재현하지 않고 다음 추상값을 제어한다.
- Weekly Weight Change
- Stress
- Recovery Cost
- Training Quality Penalty
- Injury Risk
- Final Weight Miss Risk

선수/코치진은 남은 기간과 현재 상태에 따라 예상 결과를 리포트한다.

---

# 12. Weight Stress

개념 입력:
- Natural Weight와 Target Weight 차이
- Remaining Time
- Current Weight
- Weight Cut Resistance
- Age
- Current Condition
- Recent Cut History

Weight Stress가 높을수록:
- Effective Cardio 감소
- Recovery 악화
- Effective Durability 감소 가능
- Stress 증가
- Injury Risk 증가
- Fight Readiness 감소

같은 감량량도 선수마다 결과가 달라야 한다.

정확한 `WeightStressCurve`는 Data Parameter로 관리한다.

---

# 13. Weigh-In Failure

## 경미한 초과
가능한 결과:
- Catchweight 재협상
- Purse 삭감
- 상대 Compensation
- 상대의 경기 거절
- Ticket Power / Reputation 영향

## 심각한 초과
- 경기 취소
- Promotion 관계 악화
- Contract / Promise 문제
- 선수 Stress 증가
- 반복 시 `Weight Reliability` 시장 평가 악화

`Weight Reliability`는 별도의 고정 Personality가 아니라 과거 기록에서 파생되는 Reputation 성격의 정보다.

---

# 14. Weight Gain / 체급 상승 적응

체중 증가가 즉시 상위호환이 되지 않는다.

초기 증량 효과 후보:
- Strength / Impact Potential 상승
- 상대적으로 높은 Mass Advantage 가능

적응 부족 시:
- Agility 감소
- Cardio 부담
- Footwork Efficiency 감소
- Energy Cost 증가

시간을 들여 적응하면 일부 패널티가 감소한다.
`Weight Gain Adaptability`가 적응 속도/최종 효율에 관여한다.

---

# 15. Aging과 Recovery

노화는 단순 Base Parameter 감소뿐 아니라 관리 난이도를 높인다.

Age 영향 후보:
- Recovery Time 증가
- Injury Risk 증가
- Permanent Wear 영향 증가
- Hard Sparring 허용량 감소
- Weight Cut 부담 증가
- Fight Frequency 감소

노장은 높은 Fight IQ / Technique / 경험으로 경쟁력을 유지할 수 있지만 젊은 선수처럼 잦은 경기와 강훈련을 반복하기 어렵다.

좋은 스케줄링과 Medical Management로 커리어 연장은 가능하지만 노화를 제거할 수는 없다.

---

# 16. Data Parameter 후보

- InjuryRiskBase
- FightDamageToInjuryCurve
- TrainingLoadInjuryCurve
- ReinjuryMultiplier
- PermanentWearGain
- HeadWearImpactWeight
- KOHeadWearBonus
- MedicalDiagnosisErrorCurve
- RecoveryRate
- AgeRecoveryModifier
- StressRecoveryModifier
- FightReadinessWeights
- WeightCutResistance
- WeightGainAdaptability
- WeightStressCurve
- WeightMissThreshold
- WeightMissPenalty
- MedicalSuspensionThreshold
- ReturnToFightThreshold

---

# 17. 핵심 플레이 루프 연결

`Fight Damage`
→ `경기 후 Medical Review`
→ `Injury / Wear 판단`
→ `회복과 훈련 계획 수정`
→ `Weight / Stress / Fight Readiness 관리`
→ `다음 Fight Offer 수락 여부`
→ `Fight Camp`
→ `경기`

즉 Injury와 Weight는 별도의 미니게임이 아니라 **선수 커리어 선택을 바꾸는 상태 시스템**이다.
