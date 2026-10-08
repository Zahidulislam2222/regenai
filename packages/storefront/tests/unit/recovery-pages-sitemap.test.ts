import {describe, expect, it} from 'vitest';
import {canonicalPath} from '../../app/content/recovery';
import {pages, validateInfoPages} from '../../app/content/recovery-pages';
import {getDemoPolicyPage} from '../../app/features/recovery/framework-data';
import {loader as sitemapLoader} from '../../app/routes/sitemap[.]xml';

describe('frontend support pages and sitemap', () => {
  it('exposes the demo terms while rejecting unrelated policy paths', () => {
    expect(getDemoPolicyPage('terms')).toBe('terms');
    expect(getDemoPolicyPage('privacy')).toBe('privacy');
    expect(getDemoPolicyPage('unknown')).toBeUndefined();
    expect(pages.contact.action?.href).toMatch(/^https:\/\//);
  });

  it('rejects an unsafe public contact action in maintained page data', () => {
    const invalid = structuredClone(pages);
    invalid.contact.action = {label: 'Contact', href: 'javascript:alert(1)'};
    expect(() => validateInfoPages(invalid)).toThrow('Invalid page action');
  });

  it('lists discoverable fixture pages and concepts without private routes', async () => {
    const response = await sitemapLoader({context: {settings: {
      canonicalOrigin: 'https://example.test', catalogSource: 'fixture',
    }}} as Parameters<typeof sitemapLoader>[0]);
    const xml = await response.text();
    expect(response.status).toBe(200);
    for (const path of ['/help', '/contact', '/policies/terms', '/collections/release',
      '/collections/move', '/collections/reset', '/products/pulse']) {
      expect(xml).toContain(`https://example.test${path}`);
    }
    expect(xml).not.toContain('/cart');
    expect(xml).not.toContain('/account');
  });

  it('gives valid public pages canonical paths and excludes private or unknown pages', () => {
    expect(canonicalPath('/help/')).toBe('/help');
    expect(canonicalPath('/collections/release')).toBe('/collections/release');
    expect(canonicalPath('/products/regenai-concept-pulse',
      {product: {handle: 'regenai-concept-pulse'}})).toBe('/products/regenai-concept-pulse');
    expect(canonicalPath('/products/unknown')).toBeNull();
    expect(canonicalPath('/cart')).toBeNull();
    expect(canonicalPath('/account')).toBeNull();
    expect(canonicalPath('/search')).toBeNull();
  });
});
