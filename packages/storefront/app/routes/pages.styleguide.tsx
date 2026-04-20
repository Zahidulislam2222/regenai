import type {MetaFunction} from 'react-router';

/**
 * /pages/styleguide — living component library.
 * Renders color tokens, typography, spacing, and each ui component variant.
 * Real-page version of what Storybook shows; useful for in-context QA.
 */

export const meta: MetaFunction = () => [
  {title: 'Style guide · RegenAI'},
  {name: 'description', content: 'RegenAI design system — color tokens, typography, components.'},
  {name: 'robots', content: 'noindex, nofollow'},
];

const COLOR_TOKENS = [
  ['bone', '#F8F6F1'],
  ['bone-muted', '#EFEBE2'],
  ['primary', '#1E3A5F'],
  ['primary-hover', '#2E5280'],
  ['accent', '#C87A4B'],
  ['sage', '#7A8F6F'],
  ['ink', '#1A1A1A'],
  ['muted', '#5A5A5A'],
  ['subtle', '#8A8A8A'],
  ['success', '#2D7A4F'],
  ['warning', '#C47E2A'],
  ['error', '#B23A3A'],
];

const TYPE_SCALE = [
  ['xs', '0.75rem', 'Small metadata'],
  ['sm', '0.875rem', 'Secondary copy'],
  ['base', '1rem', 'Body copy'],
  ['lg', '1.125rem', 'Lead paragraph'],
  ['xl', '1.25rem', 'Sub-heading'],
  ['2xl', '1.5rem', 'Heading L4'],
  ['3xl', '1.875rem', 'Heading L3'],
  ['4xl', '2.25rem', 'Heading L2'],
  ['5xl', '3rem', 'Heading L1'],
];

export default function Styleguide() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">RegenAI — Style guide</h1>
      <p className="mt-2 max-w-prose text-[var(--text-secondary)]">
        Living component library. Every token, type, and component variant here is the source of truth referenced by
        storefront + custom app + mobile. If it isn&rsquo;t here, it doesn&rsquo;t ship.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Color tokens</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {COLOR_TOKENS.map(([name, hex]) => (
            <div key={name} className="overflow-hidden rounded-md border border-[var(--color-border-default)]">
              <div className="h-16 w-full" style={{background: `var(--color-${name})`}} aria-hidden="true" />
              <div className="p-3 text-xs">
                <div className="font-mono font-medium">{name}</div>
                <div className="text-[var(--text-subtle)]">{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Typography</h2>
        <dl className="mt-4 space-y-3">
          {TYPE_SCALE.map(([token, size, label]) => (
            <div key={token} className="flex items-baseline gap-4 border-b border-[var(--color-border-default)] pb-2">
              <dt className="w-12 font-mono text-xs text-[var(--text-subtle)]">{token}</dt>
              <dd className="w-24 font-mono text-xs text-[var(--text-subtle)]">{size}</dd>
              <dd style={{fontSize: size}}>{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Components</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          For interactive component exploration with controls, see the Storybook site. This page renders static defaults
          so that Lighthouse + axe can audit them in-context.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-border-default)] p-5">
            <h3 className="mb-3 font-semibold">Button variants</h3>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">Primary</button>
              <button className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white">Accent</button>
              <button className="rounded-md bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white">Sage</button>
              <button className="rounded-md border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium">Outline</button>
              <button className="rounded-md px-4 py-2 text-sm font-medium hover:bg-[var(--color-bone-muted)]">Ghost</button>
              <button className="rounded-md bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white">Danger</button>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border-default)] p-5">
            <h3 className="mb-3 font-semibold">Badge variants</h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-medium text-white">Primary</span>
              <span className="rounded-full bg-[var(--color-sage)] px-2.5 py-0.5 text-xs font-medium text-white">Clinician-reviewed</span>
              <span className="rounded-full bg-[var(--color-success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">In stock</span>
              <span className="rounded-full bg-[var(--color-warning-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-warning)]">Contraindications</span>
              <span className="rounded-full bg-[var(--color-error-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-error)]">Out of stock</span>
              <span className="rounded-full bg-[var(--color-info-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-info)]">Evidence level A</span>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border-default)] p-5">
            <h3 className="mb-3 font-semibold">Input</h3>
            <label htmlFor="sg-input" className="mb-1 block text-sm">Email</label>
            <input
              id="sg-input"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border border-[var(--color-border-default)] p-5">
            <h3 className="mb-3 font-semibold">Card</h3>
            <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-sm)]">
              <h4 className="font-semibold">Recovery Tracker</h4>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">HRV + SpO₂ + sleep</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Focus + contrast</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Every interactive element has a visible focus ring (2px primary, 2px offset). All text hits WCAG 2.2 AA contrast on bone (≥ 4.5:1).
        </p>
      </section>
    </div>
  );
}
