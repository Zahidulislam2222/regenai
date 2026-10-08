import {describe, expect, it} from 'vitest';
import {AppSession} from '../../app/lib/session';
import {loadStorefrontSettings} from '../../app/lib/settings.server';

const input = (origin: string, localDevelopment: string) => ({
  NODE_ENV: 'development',
  LOCAL_DEVELOPMENT: localDevelopment,
  PUBLIC_CANONICAL_ORIGIN: origin,
  PUBLIC_STORE_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_CHECKOUT_DOMAIN: 'regenai.myshopify.com',
  PUBLIC_STOREFRONT_API_TOKEN: 'test-public-token-only',
  PUBLIC_STOREFRONT_ID: 'test-storefront-id',
  SESSION_SECRET: 'test-only-session-secret-with-at-least-32-characters',
});

describe('session cookie settings', () => {
  it('serializes explicit HttpOnly, SameSite, path, age and Secure attributes', async () => {
    const settings = loadStorefrontSettings(input('https://store.example.test', 'false'));
    const session = await AppSession.init(new Request('https://store.example.test/'), settings.session);
    const cookie = await session.commit();

    expect(cookie).toContain('regenai_session=');
    expect(cookie).toContain('Max-Age=2592000');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
  });

  it('permits an insecure cookie only on explicitly enabled loopback HTTP development', async () => {
    const settings = loadStorefrontSettings(input('http://127.0.0.1:3001', 'true'));
    const session = await AppSession.init(new Request('http://127.0.0.1:3001/'), settings.session);
    const cookie = await session.commit();

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Secure');
  });
});
