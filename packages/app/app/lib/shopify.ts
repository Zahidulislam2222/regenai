/**
 * Minimal Shopify OAuth + HMAC helpers for the Cloudflare Workers runtime.
 *
 * Intentionally small — avoids the `@shopify/shopify-app-remix` package
 * because it expects Node APIs we don't have on Workers. Day 15 scaffold;
 * Day 20+ can swap to a library if the surface grows.
 */

const SHOPIFY_API_VERSION = '2026-01';

/**
 * Constant-time compare — guards the HMAC check against timing attacks.
 * Workers expose `crypto.subtle.timingSafeEqual` on recent compat dates;
 * fall back to a manual loop if it's absent.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Verify the Shopify OAuth HMAC on an install/callback URL.
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant#verify-the-hmac
 */
export async function verifyOauthHmac(
  searchParams: URLSearchParams,
  apiSecret: string,
): Promise<boolean> {
  const hmac = searchParams.get('hmac');
  if (!hmac) return false;

  const sorted = [...searchParams.entries()]
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sorted));
  const expected = new Uint8Array(sig);
  const given = hexToBytes(hmac);
  return timingSafeEqual(expected, given);
}

/**
 * Verify a Shopify webhook HMAC (base64 header `X-Shopify-Hmac-Sha256`).
 */
export async function verifyWebhookHmac(
  body: ArrayBuffer,
  hmacHeader: string,
  apiSecret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, body);
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return timingSafeEqual(
    new TextEncoder().encode(expected),
    new TextEncoder().encode(hmacHeader),
  );
}

export function buildInstallUrl({
  shop,
  apiKey,
  scopes,
  appUrl,
  state,
}: {
  shop: string;
  apiKey: string;
  scopes: string;
  appUrl: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopes,
    redirect_uri: `${appUrl}/auth/callback`,
    state,
    'grant_options[]': 'per-user',
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken({
  shop,
  code,
  apiKey,
  apiSecret,
}: {
  shop: string;
  code: string;
  apiKey: string;
  apiSecret: string;
}): Promise<{access_token: string; scope: string} | null> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify({client_id: apiKey, client_secret: apiSecret, code}),
  });
  if (!res.ok) return null;
  return (await res.json()) as {access_token: string; scope: string};
}

export function isValidShopDomain(shop: string | null): shop is string {
  if (!shop) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

export const SHOPIFY = {API_VERSION: SHOPIFY_API_VERSION} as const;
