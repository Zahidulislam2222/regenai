/**
 * Sentry — browser-side init.
 *
 * Loaded from app/entry.client.tsx on hydrate. Captures:
 * - Unhandled errors + promise rejections
 * - React Router navigation performance traces
 * - Web Vitals (LCP, CLS, INP, FCP, TTFB) via web-vitals library → Sentry
 *   custom metrics
 *
 * PII scrubbing in the beforeSend hook — the dev-store has no real PII
 * yet, but we establish the pattern now so Phase 2 HealthKit data / Phase
 * 3 biomarker data doesn't leak into error events.
 */

import * as Sentry from '@sentry/react';
import {onCLS, onINP, onLCP, onFCP, onTTFB, type Metric} from 'web-vitals';

type SentryEnv = {
  SENTRY_STOREFRONT_DSN?: string;
  NODE_ENV?: string;
  PUBLIC_STORE_DOMAIN?: string;
};

export function initSentry(env: SentryEnv) {
  if (!env.SENTRY_STOREFRONT_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_STOREFRONT_DSN,
    environment: env.NODE_ENV ?? 'development',

    // Performance — 100% trace sample in dev/staging, 10% in prod (adjusted D19 security pass).
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Replay — off in Phase 1 (bandwidth cost; revisit Phase 2 after observing
    // real error patterns for 30 days).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    beforeSend(event) {
      // Strip URL params that could carry emails / tokens / PII from health
      // data integrations (HealthKit ids, biomarker ids — Phase 2/3).
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          ['email', 'token', 'auth', 'hk_id', 'biomarker_id', 'protocol_token'].forEach((p) =>
            url.searchParams.delete(p),
          );
          event.request.url = url.toString();
        } catch {
          // Leave as-is if URL parse fails.
        }
      }

      // Drop any event mentioning a known Shopify checkout URL param that
      // carries a session token.
      const msg = (event.message ?? '') + ' ' + JSON.stringify(event.exception ?? {});
      if (/checkout_token=|_shopify_y=/.test(msg)) return null;

      return event;
    },

    // User context set when a customer logs in (packages/storefront Phase 1
    // login route). Keep ID only — no email/name in events.
  });

  // Web Vitals → Sentry custom measurements
  const reportVital = (metric: Metric) => {
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: metric.name,
      data: {value: metric.value, rating: metric.rating, id: metric.id},
      level: metric.rating === 'poor' ? 'warning' : 'info',
    });
    // Emit as measurement for Performance dashboards.
    Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
  };

  onCLS(reportVital);
  onINP(reportVital);
  onLCP(reportVital);
  onFCP(reportVital);
  onTTFB(reportVital);
}
