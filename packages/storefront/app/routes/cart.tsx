import {data, type CartQueryDataReturn, CartForm} from '@shopify/hydrogen';
import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {MetaFunction} from 'react-router';
import type {Route} from '../+types/cart';
import {CartView} from '~/features/recovery/Experience';
import {recoverySettings} from '~/config/recovery';

export const meta: MetaFunction = () => [
  {title: 'Your bag — RegenAI'},
  {name: 'robots', content: 'noindex, nofollow'},
];

/** The concept bag stays local until a real cart provider is selected. */
export async function loader({context}: Route.LoaderArgs) {
  if (recoverySettings.mode === 'local-demo') return {cart: null};
  return {cart: await context.cart.get()};
}

export async function action(args: Route.ActionArgs) {
  if (recoverySettings.mode === 'local-demo') {
    throw new Response('Cart updates are unavailable in this concept experience.', {
      status: 501,
    });
  }
  return updateShopifyCart(args);
}

/** Retained Shopify mutation path for the later commerce integration. */
async function updateShopifyCart({request, context}: Route.ActionArgs) {
  const {cart} = context;
  const formData = await request.formData();

  const {action: intent, inputs} = CartForm.getFormInput(formData);
  if (!intent) throw new Response('No cart intent provided', {status: 400});

  let result: CartQueryDataReturn;
  switch (intent) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines as CartLineUpdateInput[]);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds as string[]);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode as string | undefined;
      const discountCodes = (formDiscountCode ? [formDiscountCode] : []).concat(
        (inputs.discountCodes as string[]) ?? [],
      );
      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesUpdate: {
      const formGiftCardCode = inputs.giftCardCode as string | undefined;
      const giftCardCodes = (formGiftCardCode ? [formGiftCardCode] : []).concat(
        (inputs.giftCardCodes as string[]) ?? [],
      );
      result = await cart.updateGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate:
      result = await cart.updateBuyerIdentity(
        inputs.buyerIdentity as Parameters<typeof cart.updateBuyerIdentity>[0],
      );
      break;
    case CartForm.ACTIONS.AttributesUpdateInput:
      result = await cart.updateAttributes(
        inputs.attributes as Array<{key: string; value: string}>,
      );
      break;
    case CartForm.ACTIONS.NoteUpdate:
      result = await cart.updateNote(inputs.note as string);
      break;
    default:
      throw new Response(`${intent} cart action is not defined`, {status: 400});
  }

  const cartId = result?.cart?.id;
  const headers = cart.setCartId(cartId ?? '');
  const redirectTo = formData.get('redirectTo');
  if (typeof redirectTo === 'string' && redirectTo) {
    return data(
      {cart: result.cart, errors: result.errors, warnings: result.warnings},
      {status: 303, headers: {...Object.fromEntries(headers), Location: redirectTo}},
    );
  }
  return data(
    {cart: result.cart, errors: result.errors, warnings: result.warnings},
    {status: 200, headers},
  );
}

export default function CartRoute() {
  return <CartView />;
}
