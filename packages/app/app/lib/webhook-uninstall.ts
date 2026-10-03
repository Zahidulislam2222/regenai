import {webhookMaxBodyBytes} from './merchant-config.ts';
import {isValidShopDomain, verifyWebhookHmac} from './shopify.ts';

const noStore = {'Cache-Control': 'no-store'};

async function boundedBody(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const declared = request.headers.get('Content-Length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function validDeliveryId(value: string | null): value is string {
  return Boolean(value && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value));
}

function triggeredTime(value: string | null): number | null {
  if (!value || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function digestHex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  return crypto.subtle.digest('SHA-256', bytes).then((digest) =>
    [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
}

export async function handleUninstallWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', {status: 405, headers: noStore});
  if (!env?.SHOPIFY_API_SECRET || !env?.DB) {
    return new Response('Webhook unavailable', {status: 503, headers: noStore});
  }

  let maxBytes: number;
  try {
    maxBytes = webhookMaxBodyBytes(env);
  } catch {
    return new Response('Webhook unavailable', {status: 503, headers: noStore});
  }
  const bytes = await boundedBody(request, maxBytes);
  if (!bytes) return new Response('Payload too large', {status: 413, headers: noStore});

  const signature = request.headers.get('X-Shopify-Hmac-Sha256');
  if (!signature || !(await verifyWebhookHmac(bytes.buffer, signature, env.SHOPIFY_API_SECRET))) {
    return new Response('Unauthorized', {status: 401, headers: noStore});
  }

  const shop = request.headers.get('X-Shopify-Shop-Domain');
  const topic = request.headers.get('X-Shopify-Topic');
  const deliveryId = request.headers.get('X-Shopify-Webhook-Id');
  const eventAt = triggeredTime(request.headers.get('X-Shopify-Triggered-At'));
  if (topic !== 'app/uninstalled' || !isValidShopDomain(shop) ||
      !validDeliveryId(deliveryId) || eventAt === null ||
      !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') ?? '')) {
    return new Response('Invalid webhook metadata', {status: 400, headers: noStore});
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
  } catch {
    return new Response('Invalid webhook JSON', {status: 400, headers: noStore});
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return new Response('Invalid webhook JSON', {status: 400, headers: noStore});
  }
  const shopPayload = payload as Record<string, unknown>;
  const myshopifyDomain = shopPayload.myshopify_domain;
  const domain = shopPayload.domain;
  if ((typeof myshopifyDomain === 'string' && myshopifyDomain !== shop) ||
      (typeof domain === 'string' && domain.endsWith('.myshopify.com') && domain !== shop)) {
    return new Response('Shop mismatch', {status: 400, headers: noStore});
  }
  const hash = await digestHex(bytes);
  const matches = (row: {shop: string; topic: string; triggered_at: number; payload_sha256: string}) =>
    row.shop === shop && row.topic === topic && row.triggered_at === eventAt &&
    row.payload_sha256 === hash;

  try {
    const previous = await env.DB.prepare(
      'SELECT shop, topic, triggered_at, payload_sha256 FROM webhook_deliveries WHERE delivery_id = ?',
    ).bind(deliveryId).first<{shop: string; topic: string; triggered_at: number; payload_sha256: string}>();
    if (previous) {
      return new Response(matches(previous) ? 'OK' : 'Delivery ID conflict', {
        status: matches(previous) ? 200 : 409, headers: noStore,
      });
    }

    const matchingDelivery = `EXISTS (SELECT 1 FROM webhook_deliveries
      WHERE delivery_id = ? AND shop = ? AND topic = 'app/uninstalled'
      AND triggered_at = ? AND payload_sha256 = ?)`;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO webhook_deliveries
        (delivery_id, shop, topic, triggered_at, received_at, payload_sha256)
        VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(delivery_id) DO NOTHING`)
        .bind(deliveryId, shop, topic, eventAt, Date.now(), hash),
      env.DB.prepare(`DELETE FROM sessions WHERE shop = ? AND created_at < ? AND ${matchingDelivery}`)
        .bind(shop, eventAt, deliveryId, shop, eventAt, hash),
      env.DB.prepare(`DELETE FROM merchant_sessions WHERE shop = ?
        AND NOT EXISTS (SELECT 1 FROM oauth_tokens WHERE shop = ? AND installed_at >= ?)
        AND ${matchingDelivery}`)
        .bind(shop, shop, eventAt, deliveryId, shop, eventAt, hash),
      env.DB.prepare(`DELETE FROM oauth_tokens WHERE shop = ? AND installed_at < ? AND ${matchingDelivery}`)
        .bind(shop, eventAt, deliveryId, shop, eventAt, hash),
    ]);
    const saved = await env.DB.prepare(
      'SELECT shop, topic, triggered_at, payload_sha256 FROM webhook_deliveries WHERE delivery_id = ?',
    ).bind(deliveryId).first<{shop: string; topic: string; triggered_at: number; payload_sha256: string}>();
    if (!saved) throw new Error('Webhook delivery not persisted');
    return new Response(matches(saved) ? 'OK' : 'Delivery ID conflict', {
      status: matches(saved) ? 200 : 409, headers: noStore,
    });
  } catch {
    return new Response('Webhook temporarily unavailable', {status: 503, headers: noStore});
  }
}
