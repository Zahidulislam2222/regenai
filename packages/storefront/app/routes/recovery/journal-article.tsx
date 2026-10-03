import {useLoaderData} from 'react-router';
import type {Route} from './+types/journal-article';
import {editorial, selectJournalStory} from '~/content/recovery-editorial';
import {JournalArticleView} from '~/features/recovery/Editorial';
import {RecoveryRouteErrorBoundary} from './error';

export {RecoveryRouteErrorBoundary as ErrorBoundary};

export function loader({context, params}: Route.LoaderArgs) {
  const story = editorial.stories.find((item) => item.slug === params.slug);
  if (!story) throw new Response(null, {status: 404});
  return {story: selectJournalStory(story, context.settings.catalogSource)};
}

export const meta: Route.MetaFunction = ({data}) => [
  {title: data ? `${data.story.title} — RegenAI` : 'Design notes — RegenAI'},
  {name: 'description', content: data?.story.summary ?? editorial.ui.journalPageIntro},
];

export default function JournalArticleRoute() {
  const {story} = useLoaderData<typeof loader>();
  return <JournalArticleView story={story} />;
}
