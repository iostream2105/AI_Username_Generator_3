import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const landingPagesFile = path.join(projectRoot, 'src', 'landingPages.ts');
const distIndexFile = path.join(distDir, 'index.html');

function normalizeRoutePath(routePath) {
  return routePath.replace(/^\/+/, '').replace(/\/+$/, '');
}

async function getRouteFallbacks() {
  const landingPagesSource = await readFile(landingPagesFile, 'utf8');
  const routeMatches = landingPagesSource.matchAll(/path:\s*'([^']+)'/g);
  const routeSet = new Set(['admin']);

  for (const [, routePath] of routeMatches) {
    const normalized = normalizeRoutePath(routePath);
    if (normalized) {
      routeSet.add(normalized);
    }
  }

  return [...routeSet];
}

async function main() {
  const [routes, indexHtml] = await Promise.all([
    getRouteFallbacks(),
    readFile(distIndexFile, 'utf8'),
  ]);

  await Promise.all(
    routes.map(async (route) => {
      const fallbackDir = path.join(distDir, route);
      const fallbackIndexFile = path.join(fallbackDir, 'index.html');
      await mkdir(fallbackDir, {recursive: true});
      await writeFile(fallbackIndexFile, indexHtml, 'utf8');
    }),
  );

  console.log(`Generated SPA fallback entry files for ${routes.length} routes.`);
}

await main();
