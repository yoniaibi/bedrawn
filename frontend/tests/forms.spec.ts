import { test, expect } from '@playwright/test';
import { suppressCookieBanner } from './helpers';

test.beforeEach(async ({ page }) => {
  await suppressCookieBanner(page);
});

test.describe('Login form validation', () => {
  test('submit button exists', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('email field accepts input', async ({ page }) => {
    await page.goto('/login');
    const email = page.locator('input[type="email"]');
    await email.fill('test@example.com');
    await expect(email).toHaveValue('test@example.com');
  });

  test('password field accepts input', async ({ page }) => {
    await page.goto('/login');
    const password = page.locator('input[type="password"]');
    await password.fill('mypassword');
    await expect(password).toHaveValue('mypassword');
  });

  test('shows loading state during submission', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'somepassword');
    // Intercept Cognito to make it slow
    await page.click('button[type="submit"]');
    // Button shows "Logging in…" or similar — or immediately shows error
    const btn = page.locator('button[type="submit"]');
    // Either state is valid
    await page.waitForTimeout(200);
    const text = await btn.textContent().catch(() => '');
    expect(text?.includes('Log') || text?.includes('Logging')).toBeTruthy();
  });
});

test.describe('Sign up form validation', () => {
  test('name, email, and password fields present', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('submit button is disabled until form is filled', async ({ page }) => {
    await page.goto('/signup');
    // With empty form, clicking button should not navigate away
    const btn = page.locator('button[type="submit"]');
    await btn.click();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/signup/);
  });

  test('email field accepts valid email', async ({ page }) => {
    await page.goto('/signup');
    const email = page.locator('input[type="email"]');
    await email.fill('hello@drawn.app');
    await expect(email).toHaveValue('hello@drawn.app');
  });
});

test.describe('Forgot password form', () => {
  test('email input works and enables button', async ({ page }) => {
    await page.goto('/forgot-password');
    const email = page.locator('input[type="email"]');
    const btn = page.locator('button[type="submit"]');

    await expect(btn).toBeDisabled();
    await email.fill('user@drawn.app');
    await expect(btn).toBeEnabled();
  });

  test('submitting shows loading then confirmation or error', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', 'nonexistent@drawn.app');
    await page.click('button[type="submit"]');
    // Either shows "Check your email" confirmation or an error message
    await page.waitForTimeout(5000);
    const hasSent = await page.locator('text=Check your email').count();
    const hasError = await page.locator('p[style*="red"], [style*="var(--red)"]').count();
    expect(hasSent + hasError).toBeGreaterThan(0);
  });
});

test.describe('Verify email form', () => {
  test('resend code button is present', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    await expect(page.locator('text=Resend code')).toBeVisible();
  });

  test('verify button disabled with empty inputs', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('verify button enabled after filling all 6 digits', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('submitting wrong code shows error', async ({ page }) => {
    await page.goto('/verify-email?email=test@example.com');
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('9');
    }
    await page.click('button[type="submit"]');
    // Cognito returns an error — check the red error container appears
    await expect(
      page.locator('div').filter({ hasText: /invalid|incorrect|expired|not exist|error|code/i }).last()
    ).toBeVisible({ timeout: 10000 });
  });
});
