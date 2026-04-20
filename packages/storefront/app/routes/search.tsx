import {data, type LoaderFunctionArgs, type MetaFunction, useLoaderData} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {
  getEmptyPredictiveSearchResult,
  type PredictiveSearchReturn,
  type RegularSearchReturn,
} from '~/lib/search';

export const meta: MetaFunction = () => [
  {title: 'Search — RegenAI'},
  {name: 'description', content: 'Search RegenAI products, protocols, and clinical content.'},
];

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.get('predictive') === 'true';
  const term = (url.searchParams.get('q') ?? '').trim();

  if (isPredictive) {
    const result = await predictiveSearch({request, context, term});
    return data(result);
  }

  const result = await regularSearch({request, context, term});
  return data(result);
}

export default function SearchRoute() {
  const result = useLoaderData<typeof loader>();

  if (result.type === 'predictive') {
    // Predictive fetch is consumed by the header fetcher; the route itself
    // rarely renders. Redirect users to the regular page instead.
    return null;
  }

  const hasResults =
    result.type === 'regular' && Object.values(result.result.items).some((list) =>
      Array.isArray(list) ? list.length > 0 : false,
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Search
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          {result.term
            ? <>Results for <strong>{result.term}</strong></>
            : 'Start typing in the header search to find products, protocols, and articles.'}
        </p>
      </header>

      {result.error ? (
        <div role="alert" className="rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-4 text-sm">
          {result.error}
        </div>
      ) : null}

      {!hasResults && result.term ? (
        <p className="text-[var(--text-secondary)]">
          No results for &ldquo;{result.term}&rdquo;. Try a broader term or browse by body area.
        </p>
      ) : null}

      <Analytics.SearchView data={{searchTerm: result.term ?? '', searchResults: result}} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regular search (full-page results)
// ---------------------------------------------------------------------------
async function regularSearch({
  request,
  context,
  term,
}: {
  request: Request;
  context: LoaderFunctionArgs['context'];
  term: string;
}): Promise<RegularSearchReturn> {
  if (!term) {
    return {type: 'regular', term: '', result: {total: 0, items: {}} as RegularSearchReturn['result']};
  }
  const {storefront} = context;
  const variables = getPaginationVariables(request, {pageBy: 24});
  try {
    const {products, articles, pages} = await storefront.query(REGULAR_SEARCH_QUERY, {
      variables: {term, ...variables},
    });
    const total = (products?.nodes?.length ?? 0) + (articles?.nodes?.length ?? 0) + (pages?.nodes?.length ?? 0);
    return {
      type: 'regular',
      term,
      result: {total, items: {products, articles, pages}} as RegularSearchReturn['result'],
    };
  } catch (err) {
    return {
      type: 'regular',
      term,
      error: err instanceof Error ? err.message : 'Search failed',
      result: {total: 0, items: {}} as RegularSearchReturn['result'],
    };
  }
}

// ---------------------------------------------------------------------------
// Predictive search (header dropdown)
// ---------------------------------------------------------------------------
async function predictiveSearch({
  request,
  context,
  term,
}: {
  request: Request;
  context: LoaderFunctionArgs['context'];
  term: string;
}): Promise<PredictiveSearchReturn> {
  const empty = getEmptyPredictiveSearchResult();
  if (!term) {
    return {type: 'predictive', term: '', result: {total: 0, items: empty.items}};
  }

  const limit = Number(new URL(request.url).searchParams.get('limit') ?? '5');
  const {storefront} = context;

  try {
    const {predictiveSearch: res} = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {term, limit},
    });
    if (!res) {
      return {type: 'predictive', term, result: {total: 0, items: empty.items}};
    }
    const total =
      (res.products?.length ?? 0) +
      (res.collections?.length ?? 0) +
      (res.pages?.length ?? 0) +
      (res.articles?.length ?? 0) +
      (res.queries?.length ?? 0);
    return {type: 'predictive', term, result: {total, items: res}};
  } catch (err) {
    return {
      type: 'predictive',
      term,
      error: err instanceof Error ? err.message : 'Predictive search failed',
      result: {total: 0, items: empty.items},
    };
  }
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $term: String!
    $limit: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $term
      limit: $limit
      types: [PRODUCT, COLLECTION, PAGE, ARTICLE, QUERY]
      limitScope: EACH
    ) {
      products {
        id
        title
        handle
        trackingParameters
        featuredImage { url altText width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
      collections {
        id
        title
        handle
        trackingParameters
        image { url altText }
      }
      pages {
        id
        title
        handle
        trackingParameters
      }
      articles {
        id
        title
        handle
        trackingParameters
        image { url altText }
      }
      queries {
        text
        trackingParameters
      }
    }
  }
` as const;

const REGULAR_SEARCH_QUERY = `#graphql
  query RegularSearch(
    $term: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term
      types: [PRODUCT]
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
    ) {
      nodes {
        ... on Product {
          id
          title
          handle
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
    articles: search(query: $term, types: [ARTICLE], first: 10) {
      nodes {
        ... on Article {
          id
          title
          handle
          blog { handle }
        }
      }
    }
    pages: search(query: $term, types: [PAGE], first: 10) {
      nodes {
        ... on Page {
          id
          title
          handle
        }
      }
    }
  }
` as const;
