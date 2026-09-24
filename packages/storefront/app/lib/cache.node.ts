import {createHash} from 'node:crypto';
import {LRUCache} from 'lru-cache';

export type BoundedHydrogenCacheOptions = {
  maxEntries: number;
  maxBytes: number;
  maxEntryBytes: number;
  maxTtlMs: number;
  maxKeyBytes: number;
  maxHeaderBytes: number;
  maxPendingWrites: number;
  readTimeoutMs: number;
};

type StoredResponse = {
  body: Uint8Array;
  headers: [string, string][];
  status: number;
  statusText: string;
  storedAt: number;
  expiresAt: number;
  cachePutAt: number;
  byteSize: number;
};

const encoder = new TextEncoder();
const forbiddenResponseHeaders = new Set([
  'set-cookie',
  'www-authenticate',
]);

function utf8Bytes(value: string): number {
  return encoder.encode(value).byteLength;
}

function cacheDirectives(value: string): Map<string, string | true> {
  const result = new Map<string, string | true>();
  for (const part of value.split(',')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    const name = rawName?.toLowerCase();
    if (!name) continue;
    const joinedValue = rawValue.join('=').trim();
    result.set(name, joinedValue.replace(/^"|"$/g, '') || true);
  }
  return result;
}

function secondsDirective(
  directives: Map<string, string | true>,
  name: string,
): number | undefined {
  const value = directives.get(name);
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) ? seconds : undefined;
}

function asRequest(value: RequestInfo | URL): Request {
  return value instanceof Request ? value : new Request(value);
}

function validateOptions(options: BoundedHydrogenCacheOptions): void {
  for (const [name, value] of Object.entries(options)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TypeError(`Invalid cache bound: ${name}`);
    }
  }
  if (options.maxEntryBytes > options.maxBytes) {
    throw new TypeError('Invalid cache bound: maxEntryBytes exceeds maxBytes');
  }
}

/**
 * A process-local, bounded implementation of the Web Cache methods Hydrogen uses.
 * Raw Hydrogen cache URLs are reversible and can contain a Storefront token and
 * GraphQL variables, so only their SHA-256 digests are retained.
 */
export class BoundedHydrogenCache implements Cache {
  readonly #options: BoundedHydrogenCacheOptions;
  readonly #entries: LRUCache<string, StoredResponse>;
  #pendingWrites = 0;

  constructor(options: BoundedHydrogenCacheOptions) {
    validateOptions(options);
    this.#options = options;
    this.#entries = new LRUCache({
      max: options.maxEntries,
      maxSize: options.maxBytes,
      sizeCalculation: (entry) => entry.byteSize,
    });
  }

  async match(input: RequestInfo | URL): Promise<Response | undefined> {
    const request = asRequest(input);
    const key = this.#keyFor(request);
    if (!key) return undefined;
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.#entries.delete(key);
      return undefined;
    }

    const headers = new Headers(entry.headers);
    const realCacheControl = cacheDirectives(
      headers.get('real-cache-control') ?? '',
    );
    const freshSeconds = secondsDirective(realCacheControl, 'max-age') ?? 0;
    if (Date.now() >= entry.cachePutAt + freshSeconds * 1000) {
      // Hydrogen logs raw SWR failures internally even when logErrors is false.
      // Node intentionally uses fresh-only semantics; Worker cache is unchanged.
      this.#entries.delete(key);
      return undefined;
    }
    headers.set('cache', 'HIT');
    headers.set('date', new Date(entry.cachePutAt).toUTCString());
    // Hydrogen's isStale() can run after the response was read. Omitting this
    // metadata from the returned copy prevents a delayed stale revalidation;
    // the private stored copy remains available for this adapter's TTL checks.
    headers.delete('cache-put-date');

    return new Response(entry.body.slice(), {
      status: entry.status,
      statusText: entry.statusText,
      headers,
    });
  }

  async put(input: RequestInfo | URL, response: Response): Promise<void> {
    const request = asRequest(input);
    if (request.method !== 'GET') {
      throw new TypeError('Cannot cache response to non-GET request.');
    }
    if (response.status === 206 || request.headers.has('range')) {
      throw new TypeError('Cannot cache response to a range request.');
    }

    const key = this.#keyFor(request);
    if (!key || response.status !== 200 || !response.body) return;
    const vary = response.headers.get('vary');
    if (vary && vary.trim() !== '') return;
    for (const name of forbiddenResponseHeaders) {
      if (response.headers.has(name)) return;
    }

    const paddedDirectives = cacheDirectives(response.headers.get('cache-control') ?? '');
    if (
      paddedDirectives.has('private') ||
      paddedDirectives.has('no-store') ||
      paddedDirectives.get('public') === undefined
    ) return;

    const maxAgeSeconds = secondsDirective(paddedDirectives, 'max-age');
    if (maxAgeSeconds === undefined) return;
    const ttlMs = Math.min(
      maxAgeSeconds * 1000,
      this.#options.maxTtlMs,
    );
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1) return;

    const headers = Array.from(response.headers.entries());
    const headerBytes = headers.reduce(
      (total, [name, value]) => total + utf8Bytes(name) + utf8Bytes(value),
      0,
    );
    if (headerBytes > this.#options.maxHeaderBytes) return;

    const realDirectives = cacheDirectives(response.headers.get('real-cache-control') ?? '');
    const realMaxAge = secondsDirective(realDirectives, 'max-age');
    const rawCachePutAt = response.headers.get('cache-put-date');
    const cachePutAt = rawCachePutAt && /^\d{1,16}$/.test(rawCachePutAt)
      ? Number(rawCachePutAt)
      : Number.NaN;
    if (realMaxAge === undefined || !Number.isSafeInteger(cachePutAt) || cachePutAt < 0) return;

    if (this.#pendingWrites >= this.#options.maxPendingWrites) {
      void response.body.cancel().catch(() => undefined);
      return;
    }

    let reader: ReadableStreamDefaultReader<Uint8Array>;
    try {
      // Acquire before claiming a slot: getReader() throws for an already-locked
      // stream and must not leak capacity in that case.
      reader = response.body.getReader();
    } catch {
      return;
    }

    this.#pendingWrites += 1;
    let releaseSlot = true;
    const chunks: Uint8Array[] = [];
    let bodyBytes = 0;
    try {
      const consume = async (): Promise<boolean> => {
        try {
          while (true) {
            const {done, value} = await reader.read();
            if (done) return true;
            bodyBytes += value.byteLength;
            if (bodyBytes > this.#options.maxEntryBytes) {
              void reader.cancel().catch(() => undefined);
              return false;
            }
            chunks.push(value);
          }
        } catch {
          void reader.cancel().catch(() => undefined);
          return false;
        }
      };
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<undefined>((resolve) => {
        timeoutId = setTimeout(() => resolve(undefined), this.#options.readTimeoutMs);
      });
      const readPromise = consume();
      const result = await Promise.race([readPromise, timeout]);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (result === undefined) {
        releaseSlot = false;
        // A stream's cancellation algorithm is user supplied and may never
        // settle. Do not let it block this put; keep the slot until read settles.
        void reader.cancel().catch(() => undefined);
        void readPromise.finally(() => {
          this.#pendingWrites -= 1;
        });
        return;
      }
      if (!result) return;
    } finally {
      if (releaseSlot) this.#pendingWrites -= 1;
      try {
        reader.releaseLock();
      } catch {
        // A timed-out read keeps its slot until the pending read settles.
      }
    }

    const byteSize = 96 + key.length + headerBytes + bodyBytes;
    if (byteSize > this.#options.maxEntryBytes || byteSize > this.#options.maxBytes) return;

    const body = new Uint8Array(bodyBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    this.#entries.set(key, {
      body,
      headers,
      status: response.status,
      statusText: response.statusText,
      storedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      cachePutAt,
      byteSize,
    }, {ttl: ttlMs});
  }

  async delete(input: RequestInfo | URL): Promise<boolean> {
    const key = this.#keyFor(asRequest(input));
    return key ? this.#entries.delete(key) : false;
  }

  async keys(): Promise<ReadonlyArray<Request>> {
    throw new Error('Cache key enumeration is unsupported for private synthetic keys.');
  }

  async matchAll(): Promise<ReadonlyArray<Response>> {
    throw new Error('Cache response enumeration is unsupported.');
  }

  async add(): Promise<void> {
    throw new Error('Method not implemented. Use put instead.');
  }

  async addAll(): Promise<void> {
    throw new Error('Method not implemented. Use put instead.');
  }

  #keyFor(request: Request): string | undefined {
    if (
      request.method !== 'GET' ||
      request.headers.has('range') ||
      request.headers.has('cookie') ||
      request.headers.has('authorization')
    ) return undefined;
    if (utf8Bytes(request.url) > this.#options.maxKeyBytes) return undefined;
    return createHash('sha256').update(request.url, 'utf8').digest('hex');
  }
}
