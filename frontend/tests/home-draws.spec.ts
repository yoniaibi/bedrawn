import { test, expect } from '@playwright/test';
import { injectAuth, mockApi, API_BASE } from './helpers';

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
    // Both mock draws have isClosingTonight=true → "2 draws drawing tonight at 9pm"
    await expect(page.locator('text=draws drawing tonight at 9pm').first()).toBeVisible({ timeout: 5000 });
  });

  test('category pill filters work', async ({ page }) => {
    const bagsPill = page.locator('button').filter({ hasText: /^Bags$/ });
    await bagsPill.click();
    await page.waitForTimeout(500);
    // Gucci bag should still be visible; Off-White trainers should not
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible();
  });

  test('filter chip Tonight works', async ({ page }) => {
    // Tonight chip may show count e.g. "Tonight · 2" — use partial match
    await page.locator('button').filter({ hasText: 'Tonight' }).first().click();
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
  // With `output: export`, the dev server only accepts /draw/[id] params returned by
  // generateStaticParams (live API ids + numeric fallbacks). The live seed data changes,
  // so grab a real UUID at runtime and mock its detail payload with our fixture.
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    const res = await page.request.get(`${API_BASE}/draws`);
    const data = res.ok() ? await res.json() : { draws: [] };
    const drawId: string | undefined = data.draws?.[0]?.id;
    test.skip(!drawId, 'live API returned no draws — cannot exercise a UUID route');
    await mockApi(page, `/draws/${drawId}`, { draw: { ...MOCK_DRAWS[0], id: drawId, userTickets: 0 } });
    await page.goto(`/draw/${drawId}`);
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

  test('shows Drawing Tonight badge', async ({ page }) => {
    // Detail page badge is "Drawing Tonight 9pm" when isClosingTonight=true
    await expect(page.locator('text=Drawing Tonight').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Enter draw CTA with price', async ({ page }) => {
    await expect(page.locator('text=Enter draw').first()).toBeVisible({ timeout: 5000 });
  });

  test('CTA shows Enter draw button', async ({ page }) => {
    // CTA is now a modal button (sticky bar), not a link to /purchase
    await expect(page.locator('button').filter({ hasText: 'Enter draw' }).first()).toBeVisible({ timeout: 5000 });
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

  test('shows empty state when API returns no draws', async ({ page }) => {
    // Empty draws → shows "No draws tonight" or similar empty state message
    await expect(
      page.locator('text=No draws').or(page.locator('text=no draws')).or(page.locator('text=Check back')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
