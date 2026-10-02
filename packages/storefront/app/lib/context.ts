import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {loadStorefrontSettings} from '~/lib/settings.server';

type AdditionalContextType = {settings: ReturnType<typeof loadStorefrontSettings>};
export type HydrogenExecutionContext = Pick<ExecutionContext, 'waitUntil'> & {cache?: Cache};

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/**
 * Creates Hydrogen context with validated server-side settings.
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: HydrogenExecutionContext,
) {
  const settings = loadStorefrontSettings(env);

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    executionContext.cache ?? caches.open(settings.cache.namespace),
    AppSession.init(request, settings.session),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env: {
        ...env,
        SESSION_SECRET: settings.session.secret,
        PUBLIC_STOREFRONT_API_TOKEN: settings.storefrontApiToken,
        PRIVATE_STOREFRONT_API_TOKEN:
          settings.privateStorefrontApiToken ?? env.PRIVATE_STOREFRONT_API_TOKEN,
        PUBLIC_STORE_DOMAIN: settings.shopDomain,
        PUBLIC_STOREFRONT_ID: settings.storefrontId,
        PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID:
          settings.customerAccount.enabled
            ? settings.customerAccount.clientId
            : '',
        PUBLIC_CHECKOUT_DOMAIN: settings.checkoutDomain,
        SHOP_ID: settings.customerAccount.enabled ? settings.customerAccount.shopId : '',
      },
      request,
      cache,
      waitUntil,
      logErrors: false,
      session,
      // Or detect from URL path based on locale subpath, cookies, or any other strategy
      storefront: {apiVersion: settings.storefrontApiVersion},
      customerAccount: {apiVersion: settings.customerAccount.apiVersion},
      i18n: settings.locale,
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    {settings},
  );

  return hydrogenContext;
}
