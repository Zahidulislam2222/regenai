import {redirect, type LoaderFunctionArgs} from 'react-router';
import {
  exchangeCodeForToken,
  isValidShopDomain,
  verifyOauthHmac,
} from '~/lib/shopify';
import {
  authConfig, consumeOauthState, createMerchantSession, encryptShopToken,
} from '~/lib/merchant-auth';

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
    return new Response('Merchant authorization unavailable', {status: 503});
  }
  if (!env?.DB || !env?.SHOPIFY_TOKEN_ENC_KEY) {
    return new Response('Merchant authorization unavailable', {status: 503});
  }
  const {sessionSeconds} = authConfig(env);

  // Validate the Shopify signature before consuming the single-use browser-bound state.
  const ok = await verifyOauthHmac(url.searchParams, env.SHOPIFY_API_SECRET);
  if (!ok) return new Response('HMAC verification failed', {status: 403});
  if (!(await consumeOauthState(env.DB, request, state, shop))) {
    return new Response('State mismatch or expired', {status: 403});
  }

  // Exchange code for token.
  const tokenPayload = await exchangeCodeForToken({
    shop,
    code,
    apiKey: env.SHOPIFY_API_KEY,
    apiSecret: env.SHOPIFY_API_SECRET,
  });
  if (!tokenPayload) return new Response('Token exchange failed', {status: 502});

  // Encrypt before storing; an absent or invalid key prevents a successful install.
  const encryptedToken = await encryptShopToken(
    tokenPayload.access_token, shop, env.SHOPIFY_TOKEN_ENC_KEY,
  );
  await env.DB.prepare(
    `INSERT INTO oauth_tokens (shop, access_token, scope, installed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(shop) DO UPDATE SET
       access_token = excluded.access_token,
       scope = excluded.scope,
       installed_at = excluded.installed_at,
       uninstalled_at = NULL`,
  )
    .bind(shop, encryptedToken, tokenPayload.scope, Date.now())
    .run();

  const sessionCookie = await createMerchantSession(env.DB, shop, sessionSeconds);
  const headers = new Headers();
  headers.append('Set-Cookie', sessionCookie);
  headers.append('Set-Cookie', '__Host-regenai_oauth=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax');
  return redirect('/admin/reviews', {
    headers,
  });
}
