'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

export default function BecomeSellerPage() {
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [item, setItem] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !item) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Become a Seller</p>
        </div>

        <div style={{ padding: 16 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 48, margin: '0 0 16px' }}>✓</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>Application submitted!</p>
              <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 24px', lineHeight: 1.6 }}>
                We&apos;ll review your application within 24 hours. Once approved, you&apos;ll need to complete identity verification before your draws go live.
              </p>
              <Link href="/account" style={{ color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>Back to account</Link>
            </div>
          ) : (
            <>
              {/* Intro */}
              <div style={{ background: 'linear-gradient(135deg, #2D1B4E, #1a0a2e)', border: '1px solid var(--purple)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
                <p style={{ fontSize: 22, margin: '0 0 12px' }}>🏪</p>
                <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>Sell on DRAWN</p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
                  List your luxury goods for raffle. Reach thousands of buyers. Keep 77% of all ticket revenue. Draws close every night at 9pm.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Verified items only — no fakes', 'Identity verification required', '77% revenue share', 'Payout within 48 hours of draw close'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--grey)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Full name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your legal name" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Instagram handle <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourhandle" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Describe your first item *</label>
                  <textarea
                    value={item}
                    onChange={e => setItem(e.target.value)}
                    placeholder="e.g. Chanel Classic Flap, black caviar, bought 2023 from Selfridges..."
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!name || !item || loading}
                  style={{
                    width: '100%', padding: 16, borderRadius: 999, border: 'none',
                    background: !name || !item || loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
                    color: 'var(--white)', fontSize: 16, fontWeight: 700,
                    cursor: !name || !item || loading ? 'not-allowed' : 'pointer',
                  }}
                >{loading ? 'Submitting…' : 'Apply to sell'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
