import type {Route} from './+types/sitemap[.]xml';
import {designCategoryPaths, indexableStaticPaths, journalPaths, products as fixtureProducts} from '~/content/recovery';
import {listShopifyProducts} from '~/lib/shopify-catalog.server';

export async function loader({context}: Route.LoaderArgs) {
  const origin = context.settings.canonicalOrigin;
  let productHandles: string[];
  if (context.settings.catalogSource === 'shopify') {
    try {
      const catalog = await listShopifyProducts(
        (document, options) => context.storefront.query(document, options), context.settings.catalog);
      productHandles = catalog.map((product) => product.handle);
    } catch {
      throw new Response('Sitemap temporarily unavailable', {status: 503});
    }
  } else {
    productHandles = fixtureProducts.map((product) => product.id);
  }
  const paths = [
    ...indexableStaticPaths,
    ...designCategoryPaths(),
    ...productHandles.map((handle) => `/products/${handle}`),
    ...journalPaths(),
  ];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, origin).toString().replaceAll('&', '&amp;')}</loc></url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    {headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600'}},
  );
}
