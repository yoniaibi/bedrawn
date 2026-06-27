'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';
import Logo from '@/components/Logo';
import { draws, recentWinners } from '@/lib/mockData';

const displayDraws = (() => {
  const seen = new Set<string>();
  return [...draws.filter(d => d.isClosingTonight), ...draws]
    .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; })
    .slice(0, 6);
})();

const testimonials = [
  { handle: '@jess_m', location: 'London', role: 'Winner', quote: "Can't believe I just won a Chanel Classic Flap for literally 30p. I was about to go to bed 😭 the wheel landed on me and I screamed.", item: 'Chanel Classic Flap', paid: '30p', value: 2400 },
  { handle: '@marcus_t', location: 'Manchester', role: 'Seller', quote: "Listed my whole trainer collection, all 12 pairs. Sold out in 4 hours and got paid £680 by morning. Vinted never moved these.", item: 'Trainer Collection', paid: 'Seller', value: 680 },
  { handle: '@priya_k', location: 'Birmingham', role: 'Winner', quote: "My friend told me about Bedrawn, I bought 3 tickets at 10p each and won a £400 Mulberry tote. This is actually unreal.", item: 'Mulberry Alexa', paid: '30p', value: 400 },
  { handle: '@jordan_k', location: 'Manchester', role: 'Seller', quote: "Listed my Air Jordans that had been sitting on Vinted for 4 months. Drew sold out in 6 hours. Cash in my account the next day. That's insane.", item: 'Air Jordan 1', paid: 'Seller', value: 380 },
];

const faqs = [
  { q: 'How do I enter for free?', a: 'Every draw has a free postal entry route. Write a postcard with your name, email, and draw name to: Bedrawn, PO Box 1000, London, EC1A 1BB. One postcard = one entry, same odds as paid tickets. This is what makes Bedrawn a legal prize promotion under UK law.' },
  { q: 'Is this gambling?', a: 'No. Bedrawn is a prize draw, not gambling. Every draw has a free entry route (no purchase necessary), which legally distinguishes it from a lottery. No gambling licence required — same structure as large UK charity draws.' },
  { q: "What if a draw doesn't sell enough tickets?", a: 'If a draw closes without reaching its minimum ticket threshold, all buyers are automatically refunded. Funds are held in escrow — we never touch your money directly.' },
  { q: 'How do I get my prize?', a: "Once the wheel picks your name at 9pm, you get an instant notification and your item ships free within 2 business days. All items are held by Bedrawn before going live — we verify them and dispatch directly. You never deal with the seller." },
  { q: 'How are sellers paid?', a: "Sellers are paid within 24 hours of the winner confirming delivery. Bedrawn takes a 12% platform fee. For a £200 item at 25p/ticket with 2,000 tickets sold, a seller receives approximately £423." },
  { q: 'Is the draw actually random?', a: "Yes — draws use a cryptographically secure random number generator. The outcome is provably fair. The live wheel is purely visual — the winner is determined by algorithm, not where the animation stops." },
  { q: 'How many tickets can I buy?', a: "Up to 25% of the tickets in any draw. If a draw has 2,000 tickets, the max is 500. At 10p each, that's £50 for a 25% shot at the prize." },
  { q: 'When does the draw happen?', a: "Every night at 9pm UK time. All draws close simultaneously and resolve live in the app with a live chat and reaction stream. Results and winner notifications go out by 9:15pm." },
];

const compareRows = [
  { feature: 'Tickets from 10p', vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Nightly live draw', vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Independent authentication', vinted: false, ebay: false, stockx: true, us: true },
  { feature: 'Cash payout if fake', vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Anyone can list', vinted: true, ebay: true, stockx: false, us: true },
  { feature: 'Free entry route', vinted: false, ebay: false, stockx: false, us: true },
];

function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setErrMsg('Enter a valid email'); return; }
    setStatus('loading');
    setErrMsg('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok || res.status === 200) {
        setStatus('done');
      } else {
        const j = await res.json().catch(() => ({}));
        setErrMsg(j.error ?? 'Something went wrong. Try again.');
        setStatus('error');
      }
    } catch {
      setErrMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div style={{
        background: 'rgba(29,158,117,0.1)', border: '1px solid var(--green)',
        borderRadius: 14, padding: compact ? '14px 16px' : '18px 20px',
        textAlign: 'center',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 20 }}>🎉</p>
        <p style={{ margin: 0, fontSize: compact ? 14 : 16, fontWeight: 700, color: 'var(--green)' }}>You&apos;re on the list!</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--grey)' }}>We&apos;ll let you know when Bedrawn launches.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: 8, flexDirection: compact ? 'row' : 'column' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{ flex: 1, padding: compact ? '12px 16px' : '14px 16px', fontSize: 15 }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: compact ? '12px 20px' : '14px 0',
            borderRadius: 999, border: 'none',
            background: status === 'loading' ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
            color: 'var(--white)', fontSize: 15, fontWeight: 700,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      {(errMsg || status === 'error') && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red)' }}>{errMsg || 'Something went wrong.'}</p>
      )}
    </form>
  );
}

export default function LandingPage() {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthed) router.replace('/home');
  }, [isAuthed, authLoading, router]);

  useEffect(() => {
    const id = setInterval(() => setWinnerIdx(i => (i + 1) % recentWinners.length), 3500);
    return () => clearInterval(id);
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo width={200} />
      </div>
    );
  }

  const w = recentWinners[winnerIdx];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>

        {/* ─── NAV ─── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(14,11,31,0.92)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Logo width={110} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'var(--grey)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            <a href="#waitlist" style={{
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontSize: 13, fontWeight: 700,
              padding: '8px 16px', borderRadius: 999, textDecoration: 'none',
            }}>Join waitlist</a>
          </div>
        </div>

        {/* ─── HERO ─── */}
        <div style={{ position: 'relative', minHeight: 580, overflow: 'hidden' }}>
          <img
            src={draws[1].imageUrl}
            alt="Bedrawn luxury draw"
            onLoad={() => setHeroLoaded(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.6s ease',
              filter: 'brightness(0.35)',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(14,11,31,0.15) 0%, rgba(14,11,31,0.05) 30%, rgba(14,11,31,0.98) 75%)',
          }} />
          <div style={{ position: 'relative', padding: '52px 24px 44px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ marginTop: 80 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(244,114,182,0.12)', border: '1px solid rgba(244,114,182,0.35)',
                borderRadius: 999, padding: '5px 14px', marginBottom: 20,
              }}>
                <LiveDot size={6} />
                <span style={{ color: 'var(--pink)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>LAUNCHING SOON · 9PM NIGHTLY</span>
              </div>

              <h1 style={{ margin: '0 0 4px', color: 'var(--white)', fontSize: 42, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
                Their loss.
              </h1>
              <h1 className="serif" style={{ margin: '0 0 16px', color: 'var(--gold)', fontSize: 46, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1, fontStyle: 'italic' }}>
                Your win.
              </h1>
              <p style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--grey)', lineHeight: 1.65 }}>
                The marketplace where people turn unworn designer clothes, bags and trainers into cash — and you win them for as little as 10p a ticket.
              </p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(14,11,31,0.6)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(244,114,182,0.3)',
                borderRadius: 999, padding: '7px 16px', marginBottom: 24,
              }}>
                <span style={{ color: 'var(--grey)', fontSize: 12 }}>First draw closes in</span>
                <CountdownTimer style={{ color: 'var(--pink)', fontWeight: 800, fontSize: 14 }} />
              </div>

              {/* Waitlist form */}
              <div id="waitlist" style={{ marginBottom: 16 }}>
                <WaitlistForm />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex' }}>
                  {['🎉', '💜', '🔥', '⌚'].map((e, i) => (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--card)', border: '2px solid var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, marginLeft: i === 0 ? 0 : -8,
                    }}>{e}</div>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>
                  <strong style={{ color: 'var(--white)' }}>4,312 people</strong> already on the waitlist
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── STATS BAR ─── */}
        <div style={{
          margin: '0 16px', marginTop: -20,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '18px 0',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          position: 'relative', zIndex: 2,
        }}>
          {[
            { value: 'From 10p', label: 'Per ticket' },
            { value: '£1.20', label: 'Avg winner spends' },
            { value: 'Free', label: 'Postal entry' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <p className="serif" style={{ margin: 0, fontSize: 18, color: 'var(--gold)', fontWeight: 700 }}>{s.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--grey)', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── WINNER TICKER ─── */}
        <div style={{
          margin: '16px 16px 0',
          background: 'rgba(249,200,70,0.05)', border: '1px solid rgba(249,200,70,0.2)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last winner</p>
            <p style={{ margin: '2px 0 1px', fontSize: 13, color: 'var(--white)', fontWeight: 600 }}>{w.handle} · {w.item}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>
              paid <strong style={{ color: 'var(--white)' }}>{w.paid}p</strong> · won{' '}
              <strong style={{ color: 'var(--gold)' }}>£{w.value.toLocaleString()}</strong>
            </p>
          </div>
          <div style={{
            background: 'rgba(249,200,70,0.12)', border: '1px solid rgba(249,200,70,0.3)',
            borderRadius: 8, padding: '6px 10px', textAlign: 'center', flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>{Math.round((w.value / w.paid) * 100)}×</p>
            <p style={{ margin: 0, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>RETURN</p>
          </div>
        </div>

        {/* ─── TONIGHT'S DRAWS PREVIEW ─── */}
        <div style={{ padding: '28px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--white)' }}>What&apos;s drawing at 9pm</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--grey)' }}>Join the waitlist to grab tickets</p>
            </div>
            <div style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <LiveDot size={6} />
              <span style={{ color: 'var(--pink)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {displayDraws.map(d => {
              const pct = Math.round((d.soldTickets / d.totalTickets) * 100);
              const priceLabel = d.ticketPrice >= 100 ? `£${(d.ticketPrice / 100).toFixed(2)}` : `${d.ticketPrice}p`;
              return (
                <a key={d.id} href="#waitlist" style={{ textDecoration: 'none' }}>
                  <div className="landing-draw-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', height: 96 }}>
                      <img src={d.imageUrl} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(14,11,31,0.9))' }} />
                      {pct >= 70 && (
                        <span style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(236,72,153,0.85)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>🔥 {pct}%</span>
                      )}
                      <span style={{ position: 'absolute', bottom: 5, left: 5, background: 'var(--purple)', color: 'var(--white)', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{priceLabel}</span>
                    </div>
                    <div style={{ padding: '7px 8px 9px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{d.title}</p>
                      <p style={{ margin: 0, fontSize: 9, color: 'var(--gold)', fontWeight: 600 }}>£{d.retailValue.toLocaleString()}</p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>Sign up to grab tickets before tonight&apos;s draw closes at 9pm</p>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>The loop</p>
          <p style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>List. Enter. Watch. Win.</p>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
            One loop that didn&apos;t exist before — a marketplace where everything resolves live at 9pm.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 20 }}>
            {[
              { emoji: '🛒', color: 'var(--purple)', title: 'List', desc: 'Snap your bag, trainers, or watch. Set a ticket price and quantity. Ship it to us — it goes live with a Verified badge.' },
              { emoji: '📱', color: 'var(--pink)',   title: 'Enter', desc: 'Buyers grab tickets from 10p. Up to 25% of any draw. A free postal entry route is always available.' },
              { emoji: '📢', color: 'var(--gold)',   title: 'Watch', desc: 'At 9pm the whole draw resolves live. The wheel spins, names land, and the crowd reacts in real time.' },
              { emoji: '🏆', color: 'var(--green)',  title: 'Win',   desc: 'The winner gets it shipped free. The seller gets paid within 24 hours. The item finds a new home.' },
            ].map((step, i, arr) => (
              <div key={step.title} style={{
                display: 'flex', gap: 16,
                paddingBottom: i < arr.length - 1 ? 24 : 0,
                borderLeft: i < arr.length - 1 ? `2px solid ${step.color}33` : '2px solid transparent',
                paddingLeft: 20, position: 'relative', marginLeft: 4,
              }}>
                <div style={{
                  position: 'absolute', left: -14, top: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--bg)', border: `2px solid ${step.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>{step.emoji}</div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: 'var(--white)' }}>{step.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── TESTIMONIALS: REAL WINS ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Real wins</p>
          <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>Someone wins every night at 9pm.</p>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>Real people, real items, real draws. Every single night.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {testimonials.slice(0, 3).map(t => (
              <div key={t.handle} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '18px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>{t.role === 'Winner' ? '🏆' : '💰'}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{t.handle}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{t.location} · {t.role}</p>
                  </div>
                  {t.role === 'Winner' && (
                    <div style={{
                      marginLeft: 'auto',
                      background: 'rgba(249,200,70,0.1)', border: '1px solid rgba(249,200,70,0.3)',
                      borderRadius: 8, padding: '4px 10px', textAlign: 'center',
                    }}>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>
                        {t.paid} → £{t.value.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.65, fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── WHY BEDRAWN ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Why us</p>
          <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>Win big. Sell easy.</p>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>Two sides, one marketplace. Buyers win things worth hundreds for pennies. Sellers finally move what wouldn&apos;t sell.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { emoji: '🏆', title: 'Win for 10p', desc: 'A designer bag, a watch, the trainers you couldn\'t justify. Tickets start at 10p — win it for the price of nothing.' },
              { emoji: '💰', title: 'Sell what won\'t sell', desc: "That coat that's sat on Vinted for months? List it, and a crowd of ticket buyers turns it into real cash, fast." },
              { emoji: '⚡', title: 'Tickets from 10p', desc: 'Less than a penny sweet. An impulse, not a decision — so draws fill fast.' },
              { emoji: '🔒', title: 'Built-in trust', desc: 'Items held in custody before going live. Escrow on every payment. Verified sellers only.' },
              { emoji: '📢', title: 'Watch it live', desc: 'Every draw resolves live at 9pm — the wheel spins, the crowd reacts, and someone wins.' },
              { emoji: '🎉', title: 'Free to enter', desc: 'Every draw has a genuine free entry route. A prize draw, not gambling — no licence needed.' },
            ].map(card => (
              <div key={card.title} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 14px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: 24 }}>{card.emoji}</p>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{card.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', lineHeight: 1.55 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── AUTHENTICATION ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trust</p>
          <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>Every item verified. Every winner protected.</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.65 }}>
            Before your winnings ship, the item passes through an independent authentication expert. If it fails, you get the full cash value — and the seller walks away with nothing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { value: '14,200+', label: 'Authenticated' },
              { value: '99.1%', label: 'Pass rate' },
              { value: '36h', label: 'Avg turnaround' },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 10px', textAlign: 'center',
              }}>
                <p className="serif" style={{ margin: '0 0 2px', fontSize: 20, color: 'var(--gold)', fontWeight: 700 }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--grey)', letterSpacing: '0.04em' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {/* Auth cert mock */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '16px', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                <img src={draws[0].imageUrl} alt="Auth" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bedrawn Auth Certificate</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>Chanel Classic Flap · Beige</p>
              </div>
              <div style={{
                marginLeft: 'auto', background: 'rgba(29,158,117,0.15)',
                border: '1px solid var(--green)', borderRadius: 8,
                padding: '4px 10px', flexShrink: 0,
              }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.06em' }}>✓ PASSED</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Specialist', value: 'Authenticate Plus' },
                { label: 'Cert #', value: 'AP-2026-004821' },
                { label: 'Inspected', value: '18 Jun 2026' },
                { label: 'Tier', value: 'Premium (T3)' },
              ].map(row => (
                <div key={row.label}>
                  <p style={{ margin: '0 0 1px', fontSize: 10, color: 'var(--muted)' }}>{row.label}</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--grey)' }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>
          <p style={{
            margin: '16px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6,
            fontStyle: 'italic', borderLeft: '3px solid var(--border)', paddingLeft: 12,
          }}>
            &ldquo;Vinted shows you a badge. We verify the item before it reaches you — by an independent specialist, on every single draw.&rdquo;
          </p>
        </div>

        {/* ─── WHAT PEOPLE SAY ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reviews</p>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>What people are saying</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ color: 'var(--gold)', fontSize: 16 }}>★★★★★</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>4.9</span>
            <span style={{ fontSize: 12, color: 'var(--grey)' }}>from 312 beta testers</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>94%</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>🎉 would recommend</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: 'var(--pink)' }}>98%</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>🔥 say it&apos;s addictive</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Sophie M.', loc: 'London', title: 'Won Chanel Classic Flap', quote: "I genuinely could not believe it. I won a Chanel bag for 30p. I entered on a whim before bed and woke up to a notification saying I'd won. The item arrived authenticated, tracked, perfect condition. This app is not normal." },
              { name: 'Jordan K.', loc: 'Manchester', title: 'Seller, Air Jordan 1', quote: "Listed my Air Jordans that had been sitting on Vinted for 4 months. Drew sold out in 6 hours. Cash in my account the next day. That's insane." },
              { name: 'Priya T.', loc: 'Leeds', title: 'Beta tester', quote: "The live draw at 9pm is genuinely addictive. Everyone's in the comments, the wheel spins, someone wins. It's like nothing else out there." },
              { name: 'Marcus R.', loc: 'Bristol', title: 'Won Rolex Submariner', quote: "Won a Rolex for £1.20. The authentication cert arrived before the watch did. I actually felt safer buying here than I would have on eBay." },
            ].map(r => (
              <div key={r.name} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{r.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{r.loc} · {r.title}</p>
                  </div>
                  <span style={{ color: 'var(--gold)', fontSize: 12 }}>★★★★★</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.65, fontStyle: 'italic' }}>&ldquo;{r.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FAQ ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Questions</p>
          <p style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>Everything you want to know.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', background: 'none', border: 'none', cursor: 'pointer', gap: 12,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', textAlign: 'left' }}>{faq.q}</span>
                  <span style={{ color: 'var(--purple)', fontSize: 18, flexShrink: 0, fontWeight: 300, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── COMPARISON ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>The landscape</p>
          <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>Many players. None of them Bedrawn.</p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
            There are hundreds of resale and raffle sites. Not one combines a real marketplace with a nightly live draw at 10p.
          </p>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', borderBottom: '1px solid var(--border)', padding: '12px 14px' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}></span>
              {['Vinted', 'eBay', 'StockX', 'Us'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: h === 'Us' ? 'var(--purple)' : 'var(--grey)', textAlign: 'center' }}>{h}</span>
              ))}
            </div>
            {compareRows.map((row, i) => (
              <div key={row.feature} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px',
                padding: '11px 14px', borderBottom: i < compareRows.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--grey)' }}>{row.feature}</span>
                {[row.vinted, row.ebay, row.stockx, row.us].map((val, j) => (
                  <span key={j} style={{ textAlign: 'center', fontSize: 14, color: val ? (j === 3 ? 'var(--green)' : 'var(--muted)') : 'var(--border)' }}>
                    {val ? '✓' : '—'}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ─── FOUNDING SELLERS ─── */}
        <div style={{ padding: '36px 16px 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(45,27,105,0.5), rgba(244,114,182,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 20, padding: '24px 20px',
          }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(249,200,70,0.15)', border: '1px solid var(--gold)',
              color: 'var(--gold)', fontSize: 10, fontWeight: 700,
              padding: '3px 12px', borderRadius: 999, letterSpacing: '0.1em',
              marginBottom: 14,
            }}>LIMITED — 100 SPOTS</span>
            <p style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>Become a founding seller.</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.65 }}>
              Got a bag, watch, or pair of trainers that won&apos;t sell? List it as one of our first 100 founding sellers. Your first draw is commission-free.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ display: 'flex' }}>
                {['🎽', '👜', '⌚', '👟', '💎'].map((e, i) => (
                  <div key={i} style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--card)', border: '2px solid var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, marginLeft: i === 0 ? 0 : -10,
                  }}>{e}</div>
                ))}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--white)', fontWeight: 600 }}>5 founding sellers confirmed</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>from London, Manchester &amp; Leeds</p>
              </div>
            </div>
            <a href="#waitlist" style={{
              display: 'block', padding: '14px 0', borderRadius: 999,
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', textAlign: 'center',
            }}>Apply to sell →</a>
          </div>
        </div>

        {/* ─── FINAL WAITLIST CTA ─── */}
        <div style={{ padding: '36px 16px 64px' }} id="waitlist-bottom">
          <div style={{
            background: 'linear-gradient(135deg, rgba(45,27,105,0.6), rgba(139,92,246,0.15))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 20, padding: '28px 20px', textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Be there for the first draw
            </p>
            <p className="serif" style={{ margin: '0 0 8px', fontSize: 28, color: 'var(--white)', fontStyle: 'italic', letterSpacing: -0.5 }}>
              Join the waitlist.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
              4,312 already in. Spots filling fast.
            </p>
            <WaitlistForm />
            <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--muted)' }}>
              By joining you agree to our{' '}
              <Link href="/legal/terms" style={{ color: 'var(--grey)', textDecoration: 'underline' }}>Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/legal/terms" style={{ color: 'var(--grey)', textDecoration: 'underline' }}>Terms</Link>
            </p>
          </div>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>

        {/* ─── FOOTER ─── */}
        <div style={{ padding: '20px 16px 32px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Logo width={90} />
          <p style={{ margin: '12px 0 6px', fontSize: 12, color: 'var(--muted)' }}>
            Their loss. Your win. · hello@bedrawn.app
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            {[['Terms', '/legal/terms'], ['Privacy', '/legal/privacy']].map(([label, href]) => (
              <Link key={label} href={href} style={{ color: 'var(--muted)', fontSize: 11, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, padding: '0 8px' }}>
            © 2026 Bedrawn. Bedrawn operates prize draws, not lotteries. Every draw offers a genuine free entry route with equal odds, in line with the Gambling Act 2005. No gambling licence required. 18+. Please play responsibly.
          </p>
        </div>

      </div>
    </div>
  );
}
