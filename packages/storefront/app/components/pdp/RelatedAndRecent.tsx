import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {load as loadRecentlyViewed, type RecentlyViewedItem} from '~/lib/recently-viewed';

/**
 * RelatedAndRecent — "You may also like" (metafield-driven related products)
 * + "Recently viewed" (localStorage-driven). Rendered at bottom of PDP.
 * Server passes `related`; `recent` loads client-side after hydration.
 */

export interface RelatedAndRecentProps {
  related: Array<{handle: string; title: string; imageSrc: string; priceDisplay: string}>;
  currentHandle: string;
}

export function RelatedAndRecent({related, currentHandle}: RelatedAndRecentProps) {
  const [recent, setRecent] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setRecent(loadRecentlyViewed().filter((r) => r.handle !== currentHandle).slice(0, 6));
  }, [currentHandle]);

  return (
    <>
      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-10">
          <h2 id="related-heading" className="mb-4 text-2xl font-semibold tracking-tight">
            Pairs well with
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.handle}>
                <Link
                  to={`/products/${p.handle}`}
                  className="group block overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                >
                  <div className="aspect-square w-full overflow-hidden bg-[var(--color-bone-muted)]">
                    <img src={p.imageSrc} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{p.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{p.priceDisplay}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section aria-labelledby="recent-heading" className="mt-10">
          <h2 id="recent-heading" className="mb-4 text-xl font-semibold tracking-tight">
            Recently viewed
          </h2>
          <ul className="flex gap-3 overflow-x-auto pb-2">
            {recent.map((p) => (
              <li key={p.handle} className="w-40 shrink-0">
                <Link to={`/products/${p.handle}`} className="block">
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-[var(--color-bone-muted)]">
                    <img src={p.imageSrc} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-[var(--text-primary)] line-clamp-2">{p.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
