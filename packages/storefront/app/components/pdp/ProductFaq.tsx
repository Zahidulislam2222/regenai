/**
 * ProductFaq — accordion Q&A section.
 * Plain details/summary for Phase 1 (semantic + works without JS).
 * Phase-1+: swap to Radix Accordion from @regenai/ui if animation polish is needed.
 */

export interface ProductFaqItem {
  q: string;
  a: string;
}

export function ProductFaq({items}: {items: ProductFaqItem[]}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading" className="rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-5">
      <h3 id="faq-heading" className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
        Frequently asked
      </h3>
      <div className="divide-y divide-[var(--color-border-default)]">
        {items.map((item, i) => (
          <details key={i} className="group py-3">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-[var(--text-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
              {item.q}
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </summary>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
