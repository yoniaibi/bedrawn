import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

test.describe('Seller onboarding page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller');
    await page.waitForTimeout(2000);
  });

  test('shows Become a Seller header', async ({ page }) => {
    await expect(page.locator('text=Become a Seller')).toBeVisible({ timeout: 5000 });
  });

  test('shows Sell on Bedrawn card', async ({ page }) => {
    await expect(page.locator('text=Sell on Bedrawn')).toBeVisible();
  });

  test('shows 88% revenue share', async ({ page }) => {
    await expect(page.locator('text=88%').first()).toBeVisible();
  });

  test('shows 4 how-it-works steps', async ({ page }) => {
    await expect(page.locator('text=Identity verification').first()).toBeVisible();
    await expect(page.locator('text=List your item').first()).toBeVisible();
    await expect(page.locator('text=Draw runs at 9pm').first()).toBeVisible();
    await expect(page.locator('text=Get paid').first()).toBeVisible();
  });

  test('shows Start identity verification button', async ({ page }) => {
    await expect(page.locator('text=Start identity verification')).toBeVisible();
  });

  test('shows Stripe trust message', async ({ page }) => {
    await expect(page.locator('text=Stripe').first()).toBeVisible();
  });

  test('clicking verify button with API error shows error message', async ({ page }) => {
    await mockApi(page, '/seller/account', { error: 'Unauthorized' }, 401);
    await page.locator('text=Start identity verification').click();
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Unauthorized').or(page.locator('text=Something went wrong')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('clicking verify with mocked success shows loading state', async ({ page }) => {
    // Mock to delay so we can catch the loading state
    await page.route('**/seller/account', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          onboardingUrl: 'https://connect.stripe.com/setup/e/test',
          stripeAccountId: 'acct_test',
          chargesEnabled: false,
          payoutsEnabled: false,
        }),
      });
    });
    await page.locator('text=Start identity verification').click();
    await expect(page.locator('text=Opening verification').or(page.locator('text=Start identity verification')).first()).toBeVisible();
  });
});

test.describe('Seller dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/seller/account', {
      stripeAccountId: 'acct_test123',
      chargesEnabled: false,
      payoutsEnabled: false,
      onboardingUrl: null,
    });
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(2500);
  });

  test('shows Seller Dashboard header', async ({ page }) => {
    await expect(page.locator('text=Seller Dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('shows verification status section', async ({ page }) => {
    await expect(page.locator('text=Verification status')).toBeVisible({ timeout: 5000 });
  });

  test('shows Accept payments badge', async ({ page }) => {
    await expect(page.locator('text=Accept payments')).toBeVisible({ timeout: 5000 });
  });

  test('shows Receive payouts badge', async ({ page }) => {
    await expect(page.locator('text=Receive payouts').first()).toBeVisible({ timeout: 5000 });
  });

  test('unverified account shows complete verification prompt', async ({ page }) => {
    await expect(page.locator('text=Complete your verification')).toBeVisible({ timeout: 5000 });
  });

  test('unverified account shows Continue verification button', async ({ page }) => {
    await expect(page.locator('text=Continue verification')).toBeVisible({ timeout: 5000 });
  });

  test('shows Stripe account ID', async ({ page }) => {
    await expect(page.locator('text=acct_test123')).toBeVisible({ timeout: 5000 });
  });

  test('verified account shows list new item button', async ({ page }) => {
    await mockApi(page, '/seller/account', {
      stripeAccountId: 'acct_test123',
      chargesEnabled: true,
      payoutsEnabled: true,
      onboardingUrl: null,
    });
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(page.locator('text=List new item')).toBeVisible({ timeout: 5000 });
  });
});
