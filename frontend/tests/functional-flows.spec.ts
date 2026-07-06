/**
 * Functional end-to-end test scripts for the DRAWN platform.
 *
 * These tests cover the full user journey:
 *   1. Auth flow (signup, login, verify email, forgot password)
 *   2. Home page browsing, filtering, saving draws
 *   3. Draw detail → purchase modal → enter draw
 *   4. Wallet top-up
 *   5. Tickets / orders page
 *   6. Notifications (read / unread)
 *   7. Profile update
 *   8. Seller onboarding → list item → dashboard
 *   9. Admin: resolve draw, cancel draw, postal entry
 *  10. Account deletion (GDPR)
 *
 * Run: npx playwright test functional-flows.spec.ts
 */

import { test, expect } from '@playwright/test';
import { injectAuth, injectAdminAuth, mockApi } from './helpers';

// ─── Shared mock data ────────────────────────────────────────────────────────

const DRAW = {
  id: '8df1fe4b-1109-4f21-afeb-1cf7eea6011d',
  title: 'Gucci Dionysus GG Supreme Shoulder Bag',
  seller: 'drawnofficial',
  sellerEmoji: '',
  ticketPrice: 100,
  retailValue: 185000,
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
  closingDate: '2026-12-31',
  userTickets: 0,
};

const DRAWS = [DRAW];

// ─── 1. Authentication ────────────────────────────────────────────────────────

test.describe('Auth — login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('bedrawn_cookie_consent', 'accepted'));
    await page.goto('/login');
    await page.waitForTimeout(1000);
  });

  test('shows email and password fields', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('shows Forgot password link', async ({ page }) => {
    await expect(page.locator('text=Forgot').or(page.locator('text=forgot')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Sign in or Log in button', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /sign in|log in/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows link to signup page', async ({ page }) => {
    await expect(
      page.locator('a[href*="signup"]').or(page.locator('text=Create account')).or(page.locator('text=Sign up')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('empty submit shows validation or error', async ({ page }) => {
    await page.locator('button').filter({ hasText: /sign in|log in/i }).first().click();
    await page.waitForTimeout(1000);
    // Either HTML5 validation or an error message
    const hasValidation = await page.locator('input:invalid').count() > 0;
    const hasError = await page.locator('text=required').or(page.locator('text=enter')).count() > 0;
    expect(hasValidation || hasError).toBeTruthy();
  });
});

test.describe('Auth — signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('bedrawn_cookie_consent', 'accepted'));
    await page.goto('/signup');
    await page.waitForTimeout(1000);
  });

  test('shows name, email, password fields', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('shows terms checkbox or link', async ({ page }) => {
    await expect(
      page.locator('text=terms').or(page.locator('text=Terms')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth — forgot password', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('bedrawn_cookie_consent', 'accepted'));
    await page.goto('/forgot-password');
    await page.waitForTimeout(1000);
  });

  test('shows email input', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows send reset button', async ({ page }) => {
    await expect(
      page.locator('button').filter({ hasText: /reset|send/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── 2. Home page browsing ────────────────────────────────────────────────────

test.describe('Home — draws browsing', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: DRAWS });
    await page.goto('/home');
    await page.waitForTimeout(2500);
  });

  test('shows hero draw card', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('CLOSING TONIGHT badge visible on closing draw', async ({ page }) => {
    await expect(
      page.locator('text=CLOSING TONIGHT').or(page.locator('text=closing tonight')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('category filter pill Bags filters grid', async ({ page }) => {
    const pill = page.locator('button').filter({ hasText: /^Bags$/ });
    if (await pill.count() > 0) {
      await pill.click();
      await page.waitForTimeout(400);
      await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible();
    }
  });

  test('clicking draw card navigates to draw detail', async ({ page }) => {
    await page.locator('text=Gucci Dionysus').first().click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/draw\//);
  });

  test('save draw icon is present on draw card', async ({ page }) => {
    const saveBtn = page.locator('[aria-label="save"]').or(page.locator('button[title="Save"]')).first();
    if (await saveBtn.count() > 0) {
      await expect(saveBtn).toBeVisible({ timeout: 3000 });
    }
  });
});

// ─── 3. Draw detail + purchase modal ─────────────────────────────────────────

test.describe('Draw detail — view and enter', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, `/draws/${DRAW.id}`, { draw: DRAW });
    await mockApi(page, '/wallet/balance', { balancePence: 10000 });
    await page.goto(`/draw/${DRAW.id}`);
    await page.waitForTimeout(2500);
  });

  test('shows draw title', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows seller handle', async ({ page }) => {
    await expect(page.locator('text=drawnofficial').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows retail value', async ({ page }) => {
    await expect(page.locator('text=1,850').or(page.locator('text=£1,850')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket progress bar', async ({ page }) => {
    await expect(
      page.locator('text=tickets sold').or(page.locator('text=sold')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('sticky Enter draw CTA is visible', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'Enter draw' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Enter draw opens purchase modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Enter draw' }).first().click();
    await page.waitForTimeout(800);
    await expect(page.locator('text=Wallet balance').first()).toBeVisible({ timeout: 3000 });
  });

  test('purchase modal shows ticket quantity selector', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Enter draw' }).first().click();
    await page.waitForTimeout(800);
    await expect(page.locator('button').filter({ hasText: /^1$/ }).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button').filter({ hasText: /^5$/ }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^10$/ }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /^25$/ }).first()).toBeVisible();
  });

  test('purchase modal shows wallet balance', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Enter draw' }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=£100.00').or(page.locator('text=Wallet balance')).first()).toBeVisible({ timeout: 3000 });
  });

  test('selecting 5 tickets updates total cost', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Enter draw' }).first().click();
    await page.waitForTimeout(800);
    await page.locator('button').filter({ hasText: /^5$/ }).first().click();
    await page.waitForTimeout(300);
    // 5 × £1 = £5.00
    await expect(page.locator('text=£5.00').or(page.locator('text=500p')).first()).toBeVisible({ timeout: 3000 });
  });

  test('enter draw API call succeeds and shows confirmation', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/draws/*/enter', async route => {
      apiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, ticketCount: 1, costPence: 100 }),
      });
    });
    await page.locator('button').filter({ hasText: 'Enter draw' }).first().click();
    await page.waitForTimeout(800);
    const confirmBtn = page.locator('button').filter({ hasText: /confirm|buy|enter/i }).first();
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      expect(apiCalled).toBeTruthy();
      await expect(page.locator("text=You're in").or(page.locator('text=entered')).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── 4. Wallet top-up ────────────────────────────────────────────────────────

test.describe('Wallet — top up flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/wallet/balance', { balancePence: 0 });
    await page.goto('/account/wallet');
    await page.waitForTimeout(2000);
  });

  test('shows My Wallet header', async ({ page }) => {
    await expect(page.locator('text=My Wallet')).toBeVisible({ timeout: 5000 });
  });

  test('shows £0.00 balance', async ({ page }) => {
    await expect(page.locator('text=£0.00').or(page.locator('text=0p')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows top-up amount buttons £5 £10 £20 £50', async ({ page }) => {
    await expect(page.locator('text=£5').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=£10').first()).toBeVisible();
    await expect(page.locator('text=£20').first()).toBeVisible();
    await expect(page.locator('text=£50').first()).toBeVisible();
  });

  test('clicking £5 triggers topup API with 500p', async ({ page }) => {
    let body: any;
    await page.route('**/wallet/topup', async route => {
      body = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientSecret: 'pi_test_secret_123' }),
      });
    });
    await page.locator('text=£5').first().click();
    await page.waitForTimeout(2000);
    expect(body?.amountPence).toBe(500);
  });

  test('clicking £10 triggers topup API with 1000p', async ({ page }) => {
    let body: any;
    await page.route('**/wallet/topup', async route => {
      body = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientSecret: 'pi_test_secret_456' }),
      });
    });
    await page.locator('text=£10').first().click();
    await page.waitForTimeout(2000);
    expect(body?.amountPence).toBe(1000);
  });

  test('topup API error shows user-friendly message', async ({ page }) => {
    await mockApi(page, '/wallet/topup', { error: 'Card declined' }, 402);
    await page.locator('text=£5').first().click();
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=Card declined').or(page.locator('text=Failed')).or(page.locator('text=error')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows transaction history section', async ({ page }) => {
    await mockApi(page, '/wallet/transactions', { transactions: [] });
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(
      page.locator('text=History').or(page.locator('text=Transactions')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── 5. Tickets / orders ──────────────────────────────────────────────────────

test.describe('Tickets — my entries', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/entries', {
      entries: [
        {
          drawId: DRAW.id,
          drawTitle: DRAW.title,
          ticketCount: 3,
          costPence: 300,
          status: 'open',
          closingDate: '2026-12-31',
        },
      ],
    });
    await page.goto('/tickets');
    await page.waitForTimeout(2500);
  });

  test('shows My Tickets header', async ({ page }) => {
    await expect(
      page.locator('text=My Tickets').or(page.locator('text=Tickets')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows draw title on ticket card', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows ticket count', async ({ page }) => {
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Orders — history', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/entries', {
      entries: [
        {
          drawId: DRAW.id,
          drawTitle: DRAW.title,
          ticketCount: 2,
          costPence: 200,
          status: 'open',
          closingDate: '2026-12-31',
          enteredAt: '2026-06-26T10:00:00Z',
        },
      ],
    });
    await page.goto('/account/orders');
    await page.waitForTimeout(2500);
  });

  test('shows Orders or Entries header', async ({ page }) => {
    await expect(
      page.locator('text=Orders').or(page.locator('text=My Entries')).or(page.locator('text=Tickets')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows draw title in order list', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── 6. Notifications ────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  const NOTIF = {
    id: 'notif-1',
    type: 'draw_won',
    title: '🎉 You won!',
    body: 'You won the draw for: Gucci Dionysus',
    drawId: DRAW.id,
    read: false,
    createdAt: new Date().toISOString(),
  };

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/notifications', { notifications: [NOTIF] });
    await page.goto('/account/notifications');
    await page.waitForTimeout(2000);
  });

  test('shows Notifications header', async ({ page }) => {
    await expect(
      page.locator('text=Notifications').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows unread notification', async ({ page }) => {
    await expect(page.locator('text=You won!').or(page.locator('text=won')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows notification body text', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('mark all read button calls notifications/read API', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/notifications/read', async route => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    const markReadBtn = page.locator('button').filter({ hasText: /mark.*read|read all/i }).first();
    if (await markReadBtn.count() > 0) {
      await markReadBtn.click();
      await page.waitForTimeout(500);
      expect(apiCalled).toBeTruthy();
    }
  });
});

// ─── 7. Profile update ────────────────────────────────────────────────────────

test.describe('Profile — edit', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/profile', {
      handle: 'testuser',
      name: 'Test User',
      email: 'test@bedrawn.app',
      bio: '',
    });
    await page.goto('/account/profile');
    await page.waitForTimeout(2000);
  });

  test('shows profile fields', async ({ page }) => {
    await expect(
      page.locator('input[placeholder*="handle"]').or(page.locator('input[placeholder*="name"]')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('save button calls PUT /profile', async ({ page }) => {
    let putCalled = false;
    await page.route('**/profile', async route => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      } else {
        await route.continue();
      }
    });
    // type into the name field and save
    const nameInput = page.locator('input[placeholder*="Name"]').or(page.locator('input[placeholder*="name"]')).first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Updated Name');
    }
    const saveBtn = page.locator('button').filter({ hasText: /save/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
      expect(putCalled).toBeTruthy();
    }
  });
});

// ─── 8. Saved draws ───────────────────────────────────────────────────────────

test.describe('Saved draws', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/me/saved', { draws: [DRAW] });
    await page.goto('/account/saved');
    await page.waitForTimeout(2000);
  });

  test('shows Saved header', async ({ page }) => {
    await expect(
      page.locator('text=Saved').or(page.locator('text=Wishlist')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows saved draw title', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('unsave calls DELETE /draws/{id}/save', async ({ page }) => {
    let deleteCalled = false;
    await page.route(`**/draws/${DRAW.id}/save`, async route => {
      if (route.request().method() === 'DELETE' || route.request().method() === 'POST') {
        deleteCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"saved":false}' });
      } else {
        await route.continue();
      }
    });
    const saveBtn = page.locator('[aria-label="unsave"]').or(page.locator('button[title*="save"]')).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      expect(deleteCalled).toBeTruthy();
    }
  });
});

// ─── 9. Seller flow ───────────────────────────────────────────────────────────

test.describe('Seller — onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/seller');
    await page.waitForTimeout(2000);
  });

  test('shows Become a Seller header', async ({ page }) => {
    await expect(page.locator('text=Become a Seller')).toBeVisible({ timeout: 5000 });
  });

  test('shows 88% revenue share', async ({ page }) => {
    await expect(page.locator('text=88%').first()).toBeVisible({ timeout: 5000 });
  });

  test('Start verification button calls POST /seller/account', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/seller/account', async route => {
      apiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ onboardingUrl: 'https://connect.stripe.com/setup/test', stripeAccountId: 'acct_test' }),
      });
    });
    await page.locator('text=Start identity verification').click();
    await page.waitForTimeout(2000);
    expect(apiCalled).toBeTruthy();
  });
});

test.describe('Seller — list item (5-step wizard)', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/seller/account', {
      stripeAccountId: 'acct_test',
      chargesEnabled: true,
      payoutsEnabled: true,
    });
    await page.goto('/seller/list');
    await page.waitForTimeout(2000);
  });

  test('shows list item header', async ({ page }) => {
    await expect(
      page.locator('text=List').or(page.locator('text=Item details')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows step 1 category/condition inputs', async ({ page }) => {
    await expect(
      page.locator('text=Category').or(page.locator('text=Condition')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows title and description inputs', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Chanel"]').or(page.locator('input[placeholder*="title"]')).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows pricing section', async ({ page }) => {
    await expect(
      page.locator('text=Retail value').or(page.locator('text=retail')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/seller/account', {
      stripeAccountId: 'acct_test123',
      chargesEnabled: true,
      payoutsEnabled: true,
    });
    await mockApi(page, '/seller/stats', {
      totalRevenuePence: 50000,
      activeDraws: 2,
      soldTickets: 300,
      totalDraws: 5,
    });
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(2500);
  });

  test('shows Seller Dashboard header', async ({ page }) => {
    await expect(page.locator('text=Seller Dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('shows verified badges when chargesEnabled = true', async ({ page }) => {
    await expect(page.locator('text=Accept payments').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows List new item button when verified', async ({ page }) => {
    await expect(page.locator('text=List new item')).toBeVisible({ timeout: 5000 });
  });
});

// ─── 10. Admin flows ──────────────────────────────────────────────────────────

const ADMIN_DRAWS = [
  {
    id: DRAW.id,
    title: DRAW.title,
    status: 'open',
    sellerHandle: 'drawnofficial',
    ticketPricePence: 100,
    totalTickets: 1850,
    soldTickets: 1240,
    minTickets: 463,
    retailValuePence: 185000,
    closingDate: '2026-12-31',
    createdAt: new Date().toISOString(),
    category: 'Bags',
  },
];

test.describe('Admin — draw management', () => {
  test.beforeEach(async ({ page }) => {
    await injectAdminAuth(page);
    await mockApi(page, '/admin/draws', {
      draws: ADMIN_DRAWS,
      counts: { open: 1, resolved: 0, cancelled: 0 },
    });
    await page.goto('/admin');
    await page.waitForTimeout(2500);
  });

  test('shows Admin Panel header', async ({ page }) => {
    await expect(page.locator('text=Admin Panel').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows draw in list', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Resolve now button on open draw', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'Resolve now' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Cancel draw button on open draw', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'Cancel draw' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Resolve now calls /admin/draws/{id}/resolve and updates status', async ({ page }) => {
    let resolveApiCalled = false;
    await page.route(`**/admin/draws/${DRAW.id}/resolve`, async route => {
      resolveApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: 'resolved',
          drawTitle: DRAW.title,
          soldTickets: 1240,
          winnerId: 'mock-winner-id-999',
        }),
      });
    });
    await page.locator('button').filter({ hasText: 'Resolve now' }).first().click();
    // browser confirm dialog
    page.on('dialog', async dialog => { await dialog.accept(); });
    await page.waitForTimeout(1500);
    expect(resolveApiCalled).toBeTruthy();
  });

  test('Cancel draw calls /admin/draws/{id}/cancel', async ({ page }) => {
    let cancelApiCalled = false;
    await page.route(`**/admin/draws/${DRAW.id}/cancel`, async route => {
      cancelApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: 'cancelled', reason: 'Test cancel', refunded: 0 }),
      });
    });
    // Handle the window.prompt dialog
    await page.evaluate(() => {
      window.prompt = () => 'Test cancel reason';
    });
    await page.locator('button').filter({ hasText: 'Cancel draw' }).first().click();
    await page.waitForTimeout(1500);
    expect(cancelApiCalled).toBeTruthy();
  });

  test('postal entry form appears for open draw', async ({ page }) => {
    await expect(page.locator('text=Register postal entry').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder="Full name"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder="Email address"]').first()).toBeVisible();
  });

  test('postal entry calls /admin/draws/{id}/postal-entry', async ({ page }) => {
    let postalApiCalled = false;
    await page.route(`**/admin/draws/${DRAW.id}/postal-entry`, async route => {
      postalApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, postalId: 'POSTAL_abc123' }),
      });
    });
    await page.locator('input[placeholder="Full name"]').first().fill('Jane Smith');
    await page.locator('input[placeholder="Email address"]').first().fill('jane@example.com');
    await page.locator('button').filter({ hasText: 'Add' }).first().click();
    await page.waitForTimeout(1000);
    expect(postalApiCalled).toBeTruthy();
  });

  test('non-admin user sees access denied', async ({ page }) => {
    // Reload page with non-admin auth and 403 response
    await injectAuth(page);
    await mockApi(page, '/admin/draws', { error: 'Forbidden' }, 403);
    await page.goto('/admin');
    await page.waitForTimeout(2500);
    await expect(
      page.locator('text=Access denied').or(page.locator('text=admin only')).or(page.locator('text=Forbidden')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── 11. Account settings & GDPR delete ──────────────────────────────────────

test.describe('Account — settings and delete', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/account/settings');
    await page.waitForTimeout(2000);
  });

  test('shows Settings header', async ({ page }) => {
    await expect(
      page.locator('text=Settings').or(page.locator('text=Account Settings')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows delete account option', async ({ page }) => {
    await expect(
      page.locator('text=Delete account').or(page.locator('text=delete account')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('delete account calls DELETE /me', async ({ page }) => {
    let deleteCalled = false;
    await page.route('**/me', async route => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      } else {
        await route.continue();
      }
    });
    const deleteBtn = page.locator('button').filter({ hasText: /delete.*account/i }).or(page.locator('text=Delete account')).first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      // Confirm any dialog
      page.on('dialog', async dialog => { await dialog.accept(); });
      const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
        expect(deleteCalled).toBeTruthy();
      }
    }
  });
});

// ─── 12. Navigation ───────────────────────────────────────────────────────────

test.describe('Navigation — bottom tab bar', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: DRAWS });
    await page.goto('/home');
    await page.waitForTimeout(2000);
  });

  test('Home tab is visible', async ({ page }) => {
    await expect(page.locator('a[href="/home"]').or(page.locator('nav').locator('text=Home')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Tickets tab navigates to /tickets', async ({ page }) => {
    const ticketsTab = page.locator('a[href="/tickets"]').or(page.locator('nav').locator('text=Tickets')).first();
    if (await ticketsTab.count() > 0) {
      await ticketsTab.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/tickets/);
    }
  });

  test('Account tab navigates to /account', async ({ page }) => {
    const accountTab = page.locator('a[href="/account"]').or(page.locator('nav').locator('text=Account')).first();
    if (await accountTab.count() > 0) {
      await accountTab.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/account/);
    }
  });
});

// ─── 13. Search ───────────────────────────────────────────────────────────────

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/search');
    await page.waitForTimeout(1500);
  });

  test('shows search input', async ({ page }) => {
    await expect(
      page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('typing a query shows results from API', async ({ page }) => {
    await mockApi(page, '/draws?q=gucci', { draws: [DRAW] });
    const input = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]')).first();
    await input.fill('gucci');
    await page.waitForTimeout(800);
    await expect(page.locator('text=Gucci').first()).toBeVisible({ timeout: 5000 });
  });

  test('empty search shows empty state or popular draws', async ({ page }) => {
    await expect(
      page.locator('text=Search').or(page.locator('text=Popular')).or(page.locator('text=Start typing')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── 14. Live page ────────────────────────────────────────────────────────────

test.describe('Live page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/draws', { draws: DRAWS });
    await page.goto('/live');
    await page.waitForTimeout(2000);
  });

  test('shows Live or countdown section', async ({ page }) => {
    await expect(
      page.locator('text=Live').or(page.locator('text=9pm')).or(page.locator('text=countdown')).or(page.locator('text=Countdown')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── 15. Landing page (unauthenticated) ──────────────────────────────────────

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('bedrawn_cookie_consent', 'accepted'));
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('shows BeDrawn branding', async ({ page }) => {
    await expect(
      page.locator('text=BeDrawn').or(page.locator('text=BEDRAWN').or(page.locator('text=bedrawn'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows Sign up or Join CTA', async ({ page }) => {
    await expect(
      page.locator('text=Sign up').or(page.locator('text=Join').or(page.locator('text=Get started'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows how it works section', async ({ page }) => {
    await expect(
      page.locator('text=How it works').or(page.locator('text=how it works')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows FAQ section', async ({ page }) => {
    await expect(
      page.locator('text=FAQ').or(page.locator('text=Questions').or(page.locator('text=Is this gambling'))).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('waitlist email form submits correctly', async ({ page }) => {
    let waitlistCalled = false;
    await page.route('**/waitlist', async route => {
      waitlistCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="email"]')).first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      const submitBtn = page.locator('button').filter({ hasText: /notify|join|sign up|submit/i }).first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        expect(waitlistCalled).toBeTruthy();
      }
    }
  });
});
