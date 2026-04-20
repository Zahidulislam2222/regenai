import {redirect, type LoaderFunctionArgs} from 'react-router';
import {
  exchangeCodeForToken,
  isValidShopDomain,
  verifyOauthHmac,
} from '~/lib/shopify';

/**
 * OAuth callback. Verifies `state`, verifies HMAC, exchanges `code` for an
 * offline access token, stores token in D1, redirects to the admin UI.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!isValidShopDomain(shop)) return new Response('Invalid shop', {status: 400});
  if (!code || !state) return new Response('Missing code or state', {status: 400});
  if (!env?.SHOPIFY_API_KEY || !env?.SHOPIFY_API_SECRET) {
    return new Response('Missing SHOPIFY_API_KEY / SHOPIFY_API_SECRET', {status: 500});
  }
  if (!env?.SESSIONS || !env?.DB) {
    return new Response('KV or D1 binding missing', {status: 500});
  }

  // Verify state matches the one we issued at /auth/install.
  const storedShop = await env.SESSIONS.get(`oauth:state:${state}`);
  if (storedShop !== shop) return new Response('State mismatch', {status: 403});
  await env.SESSIONS.delete(`oauth:state:${state}`);

  // Verify HMAC.
  const ok = await verifyOauthHmac(url.searchParams, env.SHOPIFY_API_SECRET);
  if (!ok) return new Response('HMAC verification failed', {status: 403});

  // Exchange code for token.
  const tokenPayload = await exchangeCodeForToken({
    shop,
    code,
    apiKey: env.SHOPIFY_API_KEY,
    apiSecret: env.SHOPIFY_API_SECRET,
  });
  if (!tokenPayload) return new Response('Token exchange failed', {status: 502});

  // Persist token in D1 (Day-19 security pass wraps this in AES-GCM encrypt).
  await env.DB.prepare(
    `INSERT INTO oauth_tokens (shop, access_token, scope, installed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(shop) DO UPDATE SET
       access_token = excluded.access_token,
       scope = excluded.scope,
       installed_at = excluded.installed_at,
       uninstalled_at = NULL`,
  )
    .bind(shop, tokenPayload.access_token, tokenPayload.scope, Date.now())
    .run();

  return redirect(`/admin/reviews?shop=${encodeURIComponent(shop)}`);
}
