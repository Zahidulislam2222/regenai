import {readSignedWebhook} from './webhook-request.ts';

const noStore = {'Cache-Control': 'no-store'};

export async function handleUninstallWebhook(request: Request, env: Env): Promise<Response> {
  const signed = await readSignedWebhook(request, env, ['app/uninstalled']);
  if (signed instanceof Response) return signed;
  const {shop, topic, deliveryId, eventAt, hash} = signed;
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
