'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@/lib/amplify';

interface Draw {
  id: string;
  title: string;
  imageUrl: string;
  retailValue: number;
  ticketPrice: number;
  soldTickets: number;
  totalTickets: number;
  status: string;
  winnerHandle?: string;
  resolvedAt?: string;
}

export default function WinnerClient({ id }: { id: string }) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [payoutDone, setPayoutDone] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setLoading(false); return; }
    fetch(`${url}/draws/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.draw) setDraw(d.draw); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Get current user's sub so we can check if they're the winner
    fetchAuthSession()
      .then(session => {
        const sub = (session.tokens?.idToken?.payload as any)?.sub as string | undefined;
        if (sub) setCurrentUserId(sub);
      })
      .catch(() => {});
  }, [id]);

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    setPayoutError('');
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws/${id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? 'Failed to confirm delivery');
      }
      setPayoutDone(true);
    } catch (err: unknown) {
      setPayoutError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--grey)' }}>Loading…</div>
      </AppShell>
    );
  }

  if (!draw || draw.status !== 'resolved') {
    return (
      <AppShell>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            {draw?.status === 'open' ? 'Draw still running' : 'Draw not found'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--grey)', margin: '0 0 24px' }}>
            {draw?.status === 'open'
              ? 'This draw hasn\'t resolved yet. Check back at 9pm tonight.'
              : 'This draw doesn\'t exist or hasn\'t resolved yet.'}
          </p>
          <Link href={draw ? `/draw/${id}` : '/home'} style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: 999,
            background: 'var(--purple)', color: 'var(--white)', textDecoration: 'none', fontWeight: 700,
          }}>
            {draw ? 'View draw' : 'Browse draws'}
          </Link>
        </div>
      </AppShell>
    );
  }

  const resolvedDate = draw.resolvedAt
    ? new Date(draw.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const ticketPrice = draw.ticketPrice >= 100
    ? `£${(draw.ticketPrice / 100).toFixed(2)}`
    : `${draw.ticketPrice}p`;

  return (
    <AppShell>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Header */}
        <Link href={`/draw/${id}`} style={{ color: 'var(--grey)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Back to draw
        </Link>

        {/* Winner card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.06))',
          border: '1.5px solid var(--gold)',
          borderRadius: 20, overflow: 'hidden',
          textAlign: 'center',
        }}>
          {/* Item image */}
          {draw.imageUrl && (
            <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draw.imageUrl}
                alt={draw.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)',
              }} />
              <div style={{
                position: 'absolute', bottom: 16, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
              }}>
                <span style={{
                  background: 'var(--gold)', color: '#000',
                  fontSize: 11, fontWeight: 800, padding: '4px 16px',
                  borderRadius: 999, letterSpacing: '0.1em',
                }}>WINNER ANNOUNCED</span>
              </div>
            </div>
          )}

          <div style={{ padding: '28px 32px 32px' }}>
            {/* Confetti emoji */}
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>

            <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Winner of
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.25 }}>
              {draw.title}
            </p>

            {/* Winner handle */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--gold-light)', border: '1px solid var(--gold)',
              borderRadius: 999, padding: '10px 24px', marginBottom: 24,
            }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>
                @{draw.winnerHandle ?? 'winner'}
              </span>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 32,
              padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
              marginBottom: 20,
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>
                  £{draw.retailValue.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Retail value</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--purple)' }}>
                  {ticketPrice}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Per ticket</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                  {draw.soldTickets.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Tickets sold</p>
              </div>
            </div>

            {resolvedDate && (
              <p style={{ margin: '0 0 24px', fontSize: 12, color: 'var(--muted)' }}>
                Drawn on {resolvedDate}
              </p>
            )}

            {/* Confirm delivery — only shown to the winner */}
            {currentUserId && draw.winnerHandle && (
              <div style={{ marginBottom: 20 }}>
                {payoutDone ? (
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid var(--green)', borderRadius: 12, padding: '14px 20px' }}>
                    <p style={{ margin: 0, color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>Delivery confirmed — seller payout initiated</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleConfirmDelivery}
                      disabled={confirming}
                      style={{
                        width: '100%', padding: '14px 24px', borderRadius: 999,
                        background: confirming ? 'var(--muted)' : 'linear-gradient(135deg, var(--gold), #d97706)',
                        border: 'none', color: '#000', fontWeight: 800, fontSize: 15,
                        cursor: confirming ? 'not-allowed' : 'pointer', marginBottom: 8,
                      }}
                    >
                      {confirming ? 'Confirming…' : 'Confirm delivery received'}
                    </button>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>
                      Only press once you&apos;ve received the item. This releases payment to the seller.
                    </p>
                    {payoutError && (
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>{payoutError}</p>
                    )}
                  </>
                )}
              </div>
            )}

            <Link href="/home" style={{
              display: 'inline-block', padding: '12px 32px', borderRadius: 999,
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}>
              Enter tonight&apos;s draws →
            </Link>
          </div>
        </div>

        {/* Legal note */}
        <p style={{ margin: '20px 0 0', fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Winner selected by cryptographically secure random algorithm.
          Result is provably fair and independently verifiable.
        </p>
      </div>
    </AppShell>
  );
}
