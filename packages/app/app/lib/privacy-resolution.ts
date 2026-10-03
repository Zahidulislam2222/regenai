import {boundedBody} from './webhook-request.ts';

const noStore = {'Cache-Control': 'no-store'};
const redirect = () => new Response(null, {status: 303, headers: {...noStore, Location: '/admin/privacy'}});
const validId = (value: string | null) => value && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const validCustomer = (value: string | null) => value && /^[1-9]\d{0,19}$/.test(value);

type RequestRow = {topic: string; customer_id: string | null; completed_at: number | null};

/** An authenticated merchant attests to handling a queued privacy request. */
export async function resolvePrivacyRequest(db: D1Database, shop: string, request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return new Response('Forbidden', {status: 403, headers: noStore});
  }
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get('Content-Type') ?? '')) {
    return new Response('Invalid form', {status: 400, headers: noStore});
  }
  const bytes = await boundedBody(request, 2048);
  if (!bytes) return new Response('Form too large', {status: 413, headers: noStore});
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
  } catch {
    return new Response('Invalid form', {status: 400, headers: noStore});
  }
  const deliveryId = form.get('deliveryId');
  const action = form.get('action');
  const customerId = form.get('customerId');
  if (!validId(deliveryId) || !['link_customer', 'resolve'].includes(action ?? '')) {
    return new Response('Invalid form', {status: 400, headers: noStore});
  }
  const row = await db.prepare(`SELECT topic, customer_id, completed_at FROM privacy_requests
    WHERE delivery_id = ? AND shop = ?`).bind(deliveryId, shop).first<RequestRow>();
  if (!row) return new Response('Request not found', {status: 404, headers: noStore});
  if (row.completed_at !== null) return redirect();

  if (action === 'link_customer' && row.topic === 'customers/data_request' &&
      !row.customer_id && validCustomer(customerId)) {
    await db.prepare(`UPDATE privacy_requests SET customer_id = ?, status = 'pending',
      email_ciphertext = NULL WHERE delivery_id = ? AND shop = ? AND completed_at IS NULL`)
      .bind(customerId, deliveryId, shop).run();
    return redirect();
  }
  if (action === 'resolve' && form.get('attest') === 'yes') {
    if (row.topic === 'customers/data_request' && row.customer_id) {
      await db.prepare(`UPDATE privacy_requests SET completed_at = ?, email_ciphertext = NULL
        WHERE delivery_id = ? AND shop = ? AND completed_at IS NULL`)
        .bind(Date.now(), deliveryId, shop).run();
      return redirect();
    }
    if (row.topic === 'customers/redact' && validCustomer(customerId)) {
      await db.batch([
        db.prepare(`DELETE FROM protocol_tracker WHERE shop = ? AND customer_id = ?
          AND EXISTS (SELECT 1 FROM privacy_requests WHERE delivery_id = ?
            AND shop = ? AND completed_at IS NULL)`)
          .bind(shop, customerId, deliveryId, shop),
        db.prepare(`UPDATE privacy_requests SET customer_id = ?, status = 'redacted',
          completed_at = ?, email_ciphertext = NULL
          WHERE delivery_id = ? AND shop = ? AND completed_at IS NULL`)
          .bind(customerId, Date.now(), deliveryId, shop),
      ]);
      return redirect();
    }
  }
  return new Response('Invalid resolution', {status: 400, headers: noStore});
}
