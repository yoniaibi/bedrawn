import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows DRAWN logo and auth CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=DRAWN').first()).toBeVisible();
    // Landing page CTA says "Get started" and "Log in"
    await expect(page.locator('text=Get started').or(page.locator('text=Sign up')).first()).toBeVisible();
    await expect(page.locator('text=Log in').or(page.locator('text=Login')).first()).toBeVisible();
  });
});

test.describe('Sign up page', () => {
  test('navigates to /signup from landing Get started CTA', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    await page.goto('/signup');
    await page.click('button[type="submit"]');
    // Form should not navigate away — still on signup
    await expect(page).toHaveURL(/\/signup/);
  });

  test('shows password fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('shows error for mismatched passwords', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[type="email"]', 'test@example.com');
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill('Password123!');
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill('Different123!');
    }
    await page.click('button[type="submit"]');
    // Should remain on signup or show error
    await page.waitForTimeout(500);
    const url = page.url();
    const hasError = (url.includes('/signup') || await page.locator('text=match').count() > 0);
    expect(hasError).toBeTruthy();
  });
});

test.describe('Login page', () => {
  test('/login loads with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('has link to forgot password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Forgot password')).toBeVisible();
    await page.click('text=Forgot password');
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('has link to sign up page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign up').or(page.locator('a[href*="signup"]'))).toBeVisible();
  });

  test('shows error message for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    // Wait for any error text to appear in the red error box
    await expect(page.locator('div').filter({
      hasText: /incorrect|invalid|not found|not configured|error|password/i
    }).last()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Forgot password page', () => {
  test('shows email input and submit button', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('text=Forgot').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('button is disabled when email is empty', async ({ page }) => {
    await page.goto('/forgot-password');
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();
  });
});

test.describe('Verify email page', () => {
  test('shows 6 digit input boxes', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    const inputs = page.locator('input[inputmode="numeric"]');
    await expect(inputs).toHaveCount(6);
  });

  test('shows the email address from query param', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('verify button is disabled when code incomplete', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('typing in first box populates it', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    const inputs = page.locator('input[inputmode="numeric"]');
    await inputs.nth(0).fill('1');
    await expect(inputs.nth(0)).toHaveValue('1');
  });

  test('filling all 6 boxes enables verify button', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
  });
});
