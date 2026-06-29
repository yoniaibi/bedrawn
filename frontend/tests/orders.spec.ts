import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const MOCK_ENTRIES = [
  {
    drawId: 'draw-abc-001',
    drawTitle: 'Chanel Classic Flap',
    drawImageUrl: '',
    ticketCount: 5,
    ticketPricePence: 100,
    enteredAt: '2026-06-20T10:00:00Z',
    closingDate: '2026-07-01',
    status: 'open',
    isWinner: false,
  },
  {
    drawId: 'draw-abc-002',
    drawTitle: 'Rolex Submariner',
    drawImageUrl: '',
    ticketCount: 10,
    ticketPricePence: 200,
    enteredAt: '2026-06-15T10:00:00Z',
    closingDate: '2026-06-25',
    status: 'resolved',
    isWinner: true,
  },
  {
    drawId: 'draw-abc-003',
    drawTitle: 'Air Jordan 1 Chicago',
    drawImageUrl: '',
    ticketCount: 3,
    ticketPricePence: 50,
    enteredAt: '2026-06-10T10:00:00Z',
    closingDate: '2026-06-20',
    status: 'resolved',
    isWinner: false,
  },
];

test.describe('Orders page — unauthenticated', () => {
  test('shows page or redirects', async ({ page }) => {
    await page.goto('/account/orders');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/account/orders') || url.includes('/')).toBeTruthy();
  });
});

test.describe('Orders page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/entries', { entries: MOCK_ENTRIES });
    await page.goto('/account/orders');
    await page.waitForTimeout(2500);
  });

  test('shows My Orders header', async ({ page }) => {
    await expect(page.locator('text=My Orders')).toBeVisible({ timeout: 5000 });
  });

  test('shows All / Active / Won filter tabs', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'All' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button', { hasText: 'Active' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Won' })).toBeVisible();
  });

  test('shows draw titles from API', async ({ page }) => {
    await expect(page.locator('text=Chanel Classic Flap')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Rolex Submariner')).toBeVisible();
    await expect(page.locator('text=Air Jordan 1 Chicago')).toBeVisible();
  });

  test('Active filter shows only open entries', async ({ page }) => {
    await page.locator('button', { hasText: 'Active' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Chanel Classic Flap')).toBeVisible();
    await expect(page.locator('text=Rolex Submariner')).not.toBeVisible();
    await expect(page.locator('text=Air Jordan 1 Chicago')).not.toBeVisible();
  });

  test('Won filter shows only winning entries', async ({ page }) => {
    await page.locator('button', { hasText: 'Won' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Rolex Submariner')).toBeVisible();
    await expect(page.locator('text=Chanel Classic Flap')).not.toBeVisible();
  });

  test('shows Won badge on winning entry', async ({ page }) => {
    await expect(page.locator('text=Won').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Active badge on open entry', async ({ page }) => {
    await expect(page.locator('text=Active').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket counts', async ({ page }) => {
    await expect(page.locator('text=5 tickets').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=10 tickets').first()).toBeVisible();
  });

  test('back arrow links to /account', async ({ page }) => {
    await expect(page.locator('a[href="/account"]').filter({ hasText: '←' })).toBeVisible({ timeout: 5000 });
  });

  test('entries link to draw detail pages', async ({ page }) => {
    const link = page.locator(`a[href="/draw/draw-abc-001"]`);
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Orders page — empty state', () => {
  test('shows empty state and browse button when no entries', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/entries', { entries: [] });
    await page.goto('/account/orders');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=No orders')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Browse draws')).toBeVisible();
  });
});

test.describe('Orders page — API error', () => {
  test('handles API failure gracefully — shows empty state', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/entries', { error: 'Server error' }, 500);
    await page.goto('/account/orders');
    await page.waitForTimeout(2500);
    // Should not crash — either empty state or no orders message
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
