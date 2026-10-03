import {describe, expect, it} from 'vitest';
import type {ShopifyCatalogProduct} from '../../app/lib/shopify-catalog.server';
import {
  sandboxCartIsOwned,
  validateSandboxAdd,
  validateSandboxRemove,
  validateSandboxUpdate,
  validatedSandboxCheckoutUrl,
} from '../../app/lib/sandbox-cart.server';

const variantId = 'gid://shopify/ProductVariant/123';
const product: ShopifyCatalogProduct = {
  id: 'gid://shopify/Product/1', handle: 'regenai-concept-pulse',
  name: 'Pulse', description: '', kind: 'Recovery', availableForSale: true,
  image: {url: 'https://cdn.shopify.com/image.png', altText: null, width: 100, height: 100},
  images: [{url: 'https://cdn.shopify.com/image.png', altText: null, width: 100, height: 100}],
  options: [], complete: true,
  variants: [{id: variantId, title: 'Standard', availableForSale: true,
    selectedOptions: [], price: {amount: '10.00', currencyCode: 'USD'}}],
};
const limits = {maxLineQuantity: 4, maxTotalQuantity: 5, maxLines: 2};
const cart = (id = variantId, quantity = 1) => ({lines: {nodes: [{id: 'line-1', quantity,
  merchandise: {id}}]}});

describe('local Shopify sandbox cart authorization', () => {
  it('permits only one available, owned variant and bounded quantity', () => {
    expect(validateSandboxAdd([{merchandiseId: variantId, quantity: 2}], null, [product], limits))
      .toEqual([{merchandiseId: variantId, quantity: 2}]);
    expect(() => validateSandboxAdd([{merchandiseId: 'gid://shopify/ProductVariant/999', quantity: 1}],
      null, [product], limits)).toThrow('unavailable');
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 0}], null, [product], limits))
      .toThrow('Invalid');
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 1, attributes: []}],
      null, [product], limits)).toThrow('Invalid');
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 1},
      {merchandiseId: variantId, quantity: 1}], null, [product], limits)).toThrow('Invalid');
  });

  it('enforces existing line ownership and quantity caps', () => {
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 1}],
      cart('gid://shopify/ProductVariant/999'), [product], limits)).toThrow('non-sandbox');
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 2}],
      cart(variantId, 3), [product], limits)).toThrow('line quantity');
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 1}],
      cart(variantId, 5), [product], limits)).toThrow('line quantity');
    expect(sandboxCartIsOwned(cart(), [product])).toBe(true);
    expect(sandboxCartIsOwned(cart('gid://shopify/ProductVariant/999'), [product])).toBe(false);
    const soldOut = {...product, variants: [{...product.variants[0], availableForSale: false}]};
    expect(sandboxCartIsOwned(cart(), [soldOut])).toBe(true);
    expect(() => validateSandboxAdd([{merchandiseId: variantId, quantity: 1}],
      null, [soldOut], limits)).toThrow('unavailable');
  });

  it('removes only a line in the current cart', () => {
    expect(validateSandboxRemove(['line-1'], cart())).toEqual(['line-1']);
    expect(() => validateSandboxRemove(['line-2'], cart())).toThrow('Unknown');
    expect(() => validateSandboxRemove(['line-1', 'line-2'], cart())).toThrow('Invalid');
  });

  it('updates only an owned line within line and total quantity limits', () => {
    const secondVariant = 'gid://shopify/ProductVariant/124';
    const second = {...product, id: 'gid://shopify/Product/2',
      variants: [{...product.variants[0], id: secondVariant}]};
    const twoLineCart = {lines: {nodes: [
      {id: 'line-1', quantity: 2, merchandise: {id: variantId}},
      {id: 'line-2', quantity: 2, merchandise: {id: secondVariant}},
    ]}};
    expect(validateSandboxUpdate([{id: 'line-1', quantity: 3}], twoLineCart,
      [product, second], limits)).toEqual([{id: 'line-1', quantity: 3}]);
    expect(() => validateSandboxUpdate([{id: 'line-1', quantity: 4}], twoLineCart,
      [product, second], limits)).toThrow('quantity limit');
    expect(() => validateSandboxUpdate([{id: 'line-2', quantity: 1}], twoLineCart,
      [product], limits)).toThrow('non-sandbox');
    expect(() => validateSandboxUpdate([{id: 'line-3', quantity: 1}], twoLineCart,
      [product, second], limits)).toThrow('Unknown');
    for (const quantity of [0, 1.5, 5, '2']) {
      expect(() => validateSandboxUpdate([{id: 'line-1', quantity}], twoLineCart,
        [product, second], limits)).toThrow('Invalid');
    }
    expect(() => validateSandboxUpdate([{id: 'line-1', quantity: 1, merchandiseId: variantId}],
      twoLineCart, [product, second], limits)).toThrow('Invalid');
  });

  it('permits reducing a sold-out owned line but not increasing it', () => {
    const soldOut = {...product, variants: [{...product.variants[0], availableForSale: false}]};
    expect(validateSandboxUpdate([{id: 'line-1', quantity: 1}], cart(variantId, 2),
      [soldOut], limits)).toEqual([{id: 'line-1', quantity: 1}]);
    expect(() => validateSandboxUpdate([{id: 'line-1', quantity: 3}], cart(variantId, 2),
      [soldOut], limits)).toThrow('unavailable');
  });

  it('accepts checkout only at the exact configured HTTPS host', () => {
    expect(validatedSandboxCheckoutUrl('https://regenai.myshopify.com/checkouts/test',
      'regenai.myshopify.com')).toBe('https://regenai.myshopify.com/checkouts/test');
    expect(validatedSandboxCheckoutUrl('https://regenai.myshopify.com.evil.test/checkouts/test',
      'regenai.myshopify.com')).toBeNull();
    expect(validatedSandboxCheckoutUrl('http://regenai.myshopify.com/checkouts/test',
      'regenai.myshopify.com')).toBeNull();
    expect(validatedSandboxCheckoutUrl('https://user@regenai.myshopify.com/checkouts/test',
      'regenai.myshopify.com')).toBeNull();
  });
});
