import {useState} from 'react';
import {ProductCard, type ProductCardProps} from './ProductCard';
import {QuickView} from './QuickView';

/**
 * PlpGrid — responsive product grid + quick-view orchestration.
 * Takes a products list; quick-view modal is managed here so cards stay stateless.
 */

export interface PlpGridProps {
  products: Array<ProductCardProps & {
    description: string;
    variants: Array<{id: string; label: string; available: boolean}>;
    contraindications?: string[];
  }>;
}

export function PlpGrid({products}: PlpGridProps) {
  const [quickHandle, setQuickHandle] = useState<string | null>(null);
  const quickProduct = quickHandle ? products.find((p) => p.handle === quickHandle) : null;

  return (
    <>
      {products.length === 0 ? (
        <div className="col-span-full py-16 text-center text-[var(--text-secondary)]">
          <p className="text-lg font-medium text-[var(--text-primary)]">No products match these filters.</p>
          <p className="mt-1 text-sm">Try fewer filters or broaden the evidence-level range.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <li key={p.handle}>
              <ProductCard {...p} onQuickView={setQuickHandle} />
            </li>
          ))}
        </ul>
      )}

      <QuickView
        open={Boolean(quickProduct)}
        onClose={() => setQuickHandle(null)}
        product={
          quickProduct
            ? {
                handle: quickProduct.handle,
                title: quickProduct.title,
                priceDisplay: quickProduct.priceDisplay,
                image: {src: quickProduct.imageSrc, alt: quickProduct.imageAlt},
                description: quickProduct.description,
                variants: quickProduct.variants,
                contraindications: quickProduct.contraindications,
              }
            : null
        }
      />
    </>
  );
}
