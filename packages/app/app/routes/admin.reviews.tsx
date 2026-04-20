import {data, type LoaderFunctionArgs, useLoaderData} from 'react-router';
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Badge,
  Text,
  EmptyState,
  Banner,
} from '@shopify/polaris';

/**
 * Clinician review dashboard — first admin-app route for Day 15.
 *
 * Reads pending items from the `clinician_review_queue` D1 table. Each
 * row represents a product-copy diff routed for clinician sign-off
 * before merge (compliance-as-code gate — see PROJECT_PLAN §6 Phase 1
 * features, ADR-016 for the policy).
 *
 * Day 20 builds this out with:
 *   - Diff viewer (before/after product.descriptionHtml)
 *   - Approve / request-change / reject actions
 *   - GitHub PR webhook comment on approval
 *
 * Day 15 scope: query + list + empty state + routing surface.
 */

interface ReviewRow {
  id: string;
  product_handle: string;
  product_title: string;
  submitter_id: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  claim_summary: string;
  evidence_level: string | null;
  fda_class: string | null;
}

export async function loader({context}: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  let rows: ReviewRow[] = [];
  let error: string | null = null;

  if (!env?.DB) {
    error = 'D1 binding "DB" is not configured. Run: wrangler d1 create regenai-app';
  } else {
    try {
      const result = await env.DB.prepare(
        `SELECT id, product_handle, product_title, submitter_id,
                submitted_at, status, claim_summary, evidence_level, fda_class
         FROM clinician_review_queue
         WHERE status = 'pending'
         ORDER BY submitted_at DESC
         LIMIT 50`,
      ).all<ReviewRow>();
      rows = result.results ?? [];
    } catch (err) {
      // D1 will error if migrations haven't run yet — surface a helpful message.
      error = err instanceof Error ? err.message : 'D1 query failed';
    }
  }

  return data({rows, error});
}

export default function AdminReviewsRoute() {
  const {rows, error} = useLoaderData<typeof loader>();

  return (
    <Page title="Clinician review queue" subtitle="Pending product-copy reviews awaiting clinician sign-off">
      <Layout>
        {error ? (
          <Layout.Section>
            <Banner tone="warning" title="D1 database not ready">
              <p>{error}</p>
              <p>
                Day-15 setup — run <code>npm run migrate:local</code> (or{' '}
                <code>migrate:remote</code> once <code>wrangler d1 create regenai-app</code> has
                populated <code>wrangler.toml</code>).
              </p>
            </Banner>
          </Layout.Section>
        ) : null}

        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{singular: 'review', plural: 'reviews'}}
              items={rows}
              emptyState={
                <EmptyState
                  heading="Nothing pending"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Product-copy edits that touch FDA / DSHEA / contraindication claim text will
                    route here for clinician review before merge.
                  </p>
                </EmptyState>
              }
              renderItem={(row) => <ReviewListItem row={row} />}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function ReviewListItem({row}: {row: ReviewRow}) {
  return (
    <ResourceItem id={row.id} url={`/admin/reviews/${row.id}`} accessibilityLabel={`Review ${row.product_title}`}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
        <Text as="h3" variant="bodyMd" fontWeight="semibold">
          {row.product_title}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {row.product_handle} · submitted {new Date(row.submitted_at).toLocaleString()}
        </Text>
        <Text as="p" variant="bodySm">
          {row.claim_summary}
        </Text>
        <div style={{display: 'flex', gap: 6, marginTop: 4}}>
          <Badge tone="info">{`Evidence: ${row.evidence_level ?? '—'}`}</Badge>
          {row.fda_class ? <Badge tone="attention">{`FDA ${row.fda_class}`}</Badge> : null}
        </div>
      </div>
    </ResourceItem>
  );
}
