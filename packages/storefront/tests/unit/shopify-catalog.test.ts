import {describe, expect, it, vi} from 'vitest';
import {getShopifyProduct, listShopifyProducts, mapShopifyProduct} from '../../app/lib/shopify-catalog.server';

const limits = {pageSize: 2, maxPages: 3, variantLimit: 10, imageLimit: 8, imageMaxWidth: 800};
const ownedProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'gid://shopify/Product/101',
  handle: 'regenai-concept-pulse',
  title: 'Pulse One',
  description: 'Illustrative product concept.',
  productType: 'Recovery tool',
  tags: ['regenai-concept', 'not-for-sale-demo'],
  availableForSale: false,
  featuredImage: {url: 'https://cdn.shopify.com/test.png', altText: 'Pulse render', width: 1200, height: 1200},
  images: {nodes: [
    {url: 'https://cdn.shopify.com/test.png', altText: 'Pulse render', width: 1200, height: 1200},
    {url: 'https://cdn.shopify.com/alternate.png', altText: 'Alternate render', width: 900, height: 900},
    {url: 'http://example.test/invalid.png', altText: 'Untrusted image', width: 900, height: 900},
  ], pageInfo: {hasNextPage: false}},
  options: [{name: 'Kit', values: ['Core']}],
  variants: {nodes: [{
    id: 'gid://shopify/ProductVariant/201',
    title: 'Core',
    availableForSale: false,
    selectedOptions: [{name: 'Kit', value: 'Core'}],
    price: {amount: '49.00', currencyCode: 'USD'},
  }], pageInfo: {hasNextPage: false}},
  ...overrides,
});

describe('Shopify catalog ownership and mapping', () => {
  it('maps authoritative IDs, options, MoneyV2, stock, and image fields', () => {
    const product = mapShopifyProduct(ownedProduct());
    expect(product).toMatchObject({
      id: 'gid://shopify/Product/101',
      handle: 'regenai-concept-pulse',
      name: 'Pulse One',
      availableForSale: false,
      image: {url: 'https://cdn.shopify.com/test.png', altText: 'Pulse render', width: 1200, height: 1200},
      images: [
        {url: 'https://cdn.shopify.com/test.png', altText: 'Pulse render', width: 1200, height: 1200},
        {url: 'https://cdn.shopify.com/alternate.png', altText: 'Alternate render', width: 900, height: 900},
      ],
      options: [{name: 'Kit', values: ['Core']}],
      variants: [{id: 'gid://shopify/ProductVariant/201', availableForSale: false,
        selectedOptions: [{name: 'Kit', value: 'Core'}], price: {amount: '49.00', currencyCode: 'USD'}}],
      complete: true,
    });
    expect(mapShopifyProduct(ownedProduct({tags: []}))).toBeNull();
    expect(mapShopifyProduct(ownedProduct({handle: 'sample-pulse'}))).toBeNull();
  });

  it('preserves unavailable state when media, variants, or price are missing', () => {
    expect(mapShopifyProduct(ownedProduct({featuredImage: null}))?.complete).toBe(false);
    expect(mapShopifyProduct(ownedProduct({variants: {nodes: [], pageInfo: {hasNextPage: false}}}))?.variants).toEqual([]);
    expect(mapShopifyProduct(ownedProduct({variants: {nodes: [
      ownedProduct().variants.nodes[0], {id: 'invalid-variant'},
    ], pageInfo: {hasNextPage: false}}}))?.complete).toBe(false);
    expect(mapShopifyProduct(ownedProduct({variants: {nodes: [{
      id: 'gid://shopify/ProductVariant/201', availableForSale: true, price: null,
    }], pageInfo: {hasNextPage: false}}}))?.variants[0].price).toBeNull();
    expect(mapShopifyProduct(ownedProduct({variants: {nodes: [{
      id: 'gid://shopify/ProductVariant/201', price: {amount: '49.00', currencyCode: 'USD'},
    }], pageInfo: {hasNextPage: true}}}))?.complete).toBe(false);
  });

  it('paginates to completion and excludes unrelated products', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({products: {nodes: [ownedProduct(), ownedProduct({id: 'gid://shopify/Product/102', handle: 'sample'})],
        pageInfo: {hasNextPage: true, endCursor: 'cursor-1'}}})
      .mockResolvedValueOnce({products: {nodes: [ownedProduct({id: 'gid://shopify/Product/103', handle: 'regenai-concept-roller'})],
        pageInfo: {hasNextPage: false, endCursor: null}}});
    const products = await listShopifyProducts(query, limits);
    expect(products.map((product) => product.handle)).toEqual(['regenai-concept-pulse', 'regenai-concept-roller']);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][1].variables.after).toBe('cursor-1');
  });

  it('rejects incomplete pagination and never falls back to fixture data', async () => {
    const query = vi.fn().mockResolvedValue({products: {nodes: [], pageInfo: {hasNextPage: true, endCursor: 'same'}}});
    await expect(listShopifyProducts(query, limits)).rejects.toHaveProperty('message', expect.stringContaining('Invalid Shopify catalog cursor'));
    await expect(listShopifyProducts(async () => {throw new Error('API unavailable');}, limits)).rejects.toHaveProperty('message', expect.stringContaining('API unavailable'));
  });

  it('limits direct lookup to owned handles and respects missing Shopify products', async () => {
    const query = vi.fn().mockResolvedValue({product: null});
    await expect(getShopifyProduct(query, 'sample-pulse', limits)).resolves.toBeNull();
    expect(query).not.toHaveBeenCalled();
    await expect(getShopifyProduct(query, 'regenai-concept-pulse', limits)).resolves.toBeNull();
    query.mockResolvedValue({product: ownedProduct({tags: []})});
    await expect(getShopifyProduct(query, 'regenai-concept-pulse', limits)).resolves.toBeNull();
    query.mockResolvedValue({product: ownedProduct()});
    await expect(getShopifyProduct(query, 'regenai-concept-pulse', limits)).resolves.toMatchObject({name: 'Pulse One'});
    expect(query.mock.lastCall?.[0]).toContain('images(first: $imageLimit)');
    expect(query.mock.lastCall?.[0]).toContain('preferredContentType: WEBP');
    expect(query.mock.lastCall?.[1].variables.imageLimit).toBe(8);
    expect(query.mock.lastCall?.[1].variables.imageMaxWidth).toBe(800);
  });
});
