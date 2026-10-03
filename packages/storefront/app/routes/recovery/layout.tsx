import {useEffect, useRef} from 'react';
import {Outlet, useLocation} from 'react-router';
import {RecoveryShell, useRecoveryMotion} from '~/features/recovery/RecoveryShell';

export default function RecoveryLayout() {
  const motion = useRecoveryMotion();

  return (
    <RecoveryShell {...motion}>
      <FocusMainOnNavigation />
      <Outlet context={motion} />
    </RecoveryShell>
  );
}

function FocusMainOnNavigation() {
  const {pathname} = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Keep the skip link first on load, including Strict Mode's repeated effect.
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    document.getElementById('main-content')?.focus({preventScroll: true});
  }, [pathname]);

  return null;
}
