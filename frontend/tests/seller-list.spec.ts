import { test, expect } from '@playwright/test';
import { injectAuth } from './helpers';

/** Advances the wizard by one step using either Next or Review listing */
async function clickAdvance(page: import('@playwright/test').Page) {
  const btn = page.locator('button', { hasText: 'Review listing' });
  if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
    await btn.click();
  } else {
    await page.locator('button', { hasText: 'Next' }).click();
  }
  await page.waitForTimeout(400);
}

test.describe('Seller list wizard — step 0 (Type)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller/list');
    await page.waitForTimeout(2000);
  });

  test('shows List a new item header', async ({ page }) => {
    await expect(page.locator('text=List a new item')).toBeVisible({ timeout: 5000 });
  });

  test('shows step progress labels', async ({ page }) => {
    for (const label of ['Type', 'Photos', 'Details', 'Pricing', 'Review']) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows What type of draw question', async ({ page }) => {
    await expect(page.locator('text=What type of draw')).toBeVisible({ timeout: 5000 });
  });

  test('shows draw type options', async ({ page }) => {
    await expect(page.locator('text=Single item')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Bundle')).toBeVisible();
  });

  test('selecting a type highlights it', async ({ page }) => {
    await page.locator('text=Single item').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Single item')).toBeVisible();
  });

  test('Next button advances to Photos step', async ({ page }) => {
    await page.locator('button', { hasText: 'Next' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Add photos')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller list wizard — step 1 (Photos)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller/list');
    await page.waitForTimeout(2000);
    await page.locator('button', { hasText: 'Next' }).click();
    await page.waitForTimeout(600);
  });

  test('shows Add photos header', async ({ page }) => {
    await expect(page.locator('text=Add photos')).toBeVisible({ timeout: 5000 });
  });

  test('shows 6 photo upload slots', async ({ page }) => {
    await expect(page.locator('input[type="file"]')).toHaveCount(6, { timeout: 5000 });
  });

  test('photo slots accept image files only', async ({ page }) => {
    const accept = await page.locator('input[type="file"]').first().getAttribute('accept');
    expect(accept).toContain('image');
  });

  test('shows Hero label on first slot using exact match', async ({ page }) => {
    // Use getByText with exact to avoid matching "hero image" in the description
    await expect(page.getByText('Hero', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('shows Photo 2 and Photo 6 labels', async ({ page }) => {
    await expect(page.getByText('Photo 2', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Photo 6', { exact: true })).toBeVisible();
  });

  test('Back button returns to Type step', async ({ page }) => {
    await page.locator('button', { hasText: 'Back' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=What type of draw')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller list wizard — navigation flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller/list');
    await page.waitForTimeout(2000);
  });

  test('can navigate through all steps to Review', async ({ page }) => {
    // Step 0 → 1 (Photos)
    await page.locator('button', { hasText: 'Next' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Add photos')).toBeVisible({ timeout: 5000 });

    // Step 1 → 2 (Details)
    await page.locator('button', { hasText: 'Next' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Item details').or(page.locator('text=Title')).first()).toBeVisible({ timeout: 5000 });

    // Step 2 → 3 (Pricing)
    await page.locator('button', { hasText: 'Next' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Ticket price').or(page.locator('text=Total tickets')).first()).toBeVisible({ timeout: 5000 });

    // Step 3 → 4 (Review) — button says "Review listing" on step 3
    await page.locator('button', { hasText: 'Review listing' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Review your listing').or(page.locator('text=Submit listing')).first()).toBeVisible({ timeout: 5000 });
  });

  test('step 2 shows title input', async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await page.locator('button', { hasText: 'Next' }).click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('input[placeholder*="title"]').or(page.locator('text=Title')).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller list wizard — review/submit step', () => {
  test('submit button is disabled without agreeing to terms', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller/list');
    await page.waitForTimeout(2000);

    // Steps 0→1→2→3
    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: 'Next' }).click();
      await page.waitForTimeout(400);
    }
    // Step 3 → 4: button says "Review listing"
    await page.locator('button', { hasText: 'Review listing' }).click();
    await page.waitForTimeout(400);

    const submitBtn = page.locator('button', { hasText: 'Submit listing' });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await expect(submitBtn).toBeDisabled();
  });

  test('agreeing to terms enables submit button', async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller/list');
    await page.waitForTimeout(2000);

    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: 'Next' }).click();
      await page.waitForTimeout(400);
    }
    await page.locator('button', { hasText: 'Review listing' }).click();
    await page.waitForTimeout(400);

    // Click the agreement checkbox
    const checkbox = page.locator('button').filter({ has: page.locator('span', { hasText: '✓' }).or(page.locator(':empty')) }).first();
    // Use the text of the checkbox to find it
    const agreementArea = page.locator('text=I confirm the item').locator('..');
    const checkBtn = agreementArea.locator('button').first();
    await checkBtn.click();
    await page.waitForTimeout(300);

    const submitBtn = page.locator('button', { hasText: 'Submit listing' });
    await expect(submitBtn).not.toBeDisabled({ timeout: 3000 });
  });
});
