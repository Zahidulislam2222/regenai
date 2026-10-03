import {describe, expect, it, vi} from 'vitest';
import {loader as accountLoader} from '../../app/routes/account/index';
import {loader as loginLoader} from '../../app/routes/account/login';
import {loader as authorizeLoader} from '../../app/routes/account/authorize';
import {loader as logoutLoader, action as logoutAction} from '../../app/routes/account/logout';

const origin = 'https://store.example.test';

function accountContext(enabled: boolean) {
  const sdkResponse = new Response(null, {status: 302, headers: {Location: '/account'}});
  return {
    settings: {canonicalOrigin: origin, customerAccount: {enabled}},
    customerAccount: {
      isLoggedIn: vi.fn().mockResolvedValue(true),
      login: vi.fn().mockResolvedValue(sdkResponse),
      authorize: vi.fn().mockResolvedValue(sdkResponse),
      logout: vi.fn().mockResolvedValue(sdkResponse),
    },
  };
}

// happy-dom's Request removes the forbidden Origin header. Route actions only
// read method and headers, so model the server request boundary explicitly.
function logoutRequest(method: string, requestOrigin?: string): Request {
  return {
    method,
    headers: {get: (name: string) => name.toLowerCase() === 'origin' ? requestOrigin ?? null : null},
  } as Request;
}

async function expectStatus(task: Promise<unknown> | (() => unknown), status: number) {
  try {
    await (typeof task === 'function' ? task() : task);
    throw new Error('Expected a route response.');
  } catch (error) {
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(status);
  }
}

describe('Customer Account API routes', () => {
  it('closes every account entry point when the feature is disabled', async () => {
    const context = accountContext(false);
    await expectStatus(accountLoader({context} as never), 404);
    await expectStatus(loginLoader({context} as never), 404);
    await expectStatus(authorizeLoader({context} as never), 404);
    await expectStatus(logoutAction({context, request: logoutRequest('POST', origin)} as never), 404);
    expect(context.customerAccount.login).not.toHaveBeenCalled();
    expect(context.customerAccount.authorize).not.toHaveBeenCalled();
    expect(context.customerAccount.logout).not.toHaveBeenCalled();
  });

  it('uses the Hydrogen SDK for enabled account state, login, and callback', async () => {
    const context = accountContext(true);
    expect(await accountLoader({context} as never)).toEqual({isLoggedIn: true});
    expect((await loginLoader({context} as never)).status).toBe(302);
    expect((await authorizeLoader({context} as never)).status).toBe(302);
    expect(context.customerAccount.isLoggedIn).toHaveBeenCalledOnce();
    expect(context.customerAccount.login).toHaveBeenCalledOnce();
    expect(context.customerAccount.authorize).toHaveBeenCalledOnce();
  });

  it('accepts only same-origin POST logout and delegates to the SDK', async () => {
    const context = accountContext(true);
    await expectStatus(() => logoutLoader(), 405);
    await expectStatus(logoutAction({context, request: logoutRequest('PUT', origin)} as never), 405);
    await expectStatus(logoutAction({context, request: logoutRequest('POST', 'https://other.example.test')} as never), 403);
    await expectStatus(logoutAction({context, request: logoutRequest('POST')} as never), 403);
    expect(context.customerAccount.logout).not.toHaveBeenCalled();

    const response = await logoutAction({context, request: logoutRequest('POST', origin)} as never);
    expect(response.status).toBe(302);
    expect(context.customerAccount.logout).toHaveBeenCalledWith({postLogoutRedirectUri: '/account'});
  });
});
