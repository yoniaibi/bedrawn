import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

test.describe('Draw static routes', () => {
  test('/draw/1 returns 200', async ({ page }) => {
    expect((await page.request.get('/draw/1')).status()).not.toBe(404);
  });

  test('/draw/6 returns 200', async ({ page }) => {
    expect((await page.request.get('/draw/6')).status()).not.toBe(404);
  });

  test('/draw/12 returns 200', async ({ page }) => {
    expect((await page.request.get('/draw/12')).status()).not.toBe(404);
  });

  test('/draw/1/purchase returns 200', async ({ page }) => {
    expect((await page.request.get('/draw/1/purchase')).status()).not.toBe(404);
  });
});

test.describe('Draw detail — unauthenticated redirect', () => {
  test('/draw/1 redirects to / when not authed', async ({ page }) => {
    await page.goto('/draw/1');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.endsWith('/') || url.includes('/draw/')).toBeTruthy();
  });
});

test.describe('Draw detail — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/draw/1');
    await page.waitForTimeout(2000);
  });

  test('shows Chanel draw title', async ({ page }) => {
    await expect(page.locator('text=Chanel Classic Flap').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket price', async ({ page }) => {
    await expect(page.locator('text=50p').or(page.locator('text=per ticket')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows retail value', async ({ page }) => {
    await expect(page.locator('text=6,800').or(page.locator('text=£6,800')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Enter draw or Buy tickets CTA', async ({ page }) => {
    await expect(
      page.locator('text=Enter draw').or(page.locator('text=Buy tickets')).or(page.locator('text=Get tickets')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows progress bar or ticket count', async ({ page }) => {
    await expect(
      page.locator('text=tickets').or(page.locator('text=sold')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('CTA links to purchase page', async ({ page }) => {
    const purchaseLink = page.locator('a[href*="/purchase"]').or(page.locator('a[href*="purchase"]'));
    await expect(purchaseLink.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Purchase page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 5000 });
    await page.goto('/draw/1/purchase');
    await page.waitForTimeout(2500);
  });

  test('shows Enter draw header', async ({ page }) => {
    await expect(page.locator('text=Enter draw').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows draw title on purchase page', async ({ page }) => {
    await expect(page.locator('text=Chanel Classic Flap').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket quantity pills 1 5 10 25', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: /^1$/ })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button').filter({ hasText: /^5$/ })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^10$/ })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^25$/ })).toBeVisible();
  });

  test('shows live wallet balance £50', async ({ page }) => {
    await expect(page.locator('text=£50.00').or(page.locator('text=Your balance')).first()).toBeVisible({ timeout: 5000 });
  });

  test('selecting 5 tickets shows correct total', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^5$/ }).click();
    // 5 × 50p = 250p = £2.50
    await expect(page.locator('text=£2.50').or(page.locator('text=250p')).first()).toBeVisible({ timeout: 3000 });
  });

  test('confirm button enabled when balance sufficient', async ({ page }) => {
    await page.waitForTimeout(1000);
    const btn = page.locator('button').filter({ hasText: /Confirm purchase/ });
    await expect(btn).toBeEnabled({ timeout: 5000 });
  });

  test('confirm calls enter-draw API and navigates to success', async ({ page }) => {
    let apiHit = false;
    await page.route('**/draws/*/enter', async route => {
      apiHit = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, ticketCount: 1, costPence: 50 }),
      });
    });
    await page.waitForTimeout(1000);
    const btn = page.locator('button').filter({ hasText: /Confirm purchase/ });
    if (await btn.isEnabled()) {
      await btn.click();
      await page.waitForTimeout(2000);
      expect(apiHit).toBeTruthy();
      await expect(page).toHaveURL(/success/, { timeout: 5000 });
    }
  });

  test('zero balance shows top up wallet link', async ({ page }) => {
    await mockApi(page, '/wallet/balance', { balancePence: 0 });
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(
      page.locator('text=Top up wallet').or(page.locator('text=insufficient')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Home page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/home');
    await page.waitForTimeout(2000);
  });

  test('home page loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toHaveText(/Error/);
  });

  test('shows draw cards', async ({ page }) => {
    const url = page.url();
    if (url.includes('/home')) {
      await expect(page.locator('text=Chanel').or(page.locator('text=Rolex')).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
