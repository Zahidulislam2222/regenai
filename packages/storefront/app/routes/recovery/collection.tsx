import type {MetaFunction, ShouldRevalidateFunction} from 'react-router';
import {site} from '~/content/recovery';
import {RecoveryCatalogView} from './catalog-view';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/collection';
import {listShopifyProducts} from '~/lib/shopify-catalog.server';
import {ShopifyCatalogView} from '~/features/recovery/ShopifyCatalogViews';
import {getConceptEditorial} from '~/lib/concept-editorial.server';
import {shouldRevalidateCatalog} from '~/lib/catalog-revalidation';

export const shouldRevalidate: ShouldRevalidateFunction = shouldRevalidateCatalog;

export async function loader({context}: Route.LoaderArgs) {
  if (context.settings.catalogSource === 'fixture') return {source: 'fixture' as const};
  try {
    const products = await listShopifyProducts(
      (document, options) => context.storefront.query(document, options),
      context.settings.catalog,
    );
    return {source: 'shopify' as const, products,
      sandboxCartEnabled: context.settings.sandboxCheckoutEnabled,
      concepts: Object.fromEntries(products.map((product) => [product.id, getConceptEditorial(product)]))};
  } catch {
    throw new Response('Catalog temporarily unavailable', {status: 503});
  }
}

export const meta: MetaFunction = () => [
  {title: 'The collection — RegenAI'},
  {name: 'description', content: site.demo},
];

export default function RecoveryCollectionRoute() {
  const data = useLoaderData<typeof loader>();
  return data.source === 'shopify'
    ? <ShopifyCatalogView products={data.products} concepts={data.concepts}
      sandboxCartEnabled={data.sandboxCartEnabled} />
    : <RecoveryCatalogView />;
}
