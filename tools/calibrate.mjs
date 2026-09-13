// AI calibration environment. Roadmap Phase 12.
// Spec: docs/design/34_ai_equilibrium.md
//
// This exists to be re-run. Whenever cards, formulas or balance values change, the previous
// AI mixture is stale — it was the answer to a different game. Running this regenerates it,
// and `check` fails loudly when the committed mixture no longer matches the current rules.
//
//   node tools/calibrate.mjs solve [rounds] [poolSize]     regenerate config/ai_strategies.json
//   node tools/calibrate.mjs check                         fail if the committed mixture is stale
//   node tools/calibrate.mjs report                        inspect the current mixture
//   node tools/calibrate.mjs policies [rounds] [poolSize]  solve over REACTIVE policies
//   node tools/calibrate.mjs grammar                       which of the policy grammar is load-bearing
//   node tools/calibrate.mjs matchup [rounds] [poolSize]   closed guard vs open guard, side by side
//
// `solve` works over fixed plans: one combo thrown every turn for the whole fight. That is
// the wrong question for any card that exists to answer a read, so `policies` solves the
// same game over per-turn decision rules instead, and reports which cards actually reach
// the timeline. Use it to judge movement, the side step and anything else conditional.

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile as readSource } from 'node:fs/promises';
import { readConfig } from './config_source.mjs';
import { loadDefinitions } from '../dist/definitions.js';
import { configureEngine, CARDS } from '../dist/engine.js';
import { createRngSet } from '../dist/rng.js';
import { samplePlans, planKey } from '../dist/plan-space.js';
import { doubleOracle, payoffMatrix, fictitiousPlay, exploitability, supportOf, duel, duelPolicies, deviateMixture, clearDuelCache, clearPolicyDuelCache, cardUsage, grammarUsage, conditionBaseRates, columnExploitability,
  isSymmetricMatchup, CLOSED_GUARD, OPEN_GUARD, POLICY_SPACE } from '../dist/equilibrium.js';
import { samplePolicies, policyKey, describePolicy, ROLES, CONDITIONS, thresholdsFor } from '../dist/policy.js';
import { ALL_BASE_PARAMETERS } from '../dist/fighter-schema.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(root, 'config', 'ai_strategies.json');
const POLICY_OUTPUT = join(root, 'config', 'ai_policies.json');

const definitions = await loadDefinitions(readConfig);
configureEngine(definitions);

// Identical stats on both sides: the payoff then measures strategy alone.
const MIRROR = { base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 60])) };
// Above this, a best responder still beats the mixture easily and the solution is provisional.
// The dead-card list in particular must not be read from an unconverged solve: a card can be
// absent simply because the search never reached the plans that use it well.
const CONVERGED_BELOW = 0.2;
const SEED = 20260101;
const OPTIONS = { stats: MIRROR, seeds: [1], profile: 'pressure' };
// Policies need more than one seed. A single seed makes every duel a bare win or loss, so the
// payoff matrix is a tournament of +-1 and fictitious play thrashes between cycles. Three
// seeds give intermediate values and the mixture settles.
const POLICY_OPTIONS = { stats: MIRROR, seeds: [1, 2, 3], profile: 'pressure' };

// A fingerprint of everything that changes what a plan is worth. If this moves, the committed
// mixture was solved for a different game and must be regenerated.
// Resolution code counts as a rule. An engine change can alter what a plan is worth just as
// much as a config change can — the RNG warm-up fix did exactly that and a config-only
// fingerprint did not notice.
const ENGINE_SOURCE = await readSource(join(root, 'dist', 'engine.js'), 'utf8');
// The role vocabulary is part of the policy game's rules: change what a role throws and every
// solved policy means something else.
const POLICY_SOURCE = await readSource(join(root, 'dist', 'policy.js'), 'utf8');

function fnv(text) {
  let hash = 2166136261;
  for (const ch of text) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function ruleParts() {
  const cfg = definitions.configs.combat_prototype;
  return [
    ENGINE_SOURCE,
    JSON.stringify(cfg.rules), JSON.stringify(cfg.modifiers), JSON.stringify(cfg.status),
    JSON.stringify(cfg.rounds), JSON.stringify(cfg.subBeat), JSON.stringify(cfg.range),
    JSON.stringify(cfg.firstStrike), JSON.stringify(cfg.intervalRecovery),
    ...Object.keys(cfg.cards).sort().map(id => `${id}:${JSON.stringify(ruleFields(cfg.cards[id]))}`)
  ];
}

// A card's name is not a rule. Hashing the whole card object meant that renaming a card, or
// rewording its description, invalidated every solved mixture and demanded a fifteen-minute
// recalculation for a change that cannot move a single plan's value. Presentation is excluded
// on the same principle that keeps it out of the engine.
const PRESENTATION = new Set(['name', 'short', 'description']);
function ruleFields(card) {
  return Object.fromEntries(Object.entries(card)
    .filter(([key]) => !PRESENTATION.has(key) && !key.startsWith('note'))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function rulesFingerprint() { return fnv(ruleParts().join('|')); }
function policyFingerprint() { return fnv([...ruleParts(), POLICY_SOURCE].join('|')); }

// In-pool exploitability understates convergence: it only looks at plans already known.
// The honest measure is whether a fresh search can still find something that beats the
// mixture, so both are reported and the second is what decides convergence.
function externalBestResponse(pool, strategy, rng, { candidates = 400, options = OPTIONS } = {}) {
  let best = 0, bestPlan = null;
  const known = new Set(pool.map(planKey));
  for (const candidate of samplePlans(rng, candidates)) {
    if (known.has(planKey(candidate))) continue;
    let value = 0;
    for (let j = 0; j < pool.length; j++) {
      if (!strategy[j]) continue;
      value += strategy[j] * duel(candidate, pool[j], options);
    }
    if (value > best) { best = value; bestPlan = candidate; }
  }
  return { gain: best, plan: bestPlan };
}

async function solve(rounds = 8, poolSize = 28) {
  clearDuelCache();
  const rng = createRngSet(SEED, definitions).stream('combat');
  const started = Date.now();
  console.log(`풀 ${poolSize}, 라운드 ${rounds}. 결정론적 전투라 표본이 아니라 정답을 계산합니다.`);
  const result = doubleOracle(samplePlans(rng, poolSize), rng, {
    rounds, candidatesPerRound: 220, addPerRound: 6, options: OPTIONS,
    onRound: h => console.log(`  round ${h.round}  pool ${String(h.poolSize).padStart(3)}  support ${String(h.support).padStart(2)}  최적대응 이득 ${h.gain.toFixed(3)}  풀내 exploit ${h.exploitability.toFixed(3)}`)
  });

  const external = externalBestResponse(result.pool, result.solution.strategy, rng);
  const support = supportOf(result.pool, result.solution.strategy);

  // Difficulty is distance from equilibrium. The weakest plans in the pool are what an easier
  // tier mixes in, so a lower tier is beatable by the same reads that beat a real novice.
  const ranked = result.pool
    .map((plan, i) => ({ i, value: result.matrix[i].reduce((a, b) => a + b, 0) / result.pool.length }))
    .sort((a, b) => a.value - b.value);
  const weakest = ranked.slice(0, Math.max(3, Math.floor(result.pool.length / 4))).map(e => e.i);

  const tiers = {};
  for (const [tier, deviation] of Object.entries({ apprentice: 0.75, standard: 0.4, contender: 0.15, brutal: 0 })) {
    const mixture = deviateMixture(result.solution.strategy, deviation, { weakestFirst: weakest });
    tiers[tier] = {
      deviation,
      exploitability: Number(exploitability(result.matrix, mixture).toFixed(4)),
      mixture: result.pool
        .map((plan, i) => ({ plan, weight: Number(mixture[i].toFixed(5)) }))
        .filter(entry => entry.weight >= 0.0005)
    };
  }

  const document = {
    config_version: '0.1.0-draft',
    description: 'Equilibrium AI mixtures solved by self-play. Regenerate with: node tools/calibrate.mjs solve',
    spec_reference: 'docs/design/34_ai_equilibrium.md',
    generated: {
      rules_fingerprint: rulesFingerprint(),
      seed: SEED,
      rounds,
      pool_size: result.pool.length,
      game_value: Number(result.solution.value.toFixed(5)),
      in_pool_exploitability: Number(result.exploitability.toFixed(4)),
      external_best_response_gain: Number(external.gain.toFixed(4)),
      note: 'game_value must sit at zero: the game is symmetric and zero-sum, so any drift means the payoff matrix stopped being antisymmetric. external_best_response_gain is the honest convergence measure; in_pool_exploitability only sees plans already in the pool.'
    },
    equilibrium_support: support.map(s => ({ plan: s.plan, weight: Number(s.weight.toFixed(5)) })),
    tiers
  };

  await writeFile(OUTPUT, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`\n게임 값 ${document.generated.game_value} (0이어야 정상)`);
  console.log(`풀내 exploitability ${document.generated.in_pool_exploitability}  |  외부 최적대응 이득 ${document.generated.external_best_response_gain}`);
  console.log(`지지집합 ${support.length}개, ${Date.now() - started}ms`);
  if (external.gain > CONVERGED_BELOW) {
    console.log(`
  ⚠ 수렴 전입니다 (외부 이득 ${external.gain.toFixed(3)} > ${CONVERGED_BELOW}).`);
    console.log('    이 해의 지지집합과 미사용 카드 목록은 신뢰할 수 없습니다.');
    console.log('    풀 크기와 라운드를 늘려 다시 풀어야 합니다.');
  }
  for (const s of support.slice(0, 8)) console.log(`  ${(s.weight * 100).toFixed(1).padStart(5)}%  ${s.plan.join(' + ')}`);
  console.log(`\n기록: ${OUTPUT}`);
  return document;
}

async function loadJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}
const loadCommitted = () => loadJson(OUTPUT);

// The regression guard. Balance changes silently invalidate a solved mixture; this makes that
// visible instead of leaving a stale AI in place.
async function check() {
  const committed = await loadCommitted();
  if (!committed) {
    console.error('ai_strategies.json이 없습니다. node tools/calibrate.mjs solve 를 실행하세요.');
    process.exitCode = 1;
    return;
  }
  const current = rulesFingerprint();
  if (committed.generated.rules_fingerprint !== current) {
    console.error('전투 규칙이 바뀌어 저장된 AI 혼합전략이 낡았습니다.');
    console.error(`  저장 ${committed.generated.rules_fingerprint} vs 현재 ${current}`);
    console.error('  node tools/calibrate.mjs solve 로 다시 계산하세요.');
    process.exitCode = 1;
    return;
  }
  for (const [tier, spec] of Object.entries(committed.tiers)) {
    const total = spec.mixture.reduce((n, e) => n + e.weight, 0);
    if (Math.abs(total - 1) > 0.02) {
      console.error(`${tier} 혼합전략 가중치 합이 1이 아닙니다: ${total}`);
      process.exitCode = 1;
      return;
    }
    for (const entry of spec.mixture) {
      for (const id of entry.plan) {
        if (!CARDS[id]) {
          console.error(`${tier} 혼합전략이 사라진 카드를 참조합니다: ${id}`);
          process.exitCode = 1;
          return;
        }
      }
    }
  }
  console.log(`AI 혼합전략이 현재 전투 규칙과 일치합니다 (fingerprint ${current}).`);

  // The policy solve has its own fingerprint: it also depends on the role vocabulary, so a
  // change to dist/policy.js stales it even when the combat rules are untouched.
  const policies = await loadJson(POLICY_OUTPUT);
  if (!policies) {
    console.log('반응형 정책 해는 아직 없습니다. node tools/calibrate.mjs policies 로 계산할 수 있습니다.');
    return;
  }
  const policyCurrent = policyFingerprint();
  if (policies.generated.policy_fingerprint !== policyCurrent) {
    console.error('전투 규칙 또는 역할 목록이 바뀌어 저장된 반응형 정책 해가 낡았습니다.');
    console.error(`  저장 ${policies.generated.policy_fingerprint} vs 현재 ${policyCurrent}`);
    console.error('  node tools/calibrate.mjs policies 로 다시 계산하세요.');
    process.exitCode = 1;
    return;
  }
  console.log(`반응형 정책 해도 일치합니다 (fingerprint ${policyCurrent}).`);
}

async function report() {
  const committed = await loadCommitted();
  if (!committed) { console.error('아직 계산된 전략이 없습니다.'); process.exitCode = 1; return; }
  console.log(`fingerprint ${committed.generated.rules_fingerprint}  게임 값 ${committed.generated.game_value}`);
  const gain = committed.generated.external_best_response_gain;
  const converged = gain <= CONVERGED_BELOW;
  console.log(`외부 최적대응 이득 ${gain} ${converged ? '(수렴)' : `(수렴 전, 기준 ${CONVERGED_BELOW})`}
`);
  console.log('등급별 이탈과 착취 가능성:');
  for (const [tier, spec] of Object.entries(committed.tiers)) {
    console.log(`  ${tier.padEnd(11)} 이탈 ${String(spec.deviation).padEnd(5)} exploitability ${spec.exploitability.toFixed(4)}  계획 ${spec.mixture.length}개`);
  }
  console.log('\n균형 지지집합:');
  for (const s of committed.equilibrium_support) console.log(`  ${(s.weight * 100).toFixed(1).padStart(5)}%  ${s.plan.join(' + ')}`);
  const dead = Object.keys(CARDS).filter(id => id !== 'rest' && !committed.equilibrium_support.some(s => s.plan.includes(id)));
  console.log(`\n균형에서 쓰이지 않는 카드: ${dead.length ? dead.join(', ') : '없음'}`);
  const policies = await loadJson(POLICY_OUTPUT);
  if (policies) {
    // Conditional cards cannot be judged from a fixed-plan solve, so the two lists are read
    // together: absent here but used there means the card works, just not by repetition.
    const usedReactively = Object.entries(policies.card_usage).filter(([, share]) => share > 0).map(([id]) => id);
    const rescued = dead.filter(id => usedReactively.includes(id));
    console.log(`  반응형 정책 균형에서는 실제로 쓰이는 카드: ${rescued.length ? rescued.join(', ') : '없음'}`);
    const neverUsed = dead.filter(id => !usedReactively.includes(id));
    console.log(`  양쪽 모두에서 쓰이지 않는 카드: ${neverUsed.length ? neverUsed.join(', ') : '없음'}`);
  }
  if (converged) {
    console.log('  (균형에 한 번도 등장하지 않는 카드는 죽은 콘텐츠 후보입니다)');
  } else {
    console.log('  이 목록은 신뢰할 수 없습니다. 수렴 전 해라 탐색이 닿지 않아 빠졌을 수 있습니다.');
    console.log('  더 큰 풀로 다시 푼 뒤 판단하세요. 이 목록을 보고 수치를 조정하면 안 됩니다.');
  }
}

// Reactive-policy solving. Same game, same solver, different strategy space: instead of one
// fixed combo the strategy is a short list of "when this, do that" rules re-read every turn.
//
// The point is the card usage table at the end. A card is only dead if it is absent from the
// timeline when reactive play is on the table — absence from a fixed-plan equilibrium proves
// nothing about a card whose whole purpose is to answer a read.
function externalPolicyResponse(pool, strategy, rng, { candidates = 300 } = {}) {
  let best = 0, bestPolicy = null;
  const known = new Set(pool.map(policyKey));
  for (const candidate of samplePolicies(rng, candidates)) {
    if (known.has(policyKey(candidate))) continue;
    let value = 0;
    for (let j = 0; j < pool.length; j++) {
      if (!strategy[j]) continue;
      value += strategy[j] * duelPolicies(candidate, pool[j], POLICY_OPTIONS);
    }
    if (value > best) { best = value; bestPolicy = candidate; }
  }
  return { gain: best, policy: bestPolicy };
}

async function solvePolicies(rounds = 8, poolSize = 36) {
  clearPolicyDuelCache();
  const rng = createRngSet(SEED, definitions).stream('combat');
  const started = Date.now();
  console.log(`반응형 정책 풀 ${poolSize}, 라운드 ${rounds}. 매 턴 다시 결정하는 전략끼리 풉니다.`);
  const result = doubleOracle(samplePolicies(rng, poolSize), rng, {
    rounds, candidatesPerRound: 200, addPerRound: 6, options: POLICY_OPTIONS, space: POLICY_SPACE,
    onRound: h => console.log(`  round ${h.round}  pool ${String(h.poolSize).padStart(3)}  support ${String(h.support).padStart(2)}  최적대응 이득 ${h.gain.toFixed(3)}  풀내 exploit ${h.exploitability.toFixed(3)}`)
  });

  const external = externalPolicyResponse(result.pool, result.solution.strategy, rng);
  const support = supportOf(result.pool, result.solution.strategy);
  const usage = cardUsage(result.pool, result.solution.strategy, { seeds: POLICY_OPTIONS.seeds, stats: MIRROR, profile: POLICY_OPTIONS.profile });
  const unreachable = Object.keys(CARDS).filter(id => !Object.values(ROLES).some(role => role.includes(id)));
  const unused = Object.keys(CARDS).filter(id => id !== 'rest' && !usage[id]);

  const document = {
    config_version: '0.1.0-draft',
    description: 'Equilibrium over reactive policies. Regenerate with: node tools/calibrate.mjs policies',
    spec_reference: 'docs/design/34_ai_equilibrium.md',
    generated: {
      policy_fingerprint: policyFingerprint(),
      seed: SEED,
      rounds,
      pool_size: result.pool.length,
      game_value: Number(result.solution.value.toFixed(5)),
      in_pool_exploitability: Number(result.exploitability.toFixed(4)),
      external_best_response_gain: Number(external.gain.toFixed(4)),
      note: 'Strategies here are decision rules, not combos. card_usage is measured by replaying the mixture and counting what actually reached the timeline, which is the only way a conditional card can show its value.'
    },
    equilibrium_support: support.map(s => ({ policy: s.plan, description: describePolicy(s.plan), weight: Number(s.weight.toFixed(5)) })),
    card_usage: Object.fromEntries(Object.entries(usage).sort((a, b) => b[1] - a[1]).map(([id, share]) => [id, Number(share.toFixed(4))])),
    unreachable_cards: unreachable
  };

  await writeFile(POLICY_OUTPUT, `${JSON.stringify(document, null, 2)}
`);
  console.log(`\n게임 값 ${document.generated.game_value} (0이어야 정상)`);
  console.log(`풀내 exploitability ${document.generated.in_pool_exploitability}  |  외부 최적대응 이득 ${document.generated.external_best_response_gain}`);
  console.log(`지지집합 ${support.length}개, ${Date.now() - started}ms`);
  if (external.gain > CONVERGED_BELOW) {
    console.log(`\n  ⚠ 수렴 전입니다 (외부 이득 ${external.gain.toFixed(3)} > ${CONVERGED_BELOW}). 사용률 표를 근거로 수치를 조정하지 마세요.`);
  }
  console.log('\n균형 정책:');
  for (const s of support.slice(0, 8)) console.log(`  ${(s.weight * 100).toFixed(1).padStart(5)}%  ${describePolicy(s.plan)}`);
  console.log('\n타임라인에 실제로 나온 카드 비율:');
  for (const [id, share] of Object.entries(document.card_usage)) console.log(`  ${id.padEnd(10)} ${(share * 100).toFixed(1).padStart(5)}%`);
  if (unreachable.length) console.log(`\n어떤 역할에도 없어 애초에 나올 수 없는 카드: ${unreachable.join(', ')}`);
  console.log(`균형에서 한 번도 나오지 않은 카드: ${unused.length ? unused.join(', ') : '없음'}`);
  console.log(`\n기록: ${POLICY_OUTPUT}`);
  return document;
}

// Is the policy grammar doing any work? A policy can carry four rules and still behave like a
// constant. Written-down rules are not played rules, so this replays the solved mixture and
// counts which rule actually decided each turn. Read it before widening the grammar: adding
// conditions multiplies the search space, and is only worth it if the ones present are used.
async function grammar() {
  // Base rates first: they need no solve, and they explain most of what the rest shows.
  const rates = conditionBaseRates({ stats: MIRROR, seeds: POLICY_OPTIONS.seeds, profile: POLICY_OPTIONS.profile });
  console.log('조건이 참일 확률 (모든 역할 조합 자가 대전):');
  for (const [label, rate] of Object.entries(rates)) {
    const warn = rate < 0.03 ? '   ← 거의 발동하지 않음' : rate > 0.9 ? '   ← 사실상 기본 역할' : '';
    console.log(`  ${label.padEnd(20)} ${(rate * 100).toFixed(2).padStart(6)}%${warn}`);
  }

  const doc = await loadJson(POLICY_OUTPUT);
  if (!doc) { console.log('\n반응형 정책 해가 아직 없어 여기까지입니다. node tools/calibrate.mjs policies 로 계산하세요.'); return; }
  if (doc.equilibrium_support.some(s => s.policy.rules.some(r => !CONDITIONS.includes(r.when)))) {
    console.log('\n저장된 해가 이전 문법으로 풀린 것입니다. node tools/calibrate.mjs policies 로 다시 계산하세요.');
    return;
  }
  console.log('');
  const pool = doc.equilibrium_support.map(s => s.policy);
  const strategy = doc.equilibrium_support.map(s => s.weight);
  const usage = grammarUsage(pool, strategy, { seeds: POLICY_OPTIONS.seeds, stats: MIRROR, profile: POLICY_OPTIONS.profile });

  console.log(`정책 ${pool.length}개, 규칙 개수 분포 ${JSON.stringify(pool.reduce((acc, p) => ({ ...acc, [p.rules.length]: (acc[p.rules.length] ?? 0) + 1 }), {}))}`);
  console.log(`\n한 경기에서 실제로 던진 서로 다른 콤보 수: ${usage.distinctPlansPerMatch.toFixed(2)}`);
  if (usage.distinctPlansPerMatch < 1.5) console.log('  ⚠ 1에 가까우면 반응형이라는 이름뿐입니다.');
  console.log(`기본 역할로 결정한 비율: ${(usage.fallbackShare * 100).toFixed(1)}%`);

  console.log('\n실제로 발동한 조건:');
  for (const when of CONDITIONS) {
    const share = usage.byCondition[when] ?? 0;
    console.log(`  ${when.padEnd(18)} ${(share * 100).toFixed(1).padStart(5)}%${share === 0 ? '   ← 한 번도 발동하지 않음' : ''}`);
  }
  console.log('\n몇 번째 규칙이 결정했나 (뒤쪽 규칙이 0이면 문법이 그만큼 낭비):');
  for (const [index, share] of Object.entries(usage.byRuleIndex).sort((a, b) => a[0] - b[0])) {
    console.log(`  ${Number(index) + 1}번째      ${(share * 100).toFixed(1).padStart(5)}%`);
  }

  // A role no policy ever selects is grammar that exists only to be skipped.
  const selected = new Set(pool.flatMap(p => [p.fallback, ...p.rules.map(r => r.role)]));
  const unused = Object.keys(ROLES).filter(r => !selected.has(r));
  console.log(`\n균형이 한 번도 고르지 않은 역할: ${unused.length ? unused.join(', ') : '없음'}`);
}

// Stance matchups. Every other mode solves orthodox against orthodox, so open guard — the one
// matchup the stance system exists for — had never been solved at all.
//
// Open guard is genuinely ASYMMETRIC even though the impact modifier treats both fighters
// alike, because a side step is named by the stepper's own movement: facing a southpaw and
// facing an orthodox are different problems. So the game value stops being a bug detector and
// becomes the measurement that matters — how much the matchup favours one corner.
function planCardShare(pool, mixture) {
  const counts = new Map();
  let total = 0;
  pool.forEach((plan, i) => {
    const weight = mixture[i];
    if (!weight) return;
    for (const id of plan) {
      counts.set(id, (counts.get(id) ?? 0) + weight);
      total += weight;
    }
  });
  return Object.fromEntries([...counts].sort((a, b) => b[1] - a[1]).map(([id, n]) => [id, n / (total || 1)]));
}

function solveMatchup(label, stances, rounds, poolSize, rng) {
  clearDuelCache();
  const options = { ...OPTIONS, stances };
  const symmetric = isSymmetricMatchup(stances);
  const started = Date.now();
  console.log(`\n=== ${label} (${stances.join(' vs ')}) ${symmetric ? '대칭' : '비대칭'} ===`);
  const result = doubleOracle(samplePlans(rng, poolSize), rng, {
    rounds, candidatesPerRound: 220, addPerRound: 6, options,
    onRound: h => console.log(`  round ${h.round}  pool ${String(h.poolSize).padStart(3)}  support ${String(h.support).padStart(2)}  최적대응 이득 ${h.gain.toFixed(3)}`)
  });
  const external = externalBestResponse(result.pool, result.solution.opponent, rng, { options });
  const rowShare = planCardShare(result.pool, result.solution.strategy);
  const colShare = planCardShare(result.pool, result.solution.opponent);
  const value = result.solution.value;
  console.log(`게임 값 ${value.toFixed(4)}${symmetric ? ' (0이어야 정상)' : `  ← ${stances[0]} 쪽 이득`}`);
  console.log(`풀내 exploit  행 ${exploitability(result.matrix, result.solution.opponent).toFixed(4)}  열 ${columnExploitability(result.matrix, result.solution.strategy).toFixed(4)}`);
  console.log(`외부 최적대응 이득 ${external.gain.toFixed(4)}${external.gain > CONVERGED_BELOW ? '  ⚠ 수렴 전' : '  (수렴)'}`);
  console.log(`지지집합 ${supportOf(result.pool, result.solution.strategy).length}개, ${Date.now() - started}ms`);
  return { label, stances, symmetric, value, external: external.gain, rowShare, colShare, pool: result.pool.length };
}

async function matchup(rounds = 8, poolSize = 28) {
  const rng = createRngSet(SEED, definitions).stream('combat');
  const closed = solveMatchup('클로즈드 가드', CLOSED_GUARD, rounds, poolSize, rng);
  const open = solveMatchup('오픈 가드', OPEN_GUARD, rounds, poolSize, rng);

  console.log('\n=== 카드 사용 비중 ===');
  const ids = [...new Set([...Object.keys(closed.rowShare), ...Object.keys(open.rowShare), ...Object.keys(open.colShare)])];
  console.log(`  ${'카드'.padEnd(16)}${'클로즈드'.padStart(9)}${'오픈(오소독스)'.padStart(15)}${'오픈(사우스포)'.padStart(15)}`);
  const pct = v => `${((v ?? 0) * 100).toFixed(1)}%`.padStart(9);
  for (const id of ids.sort((a, b) => (open.rowShare[b] ?? 0) - (open.rowShare[a] ?? 0))) {
    console.log(`  ${id.padEnd(16)}${pct(closed.rowShare[id])}${pct(open.rowShare[id]).padStart(15)}${pct(open.colShare[id]).padStart(15)}`);
  }

  // The question this mode was built to answer.
  const steps = Object.keys(CARDS).filter(id => CARDS[id].stepToward);
  const share = (obj) => steps.reduce((n, id) => n + (obj[id] ?? 0), 0);
  console.log(`\n사이드 스텝 비중  클로즈드 ${(share(closed.rowShare) * 100).toFixed(1)}%  |  오픈 ${(((share(open.rowShare) + share(open.colShare)) / 2) * 100).toFixed(1)}%`);
  if (Math.abs(open.value) > 0.1) {
    console.log(`\n⚠ 오픈 가드가 ${open.value > 0 ? OPEN_GUARD[0] : OPEN_GUARD[1]} 쪽에 ${Math.abs(open.value).toFixed(3)}만큼 기울어 있습니다.`);
    console.log('  스탠스 자체가 유불리를 만들면 안 되므로, 사이드 스텝 외의 원인이 있는지 봐야 합니다.');
  }
  return { closed, open };
}

const [mode = 'report', ...rest] = process.argv.slice(2);
if (mode === 'solve') await solve(Number(rest[0]) || 8, Number(rest[1]) || 28);
else if (mode === 'policies') await solvePolicies(Number(rest[0]) || 8, Number(rest[1]) || 36);
else if (mode === 'grammar') await grammar();
else if (mode === 'matchup') await matchup(Number(rest[0]) || 8, Number(rest[1]) || 28);
else if (mode === 'check') await check();
else if (mode === 'report') await report();
else { console.error(`알 수 없는 모드: ${mode}`); process.exitCode = 1; }
