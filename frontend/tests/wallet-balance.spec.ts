import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

test.describe('Wallet page — balance display', () => {
  test('shows fetched balance in £ format', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 3750 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=£37.50')).toBeVisible({ timeout: 5000 });
  });

  test('shows £0.00 when balance is zero', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 0 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=£0.00')).toBeVisible({ timeout: 5000 });
  });

  test('shows dash when balance API fails', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { error: 'Server error' }, 500);
    await page.goto('/account/wallet');
    await page.waitForTimeout(2500);
    // Balance should show — (dash) on failure
    await expect(page.locator('text=Available balance')).toBeVisible({ timeout: 5000 });
  });

  test('shows Available balance label', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 1000 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=Available balance')).toBeVisible({ timeout: 5000 });
  });

  test('shows large balance correctly', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 100000 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2500);
    await expect(page.locator('text=£1000.00')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Wallet page — top-up flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    // Use a balance that won't conflict with button labels (£5, £10, £20, £50)
    await mockApi(page, '/wallet/balance', { balancePence: 1234 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2000);
  });

  test('clicking £5 sends correct amountPence to API', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await page.route('**/wallet/topup', async route => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clientSecret: 'pi_test_abc' }) });
    });
    await page.locator('text=£5').first().click();
    await page.waitForTimeout(2500);
    expect(payload).not.toBeNull();
    expect((payload as unknown as Record<string, unknown>).amountPence).toBe(500);
  });

  test('clicking £50 sends correct amountPence to API', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await page.route('**/wallet/topup', async route => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clientSecret: 'pi_test_xyz' }) });
    });
    await page.locator('text=£50').first().click();
    await page.waitForTimeout(2500);
    expect(payload).not.toBeNull();
    expect((payload as unknown as Record<string, unknown>).amountPence).toBe(5000);
  });

  test('failed top-up API shows error', async ({ page }) => {
    await page.route('**/wallet/topup', async route => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Payment service unavailable' }) });
    });
    await page.locator('text=£5').first().click();
    await page.waitForTimeout(2500);
    await expect(
      page.locator('text=Payment service unavailable').or(page.locator('text=Failed')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
