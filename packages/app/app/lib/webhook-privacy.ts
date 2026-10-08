import {readSignedWebhook, type SignedWebhook} from './webhook-request.ts';
import {encryptPrivacyEmail} from './privacy-contact.ts';

const noStore = {'Cache-Control': 'no-store'};
const topics = ['customers/data_request', 'customers/redact', 'shop/redact'] as const;

function identifier(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value)) return value;
  return null;
}

function customerIdentifier(payload: Record<string, unknown>): string | null {
  const customer = payload.customer;
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) return null;
  return identifier((customer as Record<string, unknown>).id);
}

function emailOnlyCustomer(payload: Record<string, unknown>): string | null {
  const customer = payload.customer;
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) return null;
  const email = (customer as Record<string, unknown>).email;
  return typeof email === 'string' && email.length > 0 && email.length <= 320 ? email : null;
}

function matchesDelivery(
  row: {shop: string; topic: string; triggered_at: number; payload_sha256: string},
  signed: SignedWebhook,
) {
  return row.shop === signed.shop && row.topic === signed.topic &&
    row.triggered_at === signed.eventAt && row.payload_sha256 === signed.hash;
}

async function priorDelivery(db: D1Database, signed: SignedWebhook): Promise<Response | null> {
  const row = await db.prepare(
    'SELECT shop, topic, triggered_at, payload_sha256 FROM webhook_deliveries WHERE delivery_id = ?',
  ).bind(signed.deliveryId).first<{
    shop: string; topic: string; triggered_at: number; payload_sha256: string;
  }>();
  if (!row) return null;
  return new Response(matchesDelivery(row, signed) ? 'OK' : 'Delivery ID conflict', {
    status: matchesDelivery(row, signed) ? 200 : 409, headers: noStore,
  });
}

function receipt(signed: SignedWebhook, db: D1Database) {
  return db.prepare(`INSERT INTO webhook_deliveries
    (delivery_id, shop, topic, triggered_at, received_at, payload_sha256)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(delivery_id) DO NOTHING`)
    .bind(signed.deliveryId, signed.shop, signed.topic, signed.eventAt, Date.now(), signed.hash);
}

async function customerPrivacy(signed: SignedWebhook, db: D1Database, emailKey?: string): Promise<Response> {
  const customerId = customerIdentifier(signed.payload);
  const email = customerId ? null : emailOnlyCustomer(signed.payload);
  if (!customerId && !email) {
    return new Response('Missing customer identifier', {status: 400, headers: noStore});
  }
  const dataRequestId = signed.topic === 'customers/data_request'
    ? identifier((signed.payload.data_request as Record<string, unknown> | null)?.id) : null;
  if (signed.topic === 'customers/data_request' && !dataRequestId) {
    return new Response('Missing data request ID', {status: 400, headers: noStore});
  }
  const previous = await priorDelivery(db, signed);
  if (previous?.status === 409) return previous;
  if (email && !emailKey) {
    return new Response('Privacy contact encryption unavailable', {status: 503, headers: noStore});
  }
  const emailCiphertext = email && emailKey
    ? await encryptPrivacyEmail(email, signed.shop, emailKey) : null;
  const matching = `EXISTS (SELECT 1 FROM webhook_deliveries WHERE delivery_id = ?
    AND shop = ? AND topic = ? AND triggered_at = ? AND payload_sha256 = ?)`;
  const condition = [signed.deliveryId, signed.shop, signed.topic, signed.eventAt, signed.hash];
  const status = signed.topic === 'customers/data_request' ? customerId ? 'pending' : 'manual_review'
    : customerId ? 'redacted' : 'manual_review';
  const statements = [receipt(signed, db)];
  if (signed.topic === 'customers/redact' && customerId) {
    statements.push(db.prepare(`DELETE FROM protocol_tracker WHERE shop = ? AND customer_id = ?
      AND ${matching}`).bind(signed.shop, customerId, ...condition));
  }
  statements.push(db.prepare(`INSERT INTO privacy_requests
    (delivery_id, shop, topic, customer_id, data_request_id, received_at, status, email_ciphertext)
    SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ${matching}
    ON CONFLICT(delivery_id) DO NOTHING`)
    .bind(signed.deliveryId, signed.shop, signed.topic, customerId,
      dataRequestId, Date.now(), status, emailCiphertext, ...condition));
  await db.batch(statements);
  const saved = await priorDelivery(db, signed);
  const request = await db.prepare('SELECT shop, topic FROM privacy_requests WHERE delivery_id = ?')
    .bind(signed.deliveryId).first<{shop: string; topic: string}>();
  if (!saved || saved.status !== 200 || request?.shop !== signed.shop || request.topic !== signed.topic) {
    throw new Error('Privacy webhook receipt not persisted');
  }
  return saved;
}

async function shopRedact(signed: SignedWebhook, db: D1Database): Promise<Response> {
  // A live token means the shop may have reinstalled. Do not erase that install.
  const active = await db.prepare('SELECT shop FROM oauth_tokens WHERE shop = ?')
    .bind(signed.shop).first<{shop: string}>();
  if (active) return new Response('Shop installation requires review', {status: 503, headers: noStore});
  const scopedTables = [
    'protocol_tracker', 'clinician_review_queue', 'sessions', 'oauth_states',
    'merchant_sessions', 'privacy_requests', 'webhook_deliveries',
  ] as const;
  await db.batch(scopedTables.map((table) =>
    db.prepare(`DELETE FROM ${table} WHERE shop = ?
      AND NOT EXISTS (SELECT 1 FROM oauth_tokens WHERE shop = ?)`)
      .bind(signed.shop, signed.shop)));
  for (const table of [...scopedTables, 'oauth_tokens'] as const) {
    const remaining = await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE shop = ?`)
      .bind(signed.shop).first<{n: number}>();
    if (!remaining || remaining.n !== 0) throw new Error('Shop redaction incomplete');
  }
  return new Response('OK', {status: 200, headers: noStore});
}

export async function handlePrivacyWebhook(request: Request, env: Env): Promise<Response> {
  const signed = await readSignedWebhook(request, env, topics);
  if (signed instanceof Response) return signed;
  const {payload, shop, topic} = signed;
  if (payload.shop_domain !== shop || !identifier(payload.shop_id)) {
    return new Response('Invalid privacy payload', {status: 400, headers: noStore});
  }
  try {
    return topic === 'shop/redact'
      ? await shopRedact(signed, env.DB)
      : await customerPrivacy(signed, env.DB, env.SHOPIFY_TOKEN_ENC_KEY);
  } catch {
    return new Response('Webhook temporarily unavailable', {status: 503, headers: noStore});
  }
}
