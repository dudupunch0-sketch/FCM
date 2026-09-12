// Browser boot: fetch Definition Data and configure the engine before the app body runs.
// Imported for side effect, so module evaluation order guarantees configuration happens first.
import {loadDefinitions} from './definitions.js';
import {configureStrings} from './strings.js';
import {configureEngine,configureStrategies} from './engine.js';
const read=async name=>{
  const response=await fetch(`./config/${name}.json`,{cache:'no-cache'});
  if(!response.ok)throw Error(`Config를 불러오지 못했습니다: ${name}.json (${response.status}). node tools/sync_config.mjs를 실행하세요`);
  return response.json();
};
export const definitions=await loadDefinitions(read);
configureEngine(definitions);

// User-facing strings load before anything renders. The base language doubles as the
// fallback so a late translation shows Korean rather than a raw key.
const base=await (await fetch('./config/strings/ko.json',{cache:'no-cache'})).json();
configureStrings(base,base);

// Real play faces the calibrated opponent, not the hand-written patterns. Those are only a
// fallback for when the calibration output has not been generated.
export const strategies=await (async()=>{
  try{
    const response=await fetch('./config/ai_strategies.json',{cache:'no-cache'});
    if(!response.ok)return null;
    const document=await response.json();
    configureStrategies(document,definitions.configs.difficulty.default_tier);
    return document;
  }catch{
    return null;
  }
})();
