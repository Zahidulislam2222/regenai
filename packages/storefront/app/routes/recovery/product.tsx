import {useLoaderData} from 'react-router';
import {getDemoRecoveryProduct} from '~/features/recovery/framework-data';
import {ProductDetailView} from '~/features/recovery/Experience';
import {useRecoveryRouteMotion} from '~/features/recovery/route-motion';
import {RecoveryRouteErrorBoundary} from './error';
import {getShopifyProduct, listShopifyProducts} from '~/lib/shopify-catalog.server';
import {getConceptEditorial, selectRelatedConcepts} from '~/lib/concept-editorial.server';
import type {ShopifyCatalogProduct} from '~/lib/shopify-catalog.server';
import {ShopifyProductView} from '~/features/recovery/ShopifyCatalogViews';
import type {Route} from './+types/product';

export {RecoveryRouteErrorBoundary as ErrorBoundary};

export async function loader({params, context}: Route.LoaderArgs) {
  if (context.settings.catalogSource === 'shopify') {
    let product;
    try {
      product = await getShopifyProduct(
        (document, options) => context.storefront.query(document, options),
        params.handle,
        context.settings.catalog,
      );
    } catch {
      throw new Response('Product temporarily unavailable', {status: 503});
    }
    if (!product) throw new Response(null, {status: 404});
    let related: ShopifyCatalogProduct[] = [];
    try {
      const products = await listShopifyProducts(
        (document, options) => context.storefront.query(document, options),
        context.settings.catalog,
      );
      related = selectRelatedConcepts(product, products);
    } catch {
      // Related concepts are optional; a catalog page failure must not hide this valid product.
    }
    return {source: 'shopify' as const, product,
      related, concept: getConceptEditorial(product),
      sandboxCartEnabled: context.settings.sandboxCheckoutEnabled};
  }
  const product = getDemoRecoveryProduct(params.handle);
  if (!product) throw new Response(null, {status: 404});
  return {source: 'fixture' as const, product};
}

export const meta: Route.MetaFunction = ({data}) => [
  {title: data ? `${data.product.name} — RegenAI` : 'Product design — RegenAI'},
  {name: 'description', content: (data?.source === 'shopify' && data.concept
    ? data.concept.summary : data?.product.description) ?? 'An original recovery-object design study.'},
];

export default function RecoveryProductRoute() {
  const data = useLoaderData<typeof loader>();
  const {paused} = useRecoveryRouteMotion();
  return data.source === 'shopify'
    ? <ShopifyProductView key={data.product.id} product={data.product}
      related={data.related} concept={data.concept}
      sandboxCartEnabled={data.sandboxCartEnabled} />
    : <ProductDetailView key={data.product.id} product={data.product} paused={paused} />;
}
