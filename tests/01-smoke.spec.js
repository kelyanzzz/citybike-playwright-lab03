const { test, expect } = require('@playwright/test');

test('dashboard loads with four stations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find your next bike' })).toBeVisible();
  await expect(page.getByTestId('station-card')).toHaveCount(4);
});

test('search narrows station list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search stations' }).fill('Central');
  await expect(page.getByTestId('station-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Central Square' })).toBeVisible();
});
