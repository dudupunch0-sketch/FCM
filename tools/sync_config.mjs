// Copies the authoritative config/ into dist/config/ so the static browser app can fetch it.
// dist/config/ is generated and git-ignored; config/ stays the single source of truth.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'config');
const target = join(root, 'dist', 'config');

const files = (await readdir(source)).filter(name => name.endsWith('.json'));
await mkdir(target, { recursive: true });
for (const name of files) {
  const text = await readFile(join(source, name), 'utf8');
  JSON.parse(text);
  await writeFile(join(target, name), text);
}
// String tables live in a subdirectory and are fetched by the browser the same way.
const stringsSource = join(source, 'strings');
const stringsTarget = join(target, 'strings');
await mkdir(stringsTarget, { recursive: true });
const tables = (await readdir(stringsSource)).filter(name => name.endsWith('.json'));
for (const name of tables) {
  const text = await readFile(join(stringsSource, name), 'utf8');
  JSON.parse(text);
  await writeFile(join(stringsTarget, name), text);
}
console.log(`synced ${files.length} config files and ${tables.length} string tables to dist/config/`);
