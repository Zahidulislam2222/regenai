import type {Route} from './+types/authorize';
import {requireCustomerAccountEnabled} from '~/lib/customer-account.server';

export async function loader({context}: Route.LoaderArgs) {
  requireCustomerAccountEnabled(context.settings);
  return context.customerAccount.authorize();
}
