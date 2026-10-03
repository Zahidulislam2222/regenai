import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {lstat, readdir, readFile} from 'node:fs/promises';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const context = join(root, 'deploy', 'hydrogen', 'context');
const forbiddenName = /(?:^|\/)(?:\.env(?:\..*)?|CREDENTIALS\.md|PROJECT-DOSSIER\.md|memory|node_modules|dist|tests)(?:\/|$)|\.(?:pem|key|p12|pfx)$/i;
const obviousSecret = /(?:shpat_[A-Za-z0-9]{12,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const supportingFiles = new Set([
  'package.json', 'package-lock.json',
  'packages/app/package.json', 'packages/ui/package.json',
  'packages/storefront/package.json', 'packages/storefront/.graphqlrc.ts',
  'packages/storefront/customer-accountapi.generated.d.ts',
  'packages/storefront/env.d.ts', 'packages/storefront/react-router.config.ts',
  'packages/storefront/server.node.ts', 'packages/storefront/server.ts',
  'packages/storefront/storefrontapi.generated.d.ts',
  'packages/storefront/tsconfig.json', 'packages/storefront/vite.config.ts',
  'scripts/rebuild-native.mjs', 'scripts/run-storefront.mjs',
  'scripts/catalog-seed/seed-config.json',
]);

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlink entered the build context.');
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error('Non-regular file entered the build context.');
  }
  return files;
}

test('the generated Docker context contains only tracked, scrubbed storefront inputs', async () => {
  execFileSync(process.execPath, [join(root, 'scripts', 'prepare-hydrogen-context.mjs')], {cwd: root});
  const tracked = new Set(execFileSync('git', ['ls-files', '-z'], {cwd: root}).toString('utf8').split('\0'));
  const files = await listFiles(context);
  assert.ok(files.length > 100, 'expected a complete storefront build context');
  for (const path of files) {
    const name = relative(context, path).split(sep).join('/');
    if (name === '.regenai-build-context') continue;
    assert.ok(tracked.has(name), `untracked file entered build context: ${name}`);
    assert.doesNotMatch(name, forbiddenName);
    assert.ok(name.startsWith('packages/storefront/app/') ||
      name.startsWith('packages/storefront/public/') || supportingFiles.has(name),
    `unexpected source path entered build context: ${name}`);
    const stat = await lstat(path);
    assert.ok(stat.isFile());
    const bytes = await readFile(path);
    assert.deepEqual(bytes, await readFile(join(root, name)), `context drift: ${name}`);
    if (/\.(?:ts|tsx|js|mjs|json)$/.test(name)) {
      assert.doesNotMatch(bytes.toString('utf8'), obviousSecret, `secret-shaped value in ${name}`);
    }
  }
});
