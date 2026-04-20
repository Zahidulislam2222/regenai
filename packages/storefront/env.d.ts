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
  }

  interface Window {
    ENV?: {
      SENTRY_STOREFRONT_DSN?: string;
      NODE_ENV?: string;
      PUBLIC_STORE_DOMAIN?: string;
    };
  }
}

export {};
