import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {InfoView} from '~/features/recovery/Experience';

export const meta: MetaFunction = () => [
  {title: `${site.pages.help.title.replaceAll('\n', ' ')} — RegenAI`},
  {name: 'description', content: site.pages.help.body},
];

export default function RecoveryHelpRoute() {
  return <InfoView page="help" />;
}
