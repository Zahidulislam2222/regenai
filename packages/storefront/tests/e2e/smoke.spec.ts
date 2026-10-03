/**
 * Storefront smoke checks against the configured Hydrogen server.
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

test('skip link reaches the main content by keyboard', async ({page}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', {name: 'Skip to main content'});
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();
});

test('journal navigation reaches an article and returns to the index', async ({page}) => {
  await page.goto('/');
  const mobileMenu = page.getByRole('button', {name: 'Open navigation'});
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
    await page.getByRole('navigation', {name: 'Mobile navigation'})
      .getByRole('link', {name: 'Design notes'}).click();
  } else {
    await page.getByRole('navigation', {name: 'Main navigation'})
      .getByRole('link', {name: 'Design notes'}).click();
  }
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.locator('main#main-content')).toBeFocused();
  await page.locator('a[href="/journal/making-pulse-one"]').first().click();
  await expect(page).toHaveURL(/\/journal\/making-pulse-one$/);
  await expect(page.getByRole('article')).toBeVisible();
  await page.getByRole('link', {name: 'All design notes'}).click();
  await expect(page).toHaveURL(/\/journal$/);
});

test('product design page gives availability without purchase controls', async ({page}) => {
  await page.goto('/products/pulse');
  await expect(page.getByRole('heading', {name: 'Pulse One'})).toBeVisible();
  await expect(page.getByText(/Ordering opens after product details and availability are confirmed/i)).toBeVisible();
  await expect(page.getByRole('button', {name: /add to bag|checkout|buy now/i})).toHaveCount(0);
});

test('key storefront routes reflow at 320 CSS pixels', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  for (const route of ['/', '/collections/all', '/products/pulse', '/cart']) {
    await page.goto(route);
    await expect(page.locator('main#main-content')).toBeVisible();
    await page.locator('footer').scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() =>
      Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
      document.documentElement.clientWidth,
    );
    expect(overflow, `${route} has horizontal overflow`).toBeLessThanOrEqual(1);
  }
});
