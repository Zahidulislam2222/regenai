import {isRouteErrorResponse, useRouteError} from 'react-router';
import {RecoveryErrorContent} from '~/features/recovery/RecoveryErrorContent';

export function RecoveryRouteErrorBoundary() {
  const error = useRouteError();
  return (
    <RecoveryErrorContent
      notFound={isRouteErrorResponse(error) && error.status === 404}
    />
  );
}
