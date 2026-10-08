import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  authenticatedShop, consumeOauthState, createMerchantSession,
  createOauthState, encryptShopToken,
} from '../app/lib/merchant-auth.ts';
import {authConfig} from '../app/lib/merchant-config.ts';
import {buildInstallUrl, exchangeCodeForToken, isValidShopDomain, verifyOauthHmac} from '../app/lib/shopify.ts';

class FakeD1 {
  states = new Map();
  sessions = new Map();
  prepare(sql) {
    return {
      bind: (...values) => ({
        run: async () => {
          if (sql.startsWith('INSERT INTO oauth_states')) {
            this.states.set(values[0], {shop: values[1], expiresAt: values[2]});
          } else if (sql.startsWith('INSERT INTO merchant_sessions')) {
            this.sessions.set(values[0], {shop: values[1], expiresAt: values[2]});
          } else {
            throw new Error('Unexpected write');
          }
        },
        first: async () => {
          if (sql.startsWith('DELETE FROM oauth_states')) {
            const row = this.states.get(values[0]);
            if (!row || row.shop !== values[1] || row.expiresAt <= values[2]) return null;
            this.states.delete(values[0]);
            return {shop: row.shop};
          }
          if (sql.startsWith('SELECT shop FROM merchant_sessions')) {
            const row = this.sessions.get(values[0]);
            return row && row.expiresAt > values[1] ? {shop: row.shop} : null;
          }
          throw new Error('Unexpected read');
        },
      }),
    };
  }
}

const request = (cookie = '') => new Request('https://app.example.test/admin/reviews', {
  headers: {Cookie: cookie},
});

test('OAuth state is browser-bound, shop-bound, expiring, and single-use', async () => {
  const db = new FakeD1();
  const {state, setCookie} = await createOauthState(db, 'a.myshopify.com', 600);
  const browser = request(setCookie.split(';')[0]);
  assert.match(setCookie, /Secure; HttpOnly; SameSite=Lax/);
  assert.equal(await consumeOauthState(db, request(), state, 'a.myshopify.com'), false);
  assert.equal(await consumeOauthState(db, browser, state, 'b.myshopify.com'), false);
  assert.equal(await consumeOauthState(db, browser, state, 'a.myshopify.com'), true);
  assert.equal(await consumeOauthState(db, browser, state, 'a.myshopify.com'), false);
  const expired = await createOauthState(db, 'a.myshopify.com', 600);
  [...db.states.values()][0].expiresAt = Date.now() - 1;
  assert.equal(await consumeOauthState(db, request(expired.setCookie.split(';')[0]), expired.state, 'a.myshopify.com'), false);
});

test('merchant session rejects forged and expired cookies', async () => {
  const db = new FakeD1();
  const cookie = await createMerchantSession(db, 'a.myshopify.com', 3600);
  assert.match(cookie, /__Host-regenai_session=.*Secure; HttpOnly; SameSite=Lax/);
  assert.equal(await authenticatedShop(db, request()), null);
  assert.equal(await authenticatedShop(db, request('__Host-regenai_session=forged')), null);
  assert.equal(await authenticatedShop(db, request(cookie.split(';')[0])), 'a.myshopify.com');
  [...db.sessions.values()][0].expiresAt = Date.now() - 1;
  assert.equal(await authenticatedShop(db, request(cookie.split(';')[0])), null);
});

test('token ciphertext is bound to its shop and invalid keys fail closed', async () => {
  const rawKey = new Uint8Array(32).fill(7);
  const keyText = Buffer.from(rawKey).toString('base64');
  const cipher = await encryptShopToken('test-token', 'a.myshopify.com', keyText);
  assert.ok(!cipher.includes('test-token'));
  const [, iv, encrypted] = cipher.split('.');
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({
    name: 'AES-GCM', iv: Buffer.from(iv, 'base64'),
    additionalData: new TextEncoder().encode('a.myshopify.com'),
  }, key, Buffer.from(encrypted, 'base64'));
  assert.equal(new TextDecoder().decode(plain), 'test-token');
  await assert.rejects(() => crypto.subtle.decrypt({
    name: 'AES-GCM', iv: Buffer.from(iv, 'base64'),
    additionalData: new TextEncoder().encode('b.myshopify.com'),
  }, key, Buffer.from(encrypted, 'base64')));
  await assert.rejects(() => encryptShopToken('test-token', 'a.myshopify.com', 'bad-key'));
});

test('durations are configuration-owned and malformed values fail closed', () => {
  assert.deepEqual(authConfig({SHOPIFY_OAUTH_STATE_TTL_SECONDS: '600', SHOPIFY_SESSION_TTL_SECONDS: '3600'}), {
    stateSeconds: 600, sessionSeconds: 3600,
  });
  assert.throws(() => authConfig({SHOPIFY_OAUTH_STATE_TTL_SECONDS: '0', SHOPIFY_SESSION_TTL_SECONDS: '3600'}));
});

test('standalone install requests an offline token and rejects malformed HMAC', async () => {
  const url = buildInstallUrl({
    shop: 'a.myshopify.com', apiKey: 'test-key', scopes: 'read_products',
    appUrl: 'https://app.example.test', state: 'test-state',
  });
  assert.ok(!url.includes('grant_options'));
  assert.equal(await verifyOauthHmac(new URLSearchParams('shop=a.myshopify.com&hmac=zz'), 'test-secret'), false);
  assert.equal(await verifyOauthHmac(new URLSearchParams('hmac=a&hmac=b'), 'test-secret'), false);
  assert.equal(isValidShopDomain('a.myshopify.com'), true);
  assert.equal(isValidShopDomain('a-.myshopify.com'), false);
  assert.equal(isValidShopDomain('evil.example.test'), false);
  assert.throws(() => buildInstallUrl({shop: 'a.myshopify.com', apiKey: 'test-key', scopes: 'read_products', appUrl: 'http://app.example.test', state: 'test-state'}));
});

test('malformed token exchange responses fail closed', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({access_token: null, scope: 'read_products'});
  try {
    assert.equal(await exchangeCodeForToken({
      shop: 'a.myshopify.com', code: 'test-code', apiKey: 'test-key', apiSecret: 'test-secret',
    }), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
