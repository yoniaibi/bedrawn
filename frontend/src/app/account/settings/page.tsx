'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

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
  const [handle, setHandle] = useState('yoniaibi');
  const [notifs, setNotifs] = useState({ reminders: true, wins: true, listings: false, grandDraw: true });
  const [showDelete, setShowDelete] = useState(false);

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Settings</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Account details */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Account</p>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <label style={{ fontSize: 11, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Handle</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 15, lineHeight: '36px' }}>@</span>
                  <input value={handle} onChange={e => setHandle(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 15 }} />
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <label style={{ fontSize: 11, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Email</label>
                <input defaultValue="yoni@example.com" type="email" style={{ padding: '6px 10px', fontSize: 15 }} />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <label style={{ fontSize: 11, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Password</label>
                <button style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: 13, cursor: 'pointer' }}>
                  Change password
                </button>
              </div>
            </div>
          </div>

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

          {/* Save button */}
          <button style={{
            width: '100%', padding: 14, borderRadius: 999,
            background: 'linear-gradient(135deg, var(--purple), var(--pink))',
            border: 'none', color: 'var(--white)', fontSize: 15, fontWeight: 700,
          }}>Save changes</button>

          {/* Danger zone */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1 }}>Danger zone</p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: 14, cursor: 'pointer' }}
              >Delete account</button>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 12, padding: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Are you sure?</p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)' }}>This permanently deletes your account and all data. This cannot be undone.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowDelete(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--white)', cursor: 'pointer' }}>Cancel</button>
                  <button style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--red)', border: 'none', color: 'var(--white)', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
