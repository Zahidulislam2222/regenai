/// <reference types="@cloudflare/workers-types" />
/// <reference types="react-router" />

declare global {
  interface Env {
    DB: D1Database;
    SHOPIFY_APP_URL: string;
    SHOPIFY_API_SCOPES: string;
    // Secrets (set via `wrangler secret put`, never in wrangler.toml):
    SHOPIFY_API_KEY?: string;
    SHOPIFY_API_SECRET?: string;
    SHOPIFY_TOKEN_ENC_KEY?: string;
    SHOPIFY_OAUTH_STATE_TTL_SECONDS: string;
    SHOPIFY_SESSION_TTL_SECONDS: string;
    REVIEW_QUEUE_LIMIT: string;
    SHOPIFY_WEBHOOK_MAX_BODY_BYTES: string;
    SENTRY_APP_DSN?: string;
  }
}

// AppLoadContext is declared in server.ts using the canonical
// cloudflare/templates shape: `{ cloudflare: { env, ctx } }`.

export {};
