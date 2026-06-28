import { test, expect } from '@playwright/test';
import { suppressCookieBanner } from './helpers';

test.beforeEach(async ({ page }) => {
  await suppressCookieBanner(page);
});

test.describe('Signup page — handle/username field', () => {
  test('shows Username field with @ prefix', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Username').first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: '@' }).first()).toBeVisible();
  });

  test('handle field accepts valid username', async ({ page }) => {
    await page.goto('/signup');
    const handleInput = page.locator('input[placeholder="yourname"]');
    await handleInput.fill('johnsmith');
    await expect(handleInput).toHaveValue('johnsmith');
  });

  test('handle field lowercases input automatically', async ({ page }) => {
    await page.goto('/signup');
    const handleInput = page.locator('input[placeholder="yourname"]');
    await handleInput.fill('JohnSmith');
    await expect(handleInput).toHaveValue('johnsmith');
  });

  test('handle field strips spaces and special chars', async ({ page }) => {
    await page.goto('/signup');
    const handleInput = page.locator('input[placeholder="yourname"]');
    await handleInput.fill('john smith!');
    await expect(handleInput).toHaveValue('johnsmith');
  });

  test('shows validation error when handle is empty on submit', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Username is required').or(page.locator('text=required')).first()).toBeVisible({ timeout: 3000 });
  });

  test('shows validation error for handle too short (< 3 chars)', async ({ page }) => {
    await page.goto('/signup');
    const handleInput = page.locator('input[placeholder="yourname"]');
    await handleInput.fill('ab');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 3000 });
  });

  test('has all 4 required fields: name, username, email, password', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="yourname"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
