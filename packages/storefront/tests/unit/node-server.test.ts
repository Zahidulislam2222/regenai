// @vitest-environment node

import {afterEach, describe, expect, it, vi} from 'vitest';
import {mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request as httpRequest, type IncomingHttpHeaders} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createNodeRuntime} from '../../app/lib/node-server';
import {loadStorefrontSettings, type StorefrontSettings} from '../../app/lib/settings.server';

const baseSettings = loadStorefrontSettings({
  NODE_ENV: 'test',
  LOCAL_DEVELOPMENT: 'true',
  PUBLIC_CANONICAL_ORIGIN: 'http://127.0.0.1:3001',
  PUBLIC_STORE_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_CHECKOUT_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_STOREFRONT_API_TOKEN: 'test-public-token-only',
  PUBLIC_STOREFRONT_ID: 'test-storefront-id',
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
});

type TestWorker = {
  fetch(request: Request, env: Env, context: {cache: Cache; waitUntil(promise: Promise<unknown>): void}): Promise<Response>;
};

function makeSettings(overrides: Partial<StorefrontSettings['nodeServer']> = {}): StorefrontSettings {
  return {...baseSettings, nodeServer: {...baseSettings.nodeServer, port: 0, ...overrides}};
}

const testEnv = {...baseSettings} as Env;

function runRequest(port: number, options: {
  path?: string;
  method?: string;
  headers?: IncomingHttpHeaders;
  body?: string;
} = {}): Promise<{status: number; headers: IncomingHttpHeaders; body: string}> {
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest({
      host: '127.0.0.1',
      port,
      path: options.path ?? '/',
      method: options.method ?? 'GET',
      headers: options.headers,
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('aborted', () => rejectRequest(new Error('HTTP response aborted')));
      response.on('error', rejectRequest);
      response.on('end', () => resolveRequest({
        status: response.statusCode ?? 0,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    request.on('error', rejectRequest);
    if (options.body) request.write(options.body);
    request.end();
  });
}

async function startRuntime(worker: TestWorker, clientDirectory?: string, settings = makeSettings()) {
  const runtime = createNodeRuntime({settings, env: testEnv, worker, clientDirectory});
  await new Promise<void>((resolveListen, rejectListen) => {
    runtime.server.once('error', rejectListen);
    runtime.server.listen(0, '127.0.0.1', resolveListen);
  });
  const port = (runtime.server.address() as AddressInfo).port;
  return {runtime, port};
}

describe('Node Fetch runtime boundary', () => {
  const runtimes: Array<{shutdown(): Promise<void>}> = [];
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(runtimes.splice(0).map((runtime) => runtime.shutdown()));
    await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {recursive: true, force: true})));
  });

  it('uses canonical origin, strips forged proxy and buyer headers, and preserves actual Origin', async () => {
    const worker: TestWorker = {
      async fetch(request) {
        return Response.json({
          url: request.url,
          host: request.headers.get('host'),
          origin: request.headers.get('origin'),
          forwarded: request.headers.get('forwarded'),
          forwardedHost: request.headers.get('x-forwarded-host'),
          buyerIp: request.headers.get('oxygen-buyer-ip'),
          buyerSig: request.headers.get('x-shopify-client-ip-sig'),
          requestId: request.headers.get('request-id'),
        });
      },
    };
    const {runtime, port} = await startRuntime(worker);
    runtimes.push(runtime);

    const response = await runRequest(port, {path: '/search?q=demo', headers: {
      Host: 'attacker.example',
      Forwarded: ['host=attacker.example', 'proto=https'],
      forwarded: 'host=second-attacker.example',
      'X-Forwarded-Host': ['attacker.example', 'second-attacker.example'],
      'x-forwarded-proto': 'https',
      origin: 'https://actual-origin.example.test',
      'Oxygen-Buyer-IP': 'forged-ip',
      'X-Shopify-Client-IP-Sig': 'forged-signature',
      'Request-ID': 'forged-request-id',
      'request-id': 'second-forged-request-id',
    }});

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      url: 'http://127.0.0.1:3001/search?q=demo',
      host: '127.0.0.1:3001',
      origin: 'https://actual-origin.example.test',
      forwarded: null,
      forwardedHost: null,
      buyerIp: null,
      buyerSig: null,
      requestId: null,
    });
  });

  it.each([
    '/assets/%2e%2e/private.txt',
    '/assets/%2f..%2fprivate.txt',
    '/assets/%5c..%5cprivate.txt',
    '/assets/%zz',
    '/assets/%00secret',
    '/assets//private.txt',
  ])('rejects hostile raw request target %s before routing', async (path) => {
    const worker = {fetch: vi.fn(async () => new Response('should not route'))};
    const {runtime, port} = await startRuntime(worker);
    runtimes.push(runtime);
    const response = await runRequest(port, {path});
    expect(response.status).toBe(400);
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it('streams bounded assets, rejects reserved methods and dotfiles, and blocks symlink escape', async () => {
    const clientDirectory = await mkdtemp(join(tmpdir(), 'regenai-node-client-'));
    temporaryDirectories.push(clientDirectory);
    await mkdir(join(clientDirectory, 'assets'));
    await mkdir(join(clientDirectory, 'media'));
    await writeFile(join(clientDirectory, 'assets', 'app-abcdef123456.css'), 'body{color:green}');
    await writeFile(join(clientDirectory, 'assets', '.env'), 'must-not-serve');
    const worker = {fetch: vi.fn(async () => new Response('SSR'))};
    const {runtime, port} = await startRuntime(worker, clientDirectory);
    runtimes.push(runtime);

    const asset = await runRequest(port, {path: '/assets/app-abcdef123456.css'});
    expect(asset.status).toBe(200);
    expect(asset.body).toBe('body{color:green}');
    expect(asset.headers['content-type']).toContain('text/css');
    expect(asset.headers['cache-control']).toContain('immutable');
    expect((await runRequest(port, {path: '/assets/.env'})).status).toBe(404);
    expect((await runRequest(port, {path: '/assets/app-abcdef123456.css', method: 'POST'})).status).toBe(405);
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it.skipIf(process.platform === 'win32')('blocks symlink escape from static roots', async () => {
    const clientDirectory = await mkdtemp(join(tmpdir(), 'regenai-node-client-'));
    const externalDirectory = await mkdtemp(join(tmpdir(), 'regenai-node-outside-'));
    temporaryDirectories.push(clientDirectory, externalDirectory);
    await mkdir(join(clientDirectory, 'media'));
    await writeFile(join(externalDirectory, 'outside.txt'), 'outside-root');
    await symlink(join(externalDirectory, 'outside.txt'), join(clientDirectory, 'media', 'escape.txt'));
    const worker = {fetch: vi.fn(async () => new Response('SSR'))};
    const {runtime, port} = await startRuntime(worker, clientDirectory);
    runtimes.push(runtime);

    expect((await runRequest(port, {path: '/media/escape.txt'})).status).toBe(404);
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it('enforces the streamed body cap and returns 413 without leaking the stream error', async () => {
    const worker: TestWorker = {
      async fetch(request) {
        try { await request.text(); } catch { /* boundary returns the fixed 413 response */ }
        return new Response('not used');
      },
    };
    const {runtime, port} = await startRuntime(worker, undefined, makeSettings({maxRequestBodyBytes: 1_024}));
    runtimes.push(runtime);
    const response = await runRequest(port, {
      path: '/mutation',
      method: 'POST',
      headers: {'transfer-encoding': 'chunked'},
      body: 'x'.repeat(1_200),
    });
    expect(response.status).toBe(413);
    expect(response.body).toBe('Payload too large');
  });

  it('safely closes a failed response stream without logging its error details', async () => {
    const worker: TestWorker = {
      async fetch() {
        let sent = false;
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            if (!sent) {
              sent = true;
              controller.enqueue(new TextEncoder().encode('partial-html'));
            } else {
              throw new Error('private GraphQL query token=test-secret cart=private-cart');
            }
          },
        });
        return new Response(body, {headers: {'content-type': 'text/html'}});
      },
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const {runtime, port} = await startRuntime(worker);
    runtimes.push(runtime);
    const response = await runRequest(port).catch((error: unknown) => {
      expect(String(error)).not.toContain('test-secret');
      expect(String(error)).not.toContain('private-cart');
      return undefined;
    });
    expect(response?.status ?? 200).toBe(200);
    expect(response?.body ?? 'connection closed after stream error').not.toContain('private GraphQL');
    expect(response?.body ?? '').not.toContain('test-secret');
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('test-secret');
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('private-cart');
  });

  it('keeps a timed-out worker slot occupied until the handler really settles', async () => {
    let releaseWorker!: (response: Response) => void;
    const stalled = new Promise<Response>((resolveResponse) => { releaseWorker = resolveResponse; });
    const worker: TestWorker = {fetch: async () => stalled};
    const {runtime, port} = await startRuntime(worker, undefined, makeSettings({
      maxConcurrentRequests: 1,
      handlerTimeoutMs: 1_000,
    }));
    runtimes.push(runtime);
    const first = await runRequest(port);
    expect(first.status).toBe(504);
    expect((await runRequest(port, {path: '/readyz'})).status).toBe(503);
    releaseWorker(new Response('late result'));
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
    expect((await runRequest(port, {path: '/readyz'})).status).toBe(200);
  });

  it('keeps repeated Set-Cookie headers separate across the HTTP adapter', async () => {
    const worker: TestWorker = {
      async fetch() {
        const headers = new Headers();
        headers.append('set-cookie', 'first=fake; Path=/; HttpOnly');
        headers.append('set-cookie', 'second=fake; Path=/; HttpOnly');
        return new Response('ok', {headers});
      },
    };
    const {runtime, port} = await startRuntime(worker);
    runtimes.push(runtime);
    const response = await runRequest(port);
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toEqual([
      'first=fake; Path=/; HttpOnly',
      'second=fake; Path=/; HttpOnly',
    ]);
  });

  it('tracks every submitted waitUntil task and admits no work above the combined bound', async () => {
    let releaseTask!: () => void;
    const pendingTask = new Promise<void>((resolveTask) => { releaseTask = resolveTask; });
    const worker: TestWorker = {
      async fetch(_request, _env, context) {
        context.waitUntil(pendingTask);
        return new Response('ok');
      },
    };
    const {runtime, port} = await startRuntime(worker, undefined, makeSettings({maxConcurrentRequests: 1}));
    runtimes.push(runtime);

    expect((await runRequest(port)).status).toBe(200);
    expect((await runRequest(port, {path: '/readyz'})).status).toBe(503);
    releaseTask();
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
    expect((await runRequest(port, {path: '/readyz'})).status).toBe(200);
  });
});
