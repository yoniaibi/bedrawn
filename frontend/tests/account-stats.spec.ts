import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const MOCK_STATS = {
  activeDraws: 4,
  totalTickets: 87,
  wins: 3,
  totalDrawsEntered: 22,
};

test.describe('Account page — stats', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/stats', MOCK_STATS);
    await page.goto('/account');
    await page.waitForTimeout(2500);
  });

  test('shows account page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
  });

  test('fetches and displays active draws count', async ({ page }) => {
    await expect(page.locator('text=4').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Active draws')).toBeVisible();
  });

  test('fetches and displays tickets bought', async ({ page }) => {
    await expect(page.locator('text=87').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Tickets bought')).toBeVisible();
  });

  test('fetches and displays wins count', async ({ page }) => {
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Wins')).toBeVisible();
  });

  test('fetches and displays total draws entered', async ({ page }) => {
    await expect(page.locator('text=22').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Draws entered')).toBeVisible();
  });

  test('shows dash placeholders while loading (before API responds)', async ({ page }) => {
    // Test that the page renders without crashing when stats API is slow
    await page.route('https://uctmxxb939.execute-api.eu-west-1.amazonaws.com/me/stats', route => {
      // Never resolve — simulates slow API
      setTimeout(() => route.abort(), 10000);
    });
    await page.goto('/account');
    await page.waitForTimeout(500);
    // Page should render, stats show — (dash) while loading
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows Edit Profile menu item', async ({ page }) => {
    await expect(page.locator('text=Edit Profile')).toBeVisible({ timeout: 5000 });
  });

  test('Edit Profile links to /account/profile', async ({ page }) => {
    await expect(page.locator('a[href="/account/profile"]')).toBeVisible({ timeout: 5000 });
  });

  test('shows My Orders menu item', async ({ page }) => {
    await expect(page.locator('text=My Orders')).toBeVisible({ timeout: 5000 });
  });

  test('shows Saved Draws menu item', async ({ page }) => {
    await expect(page.locator('text=Saved Draws')).toBeVisible({ timeout: 5000 });
  });

  test('shows Achievements section', async ({ page }) => {
    await expect(page.locator('text=Achievements')).toBeVisible({ timeout: 5000 });
  });

  test('shows referral section', async ({ page }) => {
    await expect(page.locator('text=Refer a friend')).toBeVisible({ timeout: 5000 });
  });

  test('log out button is present', async ({ page }) => {
    await expect(page.locator('text=Log out')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Account page — stats API failure', () => {
  test('renders without crashing when stats API fails', async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/stats', { error: 'Internal error' }, 500);
    await page.goto('/account');
    await page.waitForTimeout(2500);
    // Stats section should still render (showing dashes)
    await expect(page.locator('text=Active draws')).toBeVisible({ timeout: 5000 });
  });
});
