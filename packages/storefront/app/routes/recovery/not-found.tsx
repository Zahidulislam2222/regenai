import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {NotFoundView} from '~/features/recovery/Experience';
import {RecoveryRouteErrorBoundary} from './error';

export {RecoveryRouteErrorBoundary as ErrorBoundary};

export function loader(_args: LoaderFunctionArgs): never {
  throw new Response(null, {status: 404});
}

export const meta: MetaFunction = () => [
  {title: 'Page not found — RegenAI'},
  {name: 'robots', content: 'noindex, nofollow'},
];

export default function RecoveryNotFoundRoute() {
  return <NotFoundView />;
}
