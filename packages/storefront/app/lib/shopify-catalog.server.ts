import seedConfig from '../../../../scripts/catalog-seed/seed-config.json';

export type CatalogImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type CatalogVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {name: string; value: string}[];
  price: {amount: string; currencyCode: string} | null;
};

export type ShopifyCatalogProduct = {
  id: string;
  handle: string;
  name: string;
  description: string;
  kind: string;
  availableForSale: boolean;
  image: CatalogImage | null;
  images: CatalogImage[];
  options: {name: string; values: string[]}[];
  variants: CatalogVariant[];
  complete: boolean;
};

type CatalogLimits = {pageSize: number; maxPages: number; variantLimit: number; imageLimit: number};
type CatalogQuery = (document: string, options: {variables: Record<string, unknown>}) => Promise<unknown>;

const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  productType
  tags
  availableForSale
  featuredImage { url altText width height }
  options { name values }
  variants(first: $variantLimit) {
    nodes {
      id
      title
      availableForSale
      selectedOptions { name value }
      price { amount currencyCode }
    }
    pageInfo { hasNextPage }
  }
`;

const CATALOG_QUERY = `#graphql
  query RegenaiCatalog($first: Int!, $after: String, $variantLimit: Int!) {
    products(first: $first, after: $after) {
      nodes { ${PRODUCT_FIELDS} }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const PRODUCT_QUERY = `#graphql
  query RegenaiProduct($handle: String!, $variantLimit: Int!, $imageLimit: Int!) {
    product(handle: $handle) {
      ${PRODUCT_FIELDS}
      images(first: $imageLimit) {
        nodes { url altText width height }
        pageInfo { hasNextPage }
      }
    }
  }
`;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function image(value: unknown): CatalogImage | null {
  const source = record(value);
  if (!source || typeof source.url !== 'string') return null;
  try {
    if (new URL(source.url).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return {
    url: source.url,
    altText: typeof source.altText === 'string' ? source.altText : null,
    width: Number.isSafeInteger(source.width) && Number(source.width) > 0 ? Number(source.width) : null,
    height: Number.isSafeInteger(source.height) && Number(source.height) > 0 ? Number(source.height) : null,
  };
}

function variant(value: unknown): CatalogVariant | null {
  const source = record(value);
  if (!source || typeof source.id !== 'string' || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(source.id)) return null;
  const money = record(source.price);
  const amount = money?.amount;
  const currencyCode = money?.currencyCode;
  const price = typeof amount === 'string' && /^\d+(?:\.\d+)?$/.test(amount) &&
    Number.isFinite(Number(amount)) && typeof currencyCode === 'string' && /^[A-Z]{3}$/.test(currencyCode)
    ? {amount, currencyCode} : null;
  const selectedOptions = Array.isArray(source.selectedOptions)
    ? source.selectedOptions.flatMap((option) => {
        const item = record(option);
        return item && typeof item.name === 'string' && typeof item.value === 'string'
          ? [{name: item.name, value: item.value}] : [];
      })
    : [];
  return {
    id: source.id,
    title: typeof source.title === 'string' ? source.title : '',
    availableForSale: source.availableForSale === true,
    selectedOptions,
    price,
  };
}

/** Returns null for products outside this project's Shopify ownership namespace. */
export function mapShopifyProduct(value: unknown): ShopifyCatalogProduct | null {
  const source = record(value);
  if (!source || typeof source.id !== 'string' || !/^gid:\/\/shopify\/Product\/\d+$/.test(source.id) ||
    typeof source.handle !== 'string' || !source.handle.startsWith(seedConfig.handlePrefix) ||
    !Array.isArray(source.tags) || !source.tags.includes(seedConfig.tags[0]) ||
    typeof source.title !== 'string' || !source.title.trim()) return null;
  const connection = record(source.variants);
  const variants = Array.isArray(connection?.nodes)
    ? connection.nodes.flatMap((item) => {
        const mapped = variant(item);
        return mapped ? [mapped] : [];
      })
    : [];
  const options = Array.isArray(source.options)
    ? source.options.flatMap((value) => {
        const item = record(value);
        return item && typeof item.name === 'string' && Array.isArray(item.values)
          ? [{name: item.name, values: item.values.filter((v): v is string => typeof v === 'string')}]
          : [];
      })
    : [];
  const featuredImage = image(source.featuredImage);
  const imageNodes = record(source.images)?.nodes;
  const images = [featuredImage, ...(Array.isArray(imageNodes) ? imageNodes.map(image) : [])]
    .filter((value): value is CatalogImage => value !== null)
    .filter((value, index, values) => values.findIndex((other) => other.url === value.url) === index);
  return {
    id: source.id,
    handle: source.handle,
    name: source.title,
    description: typeof source.description === 'string' ? source.description : '',
    kind: typeof source.productType === 'string' ? source.productType : '',
    availableForSale: source.availableForSale === true,
    image: featuredImage,
    images,
    options,
    variants,
    complete: Boolean(featuredImage && variants.length > 0 && Array.isArray(connection?.nodes) &&
      variants.length === connection.nodes.length && variants.every((item) => item.price) &&
      record(connection?.pageInfo)?.hasNextPage === false),
  };
}

export async function listShopifyProducts(query: CatalogQuery, limits: CatalogLimits): Promise<ShopifyCatalogProduct[]> {
  const products: ShopifyCatalogProduct[] = [];
  const seenIds = new Set<string>();
  const seenCursors = new Set<string>();
  let after: string | null = null;
  for (let page = 0; page < limits.maxPages; page += 1) {
    const response = record(await query(CATALOG_QUERY, {
      variables: {first: limits.pageSize, after, variantLimit: limits.variantLimit},
    }));
    const connection = record(response?.products);
    const pageInfo = record(connection?.pageInfo);
    if (!connection || !Array.isArray(connection.nodes) || !pageInfo || typeof pageInfo.hasNextPage !== 'boolean') {
      throw new Error('Invalid Shopify catalog response');
    }
    for (const node of connection.nodes) {
      const product = mapShopifyProduct(node);
      if (!product) continue;
      if (seenIds.has(product.id)) throw new Error('Duplicate Shopify product');
      seenIds.add(product.id);
      products.push(product);
    }
    if (!pageInfo.hasNextPage) return products;
    if (typeof pageInfo.endCursor !== 'string' || !pageInfo.endCursor || seenCursors.has(pageInfo.endCursor)) {
      throw new Error('Invalid Shopify catalog cursor');
    }
    after = pageInfo.endCursor;
    seenCursors.add(after);
  }
  throw new Error('Shopify catalog exceeded configured page limit');
}

export async function getShopifyProduct(query: CatalogQuery, handle: string | undefined, limits: CatalogLimits): Promise<ShopifyCatalogProduct | null> {
  if (!handle || !handle.startsWith(seedConfig.handlePrefix) || !/^[a-z0-9-]+$/.test(handle)) return null;
  const response = record(await query(PRODUCT_QUERY, {variables: {
    handle, variantLimit: limits.variantLimit, imageLimit: limits.imageLimit,
  }}));
  if (!response || !Object.hasOwn(response, 'product')) throw new Error('Invalid Shopify product response');
  const product = mapShopifyProduct(response.product);
  return product?.handle === handle ? product : null;
}
