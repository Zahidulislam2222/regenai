import {redirect, useLoaderData} from 'react-router';
import type {MetaFunction} from 'react-router';
import type {Route} from './+types/category';
import {getDesignCategoryByHandle, site} from '~/content/recovery';
import {ShopifyCatalogView} from '~/features/recovery/ShopifyCatalogViews';
import {getConceptEditorial, selectDesignCategoryProducts} from '~/lib/concept-editorial.server';
import {listShopifyProducts} from '~/lib/shopify-catalog.server';

export async function loader({context, params}: Route.LoaderArgs) {
  const category = getDesignCategoryByHandle(params.categoryHandle);
  if (!category) throw new Response('Design category not found', {status: 404});
  if (context.settings.catalogSource === 'fixture') {
    return redirect(`/collections/all?category=${encodeURIComponent(category)}`);
  }
  try {
    const products = selectDesignCategoryProducts(category, await listShopifyProducts(
      (document, options) => context.storefront.query(document, options),
      context.settings.catalog,
    ));
    return {category, products, sandboxCartEnabled: context.settings.sandboxCheckoutEnabled,
      concepts: Object.fromEntries(products.map((product) =>
      [product.id, getConceptEditorial(product)]))};
  } catch {
    throw new Response('Catalog temporarily unavailable', {status: 503});
  }
}

export const meta: MetaFunction = ({params}) => [
  {title: `${getDesignCategoryByHandle(params.categoryHandle) ?? site.designCategory.fallbackTitle} — RegenAI`},
  {name: 'description', content: site.demo},
];

export default function RecoveryCategoryRoute() {
  const data = useLoaderData<typeof loader>();
  return <ShopifyCatalogView products={data.products} concepts={data.concepts}
    categoryTitle={data.category} sandboxCartEnabled={data.sandboxCartEnabled} />;
}
