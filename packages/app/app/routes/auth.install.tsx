import {redirect, type LoaderFunctionArgs} from 'react-router';
import {buildInstallUrl, isValidShopDomain} from '~/lib/shopify';

/**
 * OAuth install entry point. Merchant hits /auth/install?shop=X.myshopify.com.
 * We generate a random state, stash it in KV, then redirect to the Shopify
 * authorize URL. The callback verifies state + HMAC, exchanges code for
 * token, stores token in D1.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  if (!isValidShopDomain(shop)) {
    return new Response('Invalid shop parameter', {status: 400});
  }

  if (!env?.SHOPIFY_API_KEY || !env?.SHOPIFY_API_SECRET) {
    return new Response(
      'Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET. Set via `wrangler secret put`.',
      {status: 500},
    );
  }
  if (!env?.SESSIONS) {
    return new Response('KV binding "SESSIONS" not configured', {status: 500});
  }

  const state = crypto.randomUUID();
  await env.SESSIONS.put(`oauth:state:${state}`, shop, {expirationTtl: 600});

  const installUrl = buildInstallUrl({
    shop,
    apiKey: env.SHOPIFY_API_KEY,
    scopes: env.SHOPIFY_API_SCOPES,
    appUrl: env.SHOPIFY_APP_URL,
    state,
  });
  return redirect(installUrl);
}
