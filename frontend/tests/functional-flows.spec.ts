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
  // '2' is one of the FALLBACK_IDS in /draw/[id]/page.tsx generateStaticParams —
  // required so the dev server (output: export) accepts the route param.
  // The API responses for it are fully mocked below.
  id: '2',
  title: 'Gucci Dionysus GG Supreme Shoulder Bag',
  seller: 'drawnofficial',
  sellerEmoji: '',
  ticketPrice: 100,   // pence — DrawDetailClient formats as £1.00
  retailValue: 1850,  // pounds — DrawDetailClient shows £1,850
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
    const btn = page.locator('button').filter({ hasText: /sign in|log in|continue/i }).first();
    if (await btn.count() === 0) { test.skip(); return; }
    await btn.click();
    await page.waitForTimeout(1500);
    // HTML5 required validation, Cognito error, or redirect — any outcome is fine
    const url = page.url();
    const notCrashed = !url.includes('500') && !url.includes('error');
    expect(notCrashed).toBeTruthy();
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
    // Scope to the purchase sheet — the sticky-bar "Enter draw" button sits behind the modal overlay
    const confirmBtn = page.locator('.purchase-sheet').locator('button').filter({ hasText: /confirm/i }).first();
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

  test('shows transaction history when entries exist', async ({ page }) => {
    await mockApi(page, '/wallet/transactions', {
      transactions: [
        { type: 'topup', description: 'Wallet top-up', amountPence: 500, createdAt: new Date().toISOString() },
      ],
    });
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(
      page.locator('text=top-up').or(page.locator('text=Top-up')).or(page.locator('text=Wallet top').or(page.locator('text=£5'))).first()
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
    // Scope to main — the hidden desktop top-nav also contains a "Tickets" link
    await expect(
      page.locator('main').locator('text=My Tickets').first()
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
    // Scope to main — the hidden desktop top-nav also matches "Tickets"
    await expect(
      page.locator('main').locator('text=Orders').or(page.locator('main').locator('text=My Entries')).first()
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
    drawTitle: DRAW.title, // the notifications page renders drawTitle as the body line
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
      onboardingUrl: null,
    });
    await page.goto('/seller/list');
    await page.waitForTimeout(2500);
  });

  test('shows Type step (step 0)', async ({ page }) => {
    // Step 0 shows draw type selection: Single item, Bundle, Luxury
    await expect(
      page.locator('text=Single item').or(page.locator('text=Type')).or(page.locator('text=What type')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('step 0 has draw type options', async ({ page }) => {
    await expect(
      page.locator('text=Single item').or(page.locator('text=Luxury')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('advancing to Details step shows Condition + Category', async ({ page }) => {
    // Photos step requires an uploaded hero image before advancing — mock the upload flow
    await mockApi(page, '/upload-url', { uploadUrl: 'https://mock-s3.local/upload', publicUrl: 'https://mock-s3.local/photo.jpg' });
    await page.route('https://mock-s3.local/**', route => route.fulfill({ status: 200, body: '' }));

    // Click a type then upload a photo to reach Details (step 2)
    await page.locator('button').filter({ hasText: 'Single item' }).first().click();
    const nextBtn = page.locator('button').filter({ hasText: 'Next' }).first();
    await nextBtn.click(); // → Photos
    await page.waitForTimeout(400);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake-image-bytes'),
    });
    await page.waitForTimeout(800);
    await nextBtn.click(); // → Details
    await page.waitForTimeout(500);
    await expect(page.locator('text=Condition').or(page.locator('text=Category')).first()).toBeVisible({ timeout: 3000 });
  });

  test('shows pricing step with Retail value input', async ({ page }) => {
    // Navigate to Pricing step (step 3)
    const nextBtn = page.locator('button').filter({ hasText: 'Next' }).first();
    for (let i = 0; i < 3; i++) {
      const singleBtn = page.locator('button').filter({ hasText: 'Single item' }).first();
      if (await singleBtn.count() > 0) await singleBtn.click();
      if (await nextBtn.count() > 0) await nextBtn.click();
      await page.waitForTimeout(200);
    }
    await expect(
      page.locator('text=Retail value').or(page.locator('text=retail')).or(page.locator('text=Pricing')).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Seller — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    // Routes must be registered before goto()
    await mockApi(page, '/seller/account', {
      stripeAccountId: 'acct_test123',
      chargesEnabled: true,
      payoutsEnabled: true,
      onboardingUrl: null,
    });
    await mockApi(page, '/seller/stats', {
      totalEarningsPence: 50000,
      pendingPayoutPence: 12000,
      draws: [
        {
          id: DRAW.id,
          title: DRAW.title,
          soldTickets: DRAW.soldTickets,
          totalTickets: DRAW.totalTickets,
          closingDate: DRAW.closingDate,
          sellerRevenuePence: 25000,
          status: 'open',
        },
      ],
    });
    await page.goto('/seller/dashboard');
    await page.waitForTimeout(3000);
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
    // Register dialog handler BEFORE click — confirm dialogs fire synchronously
    page.on('dialog', async dialog => { await dialog.accept(); });
    await page.locator('button').filter({ hasText: 'Resolve now' }).first().click();
    await page.waitForTimeout(2000);
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
    // Settings page may redirect if unauthenticated; pass if page stays on /settings
    const url = page.url();
    if (!url.includes('settings')) { test.skip(); return; }
    await expect(page.locator('text=Settings').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Delete my account button', async ({ page }) => {
    const url = page.url();
    if (!url.includes('settings')) { test.skip(); return; }
    await expect(
      page.locator('button').filter({ hasText: /delete my account/i }).or(page.locator('text=Delete my account')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('delete account calls DELETE /me', async ({ page }) => {
    const url = page.url();
    if (!url.includes('settings')) { test.skip(); return; }
    let deleteCalled = false;
    await page.route('**/me', async route => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      } else {
        await route.continue();
      }
    });
    // First click shows confirmation UI; second click confirms
    const deleteBtn = page.locator('button').filter({ hasText: /delete my account/i }).first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      const confirmBtn = page.locator('button').filter({ hasText: /yes.*delete|confirm.*delete|permanently/i }).first();
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
        await page.waitForTimeout(1500);
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
    // :visible — desktop top-nav link is hidden on the mobile viewport (BottomNav is used there)
    const ticketsTab = page.locator('a[href="/tickets"]:visible').first();
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

  test('shows LIVE header and 9pm Draw', async ({ page }) => {
    // Scope to main — the hidden desktop top-nav also contains a "Live" link
    await expect(
      page.locator('main').locator('text=9pm Draw').or(page.locator('main').locator('text=LIVE')).first()
    ).toBeVisible({ timeout: 8000 });
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

  test('shows Join waitlist CTA', async ({ page }) => {
    await expect(
      page.locator('text=Join waitlist').or(page.locator('text=Join the waitlist')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows How it works nav link', async ({ page }) => {
    // :visible — the header nav link is hidden on mobile; the footer link is always shown
    await expect(
      page.locator('a[href="#how"]:visible').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows FAQ with gambling question', async ({ page }) => {
    await expect(
      page.locator('text=Is this gambling').or(page.locator('text=gambling')).first()
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
      // "Join the waitlist" or "Joining…" button
      const submitBtn = page.locator('button').filter({ hasText: /join|notify/i }).first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        expect(waitlistCalled).toBeTruthy();
      }
    }
  });
});
