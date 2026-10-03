import {CartForm, type CartReturn} from '@shopify/hydrogen';
import {ArrowUpRight} from 'lucide-react';
import {Link} from 'react-router';

function amount(value: {amount: string; currencyCode: string} | null | undefined): string {
  if (!value) return 'Price unavailable';
  return new Intl.NumberFormat('en-US', {style: 'currency', currency: value.currencyCode})
    .format(Number(value.amount));
}

export function ShopifySandboxCartView({cart, checkoutUrl}: {
  cart: CartReturn | null;
  checkoutUrl: string | null;
}) {
  const lines = cart?.lines?.nodes ?? [];
  return (
    <section className="page narrow">
      <p className="eyebrow">LOCAL DEVELOPMENT STORE / TEST ORDERS ONLY</p>
      <h1>Sandbox cart</h1>
      <p>This cart is connected to Shopify’s development store. Its concept prices are illustrative.</p>
      {lines.length === 0 ? (
        <div className="empty-state"><p>Your sandbox cart is empty.</p>
          <Link className="button" to="/collections/all">Explore the collection <ArrowUpRight size={18} /></Link>
        </div>
      ) : (
        <>
          <div className="cart-lines">{lines.map((line) => {
            const variant = line.merchandise;
            const product = variant?.product;
            return <article className="cart-line" key={line.id}>
              {variant?.image?.url && <img src={variant.image.url}
                alt={variant.image.altText || product?.title || 'Concept image'} width={96} height={96} />}
              <div><h2>{product?.title || 'Concept'}</h2><p>{variant?.title} · Qty {line.quantity}</p>
                <p>{amount(line.cost?.totalAmount)}</p></div>
              <CartForm route="/cart" action={CartForm.ACTIONS.LinesRemove} inputs={{lineIds: [line.id]}}>
                <button type="submit">Remove</button>
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
