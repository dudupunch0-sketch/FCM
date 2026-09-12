// Browser boot: fetch Definition Data and configure the engine before the app body runs.
// Imported for side effect, so module evaluation order guarantees configuration happens first.
import {loadDefinitions} from './definitions.js';
import {configureEngine,configureStrategies} from './engine.js';
const read=async name=>{
  const response=await fetch(`./config/${name}.json`,{cache:'no-cache'});
  if(!response.ok)throw Error(`Config를 불러오지 못했습니다: ${name}.json (${response.status}). node tools/sync_config.mjs를 실행하세요`);
  return response.json();
};
export const definitions=await loadDefinitions(read);
configureEngine(definitions);

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
