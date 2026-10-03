import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {test} from 'node:test';
import {handleUninstallWebhook} from '../app/lib/webhook-uninstall.ts';

class LocalD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    for (const name of ['0001_initial.sql', '0002_merchant_auth.sql', '0003_webhook_deliveries.sql']) {
      this.sqlite.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
    }
  }
  prepare(sql) {
    const sqlite = this.sqlite;
    return {bind(...values) {
      return {
        first: async () => sqlite.prepare(sql).get(...values) ?? null,
        run: async () => sqlite.prepare(sql).run(...values),
        sql,
        values,
      };
    }};
  }
  async batch(statements) {
    this.sqlite.exec('BEGIN');
    try {
      const results = statements.map(({sql, values}) => this.sqlite.prepare(sql).run(...values));
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
  rows(sql, ...values) { return this.sqlite.prepare(sql).all(...values); }
  run(sql, ...values) { this.sqlite.prepare(sql).run(...values); }
  close() { this.sqlite.close(); }
}

const secret = 'test-webhook-secret';
const shopA = 'alpha.myshopify.com';
const shopB = 'beta.myshopify.com';
const triggeredAt = '2026-10-04T00:00:00.000000Z';
const triggeredMs = Date.parse(triggeredAt);
const env = (DB) => ({DB, SHOPIFY_API_SECRET: secret, SHOPIFY_WEBHOOK_MAX_BODY_BYTES: '65536'});

function delivery({shop = shopA, id = 'test-delivery-1', body = {domain: shop},
  topic = 'app/uninstalled', date = triggeredAt, signature = true} = {}) {
  const raw = JSON.stringify(body);
  return new Request('https://app.example.test/webhooks/app-uninstalled', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Hmac-Sha256': signature
        ? createHmac('sha256', secret).update(raw).digest('base64') : 'invalid',
      'X-Shopify-Shop-Domain': shop,
      'X-Shopify-Topic': topic,
      'X-Shopify-Webhook-Id': id,
      'X-Shopify-Triggered-At': date,
    },
    body: raw,
  });
}

test('invalid signature and metadata never write an uninstall delivery', async () => {
  const db = new LocalD1();
  try {
    assert.equal((await handleUninstallWebhook(delivery({signature: false}), env(db))).status, 401);
    const unsigned = delivery();
    unsigned.headers.delete('X-Shopify-Hmac-Sha256');
    assert.equal((await handleUninstallWebhook(unsigned, env(db))).status, 401);
    assert.equal((await handleUninstallWebhook(delivery({topic: 'orders/create'}), env(db))).status, 400);
    assert.equal((await handleUninstallWebhook(delivery({shop: 'evil.example.test'}), env(db))).status, 400);
    assert.equal((await handleUninstallWebhook(delivery({body: {domain: shopB}}), env(db))).status, 400);
    assert.equal(db.rows('SELECT * FROM webhook_deliveries').length, 0);
  } finally { db.close(); }
});

test('database transaction failure rolls back both the delivery and token changes', async () => {
  const db = new LocalD1();
  try {
    db.run('INSERT INTO oauth_tokens(shop,access_token,scope,installed_at) VALUES(?,?,?,?)',
      shopA, 'v1.test-ciphertext', 'read_products', triggeredMs - 1000);
    db.sqlite.exec(`CREATE TRIGGER fail_token_delete BEFORE DELETE ON oauth_tokens
      BEGIN SELECT RAISE(ABORT, 'test database failure'); END`);
    assert.equal((await handleUninstallWebhook(delivery(), env(db))).status, 503);
    assert.equal(db.rows('SELECT * FROM webhook_deliveries').length, 0);
    assert.equal(db.rows('SELECT * FROM oauth_tokens').length, 1);
  } finally { db.close(); }
});

test('valid uninstall revokes only the signed shop and deduplicates delivery', async () => {
  const db = new LocalD1();
  try {
    for (const shop of [shopA, shopB]) {
      db.run('INSERT INTO oauth_tokens(shop,access_token,scope,installed_at) VALUES(?,?,?,?)',
        shop, 'v1.test-ciphertext', 'read_products', triggeredMs - 1000);
      db.run('INSERT INTO merchant_sessions(session_hash,shop,expires_at) VALUES(?,?,?)',
        `test-hash-${shop}`, shop, triggeredMs + 100000);
      db.run('INSERT INTO sessions(id,shop,state,access_token,created_at) VALUES(?,?,?,?,?)',
        `test-legacy-${shop}`, shop, 'test-state', 'test-legacy-token', triggeredMs - 1000);
    }
    assert.equal((await handleUninstallWebhook(delivery(), env(db))).status, 200);
    assert.equal(db.rows('SELECT shop FROM oauth_tokens').length, 1);
    assert.equal(db.rows('SELECT shop FROM oauth_tokens')[0].shop, shopB);
    assert.equal(db.rows('SELECT shop FROM merchant_sessions')[0].shop, shopB);
    assert.equal(db.rows('SELECT shop FROM sessions')[0].shop, shopB);
    assert.equal(db.rows('SELECT delivery_id FROM webhook_deliveries').length, 1);
    assert.equal((await handleUninstallWebhook(delivery(), env(db))).status, 200);
    assert.equal(db.rows('SELECT delivery_id FROM webhook_deliveries').length, 1);
    assert.equal((await handleUninstallWebhook(delivery({body: {domain: shopA, changed: true}}), env(db))).status, 409);
  } finally { db.close(); }
});

test('late old uninstall cannot revoke a newer installation or browser session', async () => {
  const db = new LocalD1();
  try {
    db.run('INSERT INTO oauth_tokens(shop,access_token,scope,installed_at) VALUES(?,?,?,?)',
      shopA, 'v1.new-ciphertext', 'read_products', triggeredMs + 1000);
    db.run('INSERT INTO merchant_sessions(session_hash,shop,expires_at) VALUES(?,?,?)',
      'test-new-session', shopA, triggeredMs + 100000);
    db.run('INSERT INTO sessions(id,shop,state,access_token,created_at) VALUES(?,?,?,?,?)',
      'test-new-legacy', shopA, 'test-state', 'test-token', triggeredMs + 1000);
    assert.equal((await handleUninstallWebhook(delivery(), env(db))).status, 200);
    assert.equal(db.rows('SELECT * FROM oauth_tokens').length, 1);
    assert.equal(db.rows('SELECT * FROM merchant_sessions').length, 1);
    assert.equal(db.rows('SELECT * FROM sessions').length, 1);
  } finally { db.close(); }
});

test('official uninstall payload shape with null domains is accepted', async () => {
  const db = new LocalD1();
  try {
    const result = await handleUninstallWebhook(delivery({
      id: 'test-official-shape', body: {id: 548380009, domain: null, myshopify_domain: null},
    }), env(db));
    assert.equal(result.status, 200);
    assert.equal(db.rows('SELECT * FROM webhook_deliveries').length, 1);
  } finally { db.close(); }
});

test('body cap and D1 failure return retryable or bounded responses', async () => {
  const db = new LocalD1();
  try {
    assert.equal((await handleUninstallWebhook(delivery({body: {domain: shopA, filler: 'x'.repeat(500)}}),
      {...env(db), SHOPIFY_WEBHOOK_MAX_BODY_BYTES: '128'})).status, 413);
    assert.equal(db.rows('SELECT * FROM webhook_deliveries').length, 0);
    const failing = {prepare: (...args) => db.prepare(...args), batch: async () => { throw new Error('test D1 outage'); }};
    assert.equal((await handleUninstallWebhook(delivery(), env(failing))).status, 503);
  } finally { db.close(); }
});
