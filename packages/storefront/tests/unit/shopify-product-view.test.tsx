import {fireEvent, render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {describe, expect, it} from 'vitest';
import {ShopifyCatalogView, ShopifyHomeView, ShopifyProductView} from '../../app/features/recovery/ShopifyCatalogViews';
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
  it('links the paused Pulse inspection to its validated Shopify route and shows the poster', () => {
    const view = render(<MemoryRouter><ShopifyHomeView products={[product]}
      sceneProduct={product} paused /></MemoryRouter>);
    expect(view.container.querySelectorAll('.scene-poster').length).toBe(2);
    expect([...view.container.querySelectorAll<HTMLImageElement>('.scene-poster')]
      .every((image) => image.getAttribute('src') === product.image?.url)).toBe(true);
    expect(view.container.querySelector('.inspection-static')).toBeTruthy();
    expect(view.container.querySelectorAll('.inspection-step').length).toBe(3);
    expect(view.container.querySelector('.inspection-content > .text-link')?.getAttribute('href'))
      .toBe('/products/regenai-concept-pulse');
  });

  it('keeps the Shopify homepage journey and verified category destinations', () => {
    const view = render(<MemoryRouter><ShopifyHomeView products={[product]}
      sceneProduct={product} paused /></MemoryRouter>);
    const categoryLinks = [...view.container.querySelectorAll<HTMLAnchorElement>('.category-explore-card')]
      .map((link) => link.getAttribute('href'));
    expect(categoryLinks).toEqual(['/collections/release', '/collections/move', '/collections/reset']);
    expect(view.container.querySelector('.ritual-section')).toBeTruthy();
    expect(view.container.querySelector('.lab-film')).toBeTruthy();
    expect(view.container.querySelector('.journal-feature')).toBeTruthy();
    expect(view.container.querySelector('.home-questions')).toBeTruthy();
    expect(screen.getByRole('link', {name: /Explore the finder/}).getAttribute('href')).toBe('/quiz');
    expect(view.container.querySelector('a[href="/products/pulse"]')).toBeNull();
  });

  it('keeps unverified catalog imagery without a Pulse inspection', () => {
    const view = render(<MemoryRouter><ShopifyHomeView products={[product]}
      sceneProduct={null} paused={false} /></MemoryRouter>);
    expect(view.container.querySelector('.hero-object img')?.getAttribute('src'))
      .toBe(product.image?.url);
    expect(view.container.querySelector('.inspection')).toBeNull();
  });

  it('describes an empty verified design category accurately', () => {
    render(<MemoryRouter><ShopifyCatalogView products={[]} categoryTitle="Reset" /></MemoryRouter>);
    expect(screen.getByRole('heading', {name: 'Reset tools.'})).toBeTruthy();
    expect(screen.getByText('No products are available in this design category yet.')).toBeTruthy();
    expect(screen.getByRole('link', {name: 'All tools'}).getAttribute('href')).toBe('/collections/all');
  });

  it('states the local test-order boundary consistently in collection and comparison', () => {
    const available = {...product, availableForSale: true,
      variants: [{...product.variants[0], availableForSale: true}]};
    render(<MemoryRouter><ShopifyCatalogView products={[available]} sandboxCartEnabled /></MemoryRouter>);
    expect(screen.getByText('Original product designs. Local development-store test orders only.'))
      .toBeTruthy();
    expect(screen.getByText('CHECKOUT RESTRICTED')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name: 'Compare product'}));
    expect(screen.getByText('Available for local development-store test orders')).toBeTruthy();
    expect(screen.queryByText('Explore the collection. Ordering is currently closed.')).toBeNull();
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
    expect(screen.queryByRole('button', {name: 'Add to cart'})).toBeNull();
  });

  it('keeps a sold-out Shopify variant out of the local sandbox cart', () => {
    render(<MemoryRouter><ShopifyProductView product={product} related={[]}
      sandboxCartEnabled concept={null} /></MemoryRouter>);
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Add to cart'})).toBeNull();
    expect(screen.getByRole('link', {name: 'View cart'})).toBeTruthy();
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
    const select = screen.getAllByRole('button', {name: 'Compare product'});
    fireEvent.click(select[0]);
    fireEvent.click(select[1]);
    const table = within(screen.getByRole('region', {name: 'Compare the products'}));
    expect(table.getByText('Pulse One')).toBeTruthy();
    expect(table.getByText('Point Duo')).toBeTruthy();
    expect(table.getByText('Handheld concept')).toBeTruthy();
    expect(table.getAllByText('Not verified').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', {name: 'Compare product'}).hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByRole('searchbox', {name: 'Search products'}),
      {target: {value: 'no match'}});
    expect(within(screen.getByRole('region', {name: 'Compare the products'})).getByText('Point Duo')).toBeTruthy();
    fireEvent.click(table.getByRole('button', {name: 'Remove from comparison: Pulse One'}));
    expect(table.queryByText('Pulse One')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Add to cart'})).toBeNull();
  });
});
