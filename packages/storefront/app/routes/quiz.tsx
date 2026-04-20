import type {MetaFunction} from 'react-router';
import {RecoveryQuiz} from '~/components/RecoveryQuiz';
import {Breadcrumbs} from '~/components/Breadcrumbs';

export const meta: MetaFunction = () => [
  {title: 'Recovery Quiz — RegenAI'},
  {
    name: 'description',
    content:
      'Take the 6-step recovery quiz to get clinician-reviewed protocol and product recommendations matched to your body areas, goals, and activity level.',
  },
  {property: 'og:title', content: 'Recovery Quiz — RegenAI'},
  {property: 'og:type', content: 'website'},
];

export default function QuizRoute() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          {name: 'Home', href: '/'},
          {name: 'Recovery Quiz', href: '/quiz'},
        ]}
      />
      <header className="mt-4 mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Recovery Quiz
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">
          Six quick questions. Clinician-reviewed recommendations on the other side.
          No account required to start.
        </p>
      </header>
      <RecoveryQuiz />
    </div>
  );
}
