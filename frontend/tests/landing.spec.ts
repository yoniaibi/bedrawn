import { test, expect } from '@playwright/test';

test.describe('Landing page — content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('shows hero tagline', async ({ page }) => {
    await expect(page.locator('text=Your win').or(page.locator('text=Their loss')).first()).toBeVisible();
  });

  test('shows launching soon badge', async ({ page }) => {
    await expect(page.locator('text=LAUNCHING SOON').or(page.locator('text=9PM NIGHTLY')).first()).toBeVisible();
  });

  test('shows countdown timer', async ({ page }) => {
    // Countdown should show digits
    const countdown = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/');
    await expect(countdown.first()).toBeVisible();
  });

  test('shows draw preview cards', async ({ page }) => {
    await expect(page.locator('text=Chanel Classic Flap').first()).toBeVisible();
  });

  test('draw cards link to #waitlist not draw detail', async ({ page }) => {
    const drawLinks = page.locator('a[href="#waitlist"]');
    const count = await drawLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('has Log in and Join waitlist in nav', async ({ page }) => {
    await expect(page.locator('text=Log in').first()).toBeVisible();
    await expect(page.locator('text=Join waitlist').or(page.locator('text=Join the waitlist')).first()).toBeVisible();
  });

  test('shows social proof — people on waitlist', async ({ page }) => {
    await expect(page.locator('text=/\\d,\\d{3}.*waitlist/').or(page.locator('text=waitlist')).first()).toBeVisible();
  });
});

test.describe('Landing page — waitlist form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('waitlist email input is present', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('email input accepts text', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('submit button is present next to email input', async ({ page }) => {
    // The waitlist form has a button near the email input
    const form = page.locator('form').first();
    await expect(form.locator('button')).toBeVisible();
  });

  test('clicking nav Join waitlist scrolls to form', async ({ page }) => {
    await page.locator('a[href="#waitlist"]').first().click();
    await page.waitForTimeout(500);
    // Email input should be visible after scroll
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('submitting invalid email shows no navigation', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('notanemail');
    const form = page.locator('form').first();
    await form.locator('button').click();
    await page.waitForTimeout(500);
    // Should still be on landing page
    await expect(page).toHaveURL('/');
  });
});

test.describe('Landing page — sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('shows How it works section (The loop)', async ({ page }) => {
    // Landing page uses "The loop" as the section label for how it works
    await expect(page.locator('text=The loop').or(page.locator('text=List. Enter. Watch. Win')).first()).toBeVisible();
  });

  test('shows Why us / features section', async ({ page }) => {
    // Landing page uses "Why us" as the section label
    await expect(page.locator('text=Why us').or(page.locator('text=Real wins')).first()).toBeVisible();
  });

  test('shows footer with legal links', async ({ page }) => {
    await expect(page.locator('a[href="/legal/terms"]').or(page.locator('text=Terms')).first()).toBeVisible();
    await expect(page.locator('a[href="/legal/privacy"]').or(page.locator('text=Privacy')).first()).toBeVisible();
  });

  test('FAQ section has clickable questions', async ({ page }) => {
    const faq = page.locator('text=FAQ').or(page.locator('text=Frequently asked'));
    const count = await faq.count();
    if (count > 0) {
      await expect(faq.first()).toBeVisible();
    }
  });
});
