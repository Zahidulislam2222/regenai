import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const file = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('environment names have a documented configuration boundary', () => {
  const types = file('../env.d.ts');
  const example = file('../.env.example');
  const names = [...types.matchAll(/^    ([A-Z][A-Z0-9_]+)\??:/gm)]
    .map((match) => match[1])
    .filter((name) => !['DB'].includes(name));
  for (const name of names) {
    assert.match(example, new RegExp(`^${name}=`, 'm'), `${name} missing from .env.example`);
  }
});

test('preview and staging never bind the production database', () => {
  const config = file('../wrangler.toml');
  for (const environment of ['preview', 'staging']) {
    const section = config.split(`[env.${environment}]`)[1]?.split(/\n\[env\./)[0];
    assert.ok(section, `${environment} config missing`);
    assert.doesNotMatch(section, /\[\[env\.(?:preview|staging)\.(?:d1_databases|kv_namespaces)\]\]/);
  }
  assert.doesNotMatch(config, /SHOPIFY_TOKEN_ENC_KEY\s*=/);
});

test('legacy merchant Worker keeps public production routes disabled', () => {
  const config = file('../wrangler.toml');
  const root = config.split('\n[env.')[0];
  const production = config.split('[env.production]')[1]?.split('\n[env.')[0];
  assert.ok(production, 'production config missing');
  assert.match(root, /^workers_dev = false$/m);
  assert.match(root, /^preview_urls = false$/m);
  assert.match(production, /^workers_dev = false$/m);
  assert.match(production, /^preview_urls = false$/m);

  for (const environment of ['preview', 'staging']) {
    const section = config.split(`[env.${environment}]`)[1]?.split('\n[env.')[0];
    assert.ok(section, `${environment} config missing`);
    assert.match(section, /^workers_dev = true$/m);
    assert.match(section, /^preview_urls = true$/m);
  }
});

test('webhook body limit is provided to every Worker environment', () => {
  const config = file('../wrangler.toml');
  for (const section of [config.split('\n[vars]')[1]?.split('\n[')[0],
    ...['preview', 'staging', 'production'].map((name) =>
      config.split(`[env.${name}.vars]`)[1]?.split('\n[')[0])]) {
    assert.ok(section, 'Worker environment is missing');
    assert.match(section, /^SHOPIFY_WEBHOOK_MAX_BODY_BYTES = "65536"$/m);
  }
});

test('obvious secrets and plaintext token persistence cannot enter app source', () => {
  const roots = [new URL('../app/', import.meta.url), new URL('../workers/', import.meta.url)];
  const sourceFiles = (root) => readdirSync(root, {withFileTypes: true}).flatMap((entry) => {
    const path = join(fileURLToPath(root), entry.name);
    return entry.isDirectory() ? sourceFiles(new URL(`${entry.name}/`, root)) : [path];
  });
  for (const path of roots.flatMap(sourceFiles)) {
    if (!/\.(?:ts|tsx)$/.test(path)) continue;
    const content = readFileSync(path, 'utf8');
    assert.doesNotMatch(content, /(?:shpat_|sk_live_|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/);
    assert.doesNotMatch(content, /\.bind\(shop,\s*tokenPayload\.access_token/);
  }
});
