import { test, expect } from '@playwright/test';
import { injectAuth, mockApi, suppressCookieBanner } from './helpers';

const CHANEL_AUTH_DRAW = {
  id: '1',
  title: 'Chanel Classic Flap Bag — Black Caviar',
  seller: 'luxe_closet',
  sellerId: 'demo-seller-luxe-closet',
  sellerName: 'Luxe Closet',
  sellerEmoji: '💎',
  ticketPrice: 50,
  retailValue: 6800,
  totalTickets: 13600,
  soldTickets: 11220,
  category: 'Bags',
  style: 'Womenswear',
  condition: 'Like New',
  isBundle: false,
  isClosingTonight: true,
  isVerified: true,
  reserveTickets: 9520,
  minThreshold: 0.70,
  description: 'Iconic Chanel Classic Flap in black caviar leather.',
  imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=600&fit=crop',
  tags: ['Chanel', 'Designer'],
  status: 'open',
  closingDate: '2026-12-31',
  brandId: 'chanel',
  sellerTier: 'founding',
  auth: {
    provider: 'legit_app',
    tier: 'photo',
    status: 'passed',
    certificateRef: 'LA-2026-001',
    checkedAt: '2026-06-01T12:00:00Z',
  },
};

// ---------------------------------------------------------------------------
// Feature 1: Home page — brand chips
// ---------------------------------------------------------------------------
test.describe('Home page — brand chips', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: [CHANEL_AUTH_DRAW] });
    await page.goto('/home', { timeout: 8000 });
    await page.waitForTimeout(2000);
  });

  test('shows Chanel brand chip', async ({ page }) => {
    await expect(page.locator('text=Chanel').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Louis Vuitton brand chip', async ({ page }) => {
    await expect(page.locator('text=Louis Vuitton').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Drawing Tonight chip', async ({ page }) => {
    await expect(page.locator('text=Drawing Tonight').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking High Value chip updates grid title to "High Value Bags"', async ({ page }) => {
    const chip = page.locator('button', { hasText: 'High Value' }).first()
      .or(page.locator('text=High Value').first());
    await expect(chip).toBeVisible({ timeout: 5000 });
    await chip.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=High Value Bags').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Chanel chip updates grid title to "Chanel"', async ({ page }) => {
    const chip = page.locator('button').filter({ hasText: /^Chanel$/ }).first();
    await expect(chip).toBeVisible({ timeout: 5000 });
    await chip.click();
    await page.waitForTimeout(500);
    // Grid title should now show "Chanel" — check the h2 section title
    await expect(
      page.locator('h2').filter({ hasText: /^Chanel$/ }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('old generic category chips are gone', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Womenswear' })).toHaveCount(0);
    await expect(page.locator('button', { hasText: 'Menswear' })).toHaveCount(0);
    await expect(page.locator('button', { hasText: 'Streetwear' })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Feature 2: Home page — threshold countdown on draw cards
// ---------------------------------------------------------------------------
test.describe('Home page — threshold countdown on draw cards', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: [CHANEL_AUTH_DRAW] });
    await page.goto('/home', { timeout: 8000 });
    await page.waitForTimeout(2000);
  });

  test('draw cards show a threshold countdown line', async ({ page }) => {
    const thresholdLine = page.locator('text=/more tickets needed|Draw confirmed|Sold out/i').first();
    await expect(thresholdLine).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Feature 3: Home page — Designer Bags row
// ---------------------------------------------------------------------------
test.describe('Home page — Designer Bags row', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: [CHANEL_AUTH_DRAW] });
    await page.goto('/home', { timeout: 8000 });
    await page.waitForTimeout(2000);
  });

  test('shows Designer Bags heading', async ({ page }) => {
    await expect(page.locator('text=Designer Bags').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows "Sell yours" link to /sell-your-bag', async ({ page }) => {
    const sellLink = page.locator('a[href="/sell-your-bag"]').first()
      .or(page.locator('text=/Sell yours/i').first());
    await expect(sellLink).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Feature 4: Draw cards — auth badge
// ---------------------------------------------------------------------------
test.describe('Draw cards — auth badge', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: [CHANEL_AUTH_DRAW] });
    await page.goto('/home', { timeout: 8000 });
    await page.waitForTimeout(2000);
  });

  test('shows an auth or verified badge on at least one card', async ({ page }) => {
    const badge = page.locator('span').filter({ hasText: '✓ AUTH' }).first()
      .or(page.locator('span').filter({ hasText: '✓ verified' }).first());
    await expect(badge).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Feature 5: /sell-your-bag page — structure
// ---------------------------------------------------------------------------
test.describe('/sell-your-bag page — structure', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
  });

  test('page loads with 200', async ({ page }) => {
    const response = await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    expect(response?.status()).toBe(200);
  });

  test('shows "Sell your designer bag" heading', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Sell your designer bag').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows payout widget heading "See what you\'d earn"', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(
      page.locator("text=See what you'd earn").first()
        .or(page.locator('text=/See what you.d earn/i').first())
    ).toBeVisible({ timeout: 5000 });
  });

  test('has retail value input', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    const input = page.locator('input[type="number"]').first()
      .or(page.locator('input[name*="retail" i], input[placeholder*="value" i], input[placeholder*="retail" i]').first());
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('payout comparison includes bedrawn', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/bedrawn/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('payout comparison includes Vestiaire', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/Vestiaire/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows "How it works" section', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/How it works/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows authentication trust signal', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    const trust = page.locator('text=/100% authenticated/i').first()
      .or(page.locator('text=/authenticated/i').first());
    await expect(trust).toBeVisible({ timeout: 5000 });
  });

  test('shows Chanel brand chip on page', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Chanel').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows "List my bag" CTA link', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/List my bag/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows bottom CTA "Ready to list"', async ({ page }) => {
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/Ready to list/i').first()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Feature 6: /sell-your-bag — payout calculation
// ---------------------------------------------------------------------------
test.describe('/sell-your-bag — payout calculation', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/sell-your-bag', { timeout: 8000 });
    await page.waitForTimeout(2000);
  });

  test('retail value 1000 shows ~£863 for bedrawn and ~£800 for Vestiaire', async ({ page }) => {
    const input = page.locator('input[type="number"]').first()
      .or(page.locator('input[name*="retail" i], input[placeholder*="value" i], input[placeholder*="retail" i]').first());
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('1000');
    await page.waitForTimeout(500);

    // bedrawn payout: 1000 - 12% - £17 = £863
    await expect(page.locator('text=/£\\s?863/').first()).toBeVisible({ timeout: 5000 });
    // Vestiaire payout: 1000 * 0.80 = £800
    await expect(page.locator('text=/£\\s?800/').first()).toBeVisible({ timeout: 5000 });
  });

  test('bedrawn payout is presented before Vestiaire (highlighted first)', async ({ page }) => {
    const input = page.locator('input[type="number"]').first()
      .or(page.locator('input[name*="retail" i], input[placeholder*="value" i], input[placeholder*="retail" i]').first());
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('1000');
    await page.waitForTimeout(500);

    const content = await page.content();
    const bedrawnIdx = content.toLowerCase().indexOf('bedrawn');
    const vestiaireIdx = content.toLowerCase().indexOf('vestiaire');
    expect(bedrawnIdx).toBeGreaterThan(-1);
    expect(vestiaireIdx).toBeGreaterThan(-1);
    expect(bedrawnIdx).toBeLessThan(vestiaireIdx);
  });
});

// ---------------------------------------------------------------------------
// Feature 7: /draws-history page (web)
// ---------------------------------------------------------------------------
test.describe('/draws-history page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
  });

  test('loads without error and shows "Past Draws" heading', async ({ page }) => {
    const response = await page.goto('/draws-history', { timeout: 8000 });
    await page.waitForTimeout(2000);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('text=/Past Draws/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('does not show 404', async ({ page }) => {
    await page.goto('/draws-history', { timeout: 8000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/404|not found/i')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Feature 8: Home page mock API — draws with auth field
// ---------------------------------------------------------------------------
test.describe('Home page — mocked draw with auth.status passed', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: [CHANEL_AUTH_DRAW] });
    await page.goto('/home', { timeout: 8000 });
    await page.waitForTimeout(2000);
  });

  test('mocked Chanel draw renders with AUTH badge', async ({ page }) => {
    // The mocked draw title should render
    await expect(
      page.locator('text=Chanel Classic Flap Bag').first()
        .or(page.locator('text=Chanel').first())
    ).toBeVisible({ timeout: 5000 });

    // auth.status === 'passed' → "✓ AUTH" badge on the draw card
    const badge = page.locator('span').filter({ hasText: '✓ AUTH' }).first()
      .or(page.locator('span').filter({ hasText: '✓ verified' }).first());
    await expect(badge).toBeVisible({ timeout: 5000 });
  });
});
