import type {Route} from './+types/logout';
import {requireCustomerAccountEnabled, requireSameOriginPost} from '~/lib/customer-account.server';

export function loader(): never {
  throw new Response('Method not allowed.', {status: 405, headers: {Allow: 'POST'}});
}

export async function action({request, context}: Route.ActionArgs) {
  requireCustomerAccountEnabled(context.settings);
  requireSameOriginPost(request, context.settings.canonicalOrigin);
  return context.customerAccount.logout({postLogoutRedirectUri: '/account'});
}
