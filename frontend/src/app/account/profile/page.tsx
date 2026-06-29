'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function ProfilePage() {
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHandle(data.handle ?? '');
          setName(data.name ?? '');
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ handle, name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Edit Profile</p>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--grey)', marginBottom: 6 }}>
                  Handle
                </label>
                <input
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="your_handle"
                  maxLength={20}
                />
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                  3–20 chars, letters/numbers/underscores only
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--grey)', marginBottom: 6 }}>
                  Display name
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  maxLength={50}
                />
              </div>

              {error && (
                <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
                </div>
              )}

              {saved && (
                <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--green)' }}>Profile saved</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
