import type { Page } from '@playwright/test';

const CLIENT_ID = '1sug7rg5gcfpibf5cpgut7vkg1';

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 86400 * 30; // 30 days from now

const ACCESS_TOKEN = makeJwt({
  sub: 'mock-user-id-123',
  username: 'testuser',
  'cognito:username': 'testuser',
  email: 'test@bedrawn.app',
  exp,
  iat: now,
  token_use: 'access',
  client_id: CLIENT_ID,
  scope: 'aws.cognito.signin.user.admin',
  jti: 'mock-jti-access',
});

const ADMIN_ACCESS_TOKEN = makeJwt({
  sub: 'mock-admin-id-456',
  username: 'adminuser',
  'cognito:username': 'adminuser',
  email: 'yoniaibi@gmail.com',
  'cognito:groups': ['admin'],
  exp,
  iat: now,
  token_use: 'access',
  client_id: CLIENT_ID,
  scope: 'aws.cognito.signin.user.admin',
  jti: 'mock-jti-admin',
});

const ID_TOKEN = makeJwt({
  sub: 'mock-user-id-123',
  'cognito:username': 'testuser',
  email: 'test@bedrawn.app',
  email_verified: true,
  exp,
  iat: now,
  token_use: 'id',
  aud: CLIENT_ID,
  jti: 'mock-jti-id',
});

async function setupAuth(page: Page, accessToken: string, username: string, email: string) {
  // Suppress cookie consent banner before any page load — runs on every navigation
  await page.addInitScript(() => {
    localStorage.setItem('bedrawn_cookie_consent', 'accepted');
  });

  await page.route('https://cognito-idp.eu-west-1.amazonaws.com/', async route => {
    const target = route.request().headers()['x-amz-target'] ?? '';
    if (target.includes('GetUser')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-amz-json-1.1',
        body: JSON.stringify({
          Username: username,
          UserAttributes: [
            { Name: 'sub', Value: 'mock-user-id-123' },
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await page.waitForTimeout(500);

  await page.evaluate(({ clientId, accessToken: at, idToken, username: u, email: e }) => {
    const prefix = `CognitoIdentityServiceProvider.${clientId}`;
    localStorage.setItem(`${prefix}.LastAuthUser`, u);
    localStorage.setItem(`${prefix}.${u}.accessToken`, at);
    localStorage.setItem(`${prefix}.${u}.idToken`, idToken);
    localStorage.setItem(`${prefix}.${u}.refreshToken`, 'mock-refresh-token');
    localStorage.setItem(`${prefix}.${u}.clockDrift`, '0');
    localStorage.setItem(`${prefix}.${u}.userData`, JSON.stringify({
      UserAttributes: [{ Name: 'email', Value: e }],
      Username: u,
    }));
    // Dismiss cookie consent banner so it never blocks test interactions
    localStorage.setItem('bedrawn_cookie_consent', 'accepted');
  }, { clientId: CLIENT_ID, accessToken, idToken: ID_TOKEN, username, email });
}

/**
 * Suppresses the cookie consent banner for tests that don't call injectAuth.
 * Must be called before page.goto() — it runs as an init script injected on every navigation.
 */
export async function suppressCookieBanner(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bedrawn_cookie_consent', 'accepted');
  });
}

/** Injects a standard (non-admin) Amplify session */
export async function injectAuth(page: Page) {
  await setupAuth(page, ACCESS_TOKEN, 'testuser', 'test@bedrawn.app');
}

/** Injects an admin Amplify session with cognito:groups = ['admin'] */
export async function injectAdminAuth(page: Page) {
  await setupAuth(page, ADMIN_ACCESS_TOKEN, 'adminuser', 'yoniaibi@gmail.com');
}

const API_BASE = 'https://uctmxxb939.execute-api.eu-west-1.amazonaws.com';

/** Mock an API call — intercepts only the real API host to avoid capturing page navigations */
export async function mockApi(page: Page, path: string, body: unknown, status = 200) {
  await page.route(`${API_BASE}${path}`, route => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }));
}
