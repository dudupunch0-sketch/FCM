// Shared setup: load Definition Data and configure the engine before any test uses it.
import { readConfig } from '../../tools/config_source.mjs';
import { loadDefinitions } from '../../dist/definitions.js';
import { configureEngine } from '../../dist/engine.js';

export const definitions = await loadDefinitions(readConfig);
configureEngine(definitions);
