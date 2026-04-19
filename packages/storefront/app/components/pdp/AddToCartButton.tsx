import {useState} from 'react';
import {Check, Loader2, ShoppingCart, AlertTriangle} from 'lucide-react';
import {cn} from '~/lib/utils';

/**
 * AddToCartButton — optimistic UI via `useOptimisticCart` when wired to Hydrogen.
 * Phase-1 stub: simulate optimistic success/error states without real cart mutation.
 * Phase-1+: wire to cart fetcher + Storefront API `cartLinesAdd`.
 */

export interface AddToCartButtonProps {
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  disabledReason?: string;
  isSubscription?: boolean;
  className?: string;
  fullWidth?: boolean;
}

type Status = 'idle' | 'pending' | 'success' | 'error';

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  disabledReason,
  isSubscription,
  className,
  fullWidth = true,
}: AddToCartButtonProps) {
  const [status, setStatus] = useState<Status>('idle');

  const onClick = () => {
    if (disabled || !variantId) return;
    setStatus('pending');
    // Phase-1 stub — real fetcher.submit + useOptimisticCart goes here.
    setTimeout(() => setStatus('success'), 600);
    setTimeout(() => setStatus('idle'), 2100);
  };

  const label = () => {
    if (disabled) return disabledReason ?? 'Unavailable';
    if (status === 'pending') return 'Adding…';
    if (status === 'success') return 'Added to cart';
    if (status === 'error') return 'Try again';
    return isSubscription ? `Subscribe · quantity ${quantity}` : `Add to cart · quantity ${quantity}`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === 'pending'}
      aria-live="polite"
      aria-busy={status === 'pending'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        status === 'success'
          ? 'bg-[var(--color-success)] text-white'
          : status === 'error'
          ? 'bg-[var(--color-error)] text-white'
          : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        fullWidth && 'w-full',
        className,
      )}
    >
      {status === 'pending' ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : status === 'success' ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : status === 'error' ? (
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {label()}
    </button>
  );
}
