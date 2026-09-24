import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {RecoveryCatalogView} from './catalog-view';

export const meta: MetaFunction = () => [
  {title: 'Find your next ritual — RegenAI'},
  {name: 'description', content: site.demo},
  {name: 'robots', content: 'noindex, nofollow'},
];

export default function RecoverySearchRoute() {
  return <RecoveryCatalogView search />;
}
