/** Standalone Shopify app authentication. Only opaque hashes are persisted for browser state. */

const SESSION_COOKIE = '__Host-regenai_session';
const OAUTH_COOKIE = '__Host-regenai_oauth';

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function tokenHash(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}

function readCookie(request: Request, name: string): string | null {
  const entries = (request.headers.get('Cookie') ?? '').split(';');
  const pair = entries.map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : null;
}

export async function createOauthState(db: D1Database, shop: string, ttlSeconds: number) {
  const state = randomToken();
  await db.prepare('INSERT INTO oauth_states (state_hash, shop, expires_at) VALUES (?, ?, ?)')
    .bind(await tokenHash(state), shop, Date.now() + ttlSeconds * 1000)
    .run();
  return {state, setCookie: cookie(OAUTH_COOKIE, state, ttlSeconds)};
}

export async function consumeOauthState(
  db: D1Database, request: Request, state: string, shop: string,
): Promise<boolean> {
  if (!state || state !== readCookie(request, OAUTH_COOKIE)) return false;
  const row = await db.prepare(
    'DELETE FROM oauth_states WHERE state_hash = ? AND shop = ? AND expires_at > ? RETURNING shop',
  ).bind(await tokenHash(state), shop, Date.now()).first<{shop: string}>();
  return row?.shop === shop;
}

export async function createMerchantSession(db: D1Database, shop: string, ttlSeconds: number) {
  const session = randomToken();
  await db.prepare('INSERT INTO merchant_sessions (session_hash, shop, expires_at) VALUES (?, ?, ?)')
    .bind(await tokenHash(session), shop, Date.now() + ttlSeconds * 1000)
    .run();
  return cookie(SESSION_COOKIE, session, ttlSeconds);
}

export async function authenticatedShop(db: D1Database, request: Request): Promise<string | null> {
  const session = readCookie(request, SESSION_COOKIE);
  if (!session || !/^[A-Za-z0-9_-]{43}$/.test(session)) return null;
  const row = await db.prepare(
    'SELECT shop FROM merchant_sessions WHERE session_hash = ? AND expires_at > ?',
  ).bind(await tokenHash(session), Date.now()).first<{shop: string}>();
  return row?.shop ?? null;
}

export async function encryptShopToken(token: string, shop: string, base64Key: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(base64Key), (char) => char.charCodeAt(0));
  if (keyBytes.length !== 32) throw new Error('Invalid Shopify token encryption key');
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt(
    {name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(shop)},
    key,
    new TextEncoder().encode(token),
  ));
  return `v1.${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...cipher))}`;
}
