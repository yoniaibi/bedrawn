import { fetchAuthSession } from 'aws-amplify/auth';

const API = process.env.EXPO_PUBLIC_API_URL!;

export async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

export async function apiGetPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error((b as any).error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error((b as any).error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error((b as any).error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Typed endpoint helpers — one function per backend route.
// Screens can use these instead of hand-writing paths.
// ---------------------------------------------------------------------------

export const api = {
  // Draws (public — no auth required)
  listDraws: <T = unknown>(query?: string) =>
    apiGetPublic<T>(query ? `/draws?q=${encodeURIComponent(query)}` : '/draws'),
  getDraw: <T = unknown>(id: string) => apiGetPublic<T>(`/draws/${id}`),

  // Entering & saving (auth)
  enterDraw: <T = unknown>(id: string, ticketCount: number) =>
    apiPost<T>(`/draws/${id}/enter`, { ticketCount }),
  saveDraw: <T = unknown>(id: string) => apiPost<T>(`/draws/${id}/save`, {}),
  unsaveDraw: <T = unknown>(id: string) => apiDelete<T>(`/draws/${id}/save`),
  getSavedDraws: <T = unknown>() => apiGet<T>('/me/saved'),

  // Wallet (auth)
  getWalletBalance: <T = unknown>() => apiGet<T>('/wallet/balance'),
  getWalletTransactions: <T = unknown>() => apiGet<T>('/wallet/transactions'),
  topUpWallet: <T = unknown>(amountPence: number) =>
    apiPost<T>('/wallet/topup', { amountPence }),

  // Grand draw
  getGrandDraw: <T = unknown>() => apiGet<T>('/grand-draw'),
  claimGrandDrawTicket: <T = unknown>() => apiPost<T>('/grand-draw/claim', {}),

  // Notifications (auth)
  getNotifications: <T = unknown>() => apiGet<T>('/notifications'),
  markNotificationsRead: <T = unknown>() => apiPost<T>('/notifications/read', {}),

  // Me (auth)
  getMyEntries: <T = unknown>() => apiGet<T>('/me/entries'),
  getMyStats: <T = unknown>() => apiGet<T>('/me/stats'),
  getProfile: <T = unknown>() => apiGet<T>('/profile'),
  updateProfile: <T = unknown>(profile: { handle: string; name: string }) =>
    apiPut<T>('/profile', profile),
};
