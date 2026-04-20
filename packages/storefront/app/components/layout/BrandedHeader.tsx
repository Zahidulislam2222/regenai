import {Link, NavLink} from 'react-router';
import {useState} from 'react';
import {Menu, Search, ShoppingCart, User, Globe, X} from 'lucide-react';
import {cn} from '~/lib/utils';

/**
 * BrandedHeader — primary storefront navigation.
 * Clinical-modern aesthetic. Sticky. Scroll-direction-aware hide on mobile.
 * Locale + currency switchers feed into Markets subfolder routing.
 * Real menu links populate in D6 once Storefront API is live; Phase-1
 * stub uses a small static nav + Shopify Markets picker.
 */

const MAIN_NAV = [
  {label: 'Shop', href: '/collections/all'},
  {label: 'Body Area', href: '/pages/body-area'},
  {label: 'Protocols', href: '/pages/protocols'},
  {label: 'Clinicians', href: '/pages/clinicians'},
  {label: 'Evidence', href: '/pages/evidence'},
  {label: 'B2B', href: '/pages/b2b'},
];

const LOCALES = [
  {code: 'en', label: 'English'},
  {code: 'es', label: 'Español'},
  {code: 'fr', label: 'Français'},
  {code: 'de', label: 'Deutsch'},
  {code: 'ar', label: 'العربية'},
];

export function BrandedHeader({cartCount = 0, currentLocale = 'en'}: {cartCount?: number; currentLocale?: string}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-[var(--z-sticky)] w-full border-b border-[var(--color-border-default)] bg-[var(--surface-page)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface-page)]/75"
      style={{height: 'var(--header-height)'}}
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: logo + mobile menu trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="rounded-md p-2 lg:hidden hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link to="/" aria-label="RegenAI home" className="flex items-center">
            <span className="font-semibold text-lg tracking-tight text-[var(--color-primary)]">RegenAI</span>
          </Link>
        </div>

        {/* Center: primary nav (desktop) */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-6">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({isActive}) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-[var(--color-primary)]',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-secondary)]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: utility icons */}
        <div className="flex items-center gap-1">
          <LocaleSwitcher currentLocale={currentLocale} />
          <Link
            to="/search"
            aria-label="Search"
            className="rounded-md p-2 hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            to="/account"
            aria-label="Account"
            className="hidden sm:inline-flex rounded-md p-2 hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart with ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative rounded-md p-2 hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-semibold text-white"
                aria-hidden="true"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <MobileDrawer onClose={() => setMobileOpen(false)} />
      ) : null}
    </header>
  );
}

function LocaleSwitcher({currentLocale}: {currentLocale: string}) {
  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];
  return (
    <div className="relative group hidden sm:block">
      <button
        type="button"
        aria-label={`Current language: ${current.label}. Change language.`}
        className="rounded-md p-2 hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
      </button>
      <ul
        role="menu"
        className="invisible absolute right-0 top-full mt-1 min-w-32 rounded-md border border-[var(--color-border-default)] bg-[var(--surface-card)] py-1 opacity-0 shadow-[var(--shadow-md)] transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {LOCALES.map((l) => (
          <li key={l.code} role="none">
            <a
              role="menuitem"
              href={`/${l.code}`}
              className={cn(
                'block px-3 py-1.5 text-sm hover:bg-[var(--color-bone-muted)]',
                l.code === currentLocale && 'font-medium text-[var(--color-primary)]',
              )}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileDrawer({onClose}: {onClose: () => void}) {
  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- drawer backdrop click-to-dismiss pattern */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)] backdrop-blur-sm lg:hidden"
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stop-propagation inner panel */}
      <div
        className="h-full w-3/4 max-w-xs bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-[var(--color-primary)]">RegenAI</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-2 hover:bg-[var(--color-bone-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile primary" className="flex flex-col gap-1">
          {MAIN_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-base font-medium hover:bg-[var(--color-bone-muted)]"
              onClick={onClose}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
