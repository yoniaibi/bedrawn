import { test, expect } from '@playwright/test';

test.describe('Public routes load', () => {
  test('/ loads landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toHaveText(/Error/);
  });

  test('/login loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('/signup loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('/forgot-password loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('/verify-email loads with query param', async ({ page }) => {
    await page.goto('/verify-email?email=hello@bedrawn.app');
    await expect(page.locator('text=hello@bedrawn.app')).toBeVisible();
  });

  test('/legal/terms loads', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page.locator('text=Terms of Service').first()).toBeVisible();
  });

  test('/legal/privacy loads', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('text=Privacy Policy').first()).toBeVisible();
  });

  test('/seller loads', async ({ page }) => {
    await page.goto('/seller');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toHaveText(/Error/);
  });

  test('/seller/dashboard loads', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toHaveText(/Error/);
  });

  test('/account/wallet loads', async ({ page }) => {
    await page.goto('/account/wallet');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toHaveText(/Error/);
  });
});

test.describe('Landing page navigation', () => {
  test('has Log in link that goes to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('landing page has no /signup link (waitlist only)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    // Landing is waitlist-mode — no direct signup CTA
    const signupLinks = await page.locator('a[href*="signup"]').count();
    expect(signupLinks).toBe(0);
  });

  test('Logo on login page links back to /', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('Logo on signup page links back to /', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Legal pages', () => {
  test('terms page has numbered sections', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page.locator('text=1. Introduction')).toBeVisible();
  });

  test('privacy page has data sections', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('text=1. Who We Are')).toBeVisible();
  });
});
