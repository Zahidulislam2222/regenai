import {afterEach, describe, expect, it, vi} from 'vitest';
import {logSafeError} from '../../app/lib/safe-logger.server';

describe('safe server error logging', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits only fixed allowlisted codes and accepts no error details', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const sensitiveError = new Error('query contains token=test-secret and cart=private-cart');
    Object.assign(sensitiveError, {cause: {queryVariables: {accessToken: 'test-secret'}}});

    logSafeError('requestFailed');
    logSafeError('renderFailed');
    logSafeError('footerQueryFailed');

    expect(errorSpy.mock.calls).toEqual([
      ['[regenai] storefront.request_failed'],
      ['[regenai] storefront.render_failed'],
      ['[regenai] storefront.footer_query_failed'],
    ]);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('test-secret');
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('private-cart');
  });
});
