import type {Route} from './+types/admin.privacy-export';
import {authenticatedShop} from '~/lib/merchant-auth';

type PrivacyRequest = {customer_id: string | null; data_request_id: string | null};
type ProtocolRow = {
  id: string; protocol_id: string; started_at: number; target_weeks: number;
  completions: string; status: string; last_updated: number;
};

export async function loader({context, request, params}: Route.LoaderArgs) {
  const db = context.cloudflare.env?.DB;
  if (!db) throw new Response('Merchant database unavailable', {status: 503});
  const shop = await authenticatedShop(db, request);
  if (!shop) throw new Response('Merchant authentication required', {status: 401});
  if (!params.id || !/^[A-Za-z0-9_-]{1,128}$/.test(params.id)) {
    throw new Response('Request not found', {status: 404});
  }
  const item = await db.prepare(`SELECT customer_id, data_request_id FROM privacy_requests
    WHERE delivery_id = ? AND shop = ? AND topic = 'customers/data_request'`)
    .bind(params.id, shop).first<PrivacyRequest>();
  if (!item?.customer_id) throw new Response('Request not found', {status: 404});
  const result = await db.prepare(`SELECT id, protocol_id, started_at, target_weeks,
    completions, status, last_updated FROM protocol_tracker
    WHERE shop = ? AND customer_id = ? ORDER BY started_at ASC`)
    .bind(shop, item.customer_id).all<ProtocolRow>();
  const body = JSON.stringify({
    shop, customerId: item.customer_id, dataRequestId: item.data_request_id,
    protocolTracker: result.results ?? [],
  });
  return new Response(body, {status: 200, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': 'attachment; filename="regenai-customer-data.json"',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}
