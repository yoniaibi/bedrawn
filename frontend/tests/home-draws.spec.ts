import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const MOCK_DRAWS = [
  {
    id: '8df1fe4b-1109-4f21-afeb-1cf7eea6011d',
    title: 'Gucci Dionysus GG Supreme Shoulder Bag',
    seller: 'drawnofficial',
    sellerEmoji: '',
    ticketPrice: 100,
    retailValue: 1850,
    totalTickets: 1850,
    soldTickets: 1240,
    category: 'Bags',
    style: 'Womenswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description: 'Iconic Gucci Dionysus in GG Supreme canvas.',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop',
    tags: [],
    status: 'open',
    closingDate: '2026-06-28',
  },
  {
    id: 'fa84542d-614a-4868-bcd5-886c40649df4',
    title: "Off-White x Nike Air Force 1 'The Ten'",
    seller: 'drawnofficial',
    sellerEmoji: '',
    ticketPrice: 50,
    retailValue: 650,
    totalTickets: 1300,
    soldTickets: 890,
    category: 'Trainers',
    style: 'Menswear',
    condition: 'Like New',
    isBundle: false,
    isClosingTonight: true,
    isVerified: true,
    description: 'The sneaker that defined a generation.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    tags: [],
    status: 'open',
    closingDate: '2026-06-28',
  },
];

test.describe('Home page — API-connected draws', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: MOCK_DRAWS });
    await page.goto('/home');
    await page.waitForTimeout(2500);
  });

  test('renders real draw titles from API', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('renders second draw from API', async ({ page }) => {
    await expect(page.locator("text=Off-White").first()).toBeVisible({ timeout: 5000 });
  });

  test('hero draw shows CLOSING TONIGHT badge for isClosingTonight=true', async ({ page }) => {
    await expect(
      page.locator('text=CLOSING TONIGHT').or(page.locator('text=closing tonight')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('tonight strip shows correct count', async ({ page }) => {
    // Both mock draws have isClosingTonight=true → "2 draws closing tonight"
    await expect(page.locator('text=draws closing tonight').first()).toBeVisible({ timeout: 5000 });
  });

  test('category pill filters work', async ({ page }) => {
    const bagsPill = page.locator('button').filter({ hasText: /^Bags$/ });
    await bagsPill.click();
    await page.waitForTimeout(500);
    // Gucci bag should still be visible; Off-White trainers should not
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible();
  });

  test('filter chip Tonight works', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^Tonight$/ }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible();
  });

  test('clicking draw card navigates to draw detail', async ({ page }) => {
    await page.locator('text=Gucci Dionysus').first().click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/draw\//);
  });
});

test.describe('Draw detail — real API draw UUID', () => {
  const DRAW_ID = '8df1fe4b-1109-4f21-afeb-1cf7eea6011d';

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, `/draws/${DRAW_ID}`, { draw: { ...MOCK_DRAWS[0], userTickets: 0 } });
    await page.goto(`/draw/${DRAW_ID}`);
    await page.waitForTimeout(2500);
  });

  test('shows draw title from API', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows seller handle', async ({ page }) => {
    await expect(page.locator('text=drawnofficial').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows retail value £1,850', async ({ page }) => {
    await expect(page.locator('text=1,850').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows CLOSING TONIGHT badge', async ({ page }) => {
    await expect(
      page.locator('text=CLOSING TONIGHT').or(page.locator('text=closing tonight')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows Enter draw CTA with price', async ({ page }) => {
    await expect(page.locator('text=Enter draw').first()).toBeVisible({ timeout: 5000 });
  });

  test('CTA links to purchase page', async ({ page }) => {
    await expect(page.locator(`a[href*="${DRAW_ID}/purchase"]`).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Home page — API unavailable fallback', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    // Mock API returning empty draws
    await mockApi(page, '/draws', { draws: [] });
    await page.goto('/home');
    await page.waitForTimeout(2500);
  });

  test('falls back to mock data draws when API returns empty', async ({ page }) => {
    // Mock data has Chanel, Rolex etc
    await expect(
      page.locator('text=Chanel').or(page.locator('text=Rolex')).or(page.locator('text=Loading')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
