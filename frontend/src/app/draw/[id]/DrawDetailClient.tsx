'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ProgressBar from '@/components/ProgressBar';
import LiveDot from '@/components/LiveDot';
import type { Draw } from '@/lib/mockData';

function getSavedDraws(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('saved_draws') ?? '[]'); } catch { return []; }
}

export default function DrawDetailClient({ id: idProp }: { id: string }) {
  const router = useRouter();
  const params = useParams();
  // Use live URL params so Amplify's catch-all rewrite still fetches the correct draw
  const id = (params?.id as string) || idProp;
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(() => getSavedDraws().includes(id));

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setLoading(false); return; }
    fetch(`${url}/draws/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.draw) setDraw(data.draw as Draw); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = () => {
    setSaved(prev => {
      const arr = getSavedDraws();
      const next = prev ? arr.filter(x => x !== id) : [...arr, id];
      localStorage.setItem('saved_draws', JSON.stringify(next));
      return !prev;
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--grey)' }}>Loading…</div>
      </AppShell>
    );
  }

  if (!draw) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <p style={{ color: 'var(--text)', fontSize: 16, margin: '0 0 12px' }}>Draw not found</p>
          <Link href="/home" style={{ color: 'var(--purple)' }}>← Back to home</Link>
        </div>
      </AppShell>
    );
  }

  const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  const remaining = draw.totalTickets - draw.soldTickets;
  const price = draw.ticketPrice >= 100 ? `£${(draw.ticketPrice / 100).toFixed(2)}` : `${draw.ticketPrice}p`;
  const reservePct = draw.reserveTickets ? Math.round((draw.reserveTickets / draw.totalTickets) * 100) : null;
  const reserveHit = reservePct !== null && pct >= reservePct;

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/home" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div style={{ flex: 1 }} />
          <button onClick={handleSave} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: saved ? 'var(--pink)' : 'var(--grey)' }}>
            {saved ? '♥' : '♡'}
          </button>
          <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--grey)' }}>⤴</button>
        </div>

        {/* Hero image */}
        <div style={{ height: 280, background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
          <img src={draw.imageUrl} alt={draw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(13,11,20,0.6))' }} />
          {draw.isClosingTonight && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <span style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.35)', color: '#F472B6', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.08em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
                <LiveDot size={5} /> Closing Tonight
              </span>
            </div>
          )}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
            <span style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.80)', fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(8px)', letterSpacing: '0.04em' }}>{draw.condition}</span>
            {draw.isVerified && <span style={{ background: 'rgba(196,181,253,0.12)', border: '1px solid rgba(196,181,253,0.25)', color: '#C4B5FD', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(8px)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Verified</span>}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '20px 16px' }}>
          <p className="serif" style={{ fontSize: 24, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2 }}>{draw.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {draw.sellerId ? (
              <Link href={`/sellers?id=${draw.sellerId}`} style={{
                display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none',
              }}>
                {draw.sellerAvatarUrl ? (
                  <img src={draw.sellerAvatarUrl} alt={draw.seller}
                    style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--accent-coral)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      {(draw.sellerName || draw.seller || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {draw.sellerName || `@${draw.seller}`}
                </span>
                {draw.isVerified && <span style={{ color: 'var(--accent-lilac)', fontSize: 12 }}>✓</span>}
              </Link>
            ) : (
              <>
                <span style={{ fontSize: 14, color: 'var(--grey)' }}>{draw.seller}</span>
                {draw.isVerified && <span style={{ color: 'var(--purple)', fontSize: 12 }}>✓</span>}
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <span className="serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-pink)' }}>{price}</span>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>£{draw.retailValue.toLocaleString()} retail</span>
          </div>

          {/* Progress bar with reserve marker */}
          <div style={{ position: 'relative', marginBottom: reservePct !== null ? 6 : 0 }}>
            <ProgressBar percent={pct} height={6} />
            {reservePct !== null && (
              <div style={{
                position: 'absolute',
                left: `${reservePct}%`,
                top: -4,
                width: 2, height: 14,
                background: reserveHit ? 'var(--green)' : 'var(--gold)',
                borderRadius: 1,
                transform: 'translateX(-50%)',
              }} />
            )}
          </div>
          {reservePct !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 1, background: reserveHit ? 'var(--green)' : 'var(--gold)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: reserveHit ? 'var(--green)' : 'var(--gold)', fontWeight: 500 }}>
                Reserve {reservePct}%{reserveHit ? ' — reached, draw confirmed!' : ' needed to confirm draw'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--grey)' }}>{pct}% of {draw.totalTickets.toLocaleString()} tickets sold</span>
            <span style={{ fontSize: 12, color: remaining < 500 ? 'var(--red)' : 'var(--grey)' }}>{remaining.toLocaleString()} remaining</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--grey)' }}>{draw.soldTickets.toLocaleString()} entries</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>About this item</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: expanded ? 'none' : 3, WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>
              {draw.description}
            </p>
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {draw.tags.map(tag => <span key={tag} style={{ background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--grey)', fontSize: 12, padding: '4px 10px', borderRadius: 999 }}>{tag}</span>)}
          </div>

          {/* Free postal entry info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Free postal entry</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', lineHeight: 1.5 }}>
              One postcard = one entry, equal odds to paid tickets. Write your name, email, and this draw&apos;s title on a postcard and send to our postal address.<br />
              <strong style={{ color: 'var(--gold)' }}>Postal address coming soon — will be published before launch.</strong>
            </p>
          </div>

        </div>

        {/* Winner banner — shown when draw is resolved */}
        {draw.status === 'resolved' && (
          <div style={{
            margin: '0 16px 20px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(124,58,237,0.06))',
            border: '1.5px solid var(--gold)', borderRadius: 16, padding: '20px 20px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 24 }}>🎉</p>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>
              Winner: @{draw.winnerHandle ?? 'winner'}
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--muted)' }}>This draw has closed</p>
            <Link href={`/draw/${draw.id}/winner`} style={{
              display: 'inline-block', padding: '10px 24px', borderRadius: 999,
              background: 'var(--gold)', color: '#000',
              fontWeight: 700, fontSize: 13, textDecoration: 'none',
            }}>
              View winner announcement →
            </Link>
          </div>
        )}

        {/* Sticky CTA */}
        <div style={{ position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 500, padding: '12px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', zIndex: 50 }}>
          {draw.status === 'resolved' ? (
            <Link href={`/draw/${draw.id}/winner`} style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: 16, borderRadius: 999, background: 'var(--gold)', border: 'none', color: '#000', fontSize: 16, fontWeight: 700 }}>
                🏆 See who won
              </button>
            </Link>
          ) : (
            <>
              {draw.isClosingTonight && <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--pink)', textAlign: 'center', fontWeight: 600 }}>⏰ Closing tonight at 9pm</p>}
              <button
                className="btn-purchase"
                onClick={() => router.push(`/draw/${draw.id}/purchase`)}
                style={{ width: '100%', fontSize: 16, fontWeight: 700, borderRadius: 10 }}
              >
                Enter draw · {price}
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
