import type {HydrogenEnv, I18nBase} from '@shopify/hydrogen';
import type {PublicStorefrontSettings, RuntimeMode} from './settings.shared';

export type StorefrontSettings = {
  mode: RuntimeMode;
  canonicalOrigin: string;
  secureCookies: boolean;
  shopDomain: string;
  checkoutDomain: string;
  storefrontApiToken: string;
  privateStorefrontApiToken?: string;
  storefrontId: string;
  storefrontApiVersion: string;
  customerAccount: CustomerAccountSettings;
  analytics: {enabled: boolean};
  sentry: {enabled: boolean; dsn?: string};
  locale: I18nBase;
  menuHandles: {header: string; footer: string};
  nodeServer: {
    host: string;
    port: number;
    maxHeaderSizeBytes: number;
    maxRequestBodyBytes: number;
    headersTimeoutMs: number;
    requestTimeoutMs: number;
    handlerTimeoutMs: number;
    shutdownTimeoutMs: number;
    maxConcurrentRequests: number;
    maxStaticFileBytes: number;
  };
  cache: {
    namespace: string;
    maxEntries: number;
    maxBytes: number;
    maxEntryBytes: number;
    maxTtlMs: number;
    maxKeyBytes: number;
    maxHeaderBytes: number;
    maxPendingWrites: number;
    readTimeoutMs: number;
  };
  session: {
    secret: string;
    cookieName: string;
    maxAgeSeconds: number;
    httpOnly: true;
    sameSite: 'lax';
    path: '/';
    secure: boolean;
  };
};

export type CustomerAccountSettings =
  | {
      enabled: true;
      apiVersion: string;
      clientId: string;
      shopId: string;
    }
  | {
      enabled: false;
      apiVersion: string;
    };

type SettingsInput = Pick<HydrogenEnv, 'PUBLIC_STOREFRONT_API_TOKEN' | 'PUBLIC_STORE_DOMAIN' | 'PUBLIC_STOREFRONT_ID' | 'PUBLIC_CHECKOUT_DOMAIN' | 'SESSION_SECRET'> &
  Partial<Pick<HydrogenEnv, 'PRIVATE_STOREFRONT_API_TOKEN' | 'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID' | 'SHOP_ID' | 'PUBLIC_CUSTOMER_ACCOUNT_API_URL'>> & {
  NODE_ENV?: string;
  PUBLIC_CANONICAL_ORIGIN?: string;
  STOREFRONT_API_VERSION?: string;
  CUSTOMER_ACCOUNT_ENABLED?: string;
  CUSTOMER_ACCOUNT_API_VERSION?: string;
  HEADER_MENU_HANDLE?: string;
  FOOTER_MENU_HANDLE?: string;
  HYDROGEN_CACHE_NAMESPACE?: string;
  SESSION_COOKIE_NAME?: string;
  SESSION_COOKIE_MAX_AGE_SECONDS?: string;
  ANALYTICS_ENABLED?: string;
  SENTRY_ENABLED?: string;
  SENTRY_STOREFRONT_DSN?: string;
  LOCAL_DEVELOPMENT?: string;
  SHOPIFY_CHECKOUT_DOMAIN_ALLOWLIST?: string;
  NODE_SERVER_HOST?: string;
  NODE_SERVER_PORT?: string;
  NODE_MAX_HEADER_SIZE_BYTES?: string;
  NODE_MAX_REQUEST_BODY_BYTES?: string;
  NODE_HEADERS_TIMEOUT_MS?: string;
  NODE_REQUEST_TIMEOUT_MS?: string;
  NODE_HANDLER_TIMEOUT_MS?: string;
  NODE_SHUTDOWN_TIMEOUT_MS?: string;
  NODE_MAX_CONCURRENT_REQUESTS?: string;
  NODE_MAX_STATIC_FILE_BYTES?: string;
  HYDROGEN_CACHE_MAX_ENTRIES?: string;
  HYDROGEN_CACHE_MAX_BYTES?: string;
  HYDROGEN_CACHE_MAX_ENTRY_BYTES?: string;
  HYDROGEN_CACHE_MAX_TTL_MS?: string;
  HYDROGEN_CACHE_MAX_KEY_BYTES?: string;
  HYDROGEN_CACHE_MAX_HEADER_BYTES?: string;
  HYDROGEN_CACHE_MAX_PENDING_WRITES?: string;
  HYDROGEN_CACHE_READ_TIMEOUT_MS?: string;
};

const storefrontEnvironmentKeys: readonly (keyof SettingsInput)[] = [
  'PUBLIC_STOREFRONT_API_TOKEN', 'PUBLIC_STORE_DOMAIN', 'PUBLIC_STOREFRONT_ID',
  'PUBLIC_CHECKOUT_DOMAIN', 'SESSION_SECRET', 'PRIVATE_STOREFRONT_API_TOKEN',
  'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID', 'SHOP_ID', 'PUBLIC_CUSTOMER_ACCOUNT_API_URL',
  'NODE_ENV', 'PUBLIC_CANONICAL_ORIGIN', 'STOREFRONT_API_VERSION',
  'CUSTOMER_ACCOUNT_ENABLED', 'CUSTOMER_ACCOUNT_API_VERSION', 'HEADER_MENU_HANDLE',
  'FOOTER_MENU_HANDLE', 'HYDROGEN_CACHE_NAMESPACE', 'SESSION_COOKIE_NAME',
  'SESSION_COOKIE_MAX_AGE_SECONDS', 'ANALYTICS_ENABLED', 'SENTRY_ENABLED',
  'SENTRY_STOREFRONT_DSN', 'LOCAL_DEVELOPMENT', 'SHOPIFY_CHECKOUT_DOMAIN_ALLOWLIST',
  'NODE_SERVER_HOST', 'NODE_SERVER_PORT', 'NODE_MAX_HEADER_SIZE_BYTES',
  'NODE_MAX_REQUEST_BODY_BYTES', 'NODE_HEADERS_TIMEOUT_MS', 'NODE_REQUEST_TIMEOUT_MS',
  'NODE_HANDLER_TIMEOUT_MS', 'NODE_SHUTDOWN_TIMEOUT_MS', 'NODE_MAX_CONCURRENT_REQUESTS',
  'NODE_MAX_STATIC_FILE_BYTES', 'HYDROGEN_CACHE_MAX_ENTRIES', 'HYDROGEN_CACHE_MAX_BYTES',
  'HYDROGEN_CACHE_MAX_ENTRY_BYTES', 'HYDROGEN_CACHE_MAX_TTL_MS',
  'HYDROGEN_CACHE_MAX_KEY_BYTES', 'HYDROGEN_CACHE_MAX_HEADER_BYTES',
  'HYDROGEN_CACHE_MAX_PENDING_WRITES', 'HYDROGEN_CACHE_READ_TIMEOUT_MS',
];

/** Keep unrelated host-process environment values out of the Worker Fetch env. */
export function readStorefrontEnvironment(source: Record<string, string | undefined>): SettingsInput {
  const selected: Partial<Record<keyof SettingsInput, string>> = {};
  for (const key of storefrontEnvironmentKeys) {
    const value = source[key];
    if (value !== undefined) selected[key] = value;
  }
  return selected as SettingsInput;
}

const DEFAULT_API_VERSION = '2026-04';
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_COOKIE_NAME = 'regenai_session';
const DEFAULT_LOCALE: I18nBase = {language: 'EN', country: 'US'};
const DEFAULT_MENUS = {header: 'main-menu', footer: 'footer'} as const;
const CACHE_NAMESPACE = 'regenai-hydrogen';

function nodeHost(value: string | undefined): string {
  const host = value ?? '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1', '0.0.0.0', '::'].includes(host)) {
    return invalid('NODE_SERVER_HOST');
  }
  return host;
}

function invalid(name: string): never {
  throw new Error(`Invalid or missing setting: ${name}`);
}

function required(input: SettingsInput, name: keyof SettingsInput): string {
  const value = input[name];
  if (typeof value !== 'string' || value.trim() === '' || value !== value.trim()) invalid(name);
  return value;
}

function flag(input: SettingsInput, name: keyof SettingsInput, defaultValue: boolean): boolean {
  const value = input[name];
  if (value === undefined || value === '') return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  invalid(name);
}

function validRuntimeMode(value: string | undefined): RuntimeMode {
  const mode = value ?? 'development';
  if (mode === 'development' || mode === 'test' || mode === 'production') return mode;
  return invalid('NODE_ENV');
}

function parseOrigin(value: string, name: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return invalid(name);
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.hostname === ''
  ) return invalid(name);
  return url;
}

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function parseDomain(value: string, name: string): string {
  if (value !== value.toLowerCase() || value.endsWith('.')) invalid(name);
  const parsed = parseOrigin(`https://${value}`, name);
  if (parsed.host !== value || parsed.port !== '' || parsed.hostname !== value) invalid(name);
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) invalid(name);
  return value;
}

function parseStoreDomain(value: string): string {
  const domain = parseDomain(value, 'PUBLIC_STORE_DOMAIN');
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/.test(domain)) {
    invalid('PUBLIC_STORE_DOMAIN');
  }
  return domain;
}

function parseCheckoutDomain(value: string, allowlistValue: string | undefined): string {
  const domain = parseDomain(value, 'PUBLIC_CHECKOUT_DOMAIN');
  const allowedCustomDomains = (allowlistValue ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseDomain(item, 'SHOPIFY_CHECKOUT_DOMAIN_ALLOWLIST'));
  if (
    !domain.endsWith('.myshopify.com') &&
    !domain.endsWith('.shopify.com') &&
    !allowedCustomDomains.includes(domain)
  ) invalid('PUBLIC_CHECKOUT_DOMAIN');
  return domain;
}

function parseApiVersion(value: string | undefined, name: string): string {
  const version = value ?? DEFAULT_API_VERSION;
  if (!/^\d{4}-(?:01|04|07|10)$/.test(version)) invalid(name);
  return version;
}

function boundedInteger(value: string | undefined, name: string, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) invalid(name);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) invalid(name);
  return parsed;
}

function handle(value: string | undefined, name: string, fallback: string): string {
  const result = value ?? fallback;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(result)) invalid(name);
  return result;
}

function parseDsn(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return invalid(name);
  }
  // Sentry DSNs intentionally contain a public project key in URL userinfo.
  // Accept only that narrowly defined public DSN shape, never arbitrary credentials/hosts.
  if (
    url.protocol !== 'https:' ||
    !/^[a-f0-9]+$/i.test(url.username) ||
    url.password !== '' ||
    url.port !== '' ||
    !/^o\d+\.ingest\.sentry\.io$/.test(url.hostname) ||
    !/^\/\d+\/?$/.test(url.pathname) ||
    url.search !== '' ||
    url.hash !== ''
  ) invalid(name);
  return url.toString();
}

export function loadStorefrontSettings(input: SettingsInput): StorefrontSettings {
  const mode = validRuntimeMode(input.NODE_ENV);
  const localDevelopment = flag(input, 'LOCAL_DEVELOPMENT', false);
  const originValue = required(input, 'PUBLIC_CANONICAL_ORIGIN');
  const origin = parseOrigin(originValue, 'PUBLIC_CANONICAL_ORIGIN');
  if (origin.protocol === 'http:' && (!localDevelopment || !isLoopback(origin.hostname))) {
    invalid('PUBLIC_CANONICAL_ORIGIN');
  }
  if (mode === 'production' && origin.protocol !== 'https:' && !localDevelopment) {
    invalid('PUBLIC_CANONICAL_ORIGIN');
  }

  const shopDomain = parseStoreDomain(required(input, 'PUBLIC_STORE_DOMAIN'));
  const checkoutDomain = parseCheckoutDomain(
    required(input, 'PUBLIC_CHECKOUT_DOMAIN'),
    input.SHOPIFY_CHECKOUT_DOMAIN_ALLOWLIST,
  );
  const storefrontApiToken = required(input, 'PUBLIC_STOREFRONT_API_TOKEN');
  if (/\s/.test(storefrontApiToken) || storefrontApiToken.length > 4096) invalid('PUBLIC_STOREFRONT_API_TOKEN');
  const privateToken = input.PRIVATE_STOREFRONT_API_TOKEN;
  if (privateToken !== undefined && privateToken !== '' &&
    (/\s/.test(privateToken) || privateToken.length > 4096)) invalid('PRIVATE_STOREFRONT_API_TOKEN');
  const storefrontId = required(input, 'PUBLIC_STOREFRONT_ID');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(storefrontId)) invalid('PUBLIC_STOREFRONT_ID');

  const accountApiVersion = parseApiVersion(
    input.CUSTOMER_ACCOUNT_API_VERSION,
    'CUSTOMER_ACCOUNT_API_VERSION',
  );
  const accountEnabled = flag(input, 'CUSTOMER_ACCOUNT_ENABLED', false);
  const customerAccount: CustomerAccountSettings = accountEnabled
    ? (() => {
        const clientId = required(input, 'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID');
        if (!/^[a-zA-Z0-9._-]{1,256}$/.test(clientId)) {
          invalid('PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID');
        }
        const shopId = required(input, 'SHOP_ID');
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(shopId)) invalid('SHOP_ID');
        return {enabled: true, apiVersion: accountApiVersion, clientId, shopId};
      })()
    : {enabled: false, apiVersion: accountApiVersion};

  const analyticsEnabled = flag(input, 'ANALYTICS_ENABLED', false);
  const sentryEnabled = flag(input, 'SENTRY_ENABLED', false);
  const dsnValue = input.SENTRY_STOREFRONT_DSN;
  if (sentryEnabled && !dsnValue) invalid('SENTRY_STOREFRONT_DSN');

  const sessionSecret = required(input, 'SESSION_SECRET');
  if (sessionSecret.length < 32) invalid('SESSION_SECRET');
  const secure = origin.protocol === 'https:';
  const cookieName = input.SESSION_COOKIE_NAME ?? SESSION_COOKIE_NAME;
  if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,64}$/.test(cookieName) ||
      cookieName.startsWith('__Host-') || cookieName.startsWith('__Secure-')) {
    invalid('SESSION_COOKIE_NAME');
  }
  const cookieMaxAgeSeconds = boundedInteger(
    input.SESSION_COOKIE_MAX_AGE_SECONDS,
    'SESSION_COOKIE_MAX_AGE_SECONDS',
    SESSION_COOKIE_MAX_AGE_SECONDS,
    300,
    31_536_000,
  );
  const nodeServer = {
    host: nodeHost(input.NODE_SERVER_HOST),
    port: boundedInteger(input.NODE_SERVER_PORT, 'NODE_SERVER_PORT', 3001, 1, 65_535),
    maxHeaderSizeBytes: boundedInteger(
      input.NODE_MAX_HEADER_SIZE_BYTES,
      'NODE_MAX_HEADER_SIZE_BYTES',
      16_384,
      1_024,
      65_536,
    ),
    maxRequestBodyBytes: boundedInteger(
      input.NODE_MAX_REQUEST_BODY_BYTES,
      'NODE_MAX_REQUEST_BODY_BYTES',
      1_048_576,
      1_024,
      10_485_760,
    ),
    headersTimeoutMs: boundedInteger(input.NODE_HEADERS_TIMEOUT_MS, 'NODE_HEADERS_TIMEOUT_MS', 10_000, 1_000, 60_000),
    requestTimeoutMs: boundedInteger(input.NODE_REQUEST_TIMEOUT_MS, 'NODE_REQUEST_TIMEOUT_MS', 30_000, 1_000, 120_000),
    handlerTimeoutMs: boundedInteger(input.NODE_HANDLER_TIMEOUT_MS, 'NODE_HANDLER_TIMEOUT_MS', 30_000, 1_000, 120_000),
    shutdownTimeoutMs: boundedInteger(input.NODE_SHUTDOWN_TIMEOUT_MS, 'NODE_SHUTDOWN_TIMEOUT_MS', 10_000, 1_000, 60_000),
    maxConcurrentRequests: boundedInteger(input.NODE_MAX_CONCURRENT_REQUESTS, 'NODE_MAX_CONCURRENT_REQUESTS', 128, 1, 1_024),
    maxStaticFileBytes: boundedInteger(input.NODE_MAX_STATIC_FILE_BYTES, 'NODE_MAX_STATIC_FILE_BYTES', 20_971_520, 1_024, 52_428_800),
  };
  if (nodeServer.headersTimeoutMs > nodeServer.requestTimeoutMs) {
    invalid('NODE_HEADERS_TIMEOUT_MS');
  }
  const cache = {
    namespace: handle(input.HYDROGEN_CACHE_NAMESPACE, 'HYDROGEN_CACHE_NAMESPACE', CACHE_NAMESPACE),
    maxEntries: boundedInteger(input.HYDROGEN_CACHE_MAX_ENTRIES, 'HYDROGEN_CACHE_MAX_ENTRIES', 512, 1, 10_000),
    maxBytes: boundedInteger(input.HYDROGEN_CACHE_MAX_BYTES, 'HYDROGEN_CACHE_MAX_BYTES', 33_554_432, 1_024, 268_435_456),
    maxEntryBytes: boundedInteger(input.HYDROGEN_CACHE_MAX_ENTRY_BYTES, 'HYDROGEN_CACHE_MAX_ENTRY_BYTES', 262_144, 1_024, 10_485_760),
    maxTtlMs: boundedInteger(input.HYDROGEN_CACHE_MAX_TTL_MS, 'HYDROGEN_CACHE_MAX_TTL_MS', 86_400_000, 1_000, 604_800_000),
    maxKeyBytes: boundedInteger(input.HYDROGEN_CACHE_MAX_KEY_BYTES, 'HYDROGEN_CACHE_MAX_KEY_BYTES', 131_072, 512, 1_048_576),
    maxHeaderBytes: boundedInteger(input.HYDROGEN_CACHE_MAX_HEADER_BYTES, 'HYDROGEN_CACHE_MAX_HEADER_BYTES', 16_384, 512, 65_536),
    maxPendingWrites: boundedInteger(input.HYDROGEN_CACHE_MAX_PENDING_WRITES, 'HYDROGEN_CACHE_MAX_PENDING_WRITES', 16, 1, 256),
    readTimeoutMs: boundedInteger(input.HYDROGEN_CACHE_READ_TIMEOUT_MS, 'HYDROGEN_CACHE_READ_TIMEOUT_MS', 5_000, 100, 30_000),
  };
  if (cache.maxEntryBytes > cache.maxBytes) invalid('HYDROGEN_CACHE_MAX_ENTRY_BYTES');
  return {
    mode,
    canonicalOrigin: origin.origin,
    secureCookies: secure,
    shopDomain,
    checkoutDomain,
    storefrontApiToken,
    privateStorefrontApiToken: privateToken || undefined,
    storefrontId,
    storefrontApiVersion: parseApiVersion(input.STOREFRONT_API_VERSION, 'STOREFRONT_API_VERSION'),
    customerAccount,
    analytics: {enabled: analyticsEnabled},
    sentry: {enabled: sentryEnabled, dsn: sentryEnabled ? parseDsn(dsnValue!, 'SENTRY_STOREFRONT_DSN') : undefined},
    locale: DEFAULT_LOCALE,
    menuHandles: {
      header: handle(input.HEADER_MENU_HANDLE, 'HEADER_MENU_HANDLE', DEFAULT_MENUS.header),
      footer: handle(input.FOOTER_MENU_HANDLE, 'FOOTER_MENU_HANDLE', DEFAULT_MENUS.footer),
    },
    nodeServer,
    cache,
    session: {
      secret: sessionSecret,
      cookieName,
      maxAgeSeconds: cookieMaxAgeSeconds,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure,
    },
  };
}

export function toPublicSettings(settings: StorefrontSettings): PublicStorefrontSettings {
  return {
    canonicalOrigin: settings.canonicalOrigin,
    PUBLIC_STORE_DOMAIN: settings.shopDomain,
    PUBLIC_CHECKOUT_DOMAIN: settings.checkoutDomain,
    NODE_ENV: settings.mode,
    locale: settings.locale,
    ...(settings.sentry.enabled && settings.sentry.dsn
      ? {SENTRY_STOREFRONT_DSN: settings.sentry.dsn}
      : {}),
  };
}

export function accountStatusWhenEnabled(
  enabled: boolean,
  isLoggedIn: () => Promise<boolean>,
): Promise<boolean> {
  return enabled ? isLoggedIn() : Promise.resolve(false);
}
