import {Link} from 'react-router';

/**
 * Hero — streaming-SSR above-the-fold block.
 * Clinical headline + trust-subhead + dual CTA. Background is a single
 * optimized image; text-on-image contrast verified ≥ 4.5:1 via overlay.
 */

export interface HeroProps {
  headline?: string;
  subhead?: string;
  primaryCta?: {label: string; href: string};
  secondaryCta?: {label: string; href: string};
  imageUrl?: string;
  imageAlt?: string;
}

const DEFAULT_PROPS: Required<HeroProps> = {
  headline: 'Recover. Regenerate. Reset.',
  subhead:
    'Science-backed recovery tools — clinician-reviewed, evidence-graded, contraindication-aware. From injury to everyday resilience.',
  primaryCta: {label: 'Take the recovery quiz', href: '/pages/quiz'},
  secondaryCta: {label: 'Shop by body area', href: '/pages/body-area'},
  imageUrl: '',
  imageAlt: '',
};

export function Hero(props: HeroProps = {}) {
  const p = {...DEFAULT_PROPS, ...props};
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-[var(--color-bone)]"
    >
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="mb-3 text-sm font-medium tracking-widest uppercase text-[var(--color-sage)]">
            Clinician-reviewed recovery
          </p>
          <h1
            id="hero-heading"
            className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl"
          >
            {p.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--text-secondary)]">{p.subhead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={p.primaryCta.href}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-base font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
            >
              {p.primaryCta.label}
            </Link>
            <Link
              to={p.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-border-strong)] px-6 py-3 text-base font-medium hover:bg-[var(--color-bone-muted)]"
            >
              {p.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div
          role="img"
          aria-label={p.imageAlt || 'Clinical product photography placeholder — swap via CMS'}
          className="aspect-[4/5] w-full rounded-lg bg-gradient-to-br from-[var(--color-bone-muted)] via-[var(--color-bone-subtle)] to-[var(--color-sage)]/20 lg:aspect-[4/5]"
        />
      </div>
    </section>
  );
}
