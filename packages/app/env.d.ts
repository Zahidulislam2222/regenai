/// <reference types="@cloudflare/workers-types" />
/// <reference types="react-router" />

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  SHOPIFY_APP_URL: string;
  SHOPIFY_API_SCOPES: string;
  // Secrets (set via `wrangler secret put`, never in wrangler.toml):
  SHOPIFY_API_KEY?: string;
  SHOPIFY_API_SECRET?: string;
  SENTRY_APP_DSN?: string;
}

// AppLoadContext is declared in server.ts using the canonical
// cloudflare/templates shape: `{ cloudflare: { env, ctx } }`.

export {};
