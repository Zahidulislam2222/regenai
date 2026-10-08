import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {InfoView} from '~/features/recovery/Experience';

export const meta: MetaFunction = () => [
  {title: `${site.pages.contact.title.replaceAll('\n', ' ')} — RegenAI`},
  {name: 'description', content: site.pages.contact.body},
];

export default function RecoveryContactRoute() {
  return <InfoView page="contact" />;
}
