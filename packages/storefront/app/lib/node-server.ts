import {createReadStream} from 'node:fs';
import {realpath, stat} from 'node:fs/promises';
import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import {Readable} from 'node:stream';
import {resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getRequestListener} from '@hono/node-server';
import {Hono} from 'hono';
import {getMimeType} from 'hono/utils/mime';
import type {StorefrontSettings} from './settings.server.ts';
import {BoundedHydrogenCache} from './cache.node.ts';
import {logSafeError} from './safe-logger.server.ts';

type FetchHandler = {
  fetch(request: Request, env: Env, executionContext: HydrogenExecutionContext): Promise<Response>;
};

type HydrogenExecutionContext = {
  cache: Cache;
  waitUntil(promise: Promise<unknown>): void;
};

type NodeRuntimeOptions = {
  settings: StorefrontSettings;
  env: Env;
  worker: FetchHandler;
  clientDirectory?: string;
};

type RawRequestState = {
  target: string;
  bodyTooLarge: boolean;
  handlerStarted?: () => void;
  handlerSettled?: () => void;
};

const restrictedHeaders = new Set([
  'forwarded',
  'oxygen-buyer-ip',
  'x-shopify-client-ip',
  'x-shopify-client-ip-sig',
  'request-id',
  'x-request-id',
]);

function inspectRawTarget(target: string | undefined): {pathname: string} | undefined {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('#')) return undefined;
  const queryOffset = target.indexOf('?');
  const rawPath = queryOffset < 0 ? target : target.slice(0, queryOffset);
  if (
    rawPath.includes('\\') || rawPath.includes('//') || /%(?![0-9a-f]{2})/i.test(rawPath) ||
    /%(?:2f|5c|00)/i.test(rawPath)
  ) return undefined;
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return undefined;
  }
  if (pathname.includes('\0') || pathname.includes('\\') || pathname.includes('//')) return undefined;
  if (pathname.split('/').some((part) => part === '.' || part === '..')) return undefined;
  return {pathname};
}

function stripUntrustedHeaders(request: IncomingMessage, canonicalHost: string): void {
  for (const name of Object.keys(request.headers)) {
    const normalized = name.toLowerCase();
    if (restrictedHeaders.has(normalized) || normalized.startsWith('x-forwarded-')) {
      delete request.headers[name];
    }
  }
  request.headers.host = canonicalHost;
  const safeRawHeaders: string[] = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    const name = request.rawHeaders[index];
    if (name.toLowerCase() !== 'host') safeRawHeaders.push(name, request.rawHeaders[index + 1]);
  }
  safeRawHeaders.push('host', canonicalHost);
  request.rawHeaders = safeRawHeaders;
}

function jsonResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'},
  });
}

async function servePublicFile(
  request: Request,
  pathname: string,
  clientDirectory: string,
  maxFileBytes: number,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return jsonResponse(405, 'Method not allowed');
  if (pathname.split('/').some((part) => part.startsWith('.') && part !== '')) return jsonResponse(404, 'Not found');
  const relativePath = pathname === '/favicon.svg' ? 'favicon.svg' : pathname.slice(1);
  try {
    const trustedRoot = await realpath(clientDirectory);
    const candidate = resolve(trustedRoot, relativePath);
    if (!candidate.startsWith(`${trustedRoot}${sep}`)) return jsonResponse(404, 'Not found');
    const actualPath = await realpath(candidate);
    if (!actualPath.startsWith(`${trustedRoot}${sep}`)) return jsonResponse(404, 'Not found');
    const metadata = await stat(actualPath);
    if (!metadata.isFile() || metadata.size > maxFileBytes) return jsonResponse(404, 'Not found');
    const mime = getMimeType(actualPath) ?? 'application/octet-stream';
    const headers = new Headers({
      'content-type': mime,
      'content-length': String(metadata.size),
      'x-content-type-options': 'nosniff',
      'cache-control': /(?:^|[.-])[a-f0-9]{8,}(?:[.-]|$)/i.test(actualPath)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    });
    if (request.method === 'HEAD') return new Response(null, {status: 200, headers});
    const body = Readable.toWeb(createReadStream(actualPath)) as ReadableStream<Uint8Array>;
    return new Response(body, {status: 200, headers});
  } catch {
    return jsonResponse(404, 'Not found');
  }
}

function reservedAssetPath(pathname: string): boolean {
  return pathname === '/favicon.svg' || pathname.startsWith('/assets/') || pathname.startsWith('/media/');
}

function sanitizeResponseStream(
  response: Response,
  deadlineSignal: AbortSignal,
  clearDeadline: () => void,
): Promise<Response> {
  if (!response.body) {
    clearDeadline();
    return Promise.resolve(response);
  }
  const reader = response.body.getReader();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearDeadline();
    deadlineSignal.removeEventListener('abort', abortStream);
    try { controllerRef?.close(); } catch { /* stream already closed */ }
  };
  const fail = () => {
    if (finished) return;
    finished = true;
    clearDeadline();
    deadlineSignal.removeEventListener('abort', abortStream);
    try { controllerRef?.error(new Error('Response stream failed')); } catch { /* stream already closed */ }
  };
  const abortStream = () => {
    void reader.cancel().catch(() => undefined);
    fail();
  };
  const firstResponse = reader.read().then((result) => {
    return result;
  }).catch(() => {
    logSafeError('renderFailed');
    return undefined;
  });
  let abortFirstRead!: () => void;
  const firstChunkReady = new Promise<'aborted'>((resolveAbort) => {
    abortFirstRead = () => {
      void reader.cancel().catch(() => undefined);
      resolveAbort('aborted');
    };
    if (deadlineSignal.aborted) abortFirstRead();
    else deadlineSignal.addEventListener('abort', abortFirstRead, {once: true});
  });
  return Promise.race([firstResponse, firstChunkReady]).then((first) => {
    deadlineSignal.removeEventListener('abort', abortFirstRead);
    if (first === 'aborted') {
      clearDeadline();
      return jsonResponse(504, 'Request timed out');
    }
    if (first === undefined) {
      clearDeadline();
      return jsonResponse(500, 'An unexpected error occurred');
    }
    if (first.done) {
      clearDeadline();
      return new Response(null, {status: response.status, statusText: response.statusText, headers: response.headers});
    }
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controllerRef = controller;
        deadlineSignal.addEventListener('abort', abortStream, {once: true});
        if (deadlineSignal.aborted) abortStream();
        else controller.enqueue(first.value);
      },
      async pull(controller) {
        if (finished) return;
        try {
          const result = await reader.read();
          if (result.done) finish();
          else if (!finished) controller.enqueue(result.value);
        } catch {
          logSafeError('renderFailed');
          fail();
        }
      },
      cancel(reason) {
        finished = true;
        clearDeadline();
        deadlineSignal.removeEventListener('abort', abortStream);
        void reader.cancel(reason).catch(() => undefined);
      },
    });
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  });
}

function createApplication(options: NodeRuntimeOptions, clientDirectory: string) {
  const app = new Hono<{Bindings: Env}>();
  app.get('/readyz', (context) => context.text('ready', 200, {'cache-control': 'no-store'}));
  app.all('*', async (context) => options.worker.fetch(
    context.req.raw,
    context.env,
    context.executionCtx as unknown as HydrogenExecutionContext,
  ));
  app.onError((_, context) => {
    logSafeError('requestFailed');
    return context.text('An unexpected error occurred', 500);
  });
  const cache = new BoundedHydrogenCache({
    maxEntries: options.settings.cache.maxEntries,
    maxBytes: options.settings.cache.maxBytes,
    maxEntryBytes: options.settings.cache.maxEntryBytes,
    maxTtlMs: options.settings.cache.maxTtlMs,
    maxKeyBytes: options.settings.cache.maxKeyBytes,
    maxHeaderBytes: options.settings.cache.maxHeaderBytes,
    maxPendingWrites: options.settings.cache.maxPendingWrites,
    readTimeoutMs: options.settings.cache.readTimeoutMs,
  });
  const pendingTasks = new Set<Promise<unknown>>();
  const pendingHandlers = new Set<Promise<unknown>>();

  return {
    cache,
    pendingTasks,
    pendingHandlers,
    async fetch(request: Request, raw: RawRequestState): Promise<Response> {
      const inspected = inspectRawTarget(raw.target);
      if (!inspected) return jsonResponse(400, 'Invalid request target');
      if (reservedAssetPath(inspected.pathname)) {
        return servePublicFile(request, inspected.pathname, clientDirectory, options.settings.nodeServer.maxStaticFileBytes);
      }
      const canonicalUrl = new URL(raw.target, options.settings.canonicalOrigin);
      let body = request.body;
      if (body && request.method !== 'GET' && request.method !== 'HEAD') {
        let bodyBytes = 0;
        body = body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            bodyBytes += chunk.byteLength;
            if (bodyBytes > options.settings.nodeServer.maxRequestBodyBytes) {
              raw.bodyTooLarge = true;
              throw new RangeError('request body limit exceeded');
            }
            controller.enqueue(chunk);
          },
        }));
      } else {
        body = null;
      }
      const headers = new Headers(request.headers);
      for (const name of Array.from(headers.keys())) {
        const normalized = name.toLowerCase();
        if (restrictedHeaders.has(normalized) || normalized.startsWith('x-forwarded-')) {
          headers.delete(name);
        }
      }
      headers.set('host', canonicalUrl.host);
      const deadlineController = new AbortController();
      request.signal.addEventListener('abort', () => deadlineController.abort(), {once: true});
      if (request.signal.aborted) deadlineController.abort();
      const requestSignal = AbortSignal.any([request.signal, deadlineController.signal]);
      const init = {
        method: request.method,
        headers,
        body,
        signal: requestSignal,
        redirect: request.redirect,
        duplex: 'half',
      } as RequestInit & {duplex: 'half'};
      const canonicalRequest = new Request(canonicalUrl, init);
      let clearDeadline: () => void = () => {};
      let resolveTimedOut!: (response: Response) => void;
      let timedOut = false;
      const timeoutResponse = new Promise<Response>((resolveTimeout) => {
        resolveTimedOut = resolveTimeout;
      });
      const deadlineTimer = setTimeout(() => {
        timedOut = true;
        deadlineController.abort();
        resolveTimedOut(jsonResponse(504, 'Request timed out'));
      }, options.settings.nodeServer.handlerTimeoutMs);
      clearDeadline = () => clearTimeout(deadlineTimer);
      const executionContext: HydrogenExecutionContext = {
        cache,
        waitUntil(promise) {
          const task = Promise.resolve(promise).catch(() => undefined);
          pendingTasks.add(task);
          void task.finally(() => pendingTasks.delete(task));
        },
      };
      raw.handlerStarted?.();
      const workerTask = app.fetch(
          canonicalRequest,
          options.env,
          executionContext as unknown as ExecutionContext,
        ).catch(() => {
          logSafeError('requestFailed');
          return jsonResponse(500, 'An unexpected error occurred');
        });
      const handlerTask = workerTask.then((lateResponse) => {
        if (timedOut) void lateResponse.body?.cancel().catch(() => undefined);
        raw.handlerSettled?.();
      });
      pendingHandlers.add(handlerTask);
      void handlerTask.finally(() => pendingHandlers.delete(handlerTask));
      const response = await Promise.race([workerTask, timeoutResponse]);
      if (timedOut) return response;
      if (raw.bodyTooLarge) {
        void response.body?.cancel().catch(() => undefined);
        return sanitizeResponseStream(jsonResponse(413, 'Payload too large'), requestSignal, clearDeadline);
      }
      return sanitizeResponseStream(response, requestSignal, clearDeadline);
    },
  };
}

export function createNodeRuntime(options: NodeRuntimeOptions): {
  server: Server;
  shutdown(): Promise<void>;
} {
  const clientDirectory = resolve(options.clientDirectory ?? fileURLToPath(new URL('../../dist/client/', import.meta.url)));
  const canonical = new URL(options.settings.canonicalOrigin);
  const application = createApplication(options, clientDirectory);
  const listener = getRequestListener(async (request, bindings) => {
    const incoming = bindings.incoming as IncomingMessage;
    const raw = rawRequests.get(incoming);
    if (!raw) return jsonResponse(400, 'Invalid request target');
    try {
      return await application.fetch(request, raw);
    } catch {
      logSafeError('requestFailed');
      return jsonResponse(500, 'An unexpected error occurred');
    }
  }, {
    hostname: canonical.host,
    overrideGlobalObjects: false,
    errorHandler: () => jsonResponse(500, 'An unexpected error occurred'),
  });

  const server = createServer({maxHeaderSize: options.settings.nodeServer.maxHeaderSizeBytes});
  server.headersTimeout = options.settings.nodeServer.headersTimeoutMs;
  server.requestTimeout = options.settings.nodeServer.requestTimeoutMs;
  const rawRequests = new WeakMap<IncomingMessage, RawRequestState>();
  const activeResponses = new Set<ServerResponse>();
  let activeRequests = 0;
  let closing = false;

  server.on('request', (incoming, outgoing) => {
    const inspected = inspectRawTarget(incoming.url);
    if (!inspected) {
      outgoing.writeHead(400, {'content-type': 'text/plain; charset=utf-8', connection: 'close'}).end('Invalid request target');
      return;
    }
    if (closing) {
      outgoing.writeHead(503, {connection: 'close'}).end();
      return;
    }
    const declaredLength = incoming.headers['content-length'];
    if (typeof declaredLength === 'string' && /^\d+$/.test(declaredLength) &&
        Number(declaredLength) > options.settings.nodeServer.maxRequestBodyBytes) {
      outgoing.writeHead(413, {connection: 'close'}).end('Payload too large');
      return;
    }
    if (activeRequests + application.pendingTasks.size >= options.settings.nodeServer.maxConcurrentRequests) {
      outgoing.writeHead(503, {connection: 'close'}).end('Service unavailable');
      return;
    }
    activeRequests += 1;
    activeResponses.add(outgoing);
    let responseDone = false;
    let handlerDone = true;
    const releaseIfDone = () => {
      if (!responseDone || !handlerDone || !activeResponses.has(outgoing)) return;
      activeResponses.delete(outgoing);
      activeRequests -= 1;
    };
    const state: RawRequestState = {
      target: incoming.url ?? '/',
      bodyTooLarge: false,
      handlerStarted() { handlerDone = false; },
      handlerSettled() { handlerDone = true; releaseIfDone(); },
    };
    const finishResponse = () => { responseDone = true; releaseIfDone(); };
    outgoing.once('finish', finishResponse);
    outgoing.once('close', finishResponse);
    stripUntrustedHeaders(incoming, canonical.host);
    rawRequests.set(incoming, state);
    void listener(incoming, outgoing).catch(() => {
      logSafeError('requestFailed');
      if (!outgoing.headersSent) outgoing.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
      outgoing.end('An unexpected error occurred');
    });
  });

  const shutdown = async () => {
    if (closing) return;
    closing = true;
    const closed = new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    server.closeIdleConnections();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<void>((resolveDeadline) => {
      timer = setTimeout(() => resolveDeadline(), options.settings.nodeServer.shutdownTimeoutMs);
    });
    const drainTasks = async () => {
      while (application.pendingTasks.size > 0 || application.pendingHandlers.size > 0) {
        await Promise.allSettled([
          ...application.pendingTasks,
          ...application.pendingHandlers,
        ]);
      }
    };
    await Promise.race([Promise.all([closed, drainTasks()]).then(() => undefined), deadline]);
    if (timer !== undefined) clearTimeout(timer);
    if (activeResponses.size > 0) {
      server.closeAllConnections();
      for (const response of activeResponses) response.destroy();
    }
  };

  return {server, shutdown};
}

export async function startNodeRuntime(settings: StorefrontSettings, env: Env): Promise<{
  server: Server;
  shutdown(): Promise<void>;
}> {
  if (settings.mode !== 'production') {
    throw new Error('Node runtime requires NODE_ENV=production; use LOCAL_DEVELOPMENT=true for local HTTP.');
  }
  const buildUrl = new URL('../../dist/server/index.js', import.meta.url).href;
  let workerModule: {default: FetchHandler};
  try {
    workerModule = await import(buildUrl) as {default: FetchHandler};
  } catch {
    logSafeError('requestFailed');
    throw new Error('Node production build could not be loaded.');
  }
  const runtime = createNodeRuntime({settings, env, worker: workerModule.default});
  await new Promise<void>((resolveListen, rejectListen) => {
    runtime.server.once('error', () => {
      logSafeError('requestFailed');
      rejectListen(new Error('Node server could not start.'));
    });
    runtime.server.listen(settings.nodeServer.port, settings.nodeServer.host, () => resolveListen());
  });
  return runtime;
}
