import {data, useLoaderData} from 'react-router';
import type {Route} from './+types/admin.review-detail';
import {Badge, Card, Layout, Page, Text} from '@shopify/polaris';
import {authenticatedShop} from '~/lib/merchant-auth';

interface ReviewDetail {
  id: string;
  product_handle: string;
  product_title: string;
  submitted_at: string;
  status: string;
  claim_summary: string;
  diff_json: string;
  evidence_level: string | null;
  fda_class: string | null;
}

export async function loader({context, request, params}: Route.LoaderArgs) {
  const db = context.cloudflare.env?.DB;
  if (!db) throw new Response('Merchant database unavailable', {status: 503});
  const shop = await authenticatedShop(db, request);
  if (!shop) throw new Response('Merchant authentication required', {status: 401});
  if (!params.id) throw new Response('Review not found', {status: 404});

  const review = await db.prepare(
    `SELECT id, product_handle, product_title, submitted_at, status,
            claim_summary, diff_json, evidence_level, fda_class
     FROM clinician_review_queue WHERE id = ? AND shop = ?`,
  ).bind(params.id, shop).first<ReviewDetail>();
  if (!review) throw new Response('Review not found', {status: 404});
  return data({review});
}

export default function ReviewDetailRoute() {
  const {review} = useLoaderData<typeof loader>();
  return (
    <Page title={review.product_title} backAction={{content: 'Reviews', url: '/admin/reviews'}}>
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{display: 'grid', gap: 12}}>
              <Text as="p" variant="bodyMd">{review.product_handle}</Text>
              <Text as="p" variant="bodyMd">{review.claim_summary}</Text>
              <div><Badge tone="info">{review.status}</Badge></div>
              <Text as="p" variant="bodySm" tone="subdued">
                Submitted {new Date(review.submitted_at).toLocaleString()}
              </Text>
              <Text as="p" variant="bodySm">Evidence: {review.evidence_level ?? 'Not provided'}</Text>
              <Text as="p" variant="bodySm">Device class: {review.fda_class ?? 'Not determined'}</Text>
              <Text as="h2" variant="headingMd">Proposed change</Text>
              <pre style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{review.diff_json}</pre>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
