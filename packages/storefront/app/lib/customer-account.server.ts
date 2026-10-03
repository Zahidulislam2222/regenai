import type {StorefrontSettings} from './settings.server';

export function requireCustomerAccountEnabled(
  settings: Pick<StorefrontSettings, 'customerAccount'>,
): void {
  if (!settings.customerAccount.enabled) {
    throw new Response(null, {status: 404});
  }
}

export function requireSameOriginPost(request: Request, canonicalOrigin: string): void {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed.', {status: 405, headers: {Allow: 'POST'}});
  }
  if (request.headers.get('Origin') !== canonicalOrigin) {
    throw new Response('Forbidden.', {status: 403});
  }
}
