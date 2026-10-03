import {webhookMaxBodyBytes} from './merchant-config.ts';
import {isValidShopDomain, verifyWebhookHmac} from './shopify.ts';

const noStore = {'Cache-Control': 'no-store'};

export type SignedWebhook = {
  shop: string;
  topic: string;
  deliveryId: string;
  eventAt: number;
  payload: Record<string, unknown>;
  hash: string;
};

export async function boundedBody(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer> | null> {
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

export function digestHex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  return crypto.subtle.digest('SHA-256', bytes).then((digest) =>
    [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
}

/** HMAC is checked before any header or JSON field is trusted. */
export async function readSignedWebhook(
  request: Request, env: Env, allowedTopics: readonly string[],
): Promise<SignedWebhook | Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', {status: 405, headers: noStore});
  if (!env?.SHOPIFY_API_SECRET) {
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
  if (!env.DB) return new Response('Webhook unavailable', {status: 503, headers: noStore});
  const shop = request.headers.get('X-Shopify-Shop-Domain');
  const topic = request.headers.get('X-Shopify-Topic');
  const deliveryId = request.headers.get('X-Shopify-Webhook-Id');
  const eventAt = triggeredTime(request.headers.get('X-Shopify-Triggered-At'));
  if (!topic || !allowedTopics.includes(topic) || !isValidShopDomain(shop) ||
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
  const object = payload as Record<string, unknown>;
  const myshopifyDomain = object.myshopify_domain;
  const domain = object.domain;
  const privacyDomain = object.shop_domain;
  if ((typeof myshopifyDomain === 'string' && myshopifyDomain !== shop) ||
      (typeof domain === 'string' && domain.endsWith('.myshopify.com') && domain !== shop) ||
      (typeof privacyDomain === 'string' && privacyDomain !== shop)) {
    return new Response('Shop mismatch', {status: 400, headers: noStore});
  }
  return {shop, topic, deliveryId, eventAt, payload: object, hash: await digestHex(bytes)};
}
