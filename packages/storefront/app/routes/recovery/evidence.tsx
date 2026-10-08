import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {InfoView} from '~/features/recovery/Experience';

export const meta: MetaFunction = () => [
  {title: `${site.pages.evidence.title.replaceAll('\n', ' ')} — RegenAI`},
  {name: 'description', content: site.pages.evidence.body},
];

export default function RecoveryEvidenceRoute() {
  return <InfoView page="evidence" />;
}
