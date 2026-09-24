import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {InfoView} from '~/features/recovery/Experience';

export const meta: MetaFunction = () => [
  {title: `${site.pages.about.title.replaceAll('\n', ' ')} — RegenAI`},
  {name: 'description', content: site.pages.about.body},
];

export default function RecoveryAboutRoute() {
  return <InfoView page="about" />;
}
