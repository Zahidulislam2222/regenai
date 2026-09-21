import {describe, it, expect} from 'vitest';
import {products, validateCatalog} from '../../app/content/recovery';
import {parseBag, updateBag, bagSubtotal, findProducts, recommend} from '../../app/features/recovery/commerce';
describe('recovery demo commerce', () => {
 it('rejects corrupt, unknown, fractional and negative persisted lines', () => {
  expect(parseBag('{')).toEqual([]);
  expect(parseBag(JSON.stringify([{id:'unknown',option:'x',quantity:1},{id:'pulse',option:'Standard kit',quantity:-1},{id:'pulse',option:'Standard kit',quantity:1.4}]))).toEqual([]);
 });
 it('validates options and merges the same option within quantity bounds', () => {
  let bag = updateBag([], 'pulse', 'Standard kit', 2);
  bag = updateBag(bag, 'pulse','Travel kit',1);
  expect(bag).toHaveLength(2);
  expect(updateBag(bag,'pulse','Standard kit',99)[0].quantity).toBe(9);
  expect(updateBag(bag,'pulse','invalid',1)).toEqual(bag);
  expect(bagSubtotal(bag)).toBe(44700);
  expect(updateBag(bag,'pulse','Standard kit',0)).toHaveLength(1);
 });
 it('does not trust duplicate persisted items or malformed structure', () => {
  expect(parseBag(JSON.stringify({lines:[]}))).toEqual([]);
  const line={id:'pulse',option:'Standard kit',quantity:3};
  expect(parseBag(JSON.stringify([line,line]))).toHaveLength(1);
 });
 it('searches, filters and sorts actual products', () => {
  expect(findProducts({query:'not-a-product',category:'All tools',sort:'featured'})).toHaveLength(0);
  expect(findProducts({query:'',category:'Move',sort:'price-asc'}).map(p=>p.id)).toEqual(['bands','roller']);
 });
 it('matches the chosen area and preference without inventing catalog items', () => {
  expect(recommend('Shoulders','Move').map(p=>p.id)).toEqual(['bands']);
 });
 it('falls back to area matches when a category has no matching tool', () => {
  const result = recommend('Hips','Reset');
  expect(result.length).toBeGreaterThan(0);
  expect(result.every(p => p.areas.includes('Hips'))).toBe(true);
  expect(result.some(p => p.category === 'Reset')).toBe(false);
 });
 it('rejects duplicate handles and invalid prices', () => {
  expect(()=>validateCatalog([products[0],products[0]])).toThrow();
  expect(()=>validateCatalog([{...products[0],price:-1}])).toThrow();
 });
});
