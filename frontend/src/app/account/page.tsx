'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { fetchAuthSession } from 'aws-amplify/auth';

interface Profile {
  handle: string;
  name: string;
  createdAt: string | null;
}

interface Stats {
  activeDraws: number;
  totalTickets: number;
  wins: number;
  totalDrawsEntered: number;
}

const menuItems = [
  { label: 'Edit Profile',     href: '/account/profile' },
  { label: 'My Wallet',        href: '/account/wallet' },
  { label: 'My Orders',        href: '/account/orders' },
  { label: 'Saved Draws',      href: '/account/saved' },
  { label: 'Notifications',    href: '/account/notifications' },
  { label: 'Settings',         href: '/account/settings' },
  { label: 'Seller Dashboard', href: '/seller/dashboard' },
  { label: 'List an Item',     href: '/seller/list' },
  { label: 'Become a Seller',  href: '/seller' },
  { label: 'Privacy Policy',   href: '/legal/privacy' },
  { label: 'Terms of Service', href: '/legal/terms' },
];

function referralCode(handle: string): string {
  const clean = handle.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.slice(0, 6).padEnd(4, 'X');
}

function avatarInitials(handle: string, name: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return handle.replace(/^@/, '').slice(0, 2).toUpperCase();
}

export default function AccountPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balancePence, setBalancePence] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) return;
        const API = process.env.NEXT_PUBLIC_API_URL ?? '';
        const headers = { Authorization: `Bearer ${token}` };

        const [profileRes, balanceRes, statsRes] = await Promise.all([
          fetch(`${API}/profile`,    { headers }),
          fetch(`${API}/wallet/balance`, { headers }),
          fetch(`${API}/me/stats`,   { headers }),
        ]);

        if (profileRes.ok) setProfile(await profileRes.json());
        if (balanceRes.ok) {
          const b = await balanceRes.json();
          setBalancePence(b.balancePence ?? b.balance ?? 0);
        }
        if (statsRes.ok) setStats(await statsRes.json());
      } catch {}
    })();
  }, []);

  const handleLogout = () => { logout(); router.push('/'); };

  const displayHandle = profile ? (profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`) : '…';
  const initials = profile ? avatarInitials(profile.handle, profile.name) : '··';
  const refCode = profile ? referralCode(profile.handle) : '——';

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* Profile header */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '28px 24px',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,35,86,0.10)',
            border: '2px solid var(--accent-coral)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--accent-coral)',
            letterSpacing: 1,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{displayHandle}</p>
            {profile?.name && (
              <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-secondary)' }}>{profile.name}</p>
            )}
            <span style={{ background: 'rgba(196,181,253,0.12)', border: '1px solid rgba(196,181,253,0.25)', color: 'var(--accent-lilac)', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Founding Member
            </span>
          </div>
          <Link href="/account/wallet" style={{
            textDecoration: 'none', background: 'var(--accent-coral)',
            borderRadius: 12, padding: '10px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 1 }}>Balance</span>
            <span className="serif" style={{ fontSize: 20, color: 'var(--white)', fontWeight: 700 }}>
              {balancePence !== null ? `£${(balancePence / 100).toFixed(2)}` : '—'}
            </span>
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 0',
          marginBottom: 20,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {[
            { label: 'Active draws',   value: stats ? String(stats.activeDraws)       : '—' },
            { label: 'Tickets bought', value: stats ? String(stats.totalTickets)       : '—' },
            { label: 'Wins',           value: stats ? String(stats.wins)              : '—' },
            { label: 'Draws entered',  value: stats ? String(stats.totalDrawsEntered) : '—' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              padding: '0 8px',
            }}>
              <p className="serif" style={{ margin: '0 0 2px', fontSize: 24, color: 'var(--text)', fontWeight: 700 }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Achievements</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Founding Member', unlocked: true,                           note: null },
              { label: 'First Entry',     unlocked: (stats?.totalDrawsEntered ?? 0) > 0, note: null },
              { label: 'First Win',       unlocked: (stats?.wins ?? 0) > 0,         note: null },
              { label: '25 Tickets',      unlocked: (stats?.totalTickets ?? 0) >= 25, note: stats ? `${stats.totalTickets} bought` : null },
              { label: 'First Sale',      unlocked: false,                           note: '0 sales' },
              { label: 'Night Owl',       unlocked: false,                           note: 'Enter at 9pm' },
            ].map(badge => (
              <div key={badge.label} style={{
                background: badge.unlocked ? 'rgba(139,92,246,0.10)' : 'var(--bg-base)',
                border: `1px solid ${badge.unlocked ? 'rgba(139,92,246,0.25)' : 'var(--border-subtle)'}`,
                borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                opacity: badge.unlocked ? 1 : 0.45,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: badge.unlocked ? 'var(--accent-lilac)' : 'var(--text-tertiary)' }}>{badge.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: badge.unlocked ? 'rgba(196,181,253,0.75)' : 'var(--text-tertiary)' }}>
                  {badge.unlocked ? (badge.note ?? 'Unlocked') : (badge.note ?? 'Locked')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Refer a friend</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--grey)' }}>Earn £1 credit for every friend who enters a draw</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: 3 }}>{refCode}</span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 20px', borderRadius: 10,
                border: '1px solid var(--border-accent)',
                background: copied ? 'var(--accent-coral)' : 'rgba(255,35,86,0.08)',
                color: copied ? 'var(--white)' : 'var(--accent-coral)',
                fontWeight: 700, fontSize: 13,
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            >{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>

        {/* Menu */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
          {menuItems.map((item, i) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
              </div>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '15px 20px',
              display: 'flex', alignItems: 'center',
              background: 'transparent', border: 'none',
              borderTop: '1px solid var(--border)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--red)', fontWeight: 600 }}>Log out</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', margin: 0 }}>Bedrawn · v1.0 · London, UK</p>
      </div>
    </AppShell>
  );
}
