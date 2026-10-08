import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {buildSeedPlan} from './plan.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const digest = (value) => createHash('sha256').update(value).digest('hex');

test('six owned concepts have unique draft records, variants, and original PNG assets', () => {
  const {report} = buildSeedPlan(root);
  assert.equal(report.productCount, 6);
  assert.equal(report.variantCount, 12);
  assert.equal(report.remoteWrites, 0);
  assert.equal(report.records.length, 6);
  assert.deepEqual(new Set(report.records.map(({handle}) => handle)).size, 6);
  assert.deepEqual(new Set(report.records.flatMap(({variants}) => variants.map(({sku}) => sku))).size, 12);
  for (const record of report.records) {
    assert.equal(record.status, 'DRAFT');
    assert.equal(record.publication, 'none');
    assert.equal(record.currency, 'USD');
    assert.equal(record.variants.length, 2);
    assert.match(record.image.sha256, /^[a-f0-9]{64}$/);
    assert.ok(record.image.bytes > 8);
    assert.ok(record.tags.includes('not-for-sale-demo'));
  }
  const {planSha256, settingsSha256, ...payload} = report;
  assert.equal(planSha256, digest(JSON.stringify(payload)));
  assert.equal(settingsSha256, digest(readFileSync(resolve(root, 'scripts/catalog-seed/seed-config.json'))));
});

test('a wrong execution digest stops before any network or store mutation', () => {
  const result = spawnSync(process.execPath,
    [resolve(root, 'scripts/catalog-seed/seed.mjs'), '--apply', 'wrong', 'wrong'],
    {cwd: root, env: {}, encoding: 'utf8', timeout: 10000});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Plan or settings digest mismatch/);
});

test('seed source contains no literal shop endpoint or obvious live credential', () => {
  const source = readFileSync(resolve(root, 'scripts/catalog-seed/seed.mjs'), 'utf8');
  for (const [candidate] of source.matchAll(/https?:\/\/[^\s"'`]+/g)) {
    if (!URL.canParse(candidate)) continue;
    const url = new URL(candidate);
    assert.ok(!(url.hostname.endsWith('.myshopify.com') &&
      url.pathname.startsWith('/admin/api/')), 'literal Shopify Admin endpoint in source');
  }
  assert.doesNotMatch(source, /(?:shpat_|shpss_|sk_live_)[A-Za-z0-9]{8,}/);
  assert.match(source, /process\.env\.SHOPIFY_ADMIN_API_VERSION/);
  assert.match(source, /process\.env\.SHOPIFY_ADMIN_API_TOKEN/);
});
