import {describe, expect, it} from 'vitest';
import {shouldRevalidateCatalog} from '../../app/lib/catalog-revalidation';

const currentUrl = new URL('https://shop.example.test/search?q=pulse');

describe('catalog route revalidation', () => {
  it('keeps client-side search, filter and sort changes on the current catalog', () => {
    for (const next of [
      'https://shop.example.test/search?q=roller',
      'https://shop.example.test/search?q=pulse&category=Recovery%20concept',
      'https://shop.example.test/search?q=pulse&sort=name-asc',
    ]) {
      expect(shouldRevalidateCatalog({currentUrl, nextUrl: new URL(next),
        defaultShouldRevalidate: true})).toBe(false);
    }
  });

  it('keeps the router default for route changes, refreshes and action submissions', () => {
    const base = {currentUrl, defaultShouldRevalidate: true};
    expect(shouldRevalidateCatalog({...base,
      nextUrl: new URL('https://shop.example.test/collections/all')})).toBe(true);
    expect(shouldRevalidateCatalog({...base, nextUrl: currentUrl})).toBe(true);
    expect(shouldRevalidateCatalog({...base,
      nextUrl: new URL('https://shop.example.test/search?q=roller'), formMethod: 'POST'})).toBe(true);
  });
});
