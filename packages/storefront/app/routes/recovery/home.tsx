import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {HomeView} from '~/features/recovery/Experience';
import {useRecoveryRouteMotion} from '~/features/recovery/route-motion';

export const meta: MetaFunction = () => [
  {title: 'Make room for recovery — RegenAI'},
  {name: 'description', content: site.demo},
];

export default function RecoveryHomeRoute() {
  const {paused} = useRecoveryRouteMotion();
  return <HomeView paused={paused} />;
}
