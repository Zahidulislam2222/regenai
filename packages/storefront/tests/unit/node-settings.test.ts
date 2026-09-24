import {describe, expect, it} from 'vitest';
import {loadStorefrontSettings} from '../../app/lib/settings.server';

const baseSettings = {
  NODE_ENV: 'test',
  LOCAL_DEVELOPMENT: 'true',
  PUBLIC_CANONICAL_ORIGIN: 'http://127.0.0.1:3001',
  PUBLIC_STORE_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_CHECKOUT_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_STOREFRONT_API_TOKEN: 'test-public-token-only',
  PUBLIC_STOREFRONT_ID: 'test-storefront-id',
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
};

describe('Node runtime settings', () => {
  it('defaults to finite loopback bindings, request bounds and cache limits', () => {
    const settings = loadStorefrontSettings(baseSettings);

    expect(settings.nodeServer).toEqual({
      host: '127.0.0.1',
      port: 3001,
      maxHeaderSizeBytes: 16_384,
      maxRequestBodyBytes: 1_048_576,
      headersTimeoutMs: 10_000,
      requestTimeoutMs: 30_000,
      handlerTimeoutMs: 30_000,
      shutdownTimeoutMs: 10_000,
      maxConcurrentRequests: 128,
      maxStaticFileBytes: 20_971_520,
    });
    expect(settings.cache).toMatchObject({
      maxEntries: 512,
      maxBytes: 33_554_432,
      maxEntryBytes: 262_144,
      maxTtlMs: 86_400_000,
      maxKeyBytes: 131_072,
      maxHeaderBytes: 16_384,
      maxPendingWrites: 16,
      readTimeoutMs: 5_000,
    });
  });

  it.each([
    [{NODE_SERVER_HOST: 'attacker.example'}, 'NODE_SERVER_HOST'],
    [{NODE_SERVER_PORT: '0'}, 'NODE_SERVER_PORT'],
    [{NODE_MAX_HEADER_SIZE_BYTES: '999999'}, 'NODE_MAX_HEADER_SIZE_BYTES'],
    [{NODE_HANDLER_TIMEOUT_MS: '0'}, 'NODE_HANDLER_TIMEOUT_MS'],
    [{NODE_MAX_REQUEST_BODY_BYTES: '999999999'}, 'NODE_MAX_REQUEST_BODY_BYTES'],
    [{NODE_MAX_STATIC_FILE_BYTES: '999999999'}, 'NODE_MAX_STATIC_FILE_BYTES'],
    [{NODE_MAX_STATIC_FILE_BYTES: '999999999'}, 'NODE_MAX_STATIC_FILE_BYTES'],
    [{NODE_HEADERS_TIMEOUT_MS: '60000', NODE_REQUEST_TIMEOUT_MS: '1000'}, 'NODE_HEADERS_TIMEOUT_MS'],
    [{HYDROGEN_CACHE_MAX_ENTRY_BYTES: '4096', HYDROGEN_CACHE_MAX_BYTES: '2048'}, 'HYDROGEN_CACHE_MAX_ENTRY_BYTES'],
  ])('rejects invalid runtime bounds with the setting name', (overrides, settingName) => {
    expect(() => loadStorefrontSettings({...baseSettings, ...overrides})).toThrow(settingName);
  });

  it('requires explicit opt-in before binding beyond loopback', () => {
    const settings = loadStorefrontSettings({...baseSettings, NODE_SERVER_HOST: '0.0.0.0'});
    expect(settings.nodeServer.host).toBe('0.0.0.0');
    expect(loadStorefrontSettings(baseSettings).nodeServer.host).toBe('127.0.0.1');
  });
});
