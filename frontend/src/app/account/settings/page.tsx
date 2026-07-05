'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: value ? 'var(--purple)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'var(--white)',
        position: 'absolute', top: 3, left: value ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState({ reminders: true, wins: true, listings: false, grandDraw: true });
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error('Not signed in');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to delete account');
      }

      await signOut();
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message ?? 'Something went wrong');
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Settings</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Notifications */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Notifications</p>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {[
                { key: 'reminders' as const, label: 'Draw close reminders', desc: 'Get notified 1 hour before a draw closes' },
                { key: 'wins' as const, label: 'Win alerts', desc: 'Instant notification when you win' },
                { key: 'listings' as const, label: 'New matching listings', desc: 'Based on your interests' },
                { key: 'grandDraw' as const, label: 'Grand draw reminders', desc: 'Monthly draw notifications' },
              ].map((item, i, arr) => (
                <div key={item.key} style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>{item.desc}</p>
                  </div>
                  <Toggle value={notifs[item.key]} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'Privacy Policy',   href: '/legal/privacy' },
              { label: 'Terms of Service', href: '/legal/terms' },
            ].map((item, i) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: i === 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 14, color: 'var(--text)' }}>{item.label}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Danger zone — GDPR account deletion */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1 }}>Danger zone</p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: 14, cursor: 'pointer' }}
              >Delete my account</button>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid var(--red)', borderRadius: 12, padding: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text)', fontWeight: 700 }}>Permanently delete account?</p>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.5 }}>
                  This will delete your profile, wallet, transaction history, and notification data. Your ticket entries remain on draws for integrity but are anonymised.
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)' }}>This cannot be undone.</p>
                {deleteError && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--red)' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setShowDelete(false); setDeleteError(''); }}
                    disabled={deleting}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--white)', cursor: 'pointer' }}
                  >Cancel</button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--red)', border: 'none', color: 'var(--white)', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
                  >{deleting ? 'Deleting…' : 'Yes, delete'}</button>
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', margin: 0 }}>
            Right to erasure under UK GDPR. Your data is deleted within 24 hours.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
