import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCookieSessionStorage} from 'react-router';
import {createHydrogenRouterContext} from '../../app/lib/context';

describe('Hydrogen settings context integration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('constructs the installed Hydrogen context with Customer Account bindings absent and disabled', async () => {
    const baseEnv: Env = {
      SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
      PUBLIC_STOREFRONT_API_TOKEN: 'test-public-token-only',
      PRIVATE_STOREFRONT_API_TOKEN: '',
      PUBLIC_STORE_DOMAIN: 'regenai.myshopify.com',
      PUBLIC_STOREFRONT_ID: 'test-storefront-id',
      PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: 'test-disabled-client-id',
      PUBLIC_CUSTOMER_ACCOUNT_API_URL: '',
      PUBLIC_CHECKOUT_DOMAIN: 'regenai.myshopify.com',
      SHOP_ID: 'test-disabled-shop-id',
      NODE_ENV: 'test',
      PUBLIC_CANONICAL_ORIGIN: 'https://store.example.test',
      CUSTOMER_ACCOUNT_ENABLED: 'false',
    };
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'regenai_session',
        secrets: [baseEnv.SESSION_SECRET],
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      },
    });
    const incoming = await storage.getSession();
    incoming.set('customerAccount', {
      accessToken: 'test-old-account-access-token',
      expiresAt: String(Date.now() + 60 * 60 * 1000),
      refreshToken: 'test-old-account-refresh-token',
    });
    const cookie = await storage.commitSession(incoming);
    const fetchMock = vi.fn(async () => new Response('unexpected network request', {status: 500}));
    vi.stubGlobal('fetch', fetchMock);
    const cache = {
      match: async () => undefined,
      matchAll: async () => [],
      add: async () => undefined,
      addAll: async () => undefined,
      put: async () => undefined,
      delete: async () => true,
      keys: async () => [],
    } satisfies Cache;
    vi.stubGlobal('caches', {open: vi.fn(async () => cache)});

    const context = await createHydrogenRouterContext(
      new Request('https://store.example.test/', {headers: {Cookie: cookie}}),
      baseEnv,
      {waitUntil: () => undefined},
    );

    expect(context.settings.customerAccount.enabled).toBe(false);
    expect(context.customerAccount).toBeDefined();
    expect(context.env.PUBLIC_STORE_DOMAIN).toBe(context.settings.shopDomain);
    expect(context.env.PUBLIC_STOREFRONT_API_TOKEN).toBe(context.settings.storefrontApiToken);
    expect(context.env.PUBLIC_CHECKOUT_DOMAIN).toBe(context.settings.checkoutDomain);
    // The SDK requires string bindings. Empty strings disable the account client even
    // when previously configured credentials and an old account session are present.
    expect(context.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID).toBe('');
    expect(context.env.SHOP_ID).toBe('');
    expect(await context.customerAccount.isLoggedIn()).toBe(false);
    expect(await context.customerAccount.getBuyer()).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
