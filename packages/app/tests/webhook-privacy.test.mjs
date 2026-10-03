import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {test} from 'node:test';
import {handlePrivacyWebhook} from '../app/lib/webhook-privacy.ts';
import {decryptPrivacyEmail} from '../app/lib/privacy-contact.ts';
import {LocalD1} from './helpers/local-d1.mjs';

const secret = 'test-webhook-secret';
const shopA = 'alpha.myshopify.com';
const shopB = 'beta.myshopify.com';
const date = '2026-10-04T00:00:00.000000Z';
const testKey = Buffer.alloc(32, 7).toString('base64');
const env = (DB) => ({DB, SHOPIFY_API_SECRET: secret, SHOPIFY_WEBHOOK_MAX_BODY_BYTES: '65536',
  SHOPIFY_TOKEN_ENC_KEY: testKey});

function delivery({topic = 'customers/data_request', id = 'test-privacy-1', shop = shopA,
  body, signature = true} = {}) {
  const payload = body ?? {shop_id: 123, shop_domain: shop,
    customer: {id: 456, email: 'never-store@example.test'}, data_request: {id: 789}};
  const raw = JSON.stringify(payload);
  return new Request('https://app.example.test/webhooks/privacy', {
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

test('privacy routes reject forged, mismatched, and malformed deliveries before any write', async () => {
  const db = new LocalD1();
  try {
    assert.equal((await handlePrivacyWebhook(delivery({signature: false}), env(db))).status, 401);
    assert.equal((await handlePrivacyWebhook(delivery({signature: false}), env(null))).status, 401);
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'orders/create'}), env(db))).status, 400);
    assert.equal((await handlePrivacyWebhook(delivery({body: {
      shop_id: 123, shop_domain: shopB, customer: {id: 456}, data_request: {id: 789},
    }}), env(db))).status, 400);
    assert.equal((await handlePrivacyWebhook(delivery({body: {
      shop_id: 123, shop_domain: shopA, customer: {id: 456},
    }}), env(db))).status, 400);
    assert.equal(db.rows('SELECT * FROM privacy_requests').length, 0);
    assert.equal(db.rows('SELECT * FROM webhook_deliveries').length, 0);
  } finally { db.close(); }
});

test('data request is queued without contact details and duplicate is idempotent', async () => {
  const db = new LocalD1();
  try {
    const request = delivery();
    assert.equal((await handlePrivacyWebhook(request, env(db))).status, 200);
    const row = db.rows('SELECT * FROM privacy_requests')[0];
    assert.equal(row.status, 'pending');
    assert.equal(row.customer_id, '456');
    assert.equal(row.data_request_id, '789');
    assert.equal(JSON.stringify(row).includes('never-store@example.test'), false);
    assert.equal((await handlePrivacyWebhook(delivery(), env(db))).status, 200);
    assert.equal(db.rows('SELECT * FROM privacy_requests').length, 1);
    assert.equal((await handlePrivacyWebhook(delivery({body: {
      shop_id: 123, shop_domain: shopA, customer: {id: 999}, data_request: {id: 789},
    }}), env(db))).status, 409);
    db.run('DELETE FROM privacy_requests WHERE delivery_id = ?', 'test-privacy-1');
    assert.equal((await handlePrivacyWebhook(delivery(), env(db))).status, 200);
    assert.equal(db.rows('SELECT * FROM privacy_requests').length, 1);
  } finally { db.close(); }
});

test('customer redaction removes only matching shop and customer protocol rows', async () => {
  const db = new LocalD1();
  try {
    for (const [id, shop, customer] of [
      ['a', shopA, '456'], ['b', shopA, '999'], ['c', shopB, '456'],
    ]) db.run('INSERT INTO protocol_tracker(id,shop,customer_id,protocol_id) VALUES(?,?,?,?)',
      id, shop, customer, 'test-protocol');
    const body = {shop_id: 123, shop_domain: shopA, customer: {id: 456, email: 'private@example.test'}};
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'customers/redact', id: 'test-redact', body}), env(db))).status, 200);
    assert.deepEqual(db.rows('SELECT id FROM protocol_tracker ORDER BY id').map((row) => row.id), ['b', 'c']);
    assert.equal(db.rows('SELECT status FROM privacy_requests')[0].status, 'redacted');
  } finally { db.close(); }
});

test('email-only redaction is queued for manual review without storing the email', async () => {
  const db = new LocalD1();
  try {
    const body = {shop_id: 123, shop_domain: shopA, customer: {email: 'private@example.test'}};
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'customers/redact', id: 'test-email-only', body}), env(db))).status, 200);
    const row = db.rows('SELECT * FROM privacy_requests')[0];
    assert.equal(row.status, 'manual_review');
    assert.equal(row.customer_id, null);
    assert.equal(JSON.stringify(row).includes('private@example.test'), false);
    assert.equal(await decryptPrivacyEmail(row.email_ciphertext, shopA, testKey), 'private@example.test');
    await assert.rejects(() => decryptPrivacyEmail(row.email_ciphertext, shopB, testKey));
  } finally { db.close(); }
});

test('shop redaction clears all its app data while preserving another shop', async () => {
  const db = new LocalD1();
  try {
    for (const shop of [shopA, shopB]) {
      db.run('INSERT INTO protocol_tracker(id,shop,customer_id,protocol_id) VALUES(?,?,?,?)',
        `tracker-${shop}`, shop, '456', 'test-protocol');
      db.run(`INSERT INTO clinician_review_queue
        (id,shop,product_id,product_handle,product_title,submitter_id,status,claim_summary,diff_json)
        VALUES(?,?,?,?,?,?,?,?,?)`, `review-${shop}`, shop, 'p', 'p', 'Product', 'staff',
        'pending', 'test claim', '{}');
      db.run('INSERT INTO sessions(id,shop,state,access_token) VALUES(?,?,?,?)',
        `session-${shop}`, shop, 'test-state', 'test-token');
      db.run('INSERT INTO oauth_states(state_hash,shop,expires_at) VALUES(?,?,?)',
        `state-${shop}`, shop, Date.now() + 1000);
      db.run('INSERT INTO merchant_sessions(session_hash,shop,expires_at) VALUES(?,?,?)',
        `merchant-${shop}`, shop, Date.now() + 1000);
    }
    await handlePrivacyWebhook(delivery(), env(db));
    const body = {shop_id: 123, shop_domain: shopA};
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'shop/redact', id: 'test-shop-redact', body}), env(db))).status, 200);
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'shop/redact', id: 'test-shop-redact', body}), env(db))).status, 200);
    for (const table of ['protocol_tracker', 'clinician_review_queue', 'sessions',
      'oauth_states', 'merchant_sessions', 'privacy_requests', 'webhook_deliveries']) {
      assert.equal(db.rows(`SELECT * FROM ${table} WHERE shop = ?`, shopA).length, 0);
    }
    assert.equal(db.rows('SELECT * FROM protocol_tracker WHERE shop = ?', shopB).length, 1);
    assert.equal(db.rows('SELECT * FROM clinician_review_queue WHERE shop = ?', shopB).length, 1);
  } finally { db.close(); }
});

test('active installation blocks a possibly stale shop redaction', async () => {
  const db = new LocalD1();
  try {
    db.run('INSERT INTO oauth_tokens(shop,access_token,scope) VALUES(?,?,?)',
      shopA, 'v1.test-ciphertext', 'read_products');
    const body = {shop_id: 123, shop_domain: shopA};
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'shop/redact', body}), env(db))).status, 503);
    assert.equal(db.rows('SELECT * FROM oauth_tokens').length, 1);
  } finally { db.close(); }
});

test('failed customer redaction transaction rolls back receipt and tracker delete', async () => {
  const db = new LocalD1();
  try {
    db.run('INSERT INTO protocol_tracker(id,shop,customer_id,protocol_id) VALUES(?,?,?,?)',
      'test-tracker', shopA, '456', 'test-protocol');
    db.sqlite.exec(`CREATE TRIGGER fail_privacy_request BEFORE INSERT ON privacy_requests
      BEGIN SELECT RAISE(ABORT, 'test failure'); END`);
    const body = {shop_id: 123, shop_domain: shopA, customer: {id: 456}};
    assert.equal((await handlePrivacyWebhook(delivery({topic: 'customers/redact', body}), env(db))).status, 503);
    assert.equal(db.rows('SELECT * FROM protocol_tracker').length, 1);
    assert.equal(db.rows('SELECT * FROM webhook_deliveries').length, 0);
  } finally { db.close(); }
});
