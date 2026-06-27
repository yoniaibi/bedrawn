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

/**
 * Injects Amplify v6 session tokens into localStorage and mocks the Cognito
 * GetUser endpoint so AppShell's getCurrentUser() returns a valid user.
 */
export async function injectAuth(page: Page) {
  // Mock the Cognito API endpoint — Amplify may call GetUser to validate session
  await page.route('https://cognito-idp.eu-west-1.amazonaws.com/', async route => {
    const target = route.request().headers()['x-amz-target'] ?? '';
    if (target.includes('GetUser')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-amz-json-1.1',
        body: JSON.stringify({
          Username: 'testuser',
          UserAttributes: [
            { Name: 'sub', Value: 'mock-user-id-123' },
            { Name: 'email', Value: 'test@bedrawn.app' },
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

  await page.evaluate(({ clientId, accessToken, idToken }) => {
    const prefix = `CognitoIdentityServiceProvider.${clientId}`;
    localStorage.setItem(`${prefix}.LastAuthUser`, 'testuser');
    localStorage.setItem(`${prefix}.testuser.accessToken`, accessToken);
    localStorage.setItem(`${prefix}.testuser.idToken`, idToken);
    localStorage.setItem(`${prefix}.testuser.refreshToken`, 'mock-refresh-token');
    localStorage.setItem(`${prefix}.testuser.clockDrift`, '0');
    localStorage.setItem(`${prefix}.testuser.userData`, JSON.stringify({
      UserAttributes: [{ Name: 'email', Value: 'test@bedrawn.app' }],
      Username: 'testuser',
    }));
  }, { clientId: CLIENT_ID, accessToken: ACCESS_TOKEN, idToken: ID_TOKEN });
}

/** Mock an authenticated API call — returns given body for any matching path */
export async function mockApi(page: Page, path: string, body: unknown, status = 200) {
  await page.route(`**${path}`, route => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }));
}
