/**
 * Smoke e2e — confirms dev server boots and renders the home page.
 * Real golden-path specs land Days 8–10 (PDP, cart, quiz).
 */

import {test, expect} from '@playwright/test';

test('home page responds with 200 and semantic HTML', async ({page}) => {
  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);

  // Verify core landmarks per WCAG 2.2
  await expect(page.locator('main#main-content')).toBeVisible();

  // Skip-link exists (WCAG 2.2 AA)
  const skip = page.getByRole('link', {name: /skip to main content/i});
  await expect(skip).toBeAttached();
});

test('theme-color meta is brand primary', async ({page}) => {
  await page.goto('/');
  const meta = await page.locator('meta[name="theme-color"]').getAttribute('content');
  expect(meta).toBe('#1e3a5f');
});
