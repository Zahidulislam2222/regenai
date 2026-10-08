import {useOutletContext} from 'react-router';
import type {RecoveryMotionState} from './RecoveryShell';

export function useRecoveryRouteMotion(): RecoveryMotionState {
  return useOutletContext<RecoveryMotionState>();
}
