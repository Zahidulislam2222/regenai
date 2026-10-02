/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

// Public envs bridged to the client via window.ENV (root.tsx Layout).
// Consumed by entry.client.tsx initSentry.
declare global {
  interface Env {
    SENTRY_STOREFRONT_DSN?: string;
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
  }

  interface Window {
    ENV?: {
      SENTRY_STOREFRONT_DSN?: string;
      NODE_ENV?: 'development' | 'test' | 'production';
      PUBLIC_STORE_DOMAIN?: string;
      PUBLIC_CHECKOUT_DOMAIN?: string;
      canonicalOrigin?: string;
      locale?: {language: string; country: string};
    };
  }
}

export {};
