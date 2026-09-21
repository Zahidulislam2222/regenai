// @vitest-environment node

import {afterEach, describe, expect, it, vi} from 'vitest';
import {LRUCache} from 'lru-cache';
import {BoundedHydrogenCache} from '../../app/lib/cache.node';

const makeCache = (overrides: Partial<ConstructorParameters<typeof BoundedHydrogenCache>[0]> = {}) =>
  new BoundedHydrogenCache({
    maxEntries: 2,
    maxBytes: 16_384,
    maxEntryBytes: 8_192,
    maxTtlMs: 60_000,
    maxKeyBytes: 8_192,
    maxHeaderBytes: 4_096,
    maxPendingWrites: 2,
    readTimeoutMs: 100,
    ...overrides,
  });

const publicResponse = (body = 'cached result', headers?: HeadersInit) =>
  new Response(body, {
    headers: {
      'cache-control': 'public, max-age=6, stale-while-revalidate=5',
      'real-cache-control': 'public, max-age=1',
      'cache-put-date': String(Date.now()),
      ...Object.fromEntries(new Headers(headers).entries()),
    },
  });

describe('BoundedHydrogenCache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('uses opaque storage identity and does not expose original synthetic URLs', async () => {
    const cache = makeCache();
    const setSpy = vi.spyOn(LRUCache.prototype, 'set');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const sensitiveUrl =
      'https://shopify.dev/?https%3A%2F%2Fshop.example%2FgraphqlPOSTtoken%3Dtest-storefront-token%26query%3Dcart+buyer+variables';
    const request = new Request(sensitiveUrl);
    await cache.put(request, publicResponse());

    expect(await (await cache.match(request))?.text()).toBe('cached result');
    const [storedKey, storedValue] = setSpy.mock.calls[0] as unknown as [string, {body: Uint8Array; headers: [string, string][]}];
    expect(storedKey).toMatch(/^[a-f0-9]{64}$/);
    expect(storedKey).not.toContain('test-storefront-token');
    expect(JSON.stringify({body: Array.from(storedValue.body), headers: storedValue.headers})).not.toContain('test-storefront-token');
    expect(JSON.stringify({body: Array.from(storedValue.body), headers: storedValue.headers})).not.toContain('cart+buyer+variables');
    await expect(cache.keys()).rejects.toThrow(/unsupported/);
    expect(errorSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('clones cached bytes and returns independent responses', async () => {
    const cache = makeCache();
    const request = new Request('https://shopify.dev/?public-key');
    await cache.put(request, publicResponse());

    const first = await cache.match(request);
    expect(first).toBeDefined();
    expect(await first!.text()).toBe('cached result');
    expect(await (await cache.match(request))?.text()).toBe('cached result');
  });

  it('uses only real freshness in Node and preserves Hydrogen padded retention metadata', async () => {
    vi.useFakeTimers();
    const cache = makeCache({maxTtlMs: 60_000});
    const request = new Request('https://shopify.dev/?ttl');
    await cache.put(request, publicResponse());

    expect((await cache.match(request))?.headers.get('cache')).toBe('HIT');
    expect((await cache.match(request))?.headers.get('real-cache-control')).toBe('public, max-age=1');
    expect((await cache.match(request))?.headers.has('cache-put-date')).toBe(false);
    await vi.advanceTimersByTimeAsync(1_001);
    expect(await cache.match(request)).toBeUndefined();
    await vi.advanceTimersByTimeAsync(4_001);
    expect(await cache.match(request)).toBeUndefined();
  });

  it('caps configured retention even when Hydrogen supplies a longer padded TTL', async () => {
    vi.useFakeTimers();
    const cache = makeCache({maxTtlMs: 2_000});
    const request = new Request('https://shopify.dev/?capped-ttl');
    await cache.put(request, publicResponse());

    await vi.advanceTimersByTimeAsync(2_001);
    expect(await cache.match(request)).toBeUndefined();
  });

  it('evicts least-recently-used entries under the finite item cap', async () => {
    const cache = makeCache({maxEntries: 2});
    const a = new Request('https://shopify.dev/?a');
    const b = new Request('https://shopify.dev/?b');
    const c = new Request('https://shopify.dev/?c');
    await cache.put(a, publicResponse('a'));
    await cache.put(b, publicResponse('b'));
    await cache.match(a);
    await cache.put(c, publicResponse('c'));

    expect(await cache.match(a)).toBeDefined();
    expect(await cache.match(b)).toBeUndefined();
    expect(await (await cache.match(c))?.text()).toBe('c');
  });

  it('rejects an oversized streamed body and cancels its source before retaining it', async () => {
    const cache = makeCache({maxEntryBytes: 1_024, maxBytes: 4_096});
    const request = new Request('https://shopify.dev/?large');
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(700));
        controller.enqueue(new Uint8Array(700));
      },
    });
    const response = new Response(body, {headers: {
      'cache-control': 'public, max-age=5',
      'real-cache-control': 'public, max-age=5',
      'cache-put-date': String(Date.now()),
    }});
    const probeReader = response.body!.getReader();
    const readerPrototype = Object.getPrototypeOf(probeReader);
    probeReader.releaseLock();
    const cancelSpy = vi.spyOn(readerPrototype, 'cancel');

    await cache.put(request, response);

    expect(cancelSpy).toHaveBeenCalledOnce();
    expect(await cache.match(request)).toBeUndefined();
  });

  it('does not cache private, no-store, cookie-bearing, varied, or non-public responses', async () => {
    const cache = makeCache();
    const cases = [
      publicResponse('private', {'cache-control': 'private, max-age=10'}),
      publicResponse('no-store', {'cache-control': 'public, no-store'}),
      publicResponse('cookie', {'set-cookie': 'session=fake'}),
      publicResponse('vary', {vary: 'Cookie'}),
      publicResponse('no-public', {'cache-control': 'max-age=10'}),
    ];

    for (const [index, response] of cases.entries()) {
      const request = new Request(`https://shopify.dev/?private-${index}`);
      await cache.put(request, response);
      expect(await cache.match(request), `response case ${index}`).toBeUndefined();
    }
  });

  it('bounds request-key bytes and rejects range/non-GET cache writes', async () => {
    const cache = makeCache({maxKeyBytes: 80});
    const longRequest = new Request(`https://shopify.dev/?${'x'.repeat(100)}`);
    await cache.put(longRequest, publicResponse());
    expect(await cache.match(longRequest)).toBeUndefined();

    const rangeRequest = new Request('https://shopify.dev/?range', {headers: {Range: 'bytes=0-1'}});
    await expect(cache.put(rangeRequest, publicResponse())).rejects.toThrow(/range/);
    expect(await cache.match(rangeRequest)).toBeUndefined();

    const cookieRequest = new Request('https://shopify.dev/?cookie', {headers: {Cookie: 'session=fake'}});
    await cache.put(cookieRequest, publicResponse());
    expect(await cache.match(cookieRequest)).toBeUndefined();
    const authRequest = new Request('https://shopify.dev/?auth', {headers: {Authorization: 'Bearer test-token'}});
    await cache.put(authRequest, publicResponse());
    expect(await cache.match(authRequest)).toBeUndefined();

    const mutation = new Request('https://shopify.dev/?mutation', {method: 'POST', body: 'test'});
    await expect(cache.put(mutation, publicResponse())).rejects.toThrow(/non-GET/);
  });

  it('does not retain entries whose response header metadata exceeds the cap', async () => {
    const cache = makeCache({maxHeaderBytes: 40});
    const request = new Request('https://shopify.dev/?headers');
    await cache.put(request, publicResponse('body', {'x-large': 'x'.repeat(100)}));
    expect(await cache.match(request)).toBeUndefined();
  });

  it('does not wait for a hung cancellation or release the slot while the read is still pending', async () => {
    vi.useFakeTimers();
    const cache = makeCache({maxPendingWrites: 1, readTimeoutMs: 10});
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array([1])); },
    });
    const firstResponse = new Response(stream, {headers: {
      'cache-control': 'public, max-age=10',
      'real-cache-control': 'public, max-age=10',
      'cache-put-date': String(Date.now()),
    }});
    const probeReader = firstResponse.body!.getReader();
    const readerPrototype = Object.getPrototypeOf(probeReader);
    probeReader.releaseLock();
    const cancelSpy = vi.spyOn(readerPrototype, 'cancel')
      .mockImplementation(() => new Promise<void>(() => undefined));
    const firstRequest = new Request('https://shopify.dev/?hung-one');
    const firstPut = cache.put(firstRequest, firstResponse);
    await Promise.resolve();
    const secondResponse = new Response(new ReadableStream<Uint8Array>({
    }), {headers: {
      'cache-control': 'public, max-age=10',
      'real-cache-control': 'public, max-age=10',
      'cache-put-date': String(Date.now()),
    }});
    const secondPut = cache.put(new Request('https://shopify.dev/?hung-two'), secondResponse);

    await vi.advanceTimersByTimeAsync(11);
    await Promise.all([firstPut, secondPut]);
    expect(cancelSpy).toHaveBeenCalled();
    expect(await cache.match(firstRequest)).toBeUndefined();
    expect(await cache.match(new Request('https://shopify.dev/?hung-two'))).toBeUndefined();
  });

  it('does not claim a pending slot when the response body is already locked', async () => {
    const cache = makeCache({maxPendingWrites: 1});
    const lockedResponse = new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode('body')); },
    }), {headers: {
      'cache-control': 'public, max-age=10',
      'real-cache-control': 'public, max-age=10',
    }});
    const lock = lockedResponse.body!.getReader();

    await expect(cache.put(
      new Request('https://shopify.dev/?locked'),
      lockedResponse,
    )).resolves.toBeUndefined();

    const validRequest = new Request('https://shopify.dev/?valid-after-lock');
    await cache.put(validRequest, publicResponse('available'));
    expect(await (await cache.match(validRequest))?.text()).toBe('available');
    await lock.cancel();
    lock.releaseLock();
  });
});
