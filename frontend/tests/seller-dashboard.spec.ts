import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const VERIFIED_ACCOUNT = {
  stripeAccountId: 'acct_verified123',
  chargesEnabled: true,
  payoutsEnabled: true,
  onboardingUrl: null,
};

const MOCK_SELLER_STATS = {
  draws: [
    {
      id: 'draw-seller-1',
      title: 'Off-White Jordan 1',
      status: 'open',
      soldTickets: 75,
      totalTickets: 100,
      ticketPricePence: 200,
      retailValuePence: 80000,
      sellerRevenuePence: 13200,
      closingDate: '2026-07-15',
    },
    {
      id: 'draw-seller-2',
      title: 'Palace Tri-Ferg Hoodie',
      status: 'resolved',
      soldTickets: 200,
      totalTickets: 200,
      ticketPricePence: 100,
      retailValuePence: 35000,
      sellerRevenuePence: 17600,
      payoutConfirmed: false,
    },
  ],
  totalEarningsPence: 17600,
  pendingPayoutPence: 17600,
  stripeConnected: true,
};

test.describe('Seller dashboard — stats (verified)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/seller/account', VERIFIED_ACCOUNT);
    await mockApi(page, '/seller/stats', MOCK_SELLER_STATS);
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(2500);
  });

  test('shows Seller Dashboard header', async ({ page }) => {
    await expect(page.locator('text=Seller Dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('shows total earned from API', async ({ page }) => {
    await expect(page.locator('text=£176.00').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows pending payout from API', async ({ page }) => {
    await expect(page.locator('text=Pending')).toBeVisible({ timeout: 5000 });
  });

  test('shows draw titles from stats', async ({ page }) => {
    await expect(page.locator('text=Off-White Jordan 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Palace Tri-Ferg Hoodie')).toBeVisible();
  });

  test('shows sold ticket counts', async ({ page }) => {
    await expect(page.locator('text=75/100 tickets').or(page.locator('text=75/100')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows seller revenue per draw', async ({ page }) => {
    await expect(page.locator('text=£132.00').or(page.locator('text=£176.00')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows List new item button', async ({ page }) => {
    await expect(page.locator('text=List new item')).toBeVisible({ timeout: 5000 });
  });

  test('List new item links to /seller/list', async ({ page }) => {
    await expect(page.locator('a[href="/seller/list"]')).toBeVisible({ timeout: 5000 });
  });

  test('shows draw status badges', async ({ page }) => {
    await expect(page.locator('text=open').or(page.locator('text=resolved')).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller dashboard — verified, no draws', () => {
  test('shows empty state when no draws listed', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/seller/account', VERIFIED_ACCOUNT);
    await mockApi(page, '/seller/stats', {
      draws: [],
      totalEarningsPence: 0,
      pendingPayoutPence: 0,
      stripeConnected: true,
    });
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=No draws yet').or(page.locator('text=list your first')).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller dashboard — verified, zero earnings', () => {
  test('shows £0.00 when no resolved draws', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/seller/account', VERIFIED_ACCOUNT);
    await mockApi(page, '/seller/stats', {
      draws: [],
      totalEarningsPence: 0,
      pendingPayoutPence: 0,
      stripeConnected: true,
    });
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=£0.00').first()).toBeVisible({ timeout: 5000 });
  });
});
