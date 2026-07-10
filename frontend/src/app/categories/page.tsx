'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';

const available = [
  { emoji: '👗', label: 'Fashion', desc: 'Designer clothing & outerwear', accent: '#8B5CF6' },
  { emoji: '👟', label: 'Trainers', desc: 'Rare & limited edition footwear', accent: '#EC4899' },
  { emoji: '⌚', label: 'Watches', desc: 'Luxury timepieces', accent: '#F59E0B' },
  { emoji: '👜', label: 'Bags', desc: 'Designer handbags & accessories', accent: '#10B981' },
  { emoji: '💍', label: 'Jewellery', desc: 'Fine & costume jewellery', accent: '#F59E0B' },
  { emoji: '🧢', label: 'Streetwear', desc: 'Hype & archive pieces', accent: '#EF4444' },
];

const comingSoon = [
  { emoji: '📱', label: 'Tech', desc: 'Laptops, phones & gadgets' },
  { emoji: '🎨', label: 'Art', desc: 'Prints & original works' },
  { emoji: '🎮', label: 'Gaming', desc: 'Consoles & collectibles' },
  { emoji: '🏠', label: 'Home', desc: 'Luxury homeware' },
];

export default function CategoriesPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>Categories</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Available now</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {available.map(cat => (
                <Link key={cat.label} href={`/home?category=${cat.label}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--card)', borderRadius: 14, padding: '18px 16px',
                    border: `1px solid ${cat.accent}33`,
                    borderLeft: `3px solid ${cat.accent}`,
                    cursor: 'pointer',
                  }}>
                    <p style={{ fontSize: 28, margin: '0 0 8px' }}>{cat.emoji}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>{cat.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)', lineHeight: 1.4 }}>{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Coming soon</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {comingSoon.map(cat => (
                <div key={cat.label} style={{ background: 'var(--card)', borderRadius: 14, padding: '18px 16px', border: '1px solid var(--border)', opacity: 0.5, position: 'relative' }}>
                  <p style={{ fontSize: 28, margin: '0 0 8px' }}>{cat.emoji}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>{cat.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{cat.desc}</p>
                  <span style={{ position: 'absolute', top: 10, right: 10, background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, letterSpacing: 0.5 }}>SOON</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, margin: '0 0 8px' }}>💡</p>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Don&apos;t see what you want?</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)' }}>We add new categories based on demand. Let us know what you&apos;d like to see next.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
