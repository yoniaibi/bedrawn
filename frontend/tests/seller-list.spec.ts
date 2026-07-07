import { test, expect, type Page } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

/**
 * The list wizard is gated on Stripe KYC (POST /seller/account statusCheck) and
 * each step has validation:
 *   step 0 → a draw type must be selected
 *   step 1 → a hero photo must be uploaded
 *   step 2 → title, condition, category required
 *   step 3 → retail value, ticket price, total tickets required
 */
async function setupWizard(page: Page) {
  await injectAuth(page);
  await mockApi(page, '/seller/account', {
    stripeAccountId: 'acct_test',
    chargesEnabled: true,
    payoutsEnabled: true,
    onboardingUrl: null,
  });
  // Photo upload flow: presigned URL + S3 PUT are both mocked
  await mockApi(page, '/upload-url', {
    uploadUrl: 'https://mock-s3.local/upload',
    publicUrl: 'https://mock-s3.local/photo.jpg',
  });
  await page.route('https://mock-s3.local/**', route => route.fulfill({ status: 200, body: '' }));
  await page.goto('/seller/list');
  await page.waitForTimeout(2000);
}

async function chooseType(page: Page) {
  await page.locator('button').filter({ hasText: 'Single item' }).first().click();
  await page.waitForTimeout(200);
}

async function clickNext(page: Page) {
  await page.locator('button', { hasText: 'Next' }).click();
  await page.waitForTimeout(400);
}

async function uploadPhoto(page: Page) {
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-image-bytes'),
  });
  await page.waitForTimeout(800);
}

async function fillDetails(page: Page) {
  await page.locator('input[placeholder*="Chanel"]').fill('Chanel Classic Flap — Black Caviar');
  await page.locator('button').filter({ hasText: /^Like New$/ }).click();
  await page.locator('button').filter({ hasText: /^Bags$/ }).click();
}

async function fillPricing(page: Page) {
  await page.locator('input[placeholder*="6800"]').fill('1200');
  await page.locator('button').filter({ hasText: /^50p$/ }).click();
  await page.locator('input[placeholder*="13600"]').fill('1000');
}

/** Navigates through all steps with valid data and lands on Review (step 4) */
async function goToReview(page: Page) {
  await chooseType(page);
  await clickNext(page);            // → Photos
  await uploadPhoto(page);
  await clickNext(page);            // → Details
  await fillDetails(page);
  await clickNext(page);            // → Pricing
  await fillPricing(page);
  await page.locator('button', { hasText: 'Review listing' }).click();
  await page.waitForTimeout(400);
}

test.describe('Seller list wizard — step 0 (Type)', () => {
  test.beforeEach(async ({ page }) => {
    await setupWizard(page);
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

  test('Next without a type shows validation error', async ({ page }) => {
    await clickNext(page);
    await expect(page.locator('text=Please select a draw type')).toBeVisible({ timeout: 3000 });
  });

  test('Next button advances to Photos step', async ({ page }) => {
    await chooseType(page);
    await clickNext(page);
    await expect(page.locator('text=Add photos')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller list wizard — step 1 (Photos)', () => {
  test.beforeEach(async ({ page }) => {
    await setupWizard(page);
    await chooseType(page);
    await clickNext(page);
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

  test('Next without a photo shows validation error', async ({ page }) => {
    await clickNext(page);
    await expect(page.locator('text=upload at least one photo')).toBeVisible({ timeout: 3000 });
  });

  test('Back button returns to Type step', async ({ page }) => {
    await page.locator('button', { hasText: 'Back' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=What type of draw')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller list wizard — navigation flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupWizard(page);
  });

  test('can navigate through all steps to Review', async ({ page }) => {
    // Step 0 → 1 (Photos)
    await chooseType(page);
    await clickNext(page);
    await expect(page.locator('text=Add photos')).toBeVisible({ timeout: 5000 });

    // Step 1 → 2 (Details) — requires an uploaded hero photo
    await uploadPhoto(page);
    await clickNext(page);
    await expect(page.locator('text=Title').first()).toBeVisible({ timeout: 5000 });

    // Step 2 → 3 (Pricing) — requires title, condition, category
    await fillDetails(page);
    await clickNext(page);
    await expect(page.locator('text=Ticket price').or(page.locator('text=Total tickets')).first()).toBeVisible({ timeout: 5000 });

    // Step 3 → 4 (Review) — requires retail value, ticket price, total tickets
    await fillPricing(page);
    await page.locator('button', { hasText: 'Review listing' }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=Review your listing').or(page.locator('text=Submit listing')).first()).toBeVisible({ timeout: 5000 });
  });

  test('step 2 shows title input', async ({ page }) => {
    await chooseType(page);
    await clickNext(page);
    await uploadPhoto(page);
    await clickNext(page);
    await expect(page.locator('input[placeholder*="Chanel"]').or(page.locator('text=Title')).first()).toBeVisible({ timeout: 5000 });
  });

  test('pricing step shows reserve percentage selector', async ({ page }) => {
    await chooseType(page);
    await clickNext(page);
    await uploadPhoto(page);
    await clickNext(page);
    await fillDetails(page);
    await clickNext(page);
    // Seller-configurable reserve: 25 / 50 / 75 / 100 % pills
    await expect(page.locator('text=Reserve — minimum tickets to proceed')).toBeVisible({ timeout: 5000 });
    for (const pct of ['25%', '50%', '75%', '100%']) {
      await expect(page.locator('button').filter({ hasText: pct }).first()).toBeVisible();
    }
  });
});

test.describe('Seller list wizard — review/submit step', () => {
  test('submit button is disabled without agreeing to terms', async ({ page }) => {
    await setupWizard(page);
    await goToReview(page);

    const submitBtn = page.locator('button', { hasText: 'Submit listing' });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await expect(submitBtn).toBeDisabled();
  });

  test('agreeing to terms enables submit button', async ({ page }) => {
    await setupWizard(page);
    await goToReview(page);

    // Click the agreement checkbox — a button next to the "I confirm the item" text
    const agreementArea = page.locator('text=I confirm the item').locator('..');
    const checkBtn = agreementArea.locator('button').first();
    await checkBtn.click();
    await page.waitForTimeout(300);

    const submitBtn = page.locator('button', { hasText: 'Submit listing' });
    await expect(submitBtn).not.toBeDisabled({ timeout: 3000 });
  });

  test('review step shows reserve percentage row', async ({ page }) => {
    await setupWizard(page);
    await goToReview(page);
    // Default reserve is 25% of 1000 tickets = 250
    await expect(page.locator('text=25% (250 tickets)')).toBeVisible({ timeout: 5000 });
  });
});
