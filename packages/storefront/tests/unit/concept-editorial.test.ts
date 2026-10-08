import {describe, expect, it} from 'vitest';
import {getConceptEditorial, selectDesignCategoryProducts, selectRelatedConcepts} from '../../app/lib/concept-editorial.server';
import {getDesignCategoryByHandle, products} from '../../app/content/recovery';
import seedConfig from '../../../../scripts/catalog-seed/seed-config.json';

function identity(id: string) {
  const item = products.find((value) => value.id === id);
  if (!item) throw new Error('Missing test concept');
  return {id, handle: `${seedConfig.handlePrefix}${id}`, name: item.name,
    description: `${item.description} ${item.detail} ${seedConfig.descriptionNotice}`};
}

describe('owned Shopify concept editorial', () => {
  it('uses validated local design notes only for the exact seeded identity', () => {
    const pulse = identity('pulse');
    const concept = getConceptEditorial(pulse);
    expect(concept?.detail).toContain('original product');
    expect(concept?.specs).toContainEqual({label: 'Status', value: 'product; not for sale'});
    const source = products.find((item) => item.id === 'pulse');
    if (!source) throw new Error('Missing test concept');
    expect(getConceptEditorial({...pulse,
      description: `${source.description}${source.detail}${seedConfig.descriptionNotice}`})).not.toBeNull();
    expect(getConceptEditorial({...pulse, name: 'Different title'})).toBeNull();
    expect(getConceptEditorial({...pulse, handle: 'regenai-concept-unknown'})).toBeNull();
    expect(getConceptEditorial({...pulse, description: 'Changed description'})).toBeNull();
    expect(getConceptEditorial({...pulse, description: `${pulse.description} New sales claim.`})).toBeNull();
  });

  it('relates concepts by the validated design category, not unique Shopify product types', () => {
    const pulse = identity('pulse');
    const balls = identity('balls');
    const roller = identity('roller');
    expect(selectRelatedConcepts(pulse, [pulse, balls, roller])).toEqual([balls]);
    expect(selectRelatedConcepts({...pulse, name: 'Changed title'}, [balls])).toEqual([]);
  });

  it('allows only maintained category handles and exact owned concept identities', () => {
    expect(getDesignCategoryByHandle('release')).toBe('Release');
    expect(getDesignCategoryByHandle('move')).toBe('Move');
    expect(getDesignCategoryByHandle('reset')).toBe('Reset');
    expect(getDesignCategoryByHandle('hydrogen')).toBeNull();
    expect(getDesignCategoryByHandle('RELEASE')).toBeNull();
    const pulse = identity('pulse');
    const balls = identity('balls');
    const roller = identity('roller');
    expect(selectDesignCategoryProducts('Release', [pulse, balls, roller])).toEqual([pulse, balls]);
    expect(selectDesignCategoryProducts('Release', [pulse, {...balls, name: 'Sample product'}, roller])).toEqual([pulse]);
  });
});
