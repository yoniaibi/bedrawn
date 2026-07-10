'use client';

import '@/lib/amplify';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';

interface SellerStatus {
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingUrl: string | null;
}

interface DrawStat {
  id: string;
  title: string;
  imageUrl?: string;
  status: string;
  soldTickets: number;
  totalTickets: number;
  ticketPricePence: number;
  retailValuePence: number;
  sellerRevenuePence: number;
  closingDate: string;
}

interface SellerStats {
  draws: DrawStat[];
  totalEarningsPence: number;
  pendingPayoutPence: number;
  stripeConnected: boolean;
}

async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

function StatusBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      background: enabled ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
      border: `1px solid ${enabled ? 'var(--green)' : 'var(--gold)'}`,
      borderRadius: 10,
    }}>
      <span style={{ color: enabled ? 'var(--green)' : 'var(--gold)', fontSize: 16 }}>
        {enabled ? '✓' : '○'}
      </span>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 11, color: enabled ? 'var(--green)' : 'var(--gold)' }}>
          {enabled ? 'Active' : 'Pending verification'}
        </p>
      </div>
    </div>
  );
}

function StoryCanvas({ draw, onClose }: { draw: DrawStat; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080, H = 1920;
    canvas.width = W;
    canvas.height = H;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw bag image
      ctx.drawImage(img, 0, 0, W, Math.round(H * 0.65));

      // Dark gradient overlay
      const grad = ctx.createLinearGradient(0, H * 0.35, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.75)');
      grad.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // bedrawn wordmark
      ctx.fillStyle = '#fff';
      ctx.font = `700 52px "Inter", system-ui, sans-serif`;
      ctx.fillText('bedrawn', 72, 104);

      // Draw title
      ctx.fillStyle = '#fff';
      ctx.font = `700 64px "Inter", system-ui, sans-serif`;
      const words = draw.title.split(' ');
      let line = '', y = H * 0.7;
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > W - 144) {
          ctx.fillText(line, 72, y);
          line = w; y += 80;
        } else { line = test; }
      }
      if (line) ctx.fillText(line, 72, y);

      // Price in pink
      const pricePence = draw.ticketPricePence;
      const price = pricePence >= 100 ? `£${(pricePence / 100).toFixed(2)}` : `${pricePence}p`;
      ctx.fillStyle = '#EC4899';
      ctx.font = `italic 700 96px Georgia, serif`;
      ctx.fillText(`from ${price} a ticket`, 72, H * 0.84);

      // Closing date
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `500 46px "Inter", system-ui, sans-serif`;
      ctx.fillText(`Closes ${draw.closingDate ? new Date(draw.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'soon'}`, 72, H * 0.90);

      // Footer CTA
      ctx.fillStyle = '#EC4899';
      ctx.font = `700 48px "Inter", system-ui, sans-serif`;
      ctx.fillText('bedrawn.app', 72, H - 80);

      setReady(true);
    };
    img.onerror = () => {
      // Fallback if image can't be loaded cross-origin — still render text
      ctx.fillStyle = '#0D0B14';
      ctx.fillRect(0, 0, W, H);
      img.onload && img.onload.call(img, new Event('load'));
    };
    img.src = draw.imageUrl ?? '';
    if (!draw.imageUrl) img.onerror!(new Event('error'));
  }, [draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `bedrawn-story-${draw.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-raised)', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Story asset</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-tertiary)' }}>×</button>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid var(--border-default)', display: 'block' }} />
        <button
          onClick={download}
          disabled={!ready}
          style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 999, background: ready ? 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' : 'var(--bg-overlay)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: ready ? 'pointer' : 'not-allowed' }}
        >
          {ready ? 'Download PNG →' : 'Generating…'}
        </button>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>1080×1920 — perfect for Instagram Stories</p>
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  const [status, setStatus] = useState<SellerStatus | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [storyDraw, setStoryDraw] = useState<DrawStat | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [token, user] = await Promise.all([getAuthToken(), getCurrentUser()]);
        setUsername(user.username ?? '');

        // POST /seller/account is idempotent — returns existing account data if already created
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ returnUrl: `${window.location.origin}/seller/dashboard`, statusCheck: true }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${res.status}`);
        }

        const data = await res.json();
        setStatus({
          stripeAccountId: data.stripeAccountId ?? null,
          chargesEnabled: data.chargesEnabled ?? false,
          payoutsEnabled: data.payoutsEnabled ?? false,
          onboardingUrl: data.onboardingUrl ?? null,
        });

        // Fetch seller earnings stats in parallel
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) setSellerStats(await statsRes.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load seller status');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const resumeOnboarding = async () => {
    setResumeLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/seller/dashboard` }),
      });
      const data = await res.json();
      if (data.onboardingUrl) window.location.href = data.onboardingUrl;
    } catch {
      setResumeLoading(false);
    }
  };

  const isVerified = status?.chargesEnabled && status?.payoutsEnabled;

  const shareDraw = async (d: DrawStat) => {
    const url = `${window.location.origin}/draw/${d.id}?ref=${encodeURIComponent(username)}`;
    const caption = `Enter my ${d.title} draw from ${d.ticketPricePence >= 100 ? `£${(d.ticketPricePence / 100).toFixed(2)}` : `${d.ticketPricePence}p`} on bedrawn! 🎉`;
    try {
      if (navigator.share) {
        await navigator.share({ title: d.title, text: caption, url });
      } else {
        await navigator.clipboard.writeText(`${caption} ${url}`);
        setCopiedId(d.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {}
  };

  return (
    <AppShell>
      {storyDraw && <StoryCanvas draw={storyDraw} onClose={() => setStoryDraw(null)} />}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            Seller Dashboard{username ? ` · @${username}` : ''}
          </p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--grey)' }}>Loading your seller account…</p>
            </div>
          ) : error ? (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 12, padding: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
            </div>
          ) : (
            <>
              {/* Verification status */}
              <div>
                <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Verification status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <StatusBadge enabled={status?.chargesEnabled ?? false} label="Accept payments" />
                  <StatusBadge enabled={status?.payoutsEnabled ?? false} label="Receive payouts" />
                </div>
              </div>

              {/* Not yet verified — resume onboarding */}
              {!isVerified && (
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: 20 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Complete your verification</p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
                    Your Stripe account needs a few more details before you can receive payouts. This usually takes 2–3 minutes.
                  </p>
                  <button
                    onClick={resumeOnboarding}
                    disabled={resumeLoading}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 999, border: 'none',
                      background: resumeLoading ? 'var(--muted)' : 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                      color: 'var(--white)', fontWeight: 700, fontSize: 14,
                      cursor: resumeLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {resumeLoading ? 'Opening…' : 'Continue verification →'}
                  </button>
                </div>
              )}

              {/* Verified — show dashboard */}
              {isVerified && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Total earned</p>
                      <p className="serif" style={{ margin: 0, fontSize: 28, color: 'var(--gold)', fontWeight: 700 }}>
                        {sellerStats ? `£${(sellerStats.totalEarningsPence / 100).toFixed(2)}` : '—'}
                      </p>
                    </div>
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Pending</p>
                      <p className="serif" style={{ margin: 0, fontSize: 28, color: 'var(--green)', fontWeight: 700 }}>
                        {sellerStats ? `£${(sellerStats.pendingPayoutPence / 100).toFixed(2)}` : '—'}
                      </p>
                    </div>
                  </div>

                  <Link href="/seller/list" style={{ textDecoration: 'none' }}>
                    <button style={{
                      width: '100%', padding: '14px', borderRadius: 999,
                      background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                      border: 'none', color: 'var(--white)', fontWeight: 700, fontSize: 15,
                      cursor: 'pointer',
                    }}>+ List new item</button>
                  </Link>

                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Your draws</p>
                    {sellerStats && sellerStats.draws.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sellerStats.draws.map(d => (
                          <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>
                                  {d.soldTickets}/{d.totalTickets} tickets · closes {d.closingDate}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                                  £{(d.sellerRevenuePence / 100).toFixed(2)}
                                </p>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
                                  background: d.status === 'open' ? 'rgba(139,92,246,0.15)' : 'rgba(75,85,99,0.2)',
                                  color: d.status === 'open' ? 'var(--purple)' : 'var(--grey)',
                                }}>{d.status}</span>
                              </div>
                            </div>
                            {d.status === 'open' && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => shareDraw(d)}
                                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--purple)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >
                                  {copiedId === d.id ? '✓ Copied!' : '↗ Share draw'}
                                </button>
                                <button
                                  onClick={() => setStoryDraw(d)}
                                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--grey)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >
                                  📸 Story asset
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)' }}>No draws yet — list your first item to get started.</p>
                    )}
                  </div>
                </>
              )}

              {status?.stripeAccountId && (
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                  Stripe account: {status.stripeAccountId}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
