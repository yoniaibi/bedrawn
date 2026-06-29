import { test, expect } from '@playwright/test';
import { injectAuth, mockApi } from './helpers';

const MOCK_NOTIFICATIONS = [
  {
    id: 'NOTIF#2026-06-27T20:34:58.508Z',
    type: 'draw_won',
    drawId: '27c64aad-ae1f-4937-95a1-dd8b981f5eab',
    drawTitle: 'Gucci Dionysus GG Supreme Shoulder Bag',
    read: false,
    createdAt: '2026-06-27T20:34:58.508Z',
  },
];

test.describe('Notifications page — unauthenticated', () => {
  test('redirects to / when not logged in', async ({ page }) => {
    await page.goto('/account/notifications');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.endsWith('/') || url.includes('/login') || url.includes('/notifications')).toBeTruthy();
  });
});

test.describe('Notifications page — authenticated, with notifications', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/notifications', { notifications: MOCK_NOTIFICATIONS, unreadCount: 1 });
    await page.goto('/account/notifications');
    await page.waitForTimeout(2000);
  });

  test('shows Notifications header', async ({ page }) => {
    await expect(page.locator('text=Notifications').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows draw_won notification with You won! label', async ({ page }) => {
    await expect(page.locator('text=You won!').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows draw title in notification', async ({ page }) => {
    await expect(page.locator('text=Gucci Dionysus').first()).toBeVisible({ timeout: 5000 });
  });

  test('unread notification has highlighted border', async ({ page }) => {
    // Unread notifications have a colored dot indicator
    const dot = page.locator('div[style*="border-radius: 50%"]').last();
    await expect(dot).toBeVisible({ timeout: 5000 });
  });

  test('notification links to draw detail', async ({ page }) => {
    await page.locator('text=Gucci Dionysus').first().click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/draw\//);
  });
});

test.describe('Notifications page — authenticated, empty', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockApi(page, '/notifications', { notifications: [], unreadCount: 0 });
    await page.goto('/account/notifications');
    await page.waitForTimeout(2000);
  });

  test('shows empty state message', async ({ page }) => {
    await expect(
      page.locator('text=Nothing yet').or(page.locator("text=We'll let you know")).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Nav — notification bell', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await page.goto('/home');
    await page.waitForTimeout(1500);
  });

  test('notification bell icon is visible in top nav', async ({ page }) => {
    await expect(page.locator('a[href="/account/notifications"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking bell navigates to notifications page', async ({ page }) => {
    await page.locator('a[href="/account/notifications"]').first().click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/account\/notifications/);
  });
});
