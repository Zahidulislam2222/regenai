import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

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
  // WebBluetooth is ALLOWED for our posture-sensor demo (PDP). Camera + mic
  // allowed (Phase 2 home-gym AI coach). Geolocation allowed (market
  // detection). Everything else locked down.
  'Permissions-Policy':
    'accelerometer=(self), autoplay=(self), bluetooth=(self), camera=(self), clipboard-read=(self), clipboard-write=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(self), gyroscope=(self), hid=(), magnetometer=(self), microphone=(self), midi=(), payment=(self "https://shop.app" "https://*.shopify.com"), picture-in-picture=(self), publickey-credentials-get=(self), screen-wake-lock=(self), serial=(), sync-xhr=(self), usb=(self), xr-spatial-tracking=(self)',
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
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // Extend the default CSP with origins RegenAI needs:
    // - Sentry ingest (error + performance tracking, Day 3+)
    // - Google Analytics 4 (Day 29+)
    // - Cloudflare Web Analytics (Day 3+)
    // - Klaviyo newsletter forms (Day 12+)
    // - Judge.me reviews widget (Day 12+)
    // - Fontsource self-hosted (already served from same origin, no extra needed)
    connectSrc: [
      'https://*.sentry.io',
      'https://*.ingest.sentry.io',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://static.cloudflareinsights.com',
      'https://a.klaviyo.com',
      'https://cdn.judge.me',
    ],
    scriptSrc: [
      'https://www.googletagmanager.com',
      'https://static.cloudflareinsights.com',
      'https://cdn.judge.me',
      'https://static.klaviyo.com',
    ],
    imgSrc: [
      'https://www.google-analytics.com',
      'https://judgeme.imgix.net',
      'https://cdn.judge.me',
    ],
    frameSrc: [
      'https://www.klaviyo.com',
      'https://cdn.judge.me',
    ],
    // Workers + D1 calls from custom app
    // (Added at Day 15+ when the custom app is live; scaffolded here for Day 3 Sentry integration)
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
      onError(error) {
        console.error(error);
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
