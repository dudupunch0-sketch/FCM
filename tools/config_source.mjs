// Node-side Definition Data reader. Reads the authoritative config/ at the repository root.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const CONFIG_DIR = join(dirname(dirname(fileURLToPath(import.meta.url))), 'config');

export async function readConfig(name) {
  const path = join(CONFIG_DIR, `${name}.json`);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Config 읽기 실패: ${path}\n${error.message}`);
  }
}
