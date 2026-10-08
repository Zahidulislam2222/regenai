import {describe, expect, it} from 'vitest';
import {editorial, selectJournalStory} from '../../app/content/recovery-editorial';

describe('finder story by catalog source', () => {
  const story = editorial.stories.find((item) => item.slug === 'how-the-finder-works');

  it('describes Shopify product-type filtering on the published storefront', () => {
    expect(story).toBeTruthy();
    const published = selectJournalStory(story!, 'shopify');
    expect(published.paragraphs.join(' ')).toMatch(/Shopify product type/);
    expect(published.paragraphs.join(' ')).not.toMatch(/three choices/);
  });

  it('describes the three-choice flow in the static fixture preview', () => {
    expect(story).toBeTruthy();
    const fixture = selectJournalStory(story!, 'fixture');
    expect(fixture.paragraphs.join(' ')).toMatch(/three choices/);
    expect(fixture.paragraphs.join(' ')).not.toMatch(/Shopify product type/);
  });
});
