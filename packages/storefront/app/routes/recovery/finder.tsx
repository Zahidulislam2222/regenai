import type {MetaFunction} from 'react-router';
import {FinderView} from '~/features/recovery/Experience';
import {site} from '~/content/recovery';

export const meta: MetaFunction = () => [
  {title: 'Recovery finder — RegenAI'},
  {name: 'description', content: site.finder.intro},
];

export default function RecoveryFinderRoute() {
  return <FinderView />;
}
