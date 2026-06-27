'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { currentUser } from '@/lib/mockData';

const badges = [
  { label: 'Founding Member', unlocked: true, note: null },
  { label: 'First Entry',     unlocked: true, note: null },
  { label: '3-Day Streak',    unlocked: true, note: null },
  { label: 'First Win',       unlocked: true, note: null },
  { label: '25 Tickets',      unlocked: true, note: '47 bought' },
  { label: 'First Sale',      unlocked: false, note: '0 sales' },
];

const menuItems = [
  { label: 'My Wallet',       href: '/account/wallet' },
  { label: 'My Orders',       href: '/account/orders' },
  { label: 'Saved Draws',     href: '/account/saved' },
  { label: 'Notifications',   href: '/account/notifications' },
  { label: 'Settings',        href: '/account/settings' },
  { label: 'Become a Seller', href: '/seller' },
  { label: 'Privacy Policy',  href: '/legal/privacy' },
  { label: 'Terms of Service',href: '/legal/terms' },
];

export default function AccountPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => { logout(); router.push('/'); };
  const handleCopy = () => {
    navigator.clipboard.writeText('YONI42');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* Profile header */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '28px 24px',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'var(--purple-light)',
            border: '2px solid var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--purple)',
            letterSpacing: 1,
          }}>
            {currentUser.handle.slice(1, 3).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{currentUser.handle}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--gold-light)', border: '1px solid rgba(217,119,6,0.25)', color: 'var(--gold)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                Founding Member
              </span>
              <span style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--purple)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                {currentUser.streak} day streak
              </span>
            </div>
          </div>
          <Link href="/account/wallet" style={{
            textDecoration: 'none', background: 'var(--purple)',
            borderRadius: 999, padding: '10px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 1 }}>Balance</span>
            <span className="serif" style={{ fontSize: 20, color: 'var(--white)', fontWeight: 700 }}>
              £{(currentUser.balancePence / 100).toFixed(2)}
            </span>
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 0',
          marginBottom: 20,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {[
            { label: 'Active draws', value: '3' },
            { label: 'Tickets bought', value: '47' },
            { label: 'Wins', value: '2' },
            { label: 'Value won', value: '£620' },
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
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Achievements</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {badges.map(badge => (
              <div key={badge.label} style={{
                background: badge.unlocked ? 'var(--purple-light)' : 'var(--card)',
                border: `1px solid ${badge.unlocked ? 'rgba(124,58,237,0.25)' : 'var(--border)'}`,
                borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                opacity: badge.unlocked ? 1 : 0.55,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: badge.unlocked ? 'var(--purple)' : 'var(--grey)' }}>{badge.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: badge.unlocked ? 'var(--purple-dark)' : 'var(--muted)' }}>
                  {badge.unlocked ? (badge.note ?? 'Unlocked') : badge.note ?? 'Locked'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Refer a friend</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--grey)' }}>Earn £1 credit for every friend who enters a draw</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: 3 }}>YONI42</span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 20px', borderRadius: 10,
                border: '1px solid var(--purple)',
                background: copied ? 'var(--green)' : 'var(--purple-light)',
                color: copied ? 'var(--white)' : 'var(--purple)',
                fontWeight: 700, fontSize: 13,
                transition: 'all 0.2s',
              }}
            >{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>

        {/* Menu */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
          {menuItems.map((item, i) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--card)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
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
