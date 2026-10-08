import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {JsonLd, organizationSchema, productSchema} from '../../app/lib/seo/jsonld';

describe('structured data truth and serialization', () => {
  it('uses only supplied organization facts', () => {
    const schema = organizationSchema({name: 'Concept Studio', url: 'https://example.test'});
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Concept Studio',
      url: 'https://example.test',
    });
  });

  it('does not invent an offer for a nonpurchasable concept', () => {
    const schema = productSchema({
      name: 'Concept One', description: 'Design study', sku: 'concept-one',
      image: 'https://example.test/concept.webp', url: 'https://example.test/concept',
    });
    expect(schema).not.toHaveProperty('offers');
    expect(schema).not.toHaveProperty('brand');
  });

  it('keeps untrusted text inside one JSON-LD script', () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{name: '</script><script>alert(1)</script>'}} />,
    );
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).not.toContain('</script><script>');
    expect(html).toContain('\\u003c/script>');
  });
});
