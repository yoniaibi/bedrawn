import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const MOCK_RESULTS = [
  {
    id: 'search-1',
    title: 'Gucci Dionysus Bag',
    seller: 'gucci_reseller',
    sellerEmoji: '',
    ticketPrice: 200,
    retailValue: 2500,
    totalTickets: 50,
    soldTickets: 30,
    category: 'Bags',
    style: 'Unisex',
    condition: 'Excellent',
    isBundle: false,
    isClosingTonight: false,
    isVerified: true,
    description: 'Authentic Gucci Dionysus',
    imageUrl: '',
    tags: [],
    status: 'open',
    closingDate: '2026-07-10',
  },
  {
    id: 'search-2',
    title: 'Gucci Belt Size 32',
    seller: 'fashion_uk',
    sellerEmoji: '',
    ticketPrice: 50,
    retailValue: 350,
    totalTickets: 200,
    soldTickets: 100,
    category: 'Fashion',
    style: 'Unisex',
    condition: 'Good',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description: 'Gucci GG belt',
    imageUrl: '',
    tags: [],
    status: 'open',
    closingDate: '2026-06-28',
  },
];

test.describe('Search page — default state', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/search');
    await page.waitForTimeout(1500);
  });

  test('shows search input', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="search"]')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Trending section', async ({ page }) => {
    await expect(page.locator('text=Trending')).toBeVisible({ timeout: 5000 });
  });

  test('shows Browse categories section', async ({ page }) => {
    await expect(page.locator('text=Browse categories')).toBeVisible({ timeout: 5000 });
  });

  test('shows recent searches', async ({ page }) => {
    await expect(page.locator('text=Recent searches')).toBeVisible({ timeout: 5000 });
  });

  test('shows category chips', async ({ page }) => {
    await expect(page.locator('text=Fashion')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Sneakers')).toBeVisible();
    await expect(page.locator('text=Watches')).toBeVisible();
  });

  test('shows filter chips — All, Tonight, Bundles', async ({ page }) => {
    await expect(page.getByText('All', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Tonight', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Bundles', { exact: true }).first()).toBeVisible();
  });
});

test.describe('Search page — search results', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws?q=gucci', { draws: MOCK_RESULTS });
    await page.goto('/search');
    await page.waitForTimeout(1000);

    const input = page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="search"]')).first();
    await input.fill('gucci');
    await page.waitForTimeout(1000); // wait for debounce + response
  });

  test('shows result draw titles', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus Bag').or(page.locator('text=Gucci Belt Size 32')).first()).toBeVisible({ timeout: 5000 });
  });

  test('search results are clickable draw cards', async ({ page }) => {
    const cards = page.locator(`a[href*="/draw/search-"]`);
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking clear (✕) resets search', async ({ page }) => {
    const clear = page.locator('button', { hasText: '✕' });
    if (await clear.isVisible()) {
      await clear.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=Trending')).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Search page — no results', () => {
  test('shows no results message for unknown query', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws?q=xyznonexistent', { draws: [] });
    await page.goto('/search');
    await page.waitForTimeout(1000);

    const input = page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="search"]')).first();
    await input.fill('xyznonexistent');
    await page.waitForTimeout(1000);

    await expect(
      page.locator('text=No draws matched').or(page.locator('text=Try a different')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Search page — trending and category chips', () => {
  test('clicking a trending chip fills the search input', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws?q=chanel', { draws: [] });
    await page.goto('/search');
    await page.waitForTimeout(1000);

    await page.locator('button', { hasText: 'Chanel' }).first().click();
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="search"]')).first();
    const value = await input.inputValue();
    expect(value.toLowerCase()).toContain('chanel');
  });

  test('clicking a category chip fills the search input', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws?q=watches', { draws: [] });
    await page.goto('/search');
    await page.waitForTimeout(1000);

    await page.locator('button', { hasText: 'Watches' }).click();
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="search"]')).first();
    const value = await input.inputValue();
    expect(value.toLowerCase()).toContain('watch');
  });
});
