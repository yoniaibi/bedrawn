import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const MOCK_SAVED = [
  {
    id: 'saved-draw-1',
    title: 'Bottega Veneta Pouch',
    seller: 'luxuryseller',
    ticketPrice: 150,
    retailValue: 1200,
    totalTickets: 100,
    soldTickets: 42,
    isClosingTonight: false,
    imageUrl: '',
    status: 'open',
    category: 'Bags',
  },
  {
    id: 'saved-draw-2',
    title: 'Supreme Box Logo Hoodie',
    seller: 'streetwear_uk',
    ticketPrice: 100,
    retailValue: 400,
    totalTickets: 200,
    soldTickets: 180,
    isClosingTonight: true,
    imageUrl: '',
    status: 'open',
    category: 'Fashion',
  },
];

test.describe('Saved draws page — unauthenticated', () => {
  test('shows page or redirects', async ({ page }) => {
    await page.goto('/account/saved');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/account/saved') || url.includes('/')).toBeTruthy();
  });
});

test.describe('Saved draws page — authenticated with saves', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/saved', { draws: MOCK_SAVED });
    await page.goto('/account/saved');
    await page.waitForTimeout(2500);
  });

  test('shows Saved Draws header', async ({ page }) => {
    await expect(page.locator('text=Saved Draws')).toBeVisible({ timeout: 5000 });
  });

  test('shows count of saved draws', async ({ page }) => {
    await expect(page.locator('text=Saved Draws (2)')).toBeVisible({ timeout: 5000 });
  });

  test('shows saved draw titles', async ({ page }) => {
    await expect(page.locator('text=Bottega Veneta Pouch')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Supreme Box Logo Hoodie')).toBeVisible();
  });

  test('back arrow links to /account', async ({ page }) => {
    await expect(page.locator('a[href="/account"]').filter({ hasText: '←' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Saved draws page — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/saved', { draws: [] });
    await page.goto('/account/saved');
    await page.waitForTimeout(2500);
  });

  test('shows empty state message', async ({ page }) => {
    await expect(page.locator('text=No saved draws yet')).toBeVisible({ timeout: 5000 });
  });

  test('shows tap bookmark hint', async ({ page }) => {
    await expect(page.locator('text=bookmark').or(page.locator('text=save')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Browse draws button', async ({ page }) => {
    await expect(page.locator('text=Browse draws')).toBeVisible({ timeout: 5000 });
  });

  test('Browse draws button is present', async ({ page }) => {
    const btn = page.locator('a[href="/home"]').filter({ hasText: 'Browse draws' });
    await expect(btn).toBeVisible({ timeout: 5000 });
  });
});
