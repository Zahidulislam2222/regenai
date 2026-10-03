import type {ActionFunctionArgs} from 'react-router';
import {handlePrivacyWebhook} from '~/lib/webhook-privacy';

export function loader() {
  return new Response('Method not allowed', {status: 405, headers: {'Cache-Control': 'no-store'}});
}

export async function action({request, context}: ActionFunctionArgs) {
  return handlePrivacyWebhook(request, context.cloudflare.env);
}
