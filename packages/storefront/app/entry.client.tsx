import {HydratedRouter} from 'react-router/dom';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {NonceProvider} from '@shopify/hydrogen';
import {initSentry} from '~/lib/sentry.client';

// Initialize Sentry + Web Vitals as early as possible so we capture
// hydration errors and early-navigation performance.
// ENV values bridged via a small <script id="env">...</script> in root.tsx
// (D3.2 pattern — server loader sets the public envs into window.ENV).
const clientEnv =
  // @ts-expect-error — window.ENV is injected by Remix root loader
  (typeof window !== 'undefined' && window.ENV) || {};

initSentry(clientEnv);

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  startTransition(() => {
    // Extract nonce from existing script tags
    const existingNonce =
      document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce;

    hydrateRoot(
      document,
      <StrictMode>
        <NonceProvider value={existingNonce}>
          <HydratedRouter />
        </NonceProvider>
      </StrictMode>,
    );
  });
}
