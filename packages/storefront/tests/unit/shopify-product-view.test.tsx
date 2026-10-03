import {fireEvent, render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {describe, expect, it} from 'vitest';
import {ShopifyCatalogView, ShopifyProductView} from '../../app/features/recovery/ShopifyCatalogViews';
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
  it('describes an empty verified design category accurately', () => {
    render(<MemoryRouter><ShopifyCatalogView products={[]} categoryTitle="Reset" /></MemoryRouter>);
    expect(screen.getByRole('heading', {name: 'Reset concepts.'})).toBeTruthy();
    expect(screen.getByText('No verified concepts are available in this design category yet.')).toBeTruthy();
    expect(screen.getByRole('link', {name: 'All tools'}).getAttribute('href')).toBe('/collections/all');
  });

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

  it('compares Shopify facts and validated concept details across collection filters', () => {
    const balls = {...product, id: 'gid://shopify/Product/102', handle: 'regenai-concept-balls',
      name: 'Point Duo', kind: 'Mobility balls'};
    const roller = {...product, id: 'gid://shopify/Product/103', handle: 'regenai-concept-roller',
      name: 'Form Roller', kind: 'Mobility roller'};
    render(<MemoryRouter><ShopifyCatalogView products={[product, balls, roller]} concepts={{
      [product.id]: {summary: 'Study', detail: 'Study detail', notice: 'Unverified', category: 'Release',
        specs: [{label: 'Design', value: 'Handheld concept'}]},
      [balls.id]: null,
      [roller.id]: null,
    }} /></MemoryRouter>);
    const select = screen.getAllByRole('button', {name: 'Compare concept'});
    fireEvent.click(select[0]);
    fireEvent.click(select[1]);
    const table = within(screen.getByRole('region', {name: 'Compare the concepts'}));
    expect(table.getByText('Pulse One')).toBeTruthy();
    expect(table.getByText('Point Duo')).toBeTruthy();
    expect(table.getByText('Handheld concept')).toBeTruthy();
    expect(table.getAllByText('Not verified').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', {name: 'Compare concept'}).hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByRole('searchbox', {name: 'Search products'}),
      {target: {value: 'no match'}});
    expect(within(screen.getByRole('region', {name: 'Compare the concepts'})).getByText('Point Duo')).toBeTruthy();
    fireEvent.click(table.getByRole('button', {name: 'Remove from comparison: Pulse One'}));
    expect(table.queryByText('Pulse One')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Add to sandbox cart'})).toBeNull();
  });
});
