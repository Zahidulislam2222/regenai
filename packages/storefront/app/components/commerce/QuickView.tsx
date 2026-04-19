import {useState} from 'react';
import {X} from 'lucide-react';
import {Link} from 'react-router';
import {cn} from '~/lib/utils';

export interface QuickViewProps {
  open: boolean;
  onClose: () => void;
  product: {
    handle: string;
    title: string;
    priceDisplay: string;
    image: {src: string; alt: string};
    description: string;
    variants: Array<{id: string; label: string; available: boolean}>;
    contraindications?: string[];
  } | null;
}

export function QuickView({open, onClose, product}: QuickViewProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product?.variants[0]?.id ?? null,
  );

  if (!open || !product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-[var(--surface-elevated)] shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-10 rounded-md bg-white/80 p-2 text-[var(--text-primary)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="grid gap-0 sm:grid-cols-2">
          <div className="aspect-square bg-[var(--color-bone-muted)]">
            <img
              src={product.image.src}
              alt={product.image.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col p-6">
            <h2 id="quickview-title" className="text-xl font-semibold text-[var(--text-primary)]">
              {product.title}
            </h2>
            <p className="mt-1 text-lg font-semibold text-[var(--color-primary)]">
              {product.priceDisplay}
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{product.description}</p>

            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--text-subtle)]">
                Select variant
              </legend>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    disabled={!v.available}
                    aria-pressed={selectedVariant === v.id}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm transition-colors',
                      selectedVariant === v.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                        : 'border-[var(--color-border-default)] hover:bg-[var(--color-bone-muted)]',
                      !v.available && 'opacity-50 line-through',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {product.contraindications?.length ? (
              <div
                role="alert"
                className="mt-4 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-3 text-xs text-[var(--color-warning)]"
              >
                <p className="font-semibold">Contraindications</p>
                <ul className="mt-1 list-inside list-disc">
                  {product.contraindications.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                Add to cart
              </button>
              <Link
                to={`/products/${product.handle}`}
                className="rounded-md border border-[var(--color-border-strong)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-bone-muted)]"
              >
                Full details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
