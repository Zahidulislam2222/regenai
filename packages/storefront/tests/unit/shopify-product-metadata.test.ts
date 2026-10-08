import {describe, expect, it} from 'vitest';
import {meta} from '../../app/routes/recovery/product';

function metadata(data: unknown) {
  return meta({data} as Parameters<typeof meta>[0]);
}

describe('owned product metadata', () => {
  it('uses verified maintained copy when Shopify still has the earlier description', () => {
    const result = metadata({source: 'shopify',
      product: {name: 'Pulse One', description: 'Legacy concept for a portfolio demo.'},
      concept: {summary: 'A considered addition to your wind-down ritual.'},
    });
    expect(result).toContainEqual({name: 'description',
      content: 'A considered addition to your wind-down ritual.'});
    expect(JSON.stringify(result)).not.toMatch(/\b(?:demo|concept|portfolio)\b/i);
  });

  it('preserves Shopify descriptions when there is no verified owned editorial match', () => {
    expect(metadata({source: 'shopify', product: {name: 'Another product',
      description: 'Authoritative merchant description.'}, concept: null}))
      .toContainEqual({name: 'description', content: 'Authoritative merchant description.'});
  });
});
