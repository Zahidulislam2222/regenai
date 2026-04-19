/**
 * axe-core a11y suite — WCAG 2.2 AA enforcement on every route.
 * Individual route coverage expands Day 5+ as routes land.
 */

import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/pages/styleguide',
];

for (const route of ROUTES) {
  test(`${route} — no WCAG 2.2 AA violations`, async ({page}) => {
    await page.goto(route);
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    // Exclude known-third-party noise when it appears (none yet, Phase 1
    // doesn't embed third-party widgets until Day 12 Klaviyo + Judge.me)
    const filtered = results.violations.filter(
      (v) => v.id !== 'color-contrast-enhanced',
    );

    expect.soft(filtered, JSON.stringify(filtered, null, 2)).toHaveLength(0);
  });
}
