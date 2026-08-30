# EA SPORTS UFC 5 — FCM Benchmark Research

> Focus: fighter parameters, combat-result coupling, damage, progression, and implications for Fight Club Manager.

## Why benchmark UFC 5

FCM is a management simulation rather than a directly controlled fighting game, but UFC 5 is useful as a reference for deciding which fighter parameters should exist underneath the simulation engine and how those parameters can affect observable combat outcomes.

## Fighter rating structure

EA's public fighter roster exposes distinct combat parameters rather than relying only on one overall rating. Examples include:

- Punch Power
- Kick Power
- Punch Speed
- Kick Speed
- Body Strength
- Leg Strength
- Takedowns

This demonstrates a useful principle for FCM: physically different capabilities should remain independently represented when they create meaningfully different fight outcomes.

Example public roster page: Conor McGregor (Legacy) exposes separate punch/kick power, punch/kick speed, strength and takedown values.

## Attribute-to-combat coupling

UFC 5's gameplay documentation describes an Authentic Damage system where accumulated damage changes a fighter's capabilities during the fight.

Examples:

- damage around an eye can reduce defense on that side;
- accumulated leg damage can reduce mobility;
- ground striking attributes affect ground-and-pound damage.

This is important for FCM because parameters should not exist only as pre-fight comparison numbers. They should feed directly into the simulation state and visibly alter behavior or physical performance.

## Progression reference

UFC 5 Online Career awards evolution resources that can improve:

- attributes;
- moves;
- perks.

This separation is conceptually relevant to FCM's proposed structure:

- Parameters = quantitative base capability;
- Skill Cards = special moves/behaviors/effects;
- Ring Name = achievement-driven identity/effect layer.

FCM should not copy UFC 5's player-controlled progression, but the separation of raw attributes from move/perk layers supports FCM's current design direction.

## Important design lesson for FCM

Do not compress all fighter quality into a single number.

A fighter should be strong because a particular combination of parameters, body characteristics, rule familiarity, skill cards and strategy creates an effective fighting style.

A fighter with lower apparent general evaluation should still be able to outperform a more highly rated fighter when the matchup favors their specialized capabilities.

## Candidate concepts worth revisiting later

- Localized damage affecting temporary parameters
- Mobility loss caused by leg damage
- Fight-state-dependent parameter degradation
- Separate standing and ground offensive capability
- Difference between raw physical capability and move/skill repertoire

## Sources

- EA SPORTS UFC 5 Gameplay Deep Dive: https://www.ea.com/games/ufc/ufc-5/news/ufc-5-gameplay
- EA SPORTS UFC 5 Fighter Roster / Ratings: https://www.ea.com/games/ufc/ufc-5/roster-hub
- Example fighter rating page — Conor McGregor (Legacy): https://www.ea.com/games/ufc/ufc-5/roster-hub/conor-mcgregor-legacy-ftw
- EA SPORTS UFC 5 patch notes discussing Ground Striking attribute effects: https://www.ea.com/games/ufc/ufc-5/news/ufc-5-patch-notes-2
