import {redirect, type LoaderFunctionArgs} from 'react-router';
import {buildInstallUrl, isValidShopDomain} from '~/lib/shopify';
import {createOauthState} from '~/lib/merchant-auth';
import {authConfig} from '~/lib/merchant-config';

/**
 * OAuth install entry point. Merchant hits /auth/install?shop=X.myshopify.com.
 * We generate a browser-bound random state in D1, then redirect to the Shopify
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
    return new Response('Merchant authorization unavailable', {status: 503});
  }
  if (!env?.DB) return new Response('Merchant database unavailable', {status: 503});

  const {stateSeconds} = authConfig(env);
  const {state, setCookie} = await createOauthState(env.DB, shop, stateSeconds);

  const installUrl = buildInstallUrl({
    shop,
    apiKey: env.SHOPIFY_API_KEY,
    scopes: env.SHOPIFY_API_SCOPES,
    appUrl: env.SHOPIFY_APP_URL,
    state,
  });
  return redirect(installUrl, {headers: {'Set-Cookie': setCookie}});
}
