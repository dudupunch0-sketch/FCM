// Headless balance tooling. Roadmap Phase 12.
// Spec: implementation_roadmap sections 17 and 18.
// Balance is not settled by playing a few matches by hand. These batches report the metrics
// the roadmap names, so a config change can be judged by its effect rather than by feel.
//
//   node tools/balance.mjs combat [runs]
//   node tools/balance.mjs growth [years]
//   node tools/balance.mjs world [years]
//   node tools/balance.mjs campaign [runs]
//   node tools/balance.mjs all

import { readConfig } from './config_source.mjs';
import { loadDefinitions } from '../dist/definitions.js';
import { configureEngine, configureStrategies, newMatch, makePlan, opponentPlan, resolveTurn, CARDS } from '../dist/engine.js';
import { createFighter } from '../dist/fighter.js';
import { createTrainingState, runWeek, applyGains } from '../dist/growth.js';
import { createRngSet } from '../dist/rng.js';
import { createWorld, simulateWeek } from '../dist/world.js';
import { startCampaign, runCampaign, COMPLETE } from '../dist/campaign.js';
import { ALL_BASE_PARAMETERS } from '../dist/fighter-schema.js';

const definitions = await loadDefinitions(readConfig);
configureEngine(definitions);

// `node tools/balance.mjs combat 40 equilibrium` measures against the solved AI instead of
// the hand-written patterns. A plan that dominates the fixed patterns often does not survive
// an opponent that mixes.
if (process.argv.includes('equilibrium')) {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const tier = process.argv.find(a => ['apprentice', 'standard', 'contender', 'brutal'].includes(a)) ?? 'brutal';
  const document = JSON.parse(await readFile(join(root, 'config', 'ai_strategies.json'), 'utf8'));
  configureStrategies(document, tier);
  console.log(`균형 AI(${tier})를 상대로 측정합니다.`);
}

const pct = (n, total) => total ? `${(100 * n / total).toFixed(1)}%` : '0%';
const evenly = v => ({ base: Object.fromEntries(ALL_BASE_PARAMETERS.map(k => [k, v])) });

function table(rows) {
  for (const [label, ...values] of rows) console.log(`  ${String(label).padEnd(26)} ${values.join('   ')}`);
}

// Favorite win rate, finish/decision split, plan viability and card usage.
const PLANS = {
  counter: ['sway', 'cross', 'sway', 'cross'],
  jabbing: ['jab', 'jab', 'cross', 'jab', 'rest'],
  hooks: ['hook', 'hook', 'rest', 'rest'],
  bodywork: ['body', 'body', 'body'],
  heavy: ['heavy', 'heavy', 'rest'],
  shelled: ['shell', 'cross', 'guard', 'rest'],
  lowguard: ['lowguard', 'cross', 'lowguard', 'jab'],
  weaving: ['weave', 'cross', 'weave', 'cross'],
  feinting: ['feint', 'cross', 'feint', 'jab', 'rest'],
  flicker: ['flicker', 'flicker', 'cross', 'rest', 'rest'],
  advancing: ['advance', 'body', 'body'],
  mixed: ['sway', 'body', 'cross', 'rest'],
  patient: ['guard', 'jab', 'guard', 'cross', 'rest']
};

function playMatch(plan, { seed, player, opponent, profile = 'pressure', usage = null }) {
  let match = newMatch(profile, seed, { player, opponent });
  while (!match.finished) {
    const placed = makePlan(plan);
    if (usage) for (const p of placed) usage[p.id] = (usage[p.id] ?? 0) + 1;
    match = resolveTurn(match, placed, opponentPlan(match)).match;
  }
  return match;
}

function combatBatch(runs = 200) {
  const profiles = ['pressure', 'tricky', 'turtle'];
  console.log(`
=== Plan viability (${runs} fights per matchup, even stats) ===`);
  console.log('  Fixed plans resolve near-deterministically, so a single matchup lands at ~0% or');
  console.log('  ~100%. The signal is how many PROFILES a plan beats: 1-2 is healthy, 3 is dominant.');
  const usage = {};
  const rows = [];
  const beatCounts = [];
  for (const [name, plan] of Object.entries(PLANS)) {
    const perProfile = [];
    let finishes = 0, turns = 0, total = 0;
    for (const profile of profiles) {
      let wins = 0;
      for (let seed = 1; seed <= runs; seed++) {
        const match = playMatch(plan, { seed, profile, player: evenly(60), opponent: evenly(60), usage });
        total++;
        if (match.winner === 0) wins++;
        if (match.method !== '판정') finishes++;
        turns += match.turn;
      }
      perProfile.push(wins / runs);
    }
    const beaten = perProfile.filter(r => r > 0.5).length;
    beatCounts.push(beaten);
    rows.push([name, perProfile.map(r => `${Math.round(r * 100)}%`.padStart(4)).join(' '), `승리 프로필 ${beaten}/3`, `피니시 ${pct(finishes, total).padStart(6)}`, `교환 ${(turns / total).toFixed(1)}`]);
  }
  console.log(`
  ${''.padEnd(26)} 압박  교란  수비`);
  table(rows);

  const dominant = rows.filter((_, i) => beatCounts[i] === 3).map(r => r[0]);
  const dead = rows.filter((_, i) => beatCounts[i] === 0).map(r => r[0]);
  console.log(`
  분포: ${[0, 1, 2, 3].map(k => `${k}승 ${beatCounts.filter(b => b === k).length}`).join('  ')}`);
  console.log(`  지배 전략(3/3): ${dominant.length ? dominant.join(', ') : '없음'}`);
  console.log(`  무승 계획(0/3): ${dead.length ? dead.join(', ') : '없음'}`);
  const unused = Object.keys(CARDS).filter(id => !usage[id]);
  console.log(`  미사용 카드: ${unused.length ? unused.join(', ') : '없음'}`);

  console.log(`
=== Stat gap: can strategy erase it? ===`);
  console.log('  Best plan found per gap. A gap must stop being strategisable as it widens.');
  const gapRows = [];
  for (const gap of [0, 5, 10, 15, 25]) {
    let best = 0, bestName = '-';
    for (const [name, plan] of Object.entries(PLANS)) {
      let wins = 0, total = 0;
      for (const profile of profiles) {
        for (let seed = 1; seed <= Math.max(15, runs / 4); seed++) {
          total++;
          if (playMatch(plan, { seed, profile, player: evenly(60 - gap), opponent: evenly(60) }).winner === 0) wins++;
        }
      }
      if (wins / total > best) { best = wins / total; bestName = name; }
    }
    gapRows.push([`격차 ${String(gap).padStart(2)}`, `최선의 계획 승률 ${`${Math.round(best * 100)}%`.padStart(4)}`, `(${bestName})`]);
  }
  table(gapRows);
}

// Prospect growth, veteran decline, and how training policy changes both.
function growthBatch(years = 5) {
  const weeks = years * 52;
  const policies = {
    balanced: ['growth_training', 'technical_training', 'recovery'],
    grind: ['growth_training', 'growth_training', 'sparring', 'sparring', 'technical_training', 'sparring'],
    cautious: ['technical_training', 'recovery', 'personal']
  };
  const talent = { overall_talent: 75, physical_aptitude: 75, striking_aptitude: 80, grappling_aptitude: 65, combat_intelligence_aptitude: 70 };
  console.log(`\n=== Growth batch (${years}년) ===`);
  for (const [age, label] of [[18, '18세 유망주'], [30, '30세 베테랑']]) {
    for (const [name, schedule] of Object.entries(policies)) {
      let fighter = createFighter({ id: 'g', name: 'g', base: evenly(45).base, body: { natural_weight: 75, current_weight: 75, age } });
      let state = createTrainingState();
      for (let w = 0; w < weeks; w++) {
        const result = runWeek(fighter, state, schedule, definitions, { potential: talent });
        fighter = applyGains(fighter, result.gains);
        state = result.state;
        if (w % 52 === 51) fighter = { ...fighter, body: { ...fighter.body, age: fighter.body.age + 1 } };
      }
      table([[`${label} · ${name}`, `punch ${fighter.base.punch_technique.toFixed(1)}`, `debt ${state.recovery_debt.toFixed(1)}`, `stress ${state.stress.toFixed(0)}`]]);
    }
  }
}

// Ranking stability, champion turnover, population health.
function worldBatch(years = 10) {
  const weeks = years * 52;
  const rng = createRngSet(20, definitions).stream('world_generation');
  const world = createWorld(definitions, createRngSet(20, definitions).stream('world_generation'));
  const champions = new Set([world.ranking.champion_id]);
  let churn = 0;
  let previous = [...world.ranking.ordered];
  for (let w = 0; w < weeks; w++) {
    simulateWeek(world, rng);
    champions.add(world.ranking.champion_id);
    churn += world.ranking.ordered.filter((id, i) => previous[i] !== id).length;
    previous = [...world.ranking.ordered];
  }
  const active = Object.values(world.fighters).filter(f => f.active);
  console.log(`\n=== World batch (${years}년) ===`);
  table([
    ['서로 다른 챔피언', `${champions.size}명`],
    ['평균 재임 기간', `${(weeks / champions.size / 52).toFixed(1)}년`],
    ['주당 랭킹 변동', (churn / weeks).toFixed(2)],
    ['생존 선수', `${active.length}명 / 전체 ${Object.keys(world.fighters).length}명`],
    ['은퇴', `${Object.values(world.fighters).filter(f => !f.active).length}명`],
    ['뉴스 이벤트', `${world.news.length}건`]
  ]);
}

// How long a full narrative completion takes, and how often it fails to arrive.
function campaignBatch(runs = 12) {
  const spec = {
    id: 'hero', name: 'hero', base: evenly(62).base,
    body: { natural_weight: 75, current_weight: 75, age: 22, stance: 'orthodox' },
    potential: { overall_talent: 85, physical_aptitude: 82, striking_aptitude: 88, grappling_aptitude: 70, combat_intelligence_aptitude: 82 }
  };
  let completed = 0, totalWeeks = 0, losses = 0;
  for (let seed = 1; seed <= runs; seed++) {
    const campaign = runCampaign(startCampaign(definitions, createRngSet(seed, definitions).stream('world_generation'), spec));
    if (campaign.part === COMPLETE) { completed++; totalWeeks += campaign.week; }
    losses += campaign.career.record.losses;
  }
  console.log(`\n=== Campaign batch (${runs} runs) ===`);
  table([
    ['서사 완료율', pct(completed, runs)],
    ['평균 소요', completed ? `${(totalWeeks / completed / 52).toFixed(1)}년` : '-'],
    ['평균 패배 수', (losses / runs).toFixed(1)]
  ]);
}

const [mode = 'all', arg] = process.argv.slice(2);
const n = arg ? Number(arg) : undefined;
if (mode === 'combat' || mode === 'all') combatBatch(n ?? (mode === 'all' ? 150 : 400));
if (mode === 'growth' || mode === 'all') growthBatch(n ?? 5);
if (mode === 'world' || mode === 'all') worldBatch(n ?? 10);
if (mode === 'campaign' || mode === 'all') campaignBatch(n ?? (mode === 'all' ? 6 : 12));
if (!['combat', 'growth', 'world', 'campaign', 'all'].includes(mode)) {
  console.error('사용법: node tools/balance.mjs [combat|growth|world|campaign|all] [n]');
  process.exit(1);
}
