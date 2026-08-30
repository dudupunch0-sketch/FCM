# FCM Part 1~2 — Conceptual Data Model

> 목적: 게임 명세를 실제 구현 가능한 데이터 구조로 연결하기 위한 개념 스키마
> 원칙: 구체 언어/DB 형식에 종속되지 않음
> 모든 밸런스 값은 가능한 한 Definition/Config Data로 외부화

---

# 1. 가장 중요한 분리

FCM은 Fighter 한 명에 대해 최소 다음 두 데이터를 분리해야 한다.

## True State
게임 엔진이 실제로 알고 있는 진짜 상태.

## Player Knowledge State
플레이어/Staff가 현재 알고 있거나 추정하는 상태.

절대로 Player UI가 Fighter True State를 직접 읽는 구조로 만들지 않는다.

---

# 2. GameState

```text
GameState
- save_version
- rng_seed
- current_date
- current_week
- current_part
- player_state
- management_state
- world_state
- config_version
- event_history
```

`rng_seed`를 저장해 Headless Simulation / Replay / Debug에서 재현 가능하도록 한다.

---

# 3. FighterTrueState

```text
FighterTrueState
- fighter_id
- identity
- body
- base_parameters
- growth
- rule_familiarity
- techniques
- combos
- skill_cards
- ring_names
- condition
- career
- relationship
- contract_links
- hidden_traits
- ai_state
```

---

# 4. Fighter Identity

```text
FighterIdentity
- name
- nationality
- hometown
- birth_date
- sex
- stance
- current_ring_name_id
- biography_tags
```

현재 상세 명세에서 Fighter Personality 데이터는 두지 않는다.

---

# 5. BodyData

```text
BodyData
- height
- reach
- natural_weight
- current_weight
- target_weight
- age_derived
- weight_cut_resistance
- weight_gain_adaptability
- stress_resistance
```

숨겨진 체질값은 True State에 존재하되 Player Knowledge로 별도 추정한다.

---

# 6. BaseParameters

```text
Physical
- strength
- explosiveness
- agility
- cardio
- durability
- reflex

Striking
- punch_technique
- guard_technique
- kick_technique
- footwork_technique

Grappling
- takedown_technique
- takedown_defense_technique
- clinch_technique
- ground_bottom_technique
- ground_top_technique
- submission_technique

CombatIntelligence
- fight_iq
- tactical_execution
```

내부 precision은 float 권장.
UI는 ObservationState를 통해 0~100 Range로 변환.

---

# 7. GrowthState

```text
GrowthState
- overall_talent
- physical_aptitude
- striking_aptitude
- grappling_aptitude
- combat_intelligence_aptitude
- exception_modifiers[]
- breakthrough_progress
- breakthrough_threshold
- potential_proximity_internal
- adversity_history[]
```

Potential Ceiling을 직접 UI에 노출하지 않는다.

---

# 8. RuleFamiliarityState

```text
RuleFamiliarityState
- mma
- boxing
- kickboxing
- no_rules
```

Ruleset Definition과 결합해 Effective Performance / Action Selection에 사용.

---

# 9. Technique Definition / Fighter Technique State 분리

## TechniqueDefinition

```text
TechniqueDefinition
- technique_id
- category
- type: Fundamental | Learnable | Signature
- related_base_parameters
- prerequisites
- learning_difficulty
- action_definition_id
- allowed_rulesets
- tags[]
```

## FighterTechniqueState

```text
FighterTechniqueState
- technique_id
- internal_proficiency
- exp
- learned
- hidden_affinity_modifier
- recent_usage
- finish_count
```

UI 별 1~5는 `internal_proficiency` Threshold Mapping으로 계산.

---

# 10. ComboDefinition / ComboState

```text
ComboDefinition
- combo_id
- action_sequence[]
- setup_tags[]
- prerequisites

FighterComboState
- combo_id
- proficiency
- exp
- recent_usage
```

모든 가능한 조합을 생성하지 않고 Data에 정의된 Combo만 추적.

---

# 11. SkillCardDefinition / State

```text
SkillCardDefinition
- card_id
- unlock_conditions[]
- triggers[]
- conditions[]
- modifiers[]
- action_overrides[]
- ai_weight_modifiers[]
- setup_modifiers[]
- growth_rules[]
- max_level
- rule_availability

FighterSkillCardState
- card_id
- level
- progress
- unlocked_date
- active
```

Fighter는 여러 장 보유.
Active count 기본 최대 5.

---

# 12. RingNameDefinition / State

```text
RingNameDefinition
- ring_name_id
- unique_flag
- unlock_conditions[]
- combat_modifiers[]
- ticket_power_modifiers[]
- matchmaking_modifiers[]
- opponent_modifiers[]

FighterRingNameState
- ring_name_id
- unlocked
- unlocked_date
- source_event_id
```

동일 Ring Name 동시 사용 제약은 World/Management Layer에서 검증.

---

# 13. ConditionState

```text
ConditionState
- stamina_baseline
- fatigue
- recovery_debt
- stress
- fight_readiness_summary
- body_parts{}
- injuries[]
- permanent_wear{}
- medical_suspension
- weight_state
```

## BodyPartState

```text
- part_id
- current_condition
- fight_damage
- permanent_wear
- injury_ids[]
```

---

# 14. InjuryState

```text
InjuryState
- injury_id
- body_part
- injury_type
- severity_internal
- functional_penalty
- recovery_progress
- estimated_recovery_true
- reinjury_risk
- training_restrictions[]
- fight_restriction
- created_event_id
```

Player가 보는 예상 회복기간은 별도 Medical Knowledge Record로 생성한다.

---

# 15. CareerState

```text
CareerState
- fight_record
- undefeated_streak
- ranking_entries[]
- titles[]
- ticket_power
- performance_awards[]
- rivalry_ids[]
- activity_state
- player_reputation_contribution
- promotion_relationships[]
- fight_history_ids[]
```

`Actual Strength`, `Ranking`, `Ticket Power`, `Record`는 별도 필드/시스템으로 유지.

---

# 16. RelationshipState

```text
RelationshipState
- trust
- respect
- satisfaction
- promise_ids[]
- relationship_history[]
```

고정 Loyalty / Personality 없음.

---

# 17. Player Knowledge Model

```text
FighterKnowledgeState
- fighter_id
- discovered
- discovery_sources[]
- knowledge_domains{}
- attribute_estimates{}
- technique_knowledge{}
- body_knowledge{}
- potential_knowledge
- report_history[]
```

## KnowledgeRecord

```text
- subject_key
- estimated_low
- estimated_high
- confidence
- freshness
- evidence_amount
- last_observed_date
- interpreter_id
```

Knowledge Domain 예:
- Physical
- Striking
- Grappling
- Combat Intelligence
- Technique
- Rule Familiarity
- Weight Adaptation
- Potential
- Market

---

# 18. Evidence Model

```text
EvidenceRecord
- evidence_id
- fighter_id
- source_type
- source_event_id
- observed_action
- target_knowledge_keys[]
- evidence_strength
- timestamp
- raw_fact
```

Raw Evidence는 변조하지 않는다.
Interpretation 결과만 KnowledgeRecord에 반영한다.

---

# 19. ActionDefinition

```text
ActionDefinition
- action_id
- category
- related_technique_id
- impact_coefficient
- speed_coefficient
- energy_cost
- optimal_range
- range_tolerance
- vulnerability_window
- recovery_time
- setup_tags[]
- target_options[]
- rule_availability[]
- transition_options[]
```

---

# 20. CombatState

```text
CombatState
- fight_id
- round
- time
- fighter_states{}
- range_state
- position_state
- grapple_advantage
- combat_memory{}
- current_strategy{}
- judging_state
- action_log[]
```

## FighterCombatState

```text
- effective_performance_cache
- stamina
- local_damage{}
- status: Normal/Stagger/Groggy/Knockdown
- active_skill_cards[]
- pattern_expectations{}
- read_confidence{}
- temporary_vulnerability
```

---

# 21. Combat Memory / Setup

```text
CombatMemoryState
- sequence_exposure{}
- opponent_expectations{}
- read_confidence{}
- pattern_age{}
- observed_feints[]
```

Setup은 별도 영구 Fighter Stat으로 저장하지 않는다.
현재 Fight Context에만 존재.

---

# 22. FightDefinition / FightState

```text
FightDefinition
- ruleset_id
- weight_requirement
- rounds
- round_duration
- judging_profile
- medical_rules
- allowed_actions

FightState
- participants[]
- fight_definition_id
- pre_fight_state
- combat_state
- judge_cards[]
- result
- performance_evaluation
- generated_evidence[]
- post_fight_damage
```

---

# 23. JudgingProfile

공통 Judging Core 사용.

```text
JudgingProfile
- effective_striking_weight
- damage_quality_weight
- knockdown_weight
- effective_grappling_weight
- submission_threat_weight
- ground_control_weight
- clinch_control_weight
- fight_control_weight
- disabled_categories[]
```

Ruleset별로 불가능한 Category를 비활성화.

---

# 24. Weekly Calendar

```text
WeeklySchedule
- fighter_id
- week_id
- activities[]
- coach_assignments[]
- predicted_load
- predicted_weight
- predicted_stress
```

## ActivityDefinition

```text
- activity_id
- duration
- training_load
- stress_effect
- recovery_effect
- growth_weights{}
- technique_exp
- sharpness_effect
- tactical_prep_effect
- ticket_power_effect
- injury_risk_modifier
- facility_requirements[]
- staff_role_requirements[]
```

---

# 25. FightCampState

```text
FightCampState
- fight_id
- start_date
- target_weight
- physical_fitness
- tactical_preparation
- technical_sharpness
- weight_readiness
- mental_life_state
- opponent_analysis_state
- setup_plan_ids[]
- camp_template_id
```

Fight Readiness는 위 상태의 UI Summary.

---

# 26. StaffState

```text
StaffState
- staff_id
- role
- capabilities{}
- specialties[]
- region_knowledge[]
- fighter_capacity
- assigned_fighters[]
- workload
- salary
```

---

# 27. PlayerState

```text
PlayerState
- coaching
- analysis
- scouting
- negotiation
- management
- reputation
- direct_managed_fighter_ids[]
- relationship_links[]
```

Capability와 Reputation을 분리.

---

# 28. FacilityState

```text
FacilityState
- core_gym
- striking_module
- grappling_module
- strength_conditioning_module
- recovery_medical_module
- analysis_module
- capacity
- maintenance_cost
```

시설은 직접 Combat Buff를 주지 않는다.

---

# 29. DelegationPolicy

```text
DelegationPolicy
- fighter_id
- training_mode
- fight_camp_mode
- weight_mode
- matchmaking_mode
- media_mode
- medical_mode
- responsible_staff_ids{}
- escalation_thresholds{}
```

Mode:
- Manual
- Assisted
- Delegated
- AutoWithPolicy

---

# 30. Contract Models

## ManagementContract

```text
- fighter_id
- management_share
- duration
- fight_commitment
- training_support
- termination_clause
- bonuses[]
- sponsor_share
- promises[]
```

## FightContract

```text
- promotion_id
- fighter_id
- fight_count
- purse_terms
- bonus_terms
- weight_terms
- title_terms
- exclusivity
```

---

# 31. FightOffer

```text
FightOffer
- offer_id
- source
- fighter_id
- opponent_id
- ruleset
- weight
- date
- base_purse
- win_bonus
- finish_bonus
- ranking_opportunity
- event_value
- short_notice
- title_implication
- rivalry_id
- opponent_ticket_power
- expiration_date
```

Player UI의 Risk는 Knowledge/Coach Report를 통해 계산.
정확한 실제 승률은 기본 노출하지 않는다.

---

# 32. PromotionState

```text
PromotionState
- promotion_id
- prestige
- region
- ruleset_focus[]
- budget_tier
- event_frequency
- ticket_power_preference
- competitive_preference
- player_relationship
```

2부 Ranking은 Promotion별로 분리하지 않는다.

---

# 33. RankingState

```text
RankingEntry
- ruleset
- weight_division
- champion_id
- ordered_fighter_ids[]
- last_updated
```

플레이어용 Ranking Point 없음.
내부 Ranking Algorithm용 임시 Score는 계산 가능하지만 Persistent Gameplay Resource로 취급하지 않는다.

---

# 34. RivalryState

```text
RivalryState
- rivalry_id
- fighter_a
- fighter_b
- progress
- source_events[]
- media_amplification
- last_interaction_date
```

History 기반으로 생성.

---

# 35. SponsorState

```text
SponsorOffer
- sponsor_id
- target_type: Fighter | Management
- payment
- duration
- requirements[]
- appearance_load
- media_load
- performance_bonus
- exclusivity
```

Sponsor 일정은 Calendar Activity로 생성.

---

# 36. WorldState

```text
WorldState
- fighters{}
- promotions{}
- rankings{}
- active_fights[]
- scheduled_events[]
- news_feed[]
- generation_state
- history
```

---

# 37. Simulation Tier

```text
SimulationTier
- A_PLAYER_RELEVANT
- B_KNOWN_WORLD
- C_BACKGROUND
```

Tier는 Fighter Data 자체를 바꾸지 않고 **업데이트 정밀도 / 빈도**만 변경한다.

---

# 38. Event System

모든 중요한 변화는 Event History로 남긴다.

예:
- FightCompleted
- InjuryCreated
- TechniqueLearned
- SkillCardUnlocked
- RingNameUnlocked
- Breakthrough
- WeightMiss
- ContractSigned
- PromiseBroken
- RivalryStarted
- ChampionshipWon
- FirstLoss
- Retirement

이벤트가 Evidence / Relationship / Ticket Power / World News의 공통 Source가 된다.

---

# 39. Definition / Runtime State 분리

반드시 구분한다.

## Definition Data
변하지 않는 콘텐츠/밸런스 데이터.
- Action
- Technique
- Skill Card
- Ring Name
- Ruleset
- Weight Division
- Training Activity
- Facility Level
- Injury Type

## Runtime State
Save마다 변하는 상태.
- Fighter Ability
- Knowledge
- Injury
- Exp
- Contracts
- Rankings
- World History

이 분리가 Modding / 밸런싱 / 테스트의 기반이다.

---

# 40. Config / Balance Tables

권장 Config 그룹:

- combat.yaml/json
- actions.*
- techniques.*
- skill_cards.*
- ring_names.*
- growth.*
- cardio.*
- injury.*
- weight.*
- scouting.*
- training.*
- staff.*
- facilities.*
- contracts.*
- matchmaking.*
- ranking.*
- ticket_power.*
- world_generation.*

파일 형식 자체는 구현 언어에 맞춰 결정.

---

# 41. Determinism / Testing

Headless Simulation은 동일 Seed + 동일 Input이면 동일 결과를 재현할 수 있어야 한다.

필요 목적:
- 전투 버그 재현
- 밸런스 비교
- AI Strategy 비교
- 수천 경기 Monte Carlo 테스트
- Growth Curve 검증
- Ranking 안정성 검증

3D Presentation을 붙이기 전에 이 Data Model과 Headless Engine이 먼저 안정되어야 한다.
