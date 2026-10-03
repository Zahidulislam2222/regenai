import {CartForm} from '@shopify/hydrogen';
import {redirect, useLoaderData, type MetaFunction} from 'react-router';
import type {Route} from './+types/cart';
import {CartView} from '~/features/recovery/Experience';
import {ShopifySandboxCartView} from '~/features/recovery/ShopifySandboxCartView';
import {listShopifyProducts} from '~/lib/shopify-catalog.server';
import {
  sandboxCartIsOwned,
  validateSandboxAdd,
  validateSandboxRemove,
  validatedSandboxCheckoutUrl,
} from '~/lib/sandbox-cart.server';

export const meta: MetaFunction = () => [
  {title: 'Ordering — RegenAI'},
  {name: 'robots', content: 'noindex, nofollow'},
];

export async function loader({context}: Route.LoaderArgs) {
  if (!context.settings.sandboxCheckoutEnabled) return {enabled: false as const};
  const cart = await context.cart.get();
  const products = await listShopifyProducts(
    (document, options) => context.storefront.query(document, options), context.settings.catalog);
  if (!sandboxCartIsOwned(cart, products)) {
    throw new Response('Cart contains items outside this sandbox.', {status: 400});
  }
  return {
    enabled: true as const,
    cart,
    checkoutUrl: validatedSandboxCheckoutUrl(cart?.checkoutUrl, context.settings.checkoutDomain),
  };
}

export async function action({request, context}: Route.ActionArgs) {
  if (!context.settings.sandboxCheckoutEnabled) {
    throw new Response('Sandbox checkout is not enabled for this concept experience.', {status: 501});
  }
  const formData = await request.formData();
  let intent: string | undefined;
  let inputs: Record<string, unknown>;
  try {
    const parsed = CartForm.getFormInput(formData);
    intent = parsed.action;
    inputs = parsed.inputs as Record<string, unknown>;
  } catch {
    throw new Response('Invalid cart request.', {status: 400});
  }
  if (intent !== CartForm.ACTIONS.LinesAdd && intent !== CartForm.ACTIONS.LinesRemove) {
    throw new Response('Unsupported sandbox cart action.', {status: 400});
  }
  const current = await context.cart.get();
  let result;
  if (intent === CartForm.ACTIONS.LinesAdd) {
    const products = await listShopifyProducts(
      (document, options) => context.storefront.query(document, options), context.settings.catalog);
    let lines;
    try {
      lines = validateSandboxAdd(inputs.lines, current, products, context.settings.sandboxCart);
    } catch {
      throw new Response('Invalid or unavailable sandbox line.', {status: 400});
    }
    result = await context.cart.addLines(lines);
  } else {
    let lineIds;
    try {
      lineIds = validateSandboxRemove(inputs.lineIds, current);
    } catch {
      throw new Response('Invalid sandbox line removal.', {status: 400});
    }
    result = await context.cart.removeLines(lineIds);
  }
  if (result.errors?.length || result.userErrors?.length || !result.cart?.id) {
    throw new Response('Shopify could not update the sandbox cart.', {status: 502});
  }
  const headers = context.cart.setCartId(result.cart.id);
  return redirect('/cart', {headers});
}

export default function CartRoute() {
  const result = useLoaderData<typeof loader>();
  return result.enabled ? <ShopifySandboxCartView cart={result.cart} checkoutUrl={result.checkoutUrl} /> : <CartView />;
}
