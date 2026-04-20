import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {OptimisticCart} from '@shopify/hydrogen';
import {Truck} from 'lucide-react';

/**
 * FreeShipBar — shows remaining subtotal to the free-shipping threshold.
 * Phase 1 uses a fixed $75 threshold; Phase 2+ reads it from a metaobject
 * so merchandising can A/B different thresholds per market.
 */

const DEFAULT_THRESHOLD_USD = 75;

export function FreeShipBar({
  cart,
  thresholdUsd = DEFAULT_THRESHOLD_USD,
}: {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  thresholdUsd?: number;
}) {
  const subtotalAmount = cart?.cost?.subtotalAmount;
  if (!subtotalAmount) return null;

  const subtotal = Number(subtotalAmount.amount);
  if (!Number.isFinite(subtotal)) return null;

  const currency = subtotalAmount.currencyCode ?? 'USD';
  const remaining = Math.max(0, thresholdUsd - subtotal);
  const pct = Math.min(100, Math.max(0, (subtotal / thresholdUsd) * 100));
  const qualified = remaining === 0;

  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-[var(--color-border-default)] bg-[var(--surface-card)] p-3 text-sm"
    >
      <div className="flex items-center gap-2 text-[var(--text-primary)]">
        <Truck className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
        {qualified ? (
          <span className="font-medium text-[var(--color-success)]">
            You&rsquo;ve unlocked free shipping.
          </span>
        ) : (
          <span>
            Add <strong>{fmt.format(remaining)}</strong> more for free shipping.
          </span>
        )}
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bone-muted)]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free shipping"
      >
        <div
          className={
            qualified
              ? 'h-full bg-[var(--color-success)] transition-[width] duration-300'
              : 'h-full bg-[var(--color-primary)] transition-[width] duration-300'
          }
          style={{width: `${pct}%`}}
        />
      </div>
    </div>
  );
}
