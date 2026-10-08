import {createHash} from 'node:crypto';
import seedConfig from '../../../../scripts/catalog-seed/seed-config.json';
import {products} from '~/content/recovery';
import type {ShopifyCatalogProduct} from './shopify-catalog.server';

export type ConceptEditorial = {
  summary: string;
  detail: string;
  notice: string;
  category: string;
  specs: {label: string; value: string}[];
};

function normalizedDescription(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Local design notes apply only to the exact owned concept identity. */
export function getConceptEditorial(
  product: Pick<ShopifyCatalogProduct, 'handle' | 'name' | 'description'>,
): ConceptEditorial | null {
  const concept = products.find((item) =>
    product.handle === `${seedConfig.handlePrefix}${item.id}` && product.name === item.name);
  if (!concept) return null;
  const parts = [concept.description, concept.detail, seedConfig.descriptionNotice]
    .map(normalizedDescription);
  const actual = normalizedDescription(product.description);
  const legacyHashes = seedConfig.legacyDescriptionHashes[product.handle as keyof typeof seedConfig.legacyDescriptionHashes] ?? [];
  const verifiedLegacy = legacyHashes.includes(createHash('sha256').update(actual).digest('hex'));
  if (actual !== parts.join(' ') && actual !== parts.join('') && !verifiedLegacy) return null;
  return {
    summary: concept.description,
    detail: concept.detail,
    notice: seedConfig.descriptionNotice,
    category: concept.category,
    specs: concept.specs.map(([label, value]) => ({label, value})),
  };
}

export function selectRelatedConcepts<T extends Pick<ShopifyCatalogProduct, 'id' | 'handle' | 'name' | 'description'>>(
  product: T,
  candidates: T[],
): T[] {
  const category = getConceptEditorial(product)?.category;
  if (!category) return [];
  return candidates.filter((item) => item.id !== product.id &&
    getConceptEditorial(item)?.category === category);
}

export function selectDesignCategoryProducts<T extends Pick<ShopifyCatalogProduct, 'handle' | 'name' | 'description'>>(
  category: string,
  candidates: T[],
): T[] {
  return candidates.filter((product) => getConceptEditorial(product)?.category === category);
}
