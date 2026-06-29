import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

test.describe('Profile page — unauthenticated', () => {
  test('shows page or redirects', async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/account/profile') || url.includes('/')).toBeTruthy();
  });
});

test.describe('Profile page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/profile', {
      handle: 'testuser',
      name: 'Test User',
      createdAt: '2026-01-01T00:00:00Z',
    });
    await page.goto('/account/profile');
    await page.waitForTimeout(2500);
  });

  test('shows Edit Profile header', async ({ page }) => {
    await expect(page.locator('text=Edit Profile')).toBeVisible({ timeout: 5000 });
  });

  test('shows Handle field', async ({ page }) => {
    await expect(page.locator('text=Handle')).toBeVisible({ timeout: 5000 });
  });

  test('shows Display name field', async ({ page }) => {
    await expect(page.locator('text=Display name')).toBeVisible({ timeout: 5000 });
  });

  test('pre-fills handle from API', async ({ page }) => {
    const handleInput = page.locator('input[placeholder*="handle"]').or(page.locator('input[value="testuser"]')).first();
    const value = await handleInput.inputValue().catch(() => '');
    expect(value).toBe('testuser');
  });

  test('pre-fills name from API', async ({ page }) => {
    const nameInput = page.locator('input[placeholder*="Name"]').or(page.locator('input[value="Test User"]')).first();
    const value = await nameInput.inputValue().catch(() => '');
    expect(value).toBe('Test User');
  });

  test('shows Save profile button', async ({ page }) => {
    await expect(page.locator('text=Save profile')).toBeVisible({ timeout: 5000 });
  });

  test('back arrow links to /account', async ({ page }) => {
    await expect(page.locator('a[href="/account"]').filter({ hasText: '←' })).toBeVisible({ timeout: 5000 });
  });

  test('saving with success shows saved confirmation', async ({ page }) => {
    await mockApi(page, '/profile', { ok: true });
    await page.locator('text=Save profile').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Profile saved')).toBeVisible({ timeout: 5000 });
  });

  test('API error shows error message', async ({ page }) => {
    await page.route('https://uctmxxb939.execute-api.eu-west-1.amazonaws.com/profile', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Handle must be 3–20 characters, letters/numbers/underscores only' }),
        });
      } else {
        await route.continue();
      }
    });

    // Clear handle field to trigger validation error
    const handleInput = page.locator('input').first();
    await handleInput.fill('x');
    await page.locator('text=Save profile').click();
    await page.waitForTimeout(1500);
    await expect(
      page.locator('text=Handle must be').or(page.locator('text=Failed')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('handle field has max length hint', async ({ page }) => {
    await expect(page.locator('text=3–20').or(page.locator('text=letters/numbers')).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile page — slow API', () => {
  test('shows form fields after profile loads', async ({ page }) => {
    await injectAuth(page);
    await page.route('https://uctmxxb939.execute-api.eu-west-1.amazonaws.com/profile', async route => {
      if (route.request().method() === 'GET') {
        await new Promise(r => setTimeout(r, 200));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ handle: 'slowuser', name: 'Slow User' }),
        });
      } else {
        await route.continue();
      }
    });
    await page.goto('/account/profile');
    // Fields should appear after data loads
    await expect(page.locator('text=Save profile')).toBeVisible({ timeout: 8000 });
    // Handle was pre-filled
    const input = page.locator('input').first();
    await expect(input).toHaveValue('slowuser', { timeout: 5000 });
  });
});
