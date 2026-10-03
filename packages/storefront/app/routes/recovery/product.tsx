import {useLoaderData} from 'react-router';
import {getDemoRecoveryProduct} from '~/features/recovery/framework-data';
import {ProductDetailView} from '~/features/recovery/Experience';
import {useRecoveryRouteMotion} from '~/features/recovery/route-motion';
import {RecoveryRouteErrorBoundary} from './error';
import {getShopifyProduct} from '~/lib/shopify-catalog.server';
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
    return {source: 'shopify' as const, product};
  }
  const product = getDemoRecoveryProduct(params.handle);
  if (!product) throw new Response(null, {status: 404});
  return {source: 'fixture' as const, product};
}

export const meta: Route.MetaFunction = ({data}) => [
  {title: data ? `${data.product.name} — RegenAI` : 'Product design — RegenAI'},
  {name: 'description', content: data?.product.description ?? 'An original recovery-object design study.'},
];

export default function RecoveryProductRoute() {
  const data = useLoaderData<typeof loader>();
  const {paused} = useRecoveryRouteMotion();
  return data.source === 'shopify'
    ? <ShopifyProductView key={data.product.id} product={data.product} />
    : <ProductDetailView key={data.product.id} product={data.product} paused={paused} />;
}
