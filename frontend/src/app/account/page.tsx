'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { currentUser } from '@/lib/mockData';

const EMOJIS = ['🦋', '🐉', '🦁', '🦊', '🐺', '🦄', '🐬', '🦅', '🌙', '⭐', '🔮', '💎', '👑', '🌹', '⚡', '🏆', '🎯', '🎭', '🎪', '🦋', '🌊', '🔥', '❄️', '🌺', '🎸', '🎩', '🗝️', '🌙', '💫', '✨'];

const badges = [
  { icon: '✦', label: 'Founding Member', unlocked: true, progress: null },
  { icon: '🎫', label: 'First Entry', unlocked: true, progress: null },
  { icon: '🔥', label: '3-Day Streak', unlocked: true, progress: null },
  { icon: '🏆', label: 'First Win', unlocked: true, progress: null },
  { icon: '📚', label: '25 Tickets', unlocked: true, progress: '47 of 25 ✓' },
  { icon: '🏪', label: 'First Sale', unlocked: false, progress: '0 sales' },
];

const menuItems = [
  { icon: '💳', label: 'My Wallet', href: '/account/wallet' },
  { icon: '📦', label: 'My Orders', href: '/account/orders' },
  { icon: '🔖', label: 'Saved Draws', href: '/account/saved' },
  { icon: '🔔', label: 'Notifications', href: '/account/notifications' },
  { icon: '⚙️', label: 'Settings', href: '/account/settings' },
  { icon: '🏪', label: 'Become a Seller', href: '/seller' },
  { icon: '📜', label: 'Privacy Policy', href: '/legal/privacy' },
  { icon: '📋', label: 'Terms of Service', href: '/legal/terms' },
];

export default function AccountPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [avatar, setAvatar] = useState(currentUser.emoji);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState(currentUser.emoji);
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('YONI42');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Profile header */}
        <div style={{ padding: '24px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowAvatarModal(true)}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(139,92,246,0.2)', border: '2px solid var(--purple)',
                fontSize: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{avatar}</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>{currentUser.handle}</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>✦ Founding Member</span>
                <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>🔥 {currentUser.streak} day streak</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Wallet pill */}
          <Link href="/account/wallet" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)',
              borderRadius: 999, padding: '10px 28px', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>💳</span>
              <span className="serif" style={{ fontSize: 24, color: 'var(--purple)', fontWeight: 700 }}>
                £{(currentUser.balancePence / 100).toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--grey)' }}>→</span>
            </div>
          </Link>

          {/* Stats */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { label: 'Active', value: '3' },
                { label: 'Tickets', value: '47' },
                { label: 'Won', value: '2' },
                { label: 'Value', value: '£620' },
              ].map((stat, i) => (
                <div key={stat.label} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <p className="serif" style={{ margin: 0, fontSize: 22, color: 'var(--white)', fontWeight: 700 }}>{stat.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>Achievements</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {badges.map(badge => (
                <div key={badge.label} style={{
                  background: 'var(--card2)', border: `1px solid ${badge.unlocked ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '12px 8px', textAlign: 'center',
                  opacity: badge.unlocked ? 1 : 0.5,
                }}>
                  <p style={{ fontSize: 22, margin: '0 0 4px' }}>{badge.icon}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: badge.unlocked ? 'var(--white)' : 'var(--grey)' }}>{badge.label}</p>
                  {badge.unlocked && !badge.progress && (
                    <span style={{ fontSize: 10, color: 'var(--green)' }}>✓ Unlocked</span>
                  )}
                  {badge.progress && (
                    <span style={{ fontSize: 10, color: 'var(--gold)' }}>{badge.progress}</span>
                  )}
                  {!badge.unlocked && (
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{badge.progress}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Referral */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>Invite friends, earn credit</p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--grey)' }}>£1 credit for every friend who joins and enters a draw</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', letterSpacing: 2 }}>YONI42</span>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: '1px solid var(--purple)',
                  background: copied ? 'var(--green)' : 'rgba(139,92,246,0.15)',
                  color: copied ? 'var(--white)' : 'var(--purple)', fontWeight: 600, fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >{copied ? '✓ Copied!' : 'Copy'}</button>
            </div>
          </div>

          {/* Menu */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {menuItems.map((item, i) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--white)' }}>{item.label}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
                </div>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                background: 'transparent', border: 'none', borderTop: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>🚪</span>
              <span style={{ fontSize: 14, color: 'var(--red)', fontWeight: 600 }}>Log out</span>
            </button>
          </div>

          {/* Version */}
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Drawn · v1.0 · London, UK
          </p>
        </div>

        {/* Avatar modal */}
        {showAvatarModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
          }} onClick={() => setShowAvatarModal(false)}>
            <div
              style={{ background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 500 }}
              onClick={e => e.stopPropagation()}
            >
              <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--white)', textAlign: 'center' }}>Choose your avatar</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20 }}>
                {EMOJIS.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => setPendingEmoji(e)}
                    style={{
                      fontSize: 28, padding: 8, borderRadius: 10, cursor: 'pointer',
                      background: pendingEmoji === e ? 'rgba(139,92,246,0.2)' : 'var(--card2)',
                      border: `2px solid ${pendingEmoji === e ? 'var(--purple)' : 'transparent'}`,
                    }}
                  >{e}</button>
                ))}
              </div>
              <button
                onClick={() => { setAvatar(pendingEmoji); setShowAvatarModal(false); }}
                style={{
                  width: '100%', padding: 14, borderRadius: 999,
                  background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                  border: 'none', color: 'var(--white)', fontSize: 15, fontWeight: 700,
                }}
              >Save</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
