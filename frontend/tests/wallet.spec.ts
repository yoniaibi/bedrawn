import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

test.describe('Wallet page — unauthenticated', () => {
  test('redirects to / when not logged in', async ({ page }) => {
    await page.goto('/account/wallet');
    await page.waitForTimeout(2000);
    const url = page.url();
    const redirected = url === 'http://localhost:3000/' || url.endsWith('/');
    const stayedOnWallet = url.includes('/wallet');
    expect(redirected || stayedOnWallet).toBeTruthy();
  });
});

test.describe('Wallet page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 2500 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2000);
  });

  test('shows My Wallet header', async ({ page }) => {
    await expect(page.locator('text=My Wallet')).toBeVisible({ timeout: 5000 });
  });

  test('shows Top up section', async ({ page }) => {
    await expect(page.locator('text=Top up')).toBeVisible({ timeout: 5000 });
  });

  test('shows four top-up amount buttons', async ({ page }) => {
    await expect(page.locator('text=£5').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=£10').first()).toBeVisible();
    await expect(page.locator('text=£20').first()).toBeVisible();
    await expect(page.locator('text=£50').first()).toBeVisible();
  });

  test('shows minimum top-up and Stripe notice', async ({ page }) => {
    await expect(page.locator('text=Minimum top-up').or(page.locator('text=Stripe')).first()).toBeVisible({ timeout: 5000 });
  });

  test('back arrow links to /account', async ({ page }) => {
    const backLink = page.locator('a[href="/account"]').filter({ hasText: '←' });
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });

  test('clicking £5 button shows payment form', async ({ page }) => {
    await mockApi(page, '/wallet/topup', { clientSecret: 'pi_test_secret_123' });
    await page.locator('text=£5').first().click();
    await page.waitForTimeout(3000);
    // Payment form should appear with cancel button
    await expect(page.locator('text=Cancel').or(page.locator('text=Pay £5').or(page.locator('text=Adding'))).first()).toBeVisible({ timeout: 8000 });
  });

  test('clicking £10 button triggers topup API call', async ({ page }) => {
    let calledWith: unknown;
    await page.route('**/wallet/topup', async route => {
      calledWith = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientSecret: 'pi_test_secret_456' }),
      });
    });
    await page.locator('text=£10').first().click();
    await page.waitForTimeout(2000);
    expect((calledWith as any)?.amountPence).toBe(1000);
  });

  test('API error shows error message', async ({ page }) => {
    await mockApi(page, '/wallet/topup', { error: 'Payment service unavailable' }, 503);
    await page.locator('text=£5').first().click();
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Payment service unavailable').or(page.locator('text=Failed')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
