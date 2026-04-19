import {Link} from 'react-router';
import {ShieldCheck, Award, HeartPulse, Mail} from 'lucide-react';

/**
 * BrandedFooter — footer with 4 link columns, trust strip, newsletter,
 * social, and legal. Editorial copy driven by brand-brief voice.
 */

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      {label: 'All products', href: '/collections/all'},
      {label: 'Body-area finder', href: '/pages/body-area'},
      {label: 'Protocols', href: '/pages/protocols'},
      {label: 'Gift cards', href: '/pages/gift-cards'},
      {label: 'Wholesale / B2B', href: '/pages/b2b'},
    ],
  },
  {
    title: 'Learn',
    links: [
      {label: 'Clinical library', href: '/blog'},
      {label: 'Clinicians', href: '/pages/clinicians'},
      {label: 'Evidence & studies', href: '/pages/evidence'},
      {label: 'Contraindications', href: '/pages/contraindications'},
    ],
  },
  {
    title: 'Account',
    links: [
      {label: 'Sign in', href: '/account'},
      {label: 'Subscriptions', href: '/account/subscriptions'},
      {label: 'Order tracking', href: '/account/orders'},
      {label: 'Device pairing', href: '/account/devices'},
    ],
  },
  {
    title: 'Support',
    links: [
      {label: 'Help center', href: '/pages/help'},
      {label: 'Contact', href: '/pages/contact'},
      {label: 'Returns & warranty', href: '/pages/returns'},
      {label: 'Shipping', href: '/pages/shipping'},
    ],
  },
];

const TRUST = [
  {icon: ShieldCheck, label: 'Clinician-reviewed'},
  {icon: Award, label: 'Research-referenced'},
  {icon: HeartPulse, label: 'Contraindication-aware'},
];

export function BrandedFooter() {
  return (
    <footer role="contentinfo" className="border-t border-[var(--color-border-default)] bg-[var(--color-bone-muted)] text-[var(--text-secondary)]">
      {/* Trust strip */}
      <div className="border-b border-[var(--color-border-default)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-6 px-4 py-4 text-sm">
          {TRUST.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-[var(--color-sage)]" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Columns + newsletter */}
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-6 lg:gap-12 lg:px-8">
        {/* Newsletter */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-[var(--text-primary)]">Science-backed recovery, in your inbox.</h3>
          <p className="mt-1 text-sm">Weekly clinician-reviewed protocols + product drops. No hype.</p>
          <form className="mt-4 flex gap-2" data-testid="footer-newsletter" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <input
              id="footer-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="flex-1 rounded-md border border-[var(--color-border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Subscribe
            </button>
          </form>
          <p className="mt-2 text-xs text-[var(--text-subtle)]">By subscribing you agree to our privacy policy. Unsubscribe any time.</p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-semibold text-[var(--text-primary)]">{col.title}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-[var(--color-primary)]">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Legal */}
      <div className="border-t border-[var(--color-border-default)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} RegenAI, Inc. All rights reserved.</p>
          <ul className="flex flex-wrap gap-4">
            <li><Link to="/policies/privacy">Privacy</Link></li>
            <li><Link to="/policies/terms">Terms</Link></li>
            <li><Link to="/policies/accessibility">Accessibility</Link></li>
            <li><Link to="/policies/ca-supply-chain">CA Supply Chain</Link></li>
            <li><Link to="/pages/fda-disclaimer">FDA disclaimers</Link></li>
          </ul>
        </div>
        <div className="mx-auto max-w-[1280px] px-4 pb-6 sm:px-6 lg:px-8">
          <p className="text-xs text-[var(--text-subtle)]">
            These statements have not been evaluated by the Food and Drug Administration. Products are not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified clinician before beginning any new recovery protocol.
          </p>
        </div>
      </div>
    </footer>
  );
}
