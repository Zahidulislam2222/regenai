import {useEffect, useRef} from 'react';
import {Outlet, useLoaderData, useLocation} from 'react-router';
import {RecoveryShell, useRecoveryMotion} from '~/features/recovery/RecoveryShell';
import type {Route} from './+types/layout';

export async function loader({context}: Route.LoaderArgs) {
  if (!context.settings.sandboxCheckoutEnabled) return {sandboxCartQuantity: undefined};
  try {
    const cart = await context.cart.get();
    return {sandboxCartQuantity: cart?.totalQuantity ?? 0};
  } catch {
    return {sandboxCartQuantity: null};
  }
}

export default function RecoveryLayout() {
  const motion = useRecoveryMotion();
  const {sandboxCartQuantity} = useLoaderData<typeof loader>();

  return (
    <RecoveryShell {...motion} bagEnabled={false} sandboxCartQuantity={sandboxCartQuantity}>
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
