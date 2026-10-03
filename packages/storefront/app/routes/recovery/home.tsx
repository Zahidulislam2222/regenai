import type {MetaFunction} from 'react-router';
import {site} from '~/content/recovery';
import {HomeView} from '~/features/recovery/Experience';
import {useRecoveryRouteMotion} from '~/features/recovery/route-motion';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/home';
import {listShopifyProducts} from '~/lib/shopify-catalog.server';
import {ShopifyHomeView} from '~/features/recovery/ShopifyCatalogViews';

export async function loader({context}: Route.LoaderArgs) {
  if (context.settings.catalogSource === 'fixture') return {source: 'fixture' as const};
  try {
    const products = await listShopifyProducts(
      (document, options) => context.storefront.query(document, options),
      context.settings.catalog,
    );
    return {source: 'shopify' as const, products};
  } catch {
    throw new Response('Catalog temporarily unavailable', {status: 503});
  }
}

export const meta: MetaFunction = () => [
  {title: 'Make room for recovery — RegenAI'},
  {name: 'description', content: site.demo},
];

export default function RecoveryHomeRoute() {
  const data = useLoaderData<typeof loader>();
  const {paused} = useRecoveryRouteMotion();
  return data.source === 'shopify'
    ? <ShopifyHomeView products={data.products} />
    : <HomeView paused={paused} />;
}
