import {useLoaderData, type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {getDemoPolicyPage} from '~/features/recovery/framework-data';
import {InfoView} from '~/features/recovery/Experience';
import {site} from '~/content/recovery';
import {RecoveryRouteErrorBoundary} from './error';

export {RecoveryRouteErrorBoundary as ErrorBoundary};

export async function loader({params}: LoaderFunctionArgs) {
  const page = getDemoPolicyPage(params.policy);
  if (!page) throw new Response(null, {status: 404});
  return {page};
}

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: data ? `${site.pages[data.page].title.replaceAll('\n', ' ')} — RegenAI` : 'Policy — RegenAI'},
  {name: 'description', content: data ? site.pages[data.page].body : site.demo},
];

export default function RecoveryPolicyRoute() {
  const {page} = useLoaderData<typeof loader>();
  return <InfoView page={page} />;
}
