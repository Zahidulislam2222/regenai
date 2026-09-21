import {describe, expect, it, vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  accountStatusWhenEnabled,
  loadStorefrontSettings,
  toPublicSettings,
} from '../../app/lib/settings.server';
import {serializePublicSettings} from '../../app/lib/settings.shared';

const validInput = (overrides: Record<string, string> = {}) => ({
  NODE_ENV: 'development',
  LOCAL_DEVELOPMENT: 'true',
  PUBLIC_CANONICAL_ORIGIN: 'http://127.0.0.1:3001',
  PUBLIC_STORE_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_CHECKOUT_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_STOREFRONT_API_TOKEN: 'test-public-token-only',
  PUBLIC_STOREFRONT_ID: 'test-storefront-id',
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
  ...overrides,
});

describe('storefront settings boundary', () => {
  it('requires an explicit valid canonical origin and does not echo its value', () => {
    expect(() => loadStorefrontSettings(validInput({PUBLIC_CANONICAL_ORIGIN: 'https://user:private@example.test'})))
      .toThrow('Invalid or missing setting: PUBLIC_CANONICAL_ORIGIN');
    let message = '';
    try {
      loadStorefrontSettings(validInput({PUBLIC_CANONICAL_ORIGIN: 'https://user:private@example.test'}));
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }
    expect(message).toBe('Invalid or missing setting: PUBLIC_CANONICAL_ORIGIN');
  });

  it('rejects non-Shopify API hosts and allows an explicitly listed custom checkout host', () => {
    expect(() => loadStorefrontSettings(validInput({PUBLIC_STORE_DOMAIN: 'evil.example'})))
      .toThrow('Invalid or missing setting: PUBLIC_STORE_DOMAIN');
    expect(loadStorefrontSettings(validInput({
      PUBLIC_CHECKOUT_DOMAIN: 'checkout.example.test',
      SHOPIFY_CHECKOUT_DOMAIN_ALLOWLIST: 'checkout.example.test',
    })).checkoutDomain).toBe('checkout.example.test');
    expect(() => loadStorefrontSettings(validInput({PUBLIC_CHECKOUT_DOMAIN: 'checkout.example.test'})))
      .toThrow('Invalid or missing setting: PUBLIC_CHECKOUT_DOMAIN');
  });

  it('rejects surrounding whitespace on raw Hydrogen domains and tokens instead of passing trimmed settings beside them', () => {
    expect(() => loadStorefrontSettings(validInput({PUBLIC_STORE_DOMAIN: ' regenai.myshopify.com'})))
      .toThrow('Invalid or missing setting: PUBLIC_STORE_DOMAIN');
    expect(() => loadStorefrontSettings(validInput({PUBLIC_STOREFRONT_API_TOKEN: ' test-token'})))
      .toThrow('Invalid or missing setting: PUBLIC_STOREFRONT_API_TOKEN');
  });

  it('defaults account and telemetry off and ignores a preconfigured Sentry DSN while disabled', () => {
    const settings = loadStorefrontSettings(validInput({
      SENTRY_STOREFRONT_DSN: 'ignored-while-disabled',
    }));
    expect(settings.customerAccount.enabled).toBe(false);
    expect(settings.analytics.enabled).toBe(false);
    expect(settings.sentry.enabled).toBe(false);
    expect(toPublicSettings(settings)).not.toHaveProperty('SENTRY_STOREFRONT_DSN');
  });

  it('requires account values only when enabled and skips the account call while disabled', async () => {
    const settings = loadStorefrontSettings(validInput());
    const isLoggedIn = vi.fn(async () => true);
    await expect(accountStatusWhenEnabled(settings.customerAccount.enabled, isLoggedIn)).resolves.toBe(false);
    expect(isLoggedIn).not.toHaveBeenCalled();
    expect(() => loadStorefrontSettings(validInput({CUSTOMER_ACCOUNT_ENABLED: 'true'})))
      .toThrow('Invalid or missing setting: PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID');
    expect(loadStorefrontSettings(validInput({
      CUSTOMER_ACCOUNT_ENABLED: 'true',
      PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: 'test-client-id',
      SHOP_ID: 'test-shop-id',
    })).customerAccount.enabled).toBe(true);
  });

  it('uses the installed SDK quarter API version and rejects invalid versions and bounds', () => {
    expect(loadStorefrontSettings(validInput()).storefrontApiVersion).toBe('2026-04');
    expect(() => loadStorefrontSettings(validInput({STOREFRONT_API_VERSION: '2026-99'})))
      .toThrow('Invalid or missing setting: STOREFRONT_API_VERSION');
    expect(() => loadStorefrontSettings(validInput({SESSION_COOKIE_MAX_AGE_SECONDS: '0'})))
      .toThrow('Invalid or missing setting: SESSION_COOKIE_MAX_AGE_SECONDS');
  });

  it('projects only the explicit public allowlist and escapes inline-script delimiters', () => {
    const settings = loadStorefrontSettings(validInput({
      PRIVATE_STOREFRONT_API_TOKEN: 'test-private-sentinel-not-public',
      SESSION_SECRET: 'test-session-sentinel-never-public-123456789',
      PUBLIC_STOREFRONT_API_TOKEN: 'test-public-sentinel-not-public-by-default',
      SENTRY_ENABLED: 'true',
      SENTRY_STOREFRONT_DSN: 'https://abc123@o123.ingest.sentry.io/456',
    }));
    const json = serializePublicSettings(toPublicSettings(settings));
    expect(json).not.toContain('test-private-sentinel-not-public');
    expect(json).not.toContain('test-session-sentinel-never-public');
    expect(json).not.toContain('test-public-sentinel-not-public-by-default');
    expect(json).toContain('SENTRY_STOREFRONT_DSN');
    expect(serializePublicSettings({...toPublicSettings(settings), canonicalOrigin: '</script>&'}))
      .not.toContain('</script>');
  });

  it('sets Secure only for validated HTTPS origins and loopback HTTP requires explicit local mode', () => {
    expect(loadStorefrontSettings(validInput({
      NODE_ENV: 'production',
      LOCAL_DEVELOPMENT: 'false',
      PUBLIC_CANONICAL_ORIGIN: 'https://shop.example.test',
    })).session.secure).toBe(true);
    expect(loadStorefrontSettings(validInput()).session.secure).toBe(false);
    expect(() => loadStorefrontSettings(validInput({
      LOCAL_DEVELOPMENT: 'false',
      PUBLIC_CANONICAL_ORIGIN: 'http://127.0.0.1:3001',
    }))).toThrow('Invalid or missing setting: PUBLIC_CANONICAL_ORIGIN');
    expect(() => loadStorefrontSettings(validInput({
      LOCAL_DEVELOPMENT: 'true',
      PUBLIC_CANONICAL_ORIGIN: 'http://192.0.2.1:3001',
    }))).toThrow('Invalid or missing setting: PUBLIC_CANONICAL_ORIGIN');
  });

  it('keeps runtime consumers on the settings boundary instead of restoring scattered defaults', () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
    const consumers = [
      read('server.ts'),
      read('app/lib/context.ts'),
      read('app/lib/session.ts'),
    ].join('\n');
    expect(consumers).not.toMatch(/process\.env/);
    expect(consumers).not.toMatch(/caches\.open\(['"]hydrogen['"]\)/);
    expect(consumers).not.toMatch(/['"](?:main-menu|footer)['"]/);
    const clientRoot = read('app/root.tsx');
    expect(clientRoot).not.toMatch(/SESSION_SECRET|PRIVATE_STOREFRONT_API_TOKEN/);
    expect(read('app/lib/settings.shared.ts')).not.toMatch(/SESSION_SECRET|PRIVATE_STOREFRONT_API_TOKEN|STOREFRONT_API_TOKEN/);
    const example = read('.env.example');
    for (const setting of [
      'PUBLIC_CANONICAL_ORIGIN',
      'PUBLIC_STORE_DOMAIN',
      'PUBLIC_CHECKOUT_DOMAIN',
      'PUBLIC_STOREFRONT_API_TOKEN',
      'PUBLIC_STOREFRONT_ID',
      'SESSION_SECRET',
      'CUSTOMER_ACCOUNT_ENABLED',
      'ANALYTICS_ENABLED',
      'SENTRY_ENABLED',
    ]) expect(example).toContain(`${setting}=`);
  });
});
