// Browser boot: fetch Definition Data and configure the engine before the app body runs.
// Imported for side effect, so module evaluation order guarantees configuration happens first.
import {loadDefinitions} from './definitions.js';
import {configureEngine} from './engine.js';
const read=async name=>{
  const response=await fetch(`./config/${name}.json`,{cache:'no-cache'});
  if(!response.ok)throw Error(`Config를 불러오지 못했습니다: ${name}.json (${response.status}). node tools/sync_config.mjs를 실행하세요`);
  return response.json();
};
export const definitions=await loadDefinitions(read);
configureEngine(definitions);
