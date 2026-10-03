import {useEffect, useState, type ReactNode} from 'react';
import {Link, NavLink} from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowUpRight, Menu, Pause, Play, Search, X} from 'lucide-react';
import {ui} from '../../content/recovery-ui';
import {site} from '../../content/recovery';
import {editorial} from '../../content/recovery-editorial';
import {BagProvider} from './Bag';

export type RecoveryMotionState = {paused: boolean; reduced: boolean; toggle: () => void};

export function useRecoveryMotion(): RecoveryMotionState {
  const [manualPause, setManualPause] = useState(false);
  // Keep server markup and the first client render deterministic. Read the
  // user's preference only after hydration, then follow preference changes.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return {paused: manualPause || reduced, reduced,
    toggle: () => setManualPause((value) => !value)};
}

export function Mark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 4v32M4 20h32M9 9l22 22M9 31 31 9"
        stroke="currentColor"
        strokeWidth="5"
      />
      <circle cx="20" cy="20" r="7" fill="var(--paper)" />
    </svg>
  );
}

function Header({paused, reduced, toggle, sandboxCartQuantity}: RecoveryMotionState & {
  sandboxCartQuantity?: number | null;
}) {
  const [mobile, setMobile] = useState(false);

  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label={ui.regenai_home_b3beff}>
        <Mark />
        <span>
          {site.name}
          <span className="brand-dot">{ui._987e95}</span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label={ui.main_navigation_eb3559}>
        {site.nav.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="header-actions">
        {!reduced && <button
          className="icon-button motion-toggle"
          onClick={toggle}
          aria-label={paused ? 'Enable motion' : 'Pause motion'}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>}
        <Link className="icon-button" to="/search" aria-label={ui.search_products_c65cb6}>
          <Search size={19} />
        </Link>
        {sandboxCartQuantity !== undefined && <Link className="bag-button" to="/cart"
          aria-label={sandboxCartQuantity === null ? editorial.ui.shopifyCartLink
            : `${editorial.ui.shopifyCartLink}, ${sandboxCartQuantity} ${editorial.ui.shopifyCartCountLabel}`}>
          {editorial.ui.shopifyCartLink}
          {sandboxCartQuantity !== null && <span aria-hidden="true">{sandboxCartQuantity}</span>}
        </Link>}
        <Link className="header-availability" to="/policies/delivery">Availability <ArrowUpRight size={16} /></Link>
        <Dialog.Root open={mobile} onOpenChange={setMobile}>
          <Dialog.Trigger className="icon-button mobile-trigger" aria-label={ui.open_navigation_0ed77f}>
            <Menu size={22} />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="drawer mobile-drawer">
              <div className="drawer-heading">
                <Dialog.Title>{ui.explore_regenai_1e8973}</Dialog.Title>
                <Dialog.Close className="icon-button" aria-label={ui.close_navigation_99904d}>
                  <X />
                </Dialog.Close>
              </div>
              <Dialog.Description className="small muted">
                {ui.space_for_your_everyday_recovery_fe26ce}
              </Dialog.Description>
              <nav aria-label={ui.mobile_navigation_806f22}>
                {site.nav.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobile(false)}>
                    {item.label}
                    <ArrowUpRight />
                  </Link>
                ))}
              </nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <p className="eyebrow">{ui.recovery_is_a_daily_practice_f94ed1}</p>
        <Link to="/quiz" className="footer-invitation">
          {site.footer.line}
          <span className="circle-arrow">
            <ArrowUpRight />
          </span>
        </Link>
      </div>
      <div className="footer-bottom">
        <Link to="/" className="brand" aria-label={ui.regenai_home_b3beff}>
          <Mark />
          <span>{ui.regenai_a00a20}</span>
        </Link>
        <p>{site.footer.note}</p>
        <nav aria-label={ui.footer_26c87b}>
          {site.footer.links.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="footer-meta">
        <span>
          {ui._6f28d6}
          {new Date().getFullYear()}
          {ui.regenai_concept_collection_d0c61b}
        </span>
        <span>{ui.made_for_the_everyday_cb296e}</span>
      </div>
    </footer>
  );
}

export function RecoveryShell({
  children,
  paused,
  reduced,
  toggle,
  bagEnabled = true,
  sandboxCartQuantity,
}: RecoveryMotionState & {children: ReactNode; bagEnabled?: boolean; sandboxCartQuantity?: number | null}) {
  const content = (
      <div className={`recovery-app ${paused ? 'motion-paused' : ''}`}>
        <a className="skip-link" href="#main-content">
          {ui.skip_to_main_content_c887f1}
        </a>
        <Header paused={paused} reduced={reduced} toggle={toggle}
          sandboxCartQuantity={sandboxCartQuantity} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
  );
  return bagEnabled ? <BagProvider>{content}</BagProvider> : content;
}
