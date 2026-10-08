import {data, useLoaderData} from 'react-router';
import type {Route} from './+types/admin.privacy';
import {Card, Layout, Page, Text} from '@shopify/polaris';
import {authenticatedShop} from '~/lib/merchant-auth';
import {decryptPrivacyEmail} from '~/lib/privacy-contact';
import {resolvePrivacyRequest} from '~/lib/privacy-resolution';
import {privacyDeadlineDays} from '~/lib/merchant-config';

type PrivacyRow = {
  delivery_id: string;
  topic: string;
  customer_id: string | null;
  data_request_id: string | null;
  received_at: number;
  status: string;
  email_ciphertext: string | null;
};

export async function loader({context, request}: Route.LoaderArgs) {
  const db = context.cloudflare.env?.DB;
  if (!db) throw new Response('Merchant database unavailable', {status: 503});
  const shop = await authenticatedShop(db, request);
  if (!shop) throw new Response('Merchant authentication required', {status: 401});
  const result = await db.prepare(`SELECT delivery_id, topic, customer_id, data_request_id,
    received_at, status, email_ciphertext FROM privacy_requests
    WHERE shop = ? AND completed_at IS NULL AND status IN ('pending', 'manual_review')
    ORDER BY received_at ASC LIMIT 100`).bind(shop).all<PrivacyRow>();
  const rows = await Promise.all((result.results ?? []).map(async (row) => {
    if (row.email_ciphertext && !context.cloudflare.env.SHOPIFY_TOKEN_ENC_KEY) {
      throw new Response('Privacy contact unavailable', {status: 503});
    }
    const email = row.email_ciphertext
      ? await decryptPrivacyEmail(row.email_ciphertext, shop,
        context.cloudflare.env.SHOPIFY_TOKEN_ENC_KEY!) : null;
    const {email_ciphertext: _encrypted, ...display} = row;
    return {...display, email};
  }));
  return data({rows, deadlineDays: privacyDeadlineDays(context.cloudflare.env)},
    {headers: {'Cache-Control': 'no-store'}});
}

export async function action({context, request}: Route.ActionArgs) {
  const db = context.cloudflare.env?.DB;
  if (!db) throw new Response('Merchant database unavailable', {status: 503});
  const shop = await authenticatedShop(db, request);
  if (!shop) throw new Response('Merchant authentication required', {status: 401});
  return resolvePrivacyRequest(db, shop, request);
}

export default function AdminPrivacyRoute() {
  const {rows, deadlineDays} = useLoaderData<typeof loader>();
  return (
    <Page title="Privacy requests" subtitle="Action queue for Shopify customer data requests">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{display: 'grid', gap: 16}}>
              <Text as="p" variant="bodyMd">
                Acknowledged webhooks still require action. Provide data-request exports to the store owner,
                and investigate records marked for manual review before their due date.
              </Text>
              {rows.length === 0 && <Text as="p" variant="bodyMd">No pending requests.</Text>}
              {rows.map((row) => <div key={row.delivery_id} style={{borderTop: '1px solid #ddd', paddingTop: 12}}>
                <Text as="h2" variant="headingSm">{row.topic} · {row.status}</Text>
                <Text as="p" variant="bodySm">Received {new Date(row.received_at).toLocaleString()}</Text>
                <Text as="p" variant="bodySm">Due {new Date(row.received_at + deadlineDays * 86400000).toLocaleString()}</Text>
                <Text as="p" variant="bodySm">Customer ID: {row.customer_id ?? 'email only; manual lookup required'}</Text>
                {row.email && <Text as="p" variant="bodySm">Customer email: {row.email}</Text>}
                {row.data_request_id && <Text as="p" variant="bodySm">Request ID: {row.data_request_id}</Text>}
                {row.topic === 'customers/data_request' && row.customer_id &&
                  <a href={`/admin/privacy/${encodeURIComponent(row.delivery_id)}/export`}>
                    Download app-held protocol data
                  </a>}
                {row.topic === 'customers/data_request' && !row.customer_id &&
                  <form method="post">
                    <input type="hidden" name="deliveryId" value={row.delivery_id} />
                    <input type="hidden" name="action" value="link_customer" />
                    <label>Customer ID found in Shopify
                      <input name="customerId" inputMode="numeric" pattern="[1-9][0-9]*" required />
                    </label>
                    <button type="submit">Link customer for export</button>
                  </form>}
                {row.topic === 'customers/data_request' && row.customer_id &&
                  <form method="post">
                    <input type="hidden" name="deliveryId" value={row.delivery_id} />
                    <input type="hidden" name="action" value="resolve" />
                    <label><input type="checkbox" name="attest" value="yes" required />
                      I provided the export to the store owner</label>
                    <button type="submit">Mark data request handled</button>
                  </form>}
                {row.topic === 'customers/redact' &&
                  <form method="post">
                    <input type="hidden" name="deliveryId" value={row.delivery_id} />
                    <input type="hidden" name="action" value="resolve" />
                    <label>Customer ID found in Shopify
                      <input name="customerId" inputMode="numeric" pattern="[1-9][0-9]*" required />
                    </label>
                    <label><input type="checkbox" name="attest" value="yes" required />
                      I verified this customer ID matches the request</label>
                    <button type="submit">Delete protocol data and mark handled</button>
                  </form>}
              </div>)}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
