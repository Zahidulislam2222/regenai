import type {MetaFunction} from 'react-router';
import {editorial} from '~/content/recovery-editorial';
import {JournalIndexView} from '~/features/recovery/Editorial';

export const meta: MetaFunction = () => [
  {title: `${editorial.ui.journalPageTitle} — RegenAI`},
  {name: 'description', content: editorial.ui.journalPageIntro},
];

export default function JournalRoute() {
  return <JournalIndexView />;
}
