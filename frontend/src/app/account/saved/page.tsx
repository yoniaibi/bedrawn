'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import { draws } from '@/lib/mockData';

export default function SavedPage() {
  const [saved] = useState(draws.filter(d => d.id === '1' || d.id === '6' || d.id === '10'));

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Saved Draws ({saved.length})</p>
        </div>

        {saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <p style={{ fontSize: 48, margin: '0 0 16px' }}>🔖</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>No saved draws yet</p>
            <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 24px' }}>Tap the bookmark on any draw to save it</p>
            <Link href="/home" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '12px 28px', borderRadius: 999, background: 'var(--purple)', border: 'none', color: 'var(--white)', fontSize: 14, fontWeight: 700 }}>
                Browse draws
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {saved.map(d => <DrawCard key={d.id} draw={d} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
