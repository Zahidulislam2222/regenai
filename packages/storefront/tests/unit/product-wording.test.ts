import {describe, expect, it} from 'vitest';
import {site, products} from '../../app/content/recovery';
import {editorial} from '../../app/content/recovery-editorial';
import {ui} from '../../app/content/recovery-ui';
import seedConfig from '../../../../scripts/catalog-seed/seed-config.json';

const labels = /\b(?:demo|sandbox|simulation|simulated|fictional|synthetic|portfolio|concepts?|preview|mock)\b/i;
function strings(value: unknown): string[] {
  if (typeof value === 'string') return value.startsWith('/') || value.startsWith('https://') ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('product language across visitor copy', () => {
  it('covers catalog, policies, editorial, navigation, accessibility and metadata', () => {
    const copy = [...strings(products), ...strings(site), ...strings(editorial), ...strings(ui),
      seedConfig.vendor, seedConfig.descriptionNotice, seedConfig.imageAltTemplate];
    for (const text of copy) expect(text).not.toMatch(labels);
  });
  it('keeps the closed-ordering and privacy facts visible', () => {
    expect(site.pages.terms.sections.flat().join(' ')).toMatch(/do not accept a real order or payment/);
    expect(site.pages.privacy.sections.flat().join(' ')).toMatch(/encrypted on the server/);
    expect(seedConfig.descriptionNotice).toMatch(/Ordering is closed/);
  });
});
