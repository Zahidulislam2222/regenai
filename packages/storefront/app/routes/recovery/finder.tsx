import {useLoaderData, type MetaFunction} from 'react-router';
import {FinderView} from '~/features/recovery/Experience';
import {ShopifyFinderView} from '~/features/recovery/ShopifyCatalogViews';
import {listShopifyProducts} from '~/lib/shopify-catalog.server';
import {site} from '~/content/recovery';
import type {Route} from './+types/finder';

export async function loader({context}: Route.LoaderArgs) {
  if (context.settings.catalogSource === 'fixture') return {source: 'fixture' as const};
  try {
    const products = await listShopifyProducts(
      (document, options) => context.storefront.query(document, options),
      context.settings.catalog,
    );
    return {source: 'shopify' as const, products};
  } catch {
    throw new Response('Finder temporarily unavailable', {status: 503});
  }
}

export const meta: MetaFunction = () => [
  {title: 'Recovery finder — RegenAI'},
  {name: 'description', content: site.finder.intro},
];

export default function RecoveryFinderRoute() {
  const data = useLoaderData<typeof loader>();
  return data.source === 'shopify'
    ? <ShopifyFinderView products={data.products} />
    : <FinderView />;
}
