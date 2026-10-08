/**
 * axe-core WCAG 2.2 AA checks on the public storefront routes.
 */

import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/collections/all',
  '/products/pulse',
  '/quiz',
  '/journal',
  '/journal/making-pulse-one',
  '/about',
  '/evidence',
  '/policies/privacy',
  '/cart',
  '/pages/styleguide',
];

for (const route of ROUTES) {
  test(`${route} — no WCAG 2.2 AA violations`, async ({page}) => {
    await page.goto(route);
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });
}
