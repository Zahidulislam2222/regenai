import assert from 'node:assert/strict';
import {test} from 'node:test';
import {encryptPrivacyEmail} from '../app/lib/privacy-contact.ts';
import {resolvePrivacyRequest} from '../app/lib/privacy-resolution.ts';
import {LocalD1} from './helpers/local-d1.mjs';

const shopA = 'alpha.myshopify.com';
const shopB = 'beta.myshopify.com';
const testKey = Buffer.alloc(32, 7).toString('base64');
const origin = 'https://app.example.test';

function form(fields, originHeader = origin) {
  return new Request(`${origin}/admin/privacy`, {method: 'POST', headers: {
    Origin: originHeader, 'Content-Type': 'application/x-www-form-urlencoded',
  }, body: new URLSearchParams(fields)});
}

function requestRow(db, id, shop, topic, customerId, ciphertext = null) {
  db.run(`INSERT INTO privacy_requests
    (delivery_id,shop,topic,customer_id,data_request_id,received_at,status,email_ciphertext)
    VALUES(?,?,?,?,?,?,?,?)`, id, shop, topic, customerId,
    topic === 'customers/data_request' ? '789' : null, Date.now(),
    customerId ? 'pending' : 'manual_review', ciphertext);
}

test('privacy resolution enforces same-origin form and shop scope', async () => {
  const db = new LocalD1();
  try {
    requestRow(db, 'test-request', shopA, 'customers/data_request', '456');
    const fields = {deliveryId: 'test-request', action: 'resolve', attest: 'yes'};
    assert.equal((await resolvePrivacyRequest(db, shopA, form(fields, 'https://evil.example.test'))).status, 403);
    assert.equal((await resolvePrivacyRequest(db, shopB, form(fields))).status, 404);
    assert.equal(db.rows('SELECT completed_at FROM privacy_requests')[0].completed_at, null);
  } finally { db.close(); }
});

test('email-only data request can link a customer then be attested and clears contact', async () => {
  const db = new LocalD1();
  try {
    const ciphertext = await encryptPrivacyEmail('private@example.test', shopA, testKey);
    requestRow(db, 'test-email-request', shopA, 'customers/data_request', null, ciphertext);
    assert.equal((await resolvePrivacyRequest(db, shopA, form({
      deliveryId: 'test-email-request', action: 'link_customer', customerId: '456',
    }))).status, 303);
    let row = db.rows('SELECT customer_id, email_ciphertext, completed_at FROM privacy_requests')[0];
    assert.equal(row.customer_id, '456');
    assert.equal(row.email_ciphertext, null);
    assert.equal(row.completed_at, null);
    assert.equal((await resolvePrivacyRequest(db, shopA, form({
      deliveryId: 'test-email-request', action: 'resolve',
    }))).status, 400);
    assert.equal((await resolvePrivacyRequest(db, shopA, form({
      deliveryId: 'test-email-request', action: 'resolve', attest: 'yes',
    }))).status, 303);
    row = db.rows('SELECT customer_id, email_ciphertext, completed_at FROM privacy_requests')[0];
    assert.equal(typeof row.completed_at, 'number');
  } finally { db.close(); }
});

test('manual customer redaction atomically deletes only identified protocol rows', async () => {
  const db = new LocalD1();
  try {
    requestRow(db, 'test-redact', shopA, 'customers/redact', null, 'v1.test-ciphertext');
    for (const [id, shop, customer] of [
      ['a', shopA, '456'], ['b', shopA, '999'], ['c', shopB, '456'],
    ]) db.run('INSERT INTO protocol_tracker(id,shop,customer_id,protocol_id) VALUES(?,?,?,?)',
      id, shop, customer, 'test-protocol');
    assert.equal((await resolvePrivacyRequest(db, shopA, form({
      deliveryId: 'test-redact', action: 'resolve', customerId: '456', attest: 'yes',
    }))).status, 303);
    assert.deepEqual(db.rows('SELECT id FROM protocol_tracker ORDER BY id').map((row) => row.id), ['b', 'c']);
    const row = db.rows('SELECT customer_id, email_ciphertext, completed_at FROM privacy_requests')[0];
    assert.equal(row.customer_id, '456');
    assert.equal(row.email_ciphertext, null);
    assert.equal(typeof row.completed_at, 'number');
  } finally { db.close(); }
});
