import {useEffect} from 'react';
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

  useEffect(() => {
    document.getElementById('main-content')?.focus({preventScroll: true});
  }, [pathname]);

  return null;
}
