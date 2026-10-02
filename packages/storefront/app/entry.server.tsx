import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext, HandleErrorFunction} from 'react-router';
import {logSafeError} from '~/lib/safe-logger.server';

export const handleError: HandleErrorFunction = (_error, {request}) => {
  if (!request.signal.aborted) logSafeError('requestFailed');
};

/**
 * Additional security headers beyond the CSP that Hydrogen generates.
 * Applied to every response — no per-route override currently needed.
 */
const securityHeaders: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-DNS-Prefetch-Control': 'on',
  // Permissions-Policy: restrict access to sensitive browser APIs by default.
  // Capabilities that the current storefront does not use stay unavailable.
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), bluetooth=(), camera=(), clipboard-read=(), clipboard-write=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), usb=(), xr-spatial-tracking=()',
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.settings.checkoutDomain,
      storeDomain: context.settings.shopDomain,
    },
    // Hydrogen's defaults cover this origin and Shopify. Add a provider origin
    // only when that provider is actually enabled in the storefront settings.
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError() {
        logSafeError('renderFailed');
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  // Apply the additional security headers defined above.
  for (const [name, value] of Object.entries(securityHeaders)) {
    responseHeaders.set(name, value);
  }

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
