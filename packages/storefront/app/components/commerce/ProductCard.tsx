import {Link} from 'react-router';
import {useState} from 'react';
import {Eye} from 'lucide-react';
import {cn} from '~/lib/utils';

/**
 * ProductCard — PLP / recommendation tile.
 * - Lazy-loaded image via Hydrogen Image pattern (fallback <img> here;
 *   storefront will wire `<Image>` from `@shopify/hydrogen` at use site)
 * - Variant swatches up to 4, "+N" overflow indicator
 * - Hover price-flash + quick view trigger
 * - FDA class II badge when applicable
 */

export interface ProductCardProps {
  handle: string;
  title: string;
  priceDisplay: string;
  compareAtDisplay?: string;
  imageSrc: string;
  imageAlt: string;
  bodyAreas?: string[];
  fdaClass?: 'Class I' | 'Class II' | 'Class III';
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  swatches?: Array<{color: string; hex: string}>;
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';
  onQuickView?: (handle: string) => void;
}

const AVAILABILITY_LABEL: Record<NonNullable<ProductCardProps['availability']>, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  preorder: 'Pre-order',
};

export function ProductCard({
  handle,
  title,
  priceDisplay,
  compareAtDisplay,
  imageSrc,
  imageAlt,
  bodyAreas = [],
  fdaClass,
  evidenceLevel,
  swatches = [],
  availability = 'in_stock',
  onQuickView,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const visibleSwatches = swatches.slice(0, 4);
  const overflowSwatches = Math.max(0, swatches.length - 4);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        to={`/products/${handle}`}
        aria-label={`View ${title}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-bone-muted)]">
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {(fdaClass || evidenceLevel) ? (
            <div className="absolute left-2 top-2 flex gap-1">
              {fdaClass ? (
                <span className="rounded-full bg-[var(--color-primary)]/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  FDA {fdaClass}
                </span>
              ) : null}
              {evidenceLevel ? (
                <span className="rounded-full bg-[var(--color-sage)]/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  Ev. {evidenceLevel}
                </span>
              ) : null}
            </div>
          ) : null}
          {availability === 'out_of_stock' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bone)]/70 backdrop-blur-sm">
              <span className="rounded-full bg-[var(--color-error)] px-3 py-1 text-xs font-medium text-white">
                {AVAILABILITY_LABEL.out_of_stock}
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {bodyAreas.length ? (
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-subtle)]">
            {bodyAreas.slice(0, 3).join(' · ')}
          </p>
        ) : null}
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          <Link to={`/products/${handle}`} className="focus-visible:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {title}
          </Link>
        </h3>

        {visibleSwatches.length ? (
          <ul aria-label="Color variants" className="mt-1 flex items-center gap-1.5">
            {visibleSwatches.map((s) => (
              <li key={s.color}>
                <span
                  title={s.color}
                  aria-label={s.color}
                  className="inline-block h-4 w-4 rounded-full border border-[var(--color-border-default)]"
                  style={{background: s.hex}}
                />
              </li>
            ))}
            {overflowSwatches > 0 ? (
              <li className="text-xs text-[var(--text-subtle)]">+{overflowSwatches}</li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-[var(--text-primary)]">{priceDisplay}</span>
            {compareAtDisplay ? (
              <span className="text-xs text-[var(--text-subtle)] line-through">{compareAtDisplay}</span>
            ) : null}
          </div>
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(handle)}
              aria-label={`Quick view ${title}`}
              className={cn(
                'relative z-10 rounded-md p-1.5 text-xs transition-opacity',
                'hover:bg-[var(--color-bone-muted)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                hovered ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
