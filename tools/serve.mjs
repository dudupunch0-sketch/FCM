// Static file server for dist/, with no dependencies.
//
// `npm start` used python3 -m http.server, which meant the one command a player runs to see
// the game needed a second runtime the rest of the project does not. Everything else here is
// Node and nothing else; this closes that gap.
//
//   node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist');
const port = Number(process.argv[2]) || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

createServer(async (request, response) => {
  // Everything is served from dist/. Resolving first and then checking the prefix is what
  // stops ../ from walking out of it.
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = normalize(join(root, path === '/' ? 'index.html' : path));
  if (!target.startsWith(root)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(target);
    response.writeHead(200, {
      'content-type': TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
      // The config mirror is regenerated constantly; a cached copy would show stale balance.
      'cache-control': 'no-store'
    }).end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
