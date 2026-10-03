import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const script = resolve(root, 'scripts/catalog-seed/publish.mjs');

test('wrong publication digests stop before any remote request', () => {
  const result = spawnSync(process.execPath, [script, '--apply', 'wrong-plan', 'wrong-settings'], {
    cwd: root,
    env: {PATH: process.env.PATH},
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Plan or settings digest mismatch/);
  assert.doesNotMatch(result.stderr, /Shopify Admin returned HTTP/);
});
