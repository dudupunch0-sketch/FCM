// AI calibration environment. Roadmap Phase 12.
// Spec: docs/design/34_ai_equilibrium.md
//
// This exists to be re-run. Whenever cards, formulas or balance values change, the previous
// AI mixture is stale — it was the answer to a different game. Running this regenerates it,
// and `check` fails loudly when the committed mixture no longer matches the current rules.
//
//   node tools/calibrate.mjs solve [rounds] [poolSize]   regenerate config/ai_strategies.json
//   node tools/calibrate.mjs check                       fail if the committed mixture is stale
//   node tools/calibrate.mjs report                      inspect the current mixture

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile as readSource } from 'node:fs/promises';
import { readConfig } from './config_source.mjs';
import { loadDefinitions } from '../dist/definitions.js';
import { configureEngine, CARDS } from '../dist/engine.js';
import { createRngSet } from '../dist/rng.js';
import { samplePlans, planKey } from '../dist/plan-space.js';
import { doubleOracle, payoffMatrix, fictitiousPlay, exploitability, supportOf, duel, deviateMixture, clearDuelCache } from '../dist/equilibrium.js';
import { ALL_BASE_PARAMETERS } from '../dist/fighter-schema.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(root, 'config', 'ai_strategies.json');

const definitions = await loadDefinitions(readConfig);
configureEngine(definitions);

// Identical stats on both sides: the payoff then measures strategy alone.
const MIRROR = { base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, 60])) };
const SEED = 20260101;
const OPTIONS = { stats: MIRROR, seeds: [1], profile: 'pressure' };

// A fingerprint of everything that changes what a plan is worth. If this moves, the committed
// mixture was solved for a different game and must be regenerated.
// Resolution code counts as a rule. An engine change can alter what a plan is worth just as
// much as a config change can — the RNG warm-up fix did exactly that and a config-only
// fingerprint did not notice.
const ENGINE_SOURCE = await readSource(join(root, 'dist', 'engine.js'), 'utf8');

function rulesFingerprint() {
  const cfg = definitions.configs.combat_prototype;
  const parts = [
    ENGINE_SOURCE,
    JSON.stringify(cfg.rules), JSON.stringify(cfg.modifiers), JSON.stringify(cfg.status),
    JSON.stringify(cfg.rounds), JSON.stringify(cfg.subBeat), JSON.stringify(cfg.range),
    JSON.stringify(cfg.firstStrike), JSON.stringify(cfg.intervalRecovery),
    ...Object.keys(cfg.cards).sort().map(id => `${id}:${JSON.stringify(cfg.cards[id])}`)
  ];
  let hash = 2166136261;
  for (const ch of parts.join('|')) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

// In-pool exploitability understates convergence: it only looks at plans already known.
// The honest measure is whether a fresh search can still find something that beats the
// mixture, so both are reported and the second is what decides convergence.
function externalBestResponse(pool, strategy, rng, { candidates = 400 } = {}) {
  let best = 0, bestPlan = null;
  const known = new Set(pool.map(planKey));
  for (const candidate of samplePlans(rng, candidates)) {
    if (known.has(planKey(candidate))) continue;
    let value = 0;
    for (let j = 0; j < pool.length; j++) {
      if (!strategy[j]) continue;
      value += strategy[j] * duel(candidate, pool[j], OPTIONS);
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
  for (const s of support.slice(0, 8)) console.log(`  ${(s.weight * 100).toFixed(1).padStart(5)}%  ${s.plan.join(' + ')}`);
  console.log(`\n기록: ${OUTPUT}`);
  return document;
}

async function loadCommitted() {
  try {
    return JSON.parse(await readFile(OUTPUT, 'utf8'));
  } catch {
    return null;
  }
}

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
}

async function report() {
  const committed = await loadCommitted();
  if (!committed) { console.error('아직 계산된 전략이 없습니다.'); process.exitCode = 1; return; }
  console.log(`fingerprint ${committed.generated.rules_fingerprint}  게임 값 ${committed.generated.game_value}`);
  console.log(`외부 최적대응 이득 ${committed.generated.external_best_response_gain} (0에 가까울수록 수렴)\n`);
  console.log('등급별 이탈과 착취 가능성:');
  for (const [tier, spec] of Object.entries(committed.tiers)) {
    console.log(`  ${tier.padEnd(11)} 이탈 ${String(spec.deviation).padEnd(5)} exploitability ${spec.exploitability.toFixed(4)}  계획 ${spec.mixture.length}개`);
  }
  console.log('\n균형 지지집합:');
  for (const s of committed.equilibrium_support) console.log(`  ${(s.weight * 100).toFixed(1).padStart(5)}%  ${s.plan.join(' + ')}`);
  const dead = Object.keys(CARDS).filter(id => id !== 'rest' && !committed.equilibrium_support.some(s => s.plan.includes(id)));
  console.log(`\n균형에서 쓰이지 않는 카드: ${dead.length ? dead.join(', ') : '없음'}`);
  console.log('  (균형에 한 번도 등장하지 않는 카드는 죽은 콘텐츠 후보입니다)');
}

const [mode = 'report', ...rest] = process.argv.slice(2);
if (mode === 'solve') await solve(Number(rest[0]) || 8, Number(rest[1]) || 28);
else if (mode === 'check') await check();
else if (mode === 'report') await report();
else { console.error(`알 수 없는 모드: ${mode}`); process.exitCode = 1; }
