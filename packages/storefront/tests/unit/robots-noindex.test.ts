import {describe, expect, it} from 'vitest';
import {meta as cartMeta} from '../../app/routes/cart';
import {meta as styleguideMeta} from '../../app/routes/pages.styleguide';
import {loader as robotsLoader} from '../../app/routes/robots[.]txt';

describe('crawler controls for private and noindex pages', () => {
  it('lets crawlers read noindex while keeping account and checkout paths blocked', async () => {
    const response = robotsLoader({context: {settings: {
      canonicalOrigin: 'https://example.test',
    }}} as Parameters<typeof robotsLoader>[0]);
    const lines = (await response.text()).split('\n');
    expect(lines).toContain('Sitemap: https://example.test/sitemap.xml');
    expect(lines).toContain('Disallow: /account');
    expect(lines).toContain('Disallow: /checkouts/');
    expect(lines).not.toContain('Disallow: /cart');
    expect(lines).not.toContain('Disallow: /pages/styleguide');
    for (const meta of [cartMeta, styleguideMeta]) {
      const tags = meta({} as Parameters<typeof meta>[0]);
      expect(tags).toContainEqual({name: 'robots', content: 'noindex, nofollow'});
    }
  });
});
