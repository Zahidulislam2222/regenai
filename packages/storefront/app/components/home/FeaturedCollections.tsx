import {Link} from 'react-router';

/**
 * FeaturedCollections — 3 curated category cards.
 * Real Storefront API query arrives Day 6.2 (currently stub content so
 * the block renders above-fold with zero network).
 */

const COLLECTIONS = [
  {
    handle: 'physiotherapy',
    title: 'Physiotherapy',
    desc: 'Posture, TENS, massage, tape — clinician-designed recovery kits.',
  },
  {
    handle: 'sleep',
    title: 'Sleep',
    desc: 'Weighted blankets, sleep trackers, smart masks.',
    tag: 'Phase 2',
  },
  {
    handle: 'mental-wellness',
    title: 'Mental wellness',
    desc: 'Vagus-nerve stim, HRV biofeedback, meditation aids.',
    tag: 'Phase 2',
  },
];

export function FeaturedCollections() {
  return (
    <section
      aria-labelledby="featured-collections-heading"
      className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mb-8 flex items-baseline justify-between">
        <h2
          id="featured-collections-heading"
          className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]"
        >
          Shop by category
        </h2>
        <Link
          to="/collections/all"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          See all
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <li key={c.handle}>
            <Link
              to={`/collections/${c.handle}`}
              className="group block overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <div
                aria-hidden="true"
                className="aspect-[4/3] w-full bg-gradient-to-br from-[var(--color-bone-muted)] to-[var(--color-bone-subtle)] transition-transform group-hover:scale-[1.02]"
              />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--text-primary)]">{c.title}</h3>
                  {c.tag ? (
                    <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                      {c.tag}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
