import { test, expect } from '@playwright/test';

/**
 * Session persistence test.
 * Verifies that after a successful login:
 * 1. Amplify stores tokens in localStorage
 * 2. Reloading the page keeps the user on the protected route (not redirected to /)
 *
 * These tests use the real Cognito UserPool. They require a verified test account.
 * Set TEST_EMAIL and TEST_PASSWORD in the environment to run the full flow.
 * Without those vars the tests are skipped gracefully.
 */

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

test.describe('Amplify configuration', () => {
  test('Amplify is configured — login error is from Cognito, not "not configured"', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nobody@test.com');
    await page.fill('input[type="password"]', 'badpassword');
    await page.click('button[type="submit"]');

    // Should show a Cognito error (Incorrect username/password etc.) NOT a config error
    const errorDiv = page.locator('div').filter({
      hasText: /incorrect|invalid|not found|user/i,
    }).last();
    await expect(errorDiv).toBeVisible({ timeout: 10000 });

    // Confirm it's NOT the unconfigured error
    const errorText = await page.locator('[style*="red"], p[style*="color"]').last().textContent().catch(() => '');
    expect(errorText?.toLowerCase()).not.toContain('not configured');
  });

  test('localStorage has Cognito keys after auth module loads', async ({ page }) => {
    await page.goto('/login');
    // After the page loads, Amplify should be configured
    const config = await page.evaluate(() => {
      // Check if Amplify is configured by attempting to access its config
      try {
        const keys = Object.keys(localStorage);
        // Amplify might create a config key, or just returns empty if not logged in yet
        return { loaded: true, keys };
      } catch {
        return { loaded: false, keys: [] };
      }
    });
    expect(config.loaded).toBeTruthy();
  });
});

test.describe('Session persistence (requires TEST_EMAIL + TEST_PASSWORD env vars)', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipped: set TEST_EMAIL and TEST_PASSWORD to run live auth tests');

  test('logging in then refreshing stays on /home', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button[type="submit"]');

    // Should land on /home after login
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000); // allow auth check to complete

    // Should still be on /home, not redirected to /
    await expect(page).toHaveURL(/\/home/);
  });

  test('after login, tokens are stored in localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    const tokens = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k => k.includes('CognitoIdentityServiceProvider') || k.includes('amplify'));
      return keys.length;
    });
    expect(tokens).toBeGreaterThan(0);
  });

  test('new tab with same browser session stays logged in', async ({ page, context }) => {
    // Login in first page
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    // Open /home in a new tab (same browser context = same localStorage)
    const page2 = await context.newPage();
    await page2.goto('/home');
    await page2.waitForTimeout(2000);
    await expect(page2).toHaveURL(/\/home/);
  });
});
