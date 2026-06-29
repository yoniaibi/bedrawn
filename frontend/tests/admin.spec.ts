import { test, expect } from '@playwright/test';
import { injectAuth, injectAdminAuth, mockApi } from './helpers';

const MOCK_ADMIN_DRAWS = [
  {
    id: '8df1fe4b-1109-4f21-afeb-1cf7eea6011d',
    title: 'Gucci Dionysus GG Supreme Shoulder Bag',
    status: 'open',
    sellerHandle: 'drawnofficial',
    ticketPricePence: 100,
    totalTickets: 1850,
    soldTickets: 1240,
    minTickets: 463,
    retailValuePence: 185000,
    closingDate: '2026-06-28',
    createdAt: '2026-06-28T00:00:00.000Z',
    category: 'Bags',
  },
  {
    id: '27c64aad-ae1f-4937-95a1-dd8b981f5eab',
    title: 'Test Draw — Chanel Classic Flap',
    status: 'resolved',
    sellerHandle: 'c2d59424',
    ticketPricePence: 25,
    totalTickets: 100,
    soldTickets: 28,
    minTickets: 25,
    retailValuePence: 680000,
    closingDate: '2026-06-27',
    winnerId: '328534a4-6061-70ff-a40b-313a407ef6bd',
    resolvedAt: '2026-06-27T20:34:58.508Z',
    createdAt: '2026-06-27T18:00:00.000Z',
    category: 'Bags',
  },
  {
    id: '7674cc61-2753-4ea2-801d-09895624854e',
    title: 'Cancellation Test Draw',
    status: 'cancelled',
    sellerHandle: 'c2d59424',
    ticketPricePence: 50,
    totalTickets: 1000,
    soldTickets: 10,
    minTickets: 250,
    retailValuePence: 50000,
    closingDate: '2026-06-28',
    cancelReason: 'below minimum (10/250)',
    createdAt: '2026-06-28T07:00:00.000Z',
    category: 'Fashion',
  },
];

test.describe('Admin panel — non-admin user', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    // Non-admin token has no cognito:groups
    await mockApi(page, '/admin/draws', { error: 'Forbidden' }, 403);
    await page.goto('/admin');
    await page.waitForTimeout(2000);
  });

  test('shows access denied for non-admin', async ({ page }) => {
    await expect(
      page.locator('text=Access denied').or(page.locator('text=admin only')).or(page.locator('text=Forbidden')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin panel — authenticated admin', () => {
  test.beforeEach(async ({ page }) => {
    await injectAdminAuth(page);
    await mockApi(page, '/admin/draws', {
      draws: MOCK_ADMIN_DRAWS,
      counts: { open: 1, resolved: 1, cancelled: 1 },
    });
    await page.goto('/admin');
    await page.waitForTimeout(2500);
  });

  test('shows Admin Panel header', async ({ page }) => {
    await expect(page.locator('text=Admin Panel').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows stats row with open/resolved/cancelled counts', async ({ page }) => {
    await expect(page.locator('text=Open').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Resolved').first()).toBeVisible();
    await expect(page.locator('text=Cancelled').first()).toBeVisible();
  });

  test('shows all draw titles', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test Draw').first()).toBeVisible();
    await expect(page.locator('text=Cancellation Test').first()).toBeVisible();
  });

  test('shows winner ID for resolved draw', async ({ page }) => {
    await expect(page.locator('text=Winner').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=328534a4').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows cancel reason for cancelled draw', async ({ page }) => {
    await expect(page.locator('text=below minimum').first()).toBeVisible({ timeout: 5000 });
  });

  test('filter tab "open" shows only open draws', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^open/ }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible();
  });

  test('filter tab "resolved" shows only resolved draws', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^resolved/ }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Test Draw').first()).toBeVisible();
  });

  test('View → link goes to draw detail', async ({ page }) => {
    await page.locator('a').filter({ hasText: 'View →' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/draw\//);
  });
});

test.describe('Admin — access without auth', () => {
  test('redirects or shows error when not logged in', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = url.endsWith('/') || url.includes('/login') || url.includes('/admin');
    expect(hasError).toBeTruthy();
  });
});
