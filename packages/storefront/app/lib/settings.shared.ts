export type RuntimeMode = 'development' | 'test' | 'production';

export type PublicStorefrontSettings = {
  canonicalOrigin: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_CHECKOUT_DOMAIN: string;
  NODE_ENV: RuntimeMode;
  locale: {language: string; country: string};
  SENTRY_STOREFRONT_DSN?: string;
};

export function serializePublicSettings(settings: PublicStorefrontSettings): string {
  return JSON.stringify(settings)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
