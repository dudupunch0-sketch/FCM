// Staff, facilities, delegation and money. Roadmap Phases 8 and 9.
// Spec: docs/design/14_staff_facilities_delegation_and_player_progression.md, docs/design/15.
// Staff and facilities never grant a flat combat buff. They change preparation quality,
// analysis accuracy and risk detection. Delegation is never perfect.
import { adjustOverhead } from './difficulty.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function hireStaff(definitions, spec) {
  const cfg = definitions.configs.world.staff;
  if (!cfg.roles.includes(spec.role)) throw Error(`알 수 없는 Staff Role: ${spec.role}`);
  const skill = clamp(spec.skill ?? 50, 0, 100);
  return {
    id: spec.id,
    role: spec.role,
    skill,
    specialties: spec.specialties ?? [],
    assigned: [],
    salary: Math.round(skill * cfg.salary_per_skill_point)
  };
}

export function assign(definitions, staff, fighterId) {
  if (!staff.assigned.includes(fighterId)) staff.assigned.push(fighterId);
  return staff;
}

// Capacity is real: an overloaded staff member produces worse reports and plans.
export function staffQuality(definitions, staff) {
  const cfg = definitions.configs.world.staff;
  const over = Math.max(0, staff.assigned.length - cfg.capacity_per_staff);
  const penalty = over > 0 ? cfg.overload_quality_penalty * (over / cfg.capacity_per_staff) : 0;
  return clamp((staff.skill / 100) * (1 - penalty), 0, 1);
}

export function createFacilities(definitions, levels = {}) {
  const cfg = definitions.configs.world.facility;
  const out = {};
  for (const module of cfg.modules) out[module] = clamp(levels[module] ?? 1, 0, cfg.max_level);
  return out;
}

export function upgradeCost(definitions, facilities, module) {
  const cfg = definitions.configs.world.facility;
  if (!(module in facilities)) throw Error(`알 수 없는 시설: ${module}`);
  if (facilities[module] >= cfg.max_level) return null;
  return cfg.upgrade_cost_per_level * (facilities[module] + 1);
}

// Facilities raise preparation quality only. Nothing here touches fight-night damage.
export function trainingQuality(definitions, { facilities, staff = [], delegationMode = 'manual' }) {
  const cfg = definitions.configs.world;
  const levels = Object.values(facilities);
  const facilityBonus = levels.reduce((n, l) => n + l, 0) / levels.length * cfg.facility.training_quality_per_level;
  const staffBonus = staff.length ? staff.reduce((n, s) => n + staffQuality(definitions, s), 0) / staff.length * 0.4 : 0;
  const delegation = cfg.staff.delegation_quality[delegationMode];
  if (delegation === undefined) throw Error(`알 수 없는 위임 모드: ${delegationMode}`);
  return { quality: (1 + facilityBonus + staffBonus) * delegation, facilityBonus, staffBonus, delegation };
}

export function maintenanceCost(definitions, facilities) {
  const cfg = definitions.configs.world.facility;
  return Object.values(facilities).reduce((n, l) => n + l * cfg.maintenance_per_level, 0);
}

// Delegation trades precision for the ability to run a larger roster without more clicks.
export function delegationPlan(definitions, roster, directIds) {
  const modes = {};
  for (const id of roster) modes[id] = directIds.includes(id) ? 'manual' : 'delegated';
  return modes;
}

// --- money ---

export function createLedger(definitions) {
  const cfg = definitions.configs.world.economy;
  return { management_cash: cfg.management_start_cash, fighter_cash: {}, history: [] };
}

function record(ledger, entry) {
  ledger.history.push(entry);
  return ledger;
}

// Fighter money and management money are separate. The player earns a share, not the purse.
export function payPurse(definitions, ledger, { fighterId, purse, share, won = false, finished = false, offer = null }) {
  let gross = purse;
  if (offer) {
    if (won) gross += offer.win_bonus ?? 0;
    if (finished) gross += offer.finish_bonus ?? 0;
  }
  const cut = Math.round(gross * share);
  ledger.fighter_cash[fighterId] = (ledger.fighter_cash[fighterId] ?? 0) + (gross - cut);
  ledger.management_cash += cut;
  record(ledger, { type: 'purse', fighterId, gross, cut });
  return { gross, managementShare: cut, fighterShare: gross - cut };
}

export function weeklyCosts(definitions, ledger, { staff = [], facilities = null, inCamp = false, damageTreated = 0, scoutingActions = 0, difficulty = null }) {
  const cfg = definitions.configs.world.economy;
  let total = difficulty ? adjustOverhead(cfg.weekly_overhead, difficulty) : cfg.weekly_overhead;
  total += staff.reduce((n, s) => n + s.salary, 0);
  if (facilities) total += maintenanceCost(definitions, facilities);
  if (inCamp) total += cfg.camp_cost_per_week;
  total += damageTreated * cfg.medical_cost_per_damage;
  total += scoutingActions * cfg.scouting_cost_per_action;
  ledger.management_cash -= total;
  record(ledger, { type: 'weekly', total });
  return total;
}

// Running out of money narrows options rather than ending the run.
export function affordability(definitions, ledger) {
  const cfg = definitions.configs.world.economy;
  const broke = ledger.management_cash < 0;
  return {
    game_over: false,
    can_hire: ledger.management_cash > cfg.weekly_overhead * 4,
    can_upgrade: ledger.management_cash > cfg.weekly_overhead * 10,
    can_scout: ledger.management_cash > cfg.scouting_cost_per_action,
    constrained: broke,
    note: broke ? '자금난: 선택지가 줄어듭니다' : null
  };
}

export function sponsorOffer(definitions, { ticketPower, weeks = 26 }) {
  const payment = Math.round(ticketPower * 18 + 200);
  return {
    payment,
    duration_weeks: weeks,
    // Sponsors pay in money and charge in calendar: appearances compete with training.
    appearance_slots_per_week: ticketPower > 60 ? 2 : 1,
    stress_per_appearance: 1.2
  };
}
