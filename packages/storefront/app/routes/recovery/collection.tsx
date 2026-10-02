import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {RecoveryCatalogView} from './catalog-view';

export const meta: MetaFunction = () => [
  {title: 'The collection — RegenAI'},
  {name: 'description', content: site.demo},
];

export default function RecoveryCollectionRoute() {
  return <RecoveryCatalogView />;
}
