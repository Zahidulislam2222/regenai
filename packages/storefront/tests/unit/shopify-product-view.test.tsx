import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {describe, expect, it} from 'vitest';
import {ShopifyProductView} from '../../app/features/recovery/ShopifyCatalogViews';
import type {ShopifyCatalogProduct} from '../../app/lib/shopify-catalog.server';

const product: ShopifyCatalogProduct = {
  id: 'gid://shopify/Product/101',
  handle: 'regenai-concept-pulse',
  name: 'Pulse One',
  description: 'Illustrative product concept.',
  kind: 'Recovery concept',
  availableForSale: false,
  image: {url: 'https://images.example.test/first.png', altText: 'First render', width: 800, height: 800},
  images: [
    {url: 'https://images.example.test/first.png', altText: 'First render', width: 800, height: 800},
    {url: 'https://images.example.test/second.png', altText: 'Second render', width: 800, height: 800},
  ],
  options: [{name: 'Kit', values: ['Core']}],
  variants: [{id: 'gid://shopify/ProductVariant/201', title: 'Core', availableForSale: false,
    selectedOptions: [{name: 'Kit', value: 'Core'}], price: {amount: '49.00', currencyCode: 'USD'}}],
  complete: true,
};

describe('Shopify concept product page', () => {
  it('selects available media and preserves the closed-commerce design disclosure', () => {
    render(<MemoryRouter><ShopifyProductView product={product} related={[]} sandboxCartEnabled={false}
      concept={{summary: 'Illustrative product concept.', detail: 'An original form study.',
        notice: 'Not manufactured or available for sale.', category: 'Release', specs: [
        {label: 'Status', value: 'Illustrative product; not for sale'},
      ]}} /></MemoryRouter>);
    expect(screen.getByRole('img', {name: 'First render'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'View image 2 of 2'}));
    expect(screen.getByRole('img', {name: 'Second render'})).toBeTruthy();
    expect(screen.getByText('Illustrative product; not for sale')).toBeTruthy();
    expect(screen.getByText('Can I place an order now?')).toBeTruthy();
    expect(screen.queryByText('How are finder results chosen?')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Add to sandbox cart'})).toBeNull();
  });
});
