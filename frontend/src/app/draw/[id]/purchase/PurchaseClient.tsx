'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';
import type { Draw } from '@/lib/mockData';

const qtyPills = [1, 5, 10, 25];

async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

export default function PurchaseClient({ id }: { id: string }) {
  const router = useRouter();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [drawLoading, setDrawLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balancePence, setBalancePence] = useState<number | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setDrawLoading(false); return; }
    const segments = window.location.pathname.split('/').filter(Boolean);
    const realId = segments[1] || id;
    fetch(`${url}/draws/${realId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.draw) setDraw(data.draw as Draw); })
      .catch(() => {})
      .finally(() => setDrawLoading(false));
  }, []); // empty deps — reads real URL at mount

  useEffect(() => {
    getAuthToken()
      .then(token => fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      }))
      .then(r => r.json())
      .then(data => setBalancePence(data.balancePence ?? 0))
      .catch(() => setBalancePence(0));
  }, []);

  if (drawLoading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--grey)' }}>Loading…</div>
      </AppShell>
    );
  }

  if (!draw) return (
    <AppShell>
      <div style={{ textAlign: 'center', padding: '60px 32px' }}>
        <p style={{ color: 'var(--text)', fontSize: 16, margin: '0 0 12px' }}>Draw not found</p>
        <a href="/home" style={{ color: 'var(--purple)' }}>← Back to home</a>
      </div>
    </AppShell>
  );

  const price = draw.ticketPrice;
  const total = qty * price;
  const totalDisplay = total >= 100 ? `£${(total / 100).toFixed(2)}` : `${total}p`;
  const priceDisplay = price >= 100 ? `£${(price / 100).toFixed(2)}` : `${price}p`;
  const sufficient = balancePence !== null && balancePence >= total;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const segments = window.location.pathname.split('/').filter(Boolean);
      const realId = segments[1] || id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws/${realId}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketCount: qty }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      router.push(`/draw/${realId}/success?qty=${qty}&total=${total}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 20 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/draw/${id}`} style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Enter draw</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--card2)' }}>
              <img src={draw.imageUrl} alt={draw.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{draw.title}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--grey)' }}>{priceDisplay} per ticket · £{draw.retailValue.toLocaleString()} retail</p>
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>How many tickets?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {qtyPills.map(q => (
                <button key={q} onClick={() => setQty(q)} style={{
                  flex: 1, padding: '14px 0', borderRadius: 12, cursor: 'pointer',
                  background: qty === q ? 'rgba(139,92,246,0.2)' : 'var(--card)',
                  border: `2px solid ${qty === q ? 'var(--purple)' : 'var(--border)'}`,
                  color: qty === q ? 'var(--purple)' : 'var(--text)',
                  fontWeight: qty === q ? 700 : 400, fontSize: 16,
                }}>{q}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Or enter amount</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ maxWidth: 120 }} />
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--grey)' }}>{qty} ticket{qty !== 1 ? 's' : ''} × {priceDisplay}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{totalDisplay}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--grey)' }}>Your balance</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: balancePence === null ? 'var(--grey)' : sufficient ? 'var(--green)' : 'var(--red)' }}>
                {balancePence === null ? 'Loading…' : `£${(balancePence / 100).toFixed(2)} ${sufficient ? '✓' : '— insufficient'}`}
              </span>
            </div>
            {balancePence !== null && !sufficient && (
              <Link href="/account/wallet" style={{ display: 'block', marginTop: 10, textAlign: 'center', color: 'var(--purple)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                Top up wallet →
              </Link>
            )}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!sufficient || loading || balancePence === null}
            style={{
              width: '100%', padding: 16, borderRadius: 999, border: 'none',
              background: !sufficient || loading || balancePence === null ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontSize: 16, fontWeight: 700,
              cursor: !sufficient || loading || balancePence === null ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Securing your tickets…' : `Confirm purchase · ${totalDisplay}`}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
