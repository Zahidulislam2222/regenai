import {data, useLoaderData} from 'react-router';
import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import type {Route} from './+types/collections.$handle';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {BodyAreaSelector} from '~/components/BodyAreaSelector';
import {PlpFilters} from '~/components/commerce/PlpFilters';
import {PlpGrid, type PlpGridProps} from '~/components/commerce/PlpGrid';
import {JsonLd, breadcrumbSchema} from '~/lib/seo/jsonld';

type PlpProduct = PlpGridProps['products'][number];

export const meta = ({data}: Route.MetaArgs) => {
  if (!data?.collection) return [{title: 'Collection — RegenAI'}];
  return [
    {title: `${data.collection.title} — RegenAI`},
    {name: 'description', content: data.collection.description ?? ''},
    {property: 'og:title', content: data.collection.title},
    {property: 'og:type', content: 'website'},
  ];
};

export async function loader({request, params, context}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Collection handle required', {status: 400});

  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection "${handle}" not found`, {status: 404});
  }

  return data({collection});
}

export default function CollectionRoute() {
  const {collection} = useLoaderData<typeof loader>();
  const products: PlpProduct[] = collection.products.nodes.map((p: any): PlpProduct => {
    const firstVariant = p.variants?.nodes?.[0];
    const firstImage = p.featuredImage ?? p.images?.nodes?.[0];
    return {
      handle: p.handle,
      title: p.title,
      priceDisplay: firstVariant
        ? formatMoney(firstVariant.price.amount, firstVariant.price.currencyCode)
        : '—',
      compareAtDisplay: firstVariant?.compareAtPrice
        ? formatMoney(
            firstVariant.compareAtPrice.amount,
            firstVariant.compareAtPrice.currencyCode,
          )
        : undefined,
      imageSrc: firstImage?.url ?? '',
      imageAlt: firstImage?.altText ?? p.title,
      availability: firstVariant?.availableForSale ? 'in_stock' : 'out_of_stock',
      description: '',
      variants: firstVariant
        ? [{id: firstVariant.id, label: 'Default', available: !!firstVariant.availableForSale}]
        : [],
    };
  });

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          {name: 'Home', url: 'https://regenai.com'},
          {name: 'Shop', url: 'https://regenai.com/collections'},
          {name: collection.title, url: `https://regenai.com/collections/${collection.handle}`},
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            {name: 'Home', href: '/'},
            {name: 'Shop', href: '/collections'},
            {name: collection.title, href: `/collections/${collection.handle}`},
          ]}
        />
        <header className="mt-4 mb-8">
          <h1 className="text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
            {collection.title}
          </h1>
          {collection.description ? (
            <p className="mt-3 max-w-3xl text-[var(--text-subtle)]">{collection.description}</p>
          ) : null}
        </header>
        <div className="mb-8">
          <BodyAreaSelector />
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PlpFilters />
          </aside>
          <section aria-label="Products">
            <PlpGrid products={products} />
          </section>
        </div>
      </div>
      <Analytics.CollectionView
        data={{
          collection: {id: collection.id, handle: collection.handle},
        }}
      />
    </>
  );
}

function formatMoney(amount: string, currency: string) {
  const n = Number(amount);
  return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(n);
}

const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCardItem on Product {
    id
    handle
    title
    featuredImage { url altText }
    images(first: 1) { nodes { url altText } }
    variants(first: 1) {
      nodes {
        id
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
      ) {
        nodes {
          ...ProductCardItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;
