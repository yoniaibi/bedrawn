'use client';

import '@/lib/amplify';
import { useState } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';

async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

export default function BecomeSellerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/seller/dashboard` }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const { onboardingUrl } = await res.json();
      window.location.href = onboardingUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Become a Seller</p>
        </div>

        <div style={{ padding: 16 }}>
          {/* Hero card */}
          <div style={{ background: 'linear-gradient(135deg, #2D1B4E, #1a0a2e)', border: '1px solid var(--purple)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
            <p style={{ fontSize: 22, margin: '0 0 12px' }}>🏪</p>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>Sell on Bedrawn</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
              List your luxury goods for raffle. Reach thousands of buyers. Keep 88% of all ticket revenue. Draws close every night at 9pm.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Verified items only — no fakes',
                'Identity verified by Stripe (secure)',
                '88% revenue share — we keep 12%',
                'Payout within 24h of delivery confirmed',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--grey)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>How it works</p>
            {[
              { step: '1', title: 'Identity verification', desc: 'Stripe securely verifies your ID and bank account. Takes 2–3 minutes.' },
              { step: '2', title: 'List your item', desc: 'Add photos, set your ticket price, and pick a draw date.' },
              { step: '3', title: 'Draw runs at 9pm', desc: 'A winner is selected and the item ships within 48 hours.' },
              { step: '4', title: 'Get paid', desc: 'Once the winner confirms delivery, 88% lands in your bank account.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--white)',
                }}>{step}</div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              width: '100%', padding: 16, borderRadius: 999, border: 'none',
              background: loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Opening verification…' : 'Start identity verification'}
          </button>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            Identity verification is handled by Stripe — your details are never stored on our servers
          </p>
        </div>
      </div>
    </AppShell>
  );
}
