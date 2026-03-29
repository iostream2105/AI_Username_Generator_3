import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const exactFallbackDir = path.join(projectRoot, '.cloudbase-static-fallbacks');
const landingPagesFile = path.join(projectRoot, 'src', 'landingPages.ts');
const distIndexFile = path.join(distDir, 'index.html');
const exactFallbackManifestFile = path.join(exactFallbackDir, 'manifest.json');

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

async function writeDirectoryFallback(route, indexHtml) {
  const fallbackDir = path.join(distDir, route);
  const fallbackIndexFile = path.join(fallbackDir, 'index.html');
  await mkdir(fallbackDir, {recursive: true});
  await writeFile(fallbackIndexFile, indexHtml, 'utf8');
}

async function writeExactPathFallback(route, indexHtml) {
  const exactFallbackFile = path.join(exactFallbackDir, `${route}.html`);
  await mkdir(path.dirname(exactFallbackFile), {recursive: true});
  await writeFile(exactFallbackFile, indexHtml, 'utf8');

  return {
    route,
    cloudPath: route,
    localPath: exactFallbackFile,
    relativeLocalPath: path.relative(projectRoot, exactFallbackFile),
  };
}

async function main() {
  const [routes, indexHtml] = await Promise.all([
    getRouteFallbacks(),
    readFile(distIndexFile, 'utf8'),
  ]);

  await rm(exactFallbackDir, {recursive: true, force: true});

  const exactFallbackManifest = await Promise.all(
    routes.map(async (route) => {
      await writeDirectoryFallback(route, indexHtml);
      return writeExactPathFallback(route, indexHtml);
    }),
  );

  await writeFile(exactFallbackManifestFile, JSON.stringify(exactFallbackManifest, null, 2), 'utf8');

  console.log(
    `Generated ${routes.length} directory fallbacks in dist and ${exactFallbackManifest.length} exact-path fallback artifacts in ${path.relative(projectRoot, exactFallbackManifestFile)}.`,
  );
}

await main();
