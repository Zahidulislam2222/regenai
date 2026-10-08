import {CartForm, type CartReturn} from '@shopify/hydrogen';
import {ArrowUpRight, Minus, Plus} from 'lucide-react';
import {Link} from 'react-router';
import {editorial} from '~/content/recovery-editorial';

function amount(value: {amount: string; currencyCode: string} | null | undefined): string {
  if (!value) return 'Price unavailable';
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: value.currencyCode})
    .format(Number(value.amount));
}

export function ShopifySandboxCartView({cart, checkoutUrl, maxLineQuantity, maxTotalQuantity}: {
  cart: CartReturn | null;
  checkoutUrl: string | null;
  maxLineQuantity: number;
  maxTotalQuantity: number;
}) {
  const lines = cart?.lines?.nodes ?? [];
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <section className="page narrow">
      <p className="eyebrow">LOCAL DEVELOPMENT STORE / TEST ORDERS ONLY</p>
      <h1>{editorial.ui.shopifyCartHeading}</h1>
      <p>{editorial.ui.shopifyCartDescription}</p>
      {lines.length === 0 ? (
        <div className="empty-state"><p>{editorial.ui.shopifyCartEmpty}</p>
          <Link className="button" to="/collections/all">Explore the collection <ArrowUpRight size={18} /></Link>
        </div>
      ) : (
        <>
          <div className="cart-lines">{lines.map((line) => {
            const variant = line.merchandise;
            const product = variant?.product;
            return <article className="cart-line" key={line.id}>
              {variant?.image?.url && <img src={variant.image.url}
                alt={variant.image.altText || product?.title || editorial.ui.shopifyCartImageAlt} width={96} height={96} />}
              <div><h2>{product?.title || editorial.ui.shopifyCartProductFallback}</h2><p>{variant?.title}</p>
                <div className="shopify-cart-quantity" role="group"
                  aria-label={`${editorial.ui.shopifyCartQuantity}: ${product?.title || editorial.ui.shopifyCartProductFallback}`}>
                  <CartForm route="/cart" action={CartForm.ACTIONS.LinesUpdate}
                    inputs={{lines: [{id: line.id, quantity: line.quantity - 1}]}}>
                    {(fetcher) => <button type="submit" aria-label={`${editorial.ui.shopifyCartDecrease} ${product?.title || editorial.ui.shopifyCartProductFallback}`}
                      disabled={line.quantity <= 1 || fetcher.state !== 'idle'}><Minus size={15} /></button>}
                  </CartForm>
                  <span aria-label={editorial.ui.shopifyCartQuantity}>{line.quantity}</span>
                  <CartForm route="/cart" action={CartForm.ACTIONS.LinesUpdate}
                    inputs={{lines: [{id: line.id, quantity: line.quantity + 1}]}}>
                    {(fetcher) => <button type="submit" aria-label={`${editorial.ui.shopifyCartIncrease} ${product?.title || editorial.ui.shopifyCartProductFallback}`}
                      disabled={line.quantity >= maxLineQuantity || totalQuantity >= maxTotalQuantity || fetcher.state !== 'idle'}>
                      <Plus size={15} />
                    </button>}
                  </CartForm>
                </div>
                <p>{amount(line.cost?.totalAmount)}</p></div>
              <CartForm route="/cart" action={CartForm.ACTIONS.LinesRemove} inputs={{lineIds: [line.id]}}>
                {(fetcher) => <button type="submit" disabled={fetcher.state !== 'idle'}
                  aria-label={`${editorial.ui.shopifyCartRemove} ${product?.title || editorial.ui.shopifyCartProductFallback}`}>
                  {editorial.ui.shopifyCartRemove}
                </button>}
              </CartForm>
            </article>;
          })}</div>
          <p className="cart-total">Subtotal: {amount(cart?.cost?.subtotalAmount)}</p>
          {checkoutUrl ? <a className="button" href={checkoutUrl} rel="noreferrer">Open test checkout <ArrowUpRight size={18} /></a>
            : <p>Test checkout is unavailable for this cart.</p>}
        </>
      )}
    </section>
  );
}
