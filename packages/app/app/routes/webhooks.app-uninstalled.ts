import type {ActionFunctionArgs} from 'react-router';
import {handleUninstallWebhook} from '~/lib/webhook-uninstall';

export function loader() {
  return new Response('Method not allowed', {status: 405, headers: {'Cache-Control': 'no-store'}});
}

export async function action({request, context}: ActionFunctionArgs) {
  return handleUninstallWebhook(request, context.cloudflare.env);
}
