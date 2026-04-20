import {
  data,
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from 'react-router';
import {CartForm, type CartQueryDataReturn} from '@shopify/hydrogen';
import {type CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import {CartMain} from '~/components/CartMain';
import {Breadcrumbs} from '~/components/Breadcrumbs';

export const meta: MetaFunction = () => [
  {title: 'Cart — RegenAI'},
  {name: 'robots', content: 'noindex, nofollow'},
];

/**
 * POST target for <CartForm>. Also renders a full-page /cart view with
 * no-JS fallback — forms submit here on-submit and return updated cart
 * JSON that the CartMain re-reads from root loader on next revalidation.
 */
export async function action({request, context}: ActionFunctionArgs) {
  const {cart} = context;
  const formData = await request.formData();

  const {action: intent, inputs} = CartForm.getFormInput(formData);
  if (!intent) {
    throw new Response('No cart intent provided', {status: 400});
  }

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
      result = await cart.updateBuyerIdentity({
        ...(inputs.buyerIdentity as Parameters<typeof cart.updateBuyerIdentity>[0]),
      });
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

  // If the submission came from the PDP AddToCartButton we want to redirect
  // back to the referring page, else stay on /cart.
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

export async function loader({context}: ActionFunctionArgs) {
  const {cart} = context;
  const cartData = await cart.get();
  return data({cart: cartData});
}

export default function CartRoute() {
  const {cart} = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{name: 'Home', href: '/'}, {name: 'Cart', href: '/cart'}]} />
      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Your cart
        </h1>
      </header>
      <CartMain cart={cart ?? null} layout="page" />
    </div>
  );
}
