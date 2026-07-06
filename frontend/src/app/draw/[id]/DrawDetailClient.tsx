'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';
import ProgressBar from '@/components/ProgressBar';
import LiveDot from '@/components/LiveDot';
import { ChevronLeftIcon, HeartFilledIcon, ShareIcon, TrophyIcon, ClockIcon } from '@/components/icons';
import type { Draw } from '@/lib/mockData';

function getSavedDraws(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('saved_draws') ?? '[]'); } catch { return []; }
}

// Extract the real draw ID from the browser URL — bypasses Next.js static prop
// which is baked as "1" when Amplify's catch-all rewrite serves /draw/1 for unknown IDs.
function getRealId(idProp: string): string {
  if (typeof window === 'undefined') return idProp;
  const segments = window.location.pathname.split('/').filter(Boolean);
  // pathname is /draw/<id>  →  segments[0]='draw', segments[1]=id
  return segments[1] || idProp;
}

export default function DrawDetailClient({ id: idProp }: { id: string }) {
  const router = useRouter();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(() => getSavedDraws().includes(getRealId(idProp)));

  // Purchase modal state
  const [showModal, setShowModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [walletPence, setWalletPence] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    const id = getRealId(idProp);
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setLoading(false); return; }
    fetch(`${url}/draws/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.draw) setDraw(data.draw as Draw); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = async () => {
    setQty(1);
    setPurchaseError('');
    setPurchased(false);
    setShowModal(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWalletPence(data.balancePence ?? 0);
      }
    } catch {}
  };

  const handlePurchase = async () => {
    if (!draw) return;
    setSubmitting(true);
    setPurchaseError('');
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) { router.push('/login'); return; }
      const id = getRealId(idProp);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws/${id}/enter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCount: qty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurchaseError(data.error ?? 'Something went wrong');
      } else {
        setPurchased(true);
        setWalletPence(prev => prev !== null ? prev - qty * draw.ticketPrice : null);
      }
    } catch {
      setPurchaseError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = () => {
    const id = getRealId(idProp);
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
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="skeleton-card" style={{ margin: '0 0 1px' }}>
            <div className="skeleton-img" style={{ aspectRatio: '16/7' }} />
          </div>
          <div style={{ padding: '20px 16px' }}>
            <div className="skeleton" style={{ height: 28, width: '75%', marginBottom: 12, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 24, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 80, marginBottom: 16, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
          </div>
        </div>
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
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Back to home">
            <ChevronLeftIcon size={20} color="var(--text-secondary)" />
          </Link>
          <div style={{ flex: 1 }} />
          <button onClick={handleSave} aria-label={saved ? 'Remove from saved' : 'Save draw'} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <HeartFilledIcon size={20} filled={saved} color={saved ? 'var(--accent-coral)' : 'var(--text-secondary)'} />
          </button>
          <button aria-label="Share" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ShareIcon size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Hero image */}
        <div style={{ height: 280, background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
          <img src={draw.imageUrl} alt={draw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(13,11,20,0.6))' }} />
          {draw.isClosingTonight ? (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <span style={{ background: 'rgba(255,35,86,0.15)', border: '1px solid rgba(255,35,86,0.35)', color: '#FF2356', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.08em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
                <LiveDot size={5} /> Drawing Tonight 9pm
              </span>
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <span style={{ background: 'rgba(0,0,0,0.40)', color: 'rgba(255,255,255,0.70)', fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 6, backdropFilter: 'blur(8px)', letterSpacing: '0.04em' }}>
                Open · accepting entries
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
        <div className="sticky-cta-bar" style={{ bottom: 58 }}>
          {draw.status === 'resolved' ? (
            <Link href={`/draw/${draw.id}/winner`} style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{ width: '100%', height: 52, borderRadius: 999, background: 'var(--gold)', border: 'none', color: '#000', fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                <TrophyIcon size={16} color="currentColor" /> See who won
              </button>
            </Link>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {draw.isClosingTonight && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--accent-rose)', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <ClockIcon size={13} color="var(--accent-rose)" /> Drawing tonight at 9pm
                </p>
              )}
              <button className="btn-purchase" onClick={openModal}>
                Enter draw · {price}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Purchase modal */}
      {showModal && draw && (
        <div
          className="purchase-overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,11,20,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div className="purchase-sheet" style={{ background: 'var(--card)', width: '100%', padding: 24, paddingBottom: 40, animation: 'sheetEnter 320ms cubic-bezier(0.16,1,0.3,1)' }}>

            {purchased ? (
              /* Success state */
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>You're in!</p>
                <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 4px' }}>{qty} ticket{qty > 1 ? 's' : ''} · {qty * draw.ticketPrice >= 100 ? `£${(qty * draw.ticketPrice / 100).toFixed(2)}` : `${qty * draw.ticketPrice}p`} spent</p>
                {walletPence !== null && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>Wallet balance: {walletPence >= 100 ? `£${(walletPence / 100).toFixed(2)}` : `${walletPence}p`}</p>
                )}
                <button onClick={() => setShowModal(false)} style={{ padding: '12px 32px', borderRadius: 999, background: 'var(--accent-coral)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>Enter draw</p>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--grey)', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                </div>

                {/* Draw title */}
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{draw.title}</p>

                {/* Wallet balance */}
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--grey)' }}>Wallet balance</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: walletPence !== null && walletPence < qty * draw.ticketPrice ? 'var(--red)' : 'var(--gold)' }}>
                    {walletPence === null ? '…' : walletPence >= 100 ? `£${(walletPence / 100).toFixed(2)}` : `${walletPence}p`}
                  </span>
                </div>

                {/* Quantity selector */}
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--grey)', fontWeight: 600 }}>Number of tickets</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[1, 5, 10, 25].map(n => (
                    <button
                      key={n}
                      onClick={() => setQty(n)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        background: qty === n ? 'rgba(255,35,86,0.10)' : 'var(--bg)',
                        border: `2px solid ${qty === n ? 'var(--accent-coral)' : 'var(--border)'}`,
                        color: qty === n ? 'var(--accent-coral)' : 'var(--text)',
                      }}
                    >{n}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', border: '1.5px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>−</button>
                  <input
                    type="number"
                    min={1}
                    max={draw.totalTickets - draw.soldTickets}
                    value={qty}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1) setQty(Math.min(v, draw.totalTickets - draw.soldTickets));
                    }}
                    style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: 'var(--bg)', border: '2px solid var(--accent-coral)', color: 'var(--text)', fontSize: 18, fontWeight: 700, outline: 'none' }}
                  />
                  <button onClick={() => setQty(q => Math.min(q + 1, draw.totalTickets - draw.soldTickets))} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', border: '1.5px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>+</button>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 14, color: 'var(--grey)' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                    {qty * draw.ticketPrice >= 100 ? `£${(qty * draw.ticketPrice / 100).toFixed(2)}` : `${qty * draw.ticketPrice}p`}
                  </span>
                </div>

                {purchaseError && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>{purchaseError}</p>
                )}

                {/* Insufficient funds */}
                {walletPence !== null && walletPence < qty * draw.ticketPrice ? (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>Insufficient wallet balance</p>
                    <button onClick={() => { setShowModal(false); router.push('/account/wallet'); }} style={{ width: '100%', padding: 16, borderRadius: 999, background: 'var(--gold)', border: 'none', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      Top up wallet →
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-purchase"
                    onClick={handlePurchase}
                    disabled={submitting}
                  >
                    {submitting ? 'Confirming…' : `Confirm · ${qty * draw.ticketPrice >= 100 ? `£${(qty * draw.ticketPrice / 100).toFixed(2)}` : `${qty * draw.ticketPrice}p`}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
