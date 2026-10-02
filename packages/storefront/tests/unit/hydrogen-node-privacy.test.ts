// @vitest-environment node

import {afterEach, describe, expect, it, vi} from 'vitest';
import {createHydrogenRouterContext} from '../../app/lib/context';
import {BoundedHydrogenCache} from '../../app/lib/cache.node';

const privateToken = 'test-only-storefront-token-NEVER-LOG';
const privateVariable = 'test-only-private-variable-NEVER-LOG';

const baseEnv: Env = {
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
  PUBLIC_STOREFRONT_API_TOKEN: privateToken,
  PRIVATE_STOREFRONT_API_TOKEN: '',
  PUBLIC_STORE_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_STOREFRONT_ID: 'test-storefront-id',
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: '',
  PUBLIC_CUSTOMER_ACCOUNT_API_URL: '',
  PUBLIC_CHECKOUT_DOMAIN: 'regenai.myshopify.com',
  SHOP_ID: '',
  NODE_ENV: 'test',
  PUBLIC_CANONICAL_ORIGIN: 'https://store.example.test',
  CUSTOMER_ACCOUNT_ENABLED: 'false',
};

function makeCache() {
  return new BoundedHydrogenCache({
    maxEntries: 8,
    maxBytes: 32_768,
    maxEntryBytes: 16_384,
    maxTtlMs: 60_000,
    maxKeyBytes: 8_192,
    maxHeaderBytes: 4_096,
    maxPendingWrites: 4,
    readTimeoutMs: 100,
  });
}

function makeContext(request: Request, cache: Cache, pending: Promise<unknown>[]) {
  return createHydrogenRouterContext(request, baseEnv, {
    cache,
    waitUntil(promise) {
      pending.push(promise);
    },
  });
}

function shopifyResponse(data: unknown, headers?: HeadersInit) {
  return new Response(JSON.stringify({data}), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=60',
      ...Object.fromEntries(new Headers(headers).entries()),
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('installed Hydrogen SDK privacy on the Node cache', () => {
  it('keeps cart.get scoped to each request cookie when contexts share the bounded cache', async () => {
    const cache = makeCache();
    const pending: Promise<unknown>[] = [];
    const seenCartIds: string[] = [];
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        query: string;
        variables?: {cartId?: string};
      };
      const cartId = body.variables?.cartId;
      if (!cartId) throw new Error('Expected Hydrogen cart query to include cartId');
      seenCartIds.push(cartId);
      return shopifyResponse({
        cart: {id: cartId, totalQuantity: cartId.endsWith('alpha') ? 2 : 5},
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const [alpha, beta] = await Promise.all([
      makeContext(
        new Request('https://store.example.test/cart', {
          headers: {Cookie: 'cart=test-cart-alpha'},
        }),
        cache,
        pending,
      ),
      makeContext(
        new Request('https://store.example.test/cart', {
          headers: {Cookie: 'cart=test-cart-beta'},
        }),
        cache,
        pending,
      ),
    ]);

    const alphaCart = await alpha.cart.get();
    const betaCart = await beta.cart.get();

    expect(alphaCart?.id).toBe('gid://shopify/Cart/test-cart-alpha');
    expect(betaCart?.id).toBe('gid://shopify/Cart/test-cart-beta');
    expect(alphaCart?.totalQuantity).toBe(2);
    expect(betaCart?.totalQuantity).toBe(5);
    expect(seenCartIds).toEqual([
      'gid://shopify/Cart/test-cart-alpha',
      'gid://shopify/Cart/test-cart-beta',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(pending).toHaveLength(0);
  });

  it('does not log real Storefront GraphQL errors or their private inputs', async () => {
    const pending: Promise<unknown>[] = [];
    const cache = makeCache();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: null,
      errors: [{message: `Rejected ${privateVariable} using ${privateToken}`}],
    }), {
      status: 200,
      headers: {'content-type': 'application/json'},
    }));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', fetchMock);

    const context = await makeContext(
      new Request('https://store.example.test/private-query'),
      cache,
      pending,
    );
    const result = await context.storefront.query(
      'query PrivateDiagnostic($privateValue: String!) { shop { name } }',
      {
        variables: {privateValue: privateVariable},
        cache: context.storefront.CacheNone(),
      },
    );

    expect(result.errors).toHaveLength(1);
    expect(errorSpy).not.toHaveBeenCalled();
    const emittedLogs = JSON.stringify({
      errors: errorSpy.mock.calls,
      warnings: warnSpy.mock.calls,
      logs: logSpy.mock.calls,
    });
    expect(emittedLogs).not.toContain(privateToken);
    expect(emittedLogs).not.toContain(privateVariable);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches in the foreground after real freshness expires without Hydrogen stale revalidation', async () => {
    vi.useFakeTimers();
    const cache = makeCache();
    const pending: Promise<unknown>[] = [];
    let responseNumber = 0;
    const fetchMock = vi.fn(async () => {
      responseNumber += 1;
      return shopifyResponse({shop: {name: `foreground-${responseNumber}`} });
    });
    vi.stubGlobal('fetch', fetchMock);

    const context = await makeContext(
      new Request('https://store.example.test/cacheable-query'),
      cache,
      pending,
    );
    const query = 'query NodePrivacyCacheProbe { shop { name } }';
    const first = await context.storefront.query(query, {
      cache: context.storefront.CacheShort(),
    });
    await Promise.all(pending.splice(0));
    expect(first.shop.name).toBe('foreground-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const freshHit = await context.storefront.query(query, {
      cache: context.storefront.CacheShort(),
    });
    expect(freshHit.shop.name).toBe('foreground-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The cache adapter checks freshness when match() begins. Delay SDK
    // deserialization after that check so the clock crosses max-age before
    // Hydrogen calls CacheAPI.isStale(). The adapter must not return the
    // internal cache-put-date header and accidentally trigger SWR.
    const originalMatch = cache.match.bind(cache);
    let delayedDecode = false;
    vi.spyOn(cache, 'match').mockImplementation(async (input) => {
      const response = await originalMatch(input);
      if (response && !delayedDecode) {
        delayedDecode = true;
        const originalText = response.text.bind(response);
        response.text = async () => {
          const body = await originalText();
          await vi.advanceTimersByTimeAsync(2_000);
          return body;
        };
      }
      return response;
    });

    const crossedDuringDecode = await context.storefront.query(query, {
      cache: context.storefront.CacheShort(),
    });
    expect(delayedDecode).toBe(true);
    expect(crossedDuringDecode.shop.name).toBe('foreground-1');
    await Promise.all(pending.splice(0));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // At 2 seconds the padded entry still exists, but the adapter must treat
    // it as expired on the next lookup and fetch in the foreground.
    await vi.advanceTimersByTimeAsync(2_000);
    const second = await context.storefront.query(query, {
      cache: context.storefront.CacheShort(),
    });
    expect(second.shop.name).toBe('foreground-2');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // The second miss may schedule finite cache storage; drain it and check it
    // did not trigger any background upstream request.
    await Promise.all(pending.splice(0));
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
