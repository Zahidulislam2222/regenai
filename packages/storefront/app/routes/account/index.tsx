import {Form, Link, useLoaderData, type MetaFunction} from 'react-router';
import type {Route} from './+types/index';
import {requireCustomerAccountEnabled} from '~/lib/customer-account.server';

export const meta: MetaFunction = () => [
  {title: 'Account — RegenAI'},
  {name: 'robots', content: 'noindex, nofollow'},
];

export function headers() {
  return {'Cache-Control': 'private, no-store'};
}

export async function loader({context}: Route.LoaderArgs) {
  requireCustomerAccountEnabled(context.settings);
  return {isLoggedIn: await context.customerAccount.isLoggedIn()};
}

export default function AccountRoute() {
  const {isLoggedIn} = useLoaderData<typeof loader>();
  return (
    <section className="mx-auto max-w-2xl px-6 py-20" aria-labelledby="account-title">
      <p className="eyebrow">Development store</p>
      <h1 id="account-title" className="mt-4 text-4xl font-semibold">Account</h1>
      {isLoggedIn ? (
        <>
          <p className="mt-5">You are signed in to the RegenAI development store.</p>
          <p className="mt-3">Orders and subscriptions are not available in this concept demo.</p>
          <Form method="post" action="/account/logout" className="mt-8">
            <button type="submit" className="rounded border px-5 py-3">Sign out</button>
          </Form>
        </>
      ) : (
        <>
          <p className="mt-5">Sign in to the RegenAI development store.</p>
          <Link to="/account/login" className="mt-8 inline-block rounded border px-5 py-3">Sign in</Link>
        </>
      )}
    </section>
  );
}
