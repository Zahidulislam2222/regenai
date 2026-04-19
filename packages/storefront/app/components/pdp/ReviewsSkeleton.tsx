import {Star} from 'lucide-react';

/**
 * ReviewsSkeleton — Judge.me placeholder.
 * Day 12 integration wires Judge.me API + injects their widget at this slot.
 * For Phase 1, render a static rating summary + "load reviews" CTA so
 * AggregateRating JSON-LD has real values even without the widget.
 */

export interface ReviewsSkeletonProps {
  ratingValue: number; // 1-5
  reviewCount: number;
  bestRating?: number; // default 5
}

export function ReviewsSkeleton({ratingValue, reviewCount, bestRating = 5}: ReviewsSkeletonProps) {
  const fullStars = Math.floor(ratingValue);
  const hasHalf = ratingValue - fullStars >= 0.5;
  return (
    <section aria-labelledby="reviews-heading" className="rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="reviews-heading" className="text-lg font-semibold text-[var(--text-primary)]">
            Customer reviews
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span aria-label={`Rated ${ratingValue} out of ${bestRating}`} className="flex items-center gap-0.5">
              {Array.from({length: bestRating}).map((_, i) => {
                const filled = i < fullStars || (i === fullStars && hasHalf);
                return (
                  <Star
                    key={i}
                    aria-hidden="true"
                    className={`h-4 w-4 ${filled ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--text-subtle)]'}`}
                  />
                );
              })}
            </span>
            <span className="text-sm font-medium">{ratingValue.toFixed(1)}</span>
            <span className="text-sm text-[var(--text-subtle)]">· {reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <button
          type="button"
          data-judgeme-load-trigger=""
          className="rounded-md border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          Read all reviews
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--text-subtle)]">
        Reviews provided by Judge.me. Verified purchases only. No incentivized reviews.
      </p>
    </section>
  );
}
