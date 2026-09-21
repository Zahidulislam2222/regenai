import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
  type ShouldRevalidateFunction,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {toPublicSettings} from '~/lib/settings.server';
import {serializePublicSettings} from '~/lib/settings.shared';
import {logSafeError} from '~/lib/safe-logger.server';
import {RecoveryShell, useRecoveryMotion} from '~/features/recovery/RecoveryShell';
import {RecoveryErrorContent} from '~/features/recovery/RecoveryErrorContent';
import recoveryStyles from '~/features/recovery/recovery.css?url';

export type RootLoader = typeof loader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
    {rel: 'stylesheet', href: recoveryStyles},
  ];
}

export async function loader({context}: Route.LoaderArgs) {
  const {settings, storefront} = context;
  const analyticsEnabled = settings.analytics.enabled;
  return {
    publicStoreDomain: settings.shopDomain,
    shop: analyticsEnabled
      ? getShopAnalytics({storefront, publicStorefrontId: settings.storefrontId})
      : null,
    consent: analyticsEnabled
      ? {
          checkoutDomain: settings.checkoutDomain,
          storefrontAccessToken: settings.storefrontApiToken,
          withPrivacyBanner: false,
          country: settings.locale.country,
          language: settings.locale.language,
        }
      : {},
    analyticsEnabled,
    publicEnv: toPublicSettings(settings),
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');
  const publicEnv = data?.publicEnv;

  return (
    <html lang={publicEnv?.locale.language.toLowerCase() ?? 'en'} dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#1e3a5f" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <script
          nonce={nonce}
          id="env"
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${publicEnv ? serializePublicSettings(publicEnv) : '{}'};`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  const outlet = <Outlet />;

  if (!data?.analyticsEnabled) return outlet;

  return (
    <Analytics.Provider cart={null} shop={data.shop} consent={data.consent}>
      {outlet}
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const motion = useRecoveryMotion();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <RecoveryShell {...motion}>
      <RecoveryErrorContent notFound={notFound} />
    </RecoveryShell>
  );
}
