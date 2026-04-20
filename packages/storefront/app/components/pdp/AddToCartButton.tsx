import {useEffect, useState} from 'react';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {Check, Loader2, ShoppingCart, AlertTriangle} from 'lucide-react';
import {useAside} from '~/components/Aside';
import {cn} from '~/lib/utils';

/**
 * AddToCartButton — real Hydrogen cart wiring.
 *
 * Submits a <CartForm action=LinesAdd> with the variant id + quantity. The
 * fetcher state drives the button's visual state (idle / pending / success),
 * and on successful submission we open the cart drawer so the customer sees
 * their just-added item.
 *
 * For subscription variants, selling-plan support comes through
 * `sellingPlanId` (resolved from the selected variant's selling plan when
 * Day-26 subscription engine lands).
 */

export interface AddToCartButtonProps {
  variantId: string;
  quantity?: number;
  sellingPlanId?: string;
  disabled?: boolean;
  disabledReason?: string;
  isSubscription?: boolean;
  className?: string;
  fullWidth?: boolean;
  /** Attributes persisted on the cart line — e.g. `_protocol_id`, `_gift`. */
  attributes?: Array<{key: string; value: string}>;
}

export function AddToCartButton({
  variantId,
  quantity = 1,
  sellingPlanId,
  disabled,
  disabledReason,
  isSubscription,
  className,
  fullWidth = true,
  attributes,
}: AddToCartButtonProps) {
  const {open} = useAside();
  // Transient success indicator — the fetcher returns to idle right after
  // the mutation resolves, so we hold a 1.5s "Added" confirmation locally.
  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(t);
  }, [justAdded]);

  const lineInput: OptimisticCartLineInput = {
    merchandiseId: variantId,
    quantity,
    ...(sellingPlanId ? {sellingPlanId} : {}),
    ...(attributes ? {attributes} : {}),
  };

  return (
    <CartForm
      route="/cart"
      inputs={{lines: [lineInput]}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => {
        const pending = fetcher.state !== 'idle';
        const errored =
          fetcher.state === 'idle' &&
          fetcher.data &&
          (fetcher.data as {errors?: unknown})?.errors;

        // On transition from pending -> idle with no error, flip justAdded +
        // open the drawer so the customer sees their item.
        if (pending === false && fetcher.data && !errored && !justAdded && fetcher.formData) {
          // Schedule for the next paint — do not set state during render.
          queueMicrotask(() => {
            setJustAdded(true);
            open('cart');
          });
        }

        const label = disabled
          ? (disabledReason ?? 'Unavailable')
          : pending
            ? 'Adding…'
            : justAdded
              ? 'Added to cart'
              : errored
                ? 'Try again'
                : isSubscription
                  ? `Subscribe · quantity ${quantity}`
                  : `Add to cart · quantity ${quantity}`;

        return (
          <button
            type="submit"
            disabled={disabled || !variantId || pending}
            aria-busy={pending}
            aria-live="polite"
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
              justAdded
                ? 'bg-[var(--color-success)] text-white'
                : errored
                  ? 'bg-[var(--color-error)] text-white'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              fullWidth && 'w-full',
              className,
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : justAdded ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : errored ? (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            )}
            {label}
          </button>
        );
      }}
    </CartForm>
  );
}
