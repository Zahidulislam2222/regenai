import {execFileSync} from 'node:child_process';
import {copyFile, lstat, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'deploy', 'hydrogen', 'context');
const marker = join(destination, '.regenai-build-context');
const exactFiles = new Set([
  'package.json',
  'package-lock.json',
  'packages/app/package.json',
  'packages/ui/package.json',
  'packages/storefront/package.json',
  'packages/storefront/.graphqlrc.ts',
  'packages/storefront/customer-accountapi.generated.d.ts',
  'packages/storefront/env.d.ts',
  'packages/storefront/react-router.config.ts',
  'packages/storefront/server.node.ts',
  'packages/storefront/server.ts',
  'packages/storefront/storefrontapi.generated.d.ts',
  'packages/storefront/tsconfig.json',
  'packages/storefront/vite.config.ts',
  'scripts/rebuild-native.mjs',
  'scripts/run-storefront.mjs',
  'scripts/catalog-seed/seed-config.json',
]);
const sourcePrefixes = ['packages/storefront/app/', 'packages/storefront/public/'];
const forbiddenPath = /(?:^|\/)(?:\.env(?:\..*)?|CREDENTIALS\.md|PROJECT-DOSSIER\.md|memory|node_modules|dist|tests)(?:\/|$)|\.(?:pem|key|p12|pfx)$/i;

const ignored = execFileSync('git', ['check-ignore', marker], {cwd: root, encoding: 'utf8'}).trim();
if (!ignored) throw new Error('Build context is not ignored by Git.');

try {
  const existing = await lstat(destination);
  if (!existing.isDirectory() || existing.isSymbolicLink()) throw new Error('Unsafe build context path.');
  if ((await readFile(marker, 'utf8')).trim() !== 'regenai-hydrogen-generated-context-v1') {
    throw new Error('Existing build context has no recognized ownership marker.');
  }
  await rm(destination, {recursive: true, force: false});
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

await mkdir(destination, {recursive: true});
await writeFile(marker, 'regenai-hydrogen-generated-context-v1\n');

const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, maxBuffer: 20 * 1024 * 1024})
  .toString('utf8').split('\0').filter(Boolean);
const selected = tracked.filter((path) => exactFiles.has(path) || sourcePrefixes.some((prefix) => path.startsWith(prefix)));
for (const path of exactFiles) {
  if (!selected.includes(path)) throw new Error(`Required tracked build input missing: ${path}`);
}
for (const path of selected) {
  if (forbiddenPath.test(path)) throw new Error(`Private path selected for build context: ${path}`);
  const source = join(root, path);
  const stat = await lstat(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Non-regular build input: ${path}`);
  const target = join(destination, path);
  if (relative(destination, target).startsWith('..' + sep)) throw new Error('Build input escapes destination.');
  await mkdir(dirname(target), {recursive: true});
  await copyFile(source, target);
}

process.stdout.write(`Prepared ${selected.length} tracked, allowlisted files in the ignored Hydrogen build context.\n`);
