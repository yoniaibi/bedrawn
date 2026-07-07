'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';
import Logo from '@/components/Logo';
import { AppleIcon, PhoneIcon } from '@/components/icons';
import { draws } from '@/lib/mockData';

const displayDraws = (() => {
  const seen = new Set<string>();
  return [...draws.filter(d => d.isClosingTonight), ...draws]
    .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; })
    .slice(0, 6);
})();


const faqs = [
  { q: 'How do I enter for free?', a: 'Every draw has a free postal entry route. Write a postcard with your name, email, and draw name and send it to our postal address (published before launch — check back soon). One postcard = one entry, same odds as paid tickets. This is what makes bedrawn a legal prize promotion under UK law.' },
  { q: 'Is this gambling?', a: 'No. bedrawn is a prize draw, not gambling. Every draw has a free entry route (no purchase necessary), which legally distinguishes it from a lottery. No gambling licence required — same structure as large UK charity draws.' },
  { q: "What if a draw doesn't sell enough tickets?", a: 'If a draw closes without reaching its minimum ticket threshold, all buyers are automatically refunded. Funds are held in escrow — we never touch your money directly.' },
  { q: 'How do I get my prize?', a: "Once the wheel picks your name at 9pm, you get an instant notification and your item ships free within 2 business days. All items are held by bedrawn before going live — we verify them and dispatch directly. You never deal with the seller." },
  { q: 'How are sellers paid?', a: "Sellers are paid within 24 hours of the winner confirming delivery. bedrawn takes a 12% platform fee. For a £200 item at 25p/ticket with 2,000 tickets sold, a seller receives approximately £423." },
  { q: 'Is the draw actually random?', a: "Yes — draws use a cryptographically secure random number generator. The outcome is provably fair. The live wheel is purely visual — the winner is determined by algorithm, not where the animation stops." },
  { q: 'How many tickets can I buy?', a: "Up to 25% of the tickets in any draw. If a draw has 2,000 tickets, the max is 500. At 10p each, that's £50 for a 25% shot at the prize." },
  { q: 'When does the draw happen?', a: "Every night at 9pm UK time. All draws close simultaneously and resolve live in the app with a live chat and reaction stream. Results and winner notifications go out by 9:15pm." },
];

const compareRows = [
  { feature: 'Tickets from 10p',             vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Nightly live draw',             vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Independent authentication',    vinted: false, ebay: false, stockx: true,  us: true },
  { feature: 'Cash payout if fake',           vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Anyone can list',               vinted: true,  ebay: true,  stockx: false, us: true },
  { feature: 'Free entry route',              vinted: false, ebay: false, stockx: false, us: true },
];

const features = [
  { title: 'Win for 10p',          desc: "A designer bag, a watch, the trainers you couldn't justify. Tickets start at 10p — win it for the price of nothing." },
  { title: "Sell what won't sell", desc: "That coat that's sat on Vinted for months? List it, and a crowd of ticket buyers turns it into real cash, fast." },
  { title: 'Tickets from 10p',     desc: 'Less than a penny sweet. An impulse, not a decision — so draws fill fast.' },
  { title: 'Built-in trust',       desc: 'Items held in custody before going live. Escrow on every payment. Verified sellers only.' },
  { title: 'Watch it live',        desc: 'Every draw resolves live at 9pm — the wheel spins, the crowd reacts, and someone wins.' },
  { title: 'Free to enter',        desc: 'Every draw has a genuine free entry route. A prize draw, not gambling — no licence needed.' },
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
        background: 'var(--green-light)', border: '1px solid var(--green)',
        borderRadius: 14, padding: compact ? '14px 16px' : '18px 20px',
        textAlign: 'center',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</div>
        <p style={{ margin: '0 0 4px', fontSize: compact ? 14 : 16, fontWeight: 700, color: 'var(--green)' }}>You&apos;re on the list!</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>We&apos;ll let you know when bedrawn launches.</p>
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
          style={{
            flex: 1, padding: compact ? '12px 16px' : '14px 16px', fontSize: 15,
            border: '1px solid var(--border)', borderRadius: 10,
            background: 'var(--card)', color: 'var(--text)', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: compact ? '12px 20px' : '14px 0',
            borderRadius: 999, border: 'none',
            background: status === 'loading' ? 'var(--muted)' : 'var(--accent-coral)',
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

const HERO_IMAGES = [
  // Editorial fashion — woman in elegant black outfit
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&h=900&fit=crop&q=85&auto=format',
  // Street style — model in designer look
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600&h=900&fit=crop&q=85&auto=format',
  // Luxury fashion — woman with designer accessories
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=900&fit=crop&q=85&auto=format',
  // High fashion editorial — elegant woman
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=900&fit=crop&q=85&auto=format',
];

export default function LandingPage() {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthed) router.replace('/home');
  }, [isAuthed, authLoading, router]);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroLoaded(false);
      setHeroIdx(i => (i + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 80, width: 'auto' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          <div className="desktop-flex" style={{ gap: 28, alignItems: 'center' }}>
            <a href="#how" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>How it works</a>
            <a href="#tonight" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Tonight</a>
            <a href="#winners" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Winners</a>
            <a href="#sellers" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Sell</a>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'var(--grey)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            <a href="#waitlist" style={{
              background: 'var(--accent-coral)',
              color: 'var(--white)', fontSize: 14, fontWeight: 700,
              padding: '10px 20px', borderRadius: 999, textDecoration: 'none',
            }}>Join waitlist</a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <div style={{ position: 'relative', minHeight: '80vh', overflow: 'hidden', background: '#0A0A14' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={heroIdx}
          src={HERO_IMAGES[heroIdx]}
          alt="bedrawn luxury fashion"
          onLoad={() => setHeroLoaded(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top',
            opacity: heroLoaded ? 0.6 : 0, transition: 'opacity 1s ease',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(10,10,20,0.92) 0%, rgba(10,10,20,0.72) 40%, rgba(10,10,20,0.2) 100%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '100px 24px 80px', display: 'flex', alignItems: 'center', minHeight: '80vh' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,35,86,0.15)', border: '1px solid rgba(255,35,86,0.4)',
              borderRadius: 999, padding: '5px 14px', marginBottom: 24,
            }}>
              <LiveDot size={6} />
              <span style={{ color: '#FF2356', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>LAUNCHING SOON · 9PM NIGHTLY</span>
            </div>

            <h1 style={{ margin: '0 0 4px', color: '#FFFFFF', fontSize: 68, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
              Their loss.
            </h1>
            <h1 className="serif" style={{ margin: '0 0 22px', color: '#F59E0B', fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: -2, fontStyle: 'italic' }}>
              Your win.
            </h1>
            <p style={{ margin: '0 0 14px', fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, maxWidth: 500 }}>
              The marketplace where people turn unworn designer clothes, bags and trainers into cash — and you win them for as little as 10p a ticket.
            </p>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,35,86,0.3)',
              borderRadius: 999, padding: '8px 18px', marginBottom: 28,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>First draw closes in</span>
              <CountdownTimer style={{ color: '#FF2356', fontWeight: 800, fontSize: 14 }} />
            </div>

            <div id="waitlist" style={{ marginBottom: 22, maxWidth: 480 }}>
              <WaitlistForm />
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              Be among the first when we launch
            </p>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { value: 'From 10p', label: 'Per ticket' },
            { value: '£1.20', label: 'Avg winner spends' },
            { value: 'Free', label: 'Postal entry route' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none', padding: '22px 0' }}>
              <p className="serif" style={{ margin: 0, fontSize: 22, color: 'var(--purple)', fontWeight: 700 }}>{s.value}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--grey)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TONIGHT'S DRAWS ─── */}
      <div id="tonight" style={{ padding: '56px 0', background: 'var(--card)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Drawing at 9pm tonight</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--grey)' }}>Join the waitlist to grab tickets before they close</p>
            </div>
            <div style={{ background: 'rgba(255,35,86,0.1)', border: '1px solid rgba(255,35,86,0.3)', borderRadius: 999, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LiveDot size={6} />
              <span style={{ color: 'var(--accent-coral)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>LIVE TONIGHT</span>
            </div>
          </div>
          <div className="landing-draw-grid">
            {displayDraws.map((d, idx) => {
              const pct = Math.round((d.soldTickets / d.totalTickets) * 100);
              const priceLabel = d.ticketPrice >= 100 ? `£${(d.ticketPrice / 100).toFixed(2)}` : `${d.ticketPrice}p`;
              return (
                <a key={d.id} href="#waitlist" style={{ textDecoration: 'none', animationDelay: `${idx * 50}ms`, animation: 'fade-in-up 0.3s ease-out both' }}>
                  <div className="landing-draw-card" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                    <div style={{ position: 'relative', aspectRatio: '3/2', overflow: 'hidden' }}>
                      <img src={d.imageUrl} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms ease-out' }} className="card-image-img" />
                      {pct >= 70 && (
                        <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent-coral)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(8px)' }}>{pct}% sold</span>
                      )}
                      <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(255,35,86,0.90)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, backdropFilter: 'blur(8px)' }}>{priceLabel}</span>
                    </div>
                    <div style={{ padding: '10px 12px 14px' }}>
                      <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{d.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--accent-gold)', fontWeight: 600 }}>£{d.retailValue.toLocaleString()} retail</p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Sign up to grab tickets before tonight&apos;s draw closes at 9pm</p>
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div id="how" style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>The loop</p>
          <h2 style={{ margin: '0 0 14px', fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>List. Enter. Watch. Win.</h2>
          <p style={{ margin: '0 0 52px', fontSize: 16, color: 'var(--grey)', lineHeight: 1.6, maxWidth: 540 }}>
            One loop that didn&apos;t exist before — a marketplace where everything resolves live at 9pm.
          </p>
          <div className="landing-steps-grid">
            {[
              { num: '01', color: 'var(--accent-lilac)', title: 'List',  desc: 'Snap your bag, trainers, or watch. Set a ticket price and quantity. Ship it to us — it goes live with a Verified badge.' },
              { num: '02', color: 'var(--accent-coral)', title: 'Enter', desc: 'Buyers grab tickets from 10p. Up to 25% of any draw. A free postal entry route is always available.' },
              { num: '03', color: 'var(--accent-coral)', title: 'Watch', desc: 'At 9pm the whole draw resolves live. The wheel spins, names land, and the crowd reacts in real time.' },
              { num: '04', color: 'var(--accent-gold)',  title: 'Win',   desc: 'The winner gets it shipped free. The seller gets paid within 24 hours. The item finds a new home.' },
            ].map(step => (
              <div key={step.title} style={{ padding: '28px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, borderTop: `4px solid ${step.color}` }}>
                <p className="serif" style={{ margin: '0 0 16px', fontSize: 48, fontWeight: 700, color: step.color, lineHeight: 1 }}>{step.num}</p>
                <p style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{step.title}</p>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--grey)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FIRST DRAW ─── */}
      <div id="winners" style={{ padding: '80px 0', background: 'rgba(139,92,246,0.04)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Be first</p>
          <h2 style={{ margin: '0 0 16px', fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>The first draw is coming.</h2>
          <p style={{ margin: '0 0 36px', fontSize: 16, color: 'var(--grey)', lineHeight: 1.65, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Every night at 9pm, a draw resolves live. Someone wins something they couldn&apos;t afford, for the price of a coffee. Join the waitlist — be there for draw number one.
          </p>
          <a href="#waitlist" style={{
            display: 'inline-block', padding: '14px 36px', borderRadius: 999,
            background: 'var(--accent-coral)', color: 'var(--white)',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
            Join the waitlist →
          </a>
        </div>
      </div>

      {/* ─── WHY bedrawn ─── */}
      <div style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Why us</p>
          <h2 style={{ margin: '0 0 8px', fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>Win big. Sell easy.</h2>
          <p style={{ margin: '0 0 44px', fontSize: 16, color: 'var(--grey)', lineHeight: 1.6, maxWidth: 560 }}>
            Two sides, one marketplace. Buyers win things worth hundreds for pennies. Sellers finally move what wouldn&apos;t sell.
          </p>
          <div className="landing-features-grid">
            {features.map(card => (
              <div key={card.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <span style={{ color: 'var(--purple)', fontSize: 16, lineHeight: 1 }}>✓</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{card.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── AUTHENTICATION ─── */}
      <div style={{ padding: '80px 0', background: 'var(--card)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="landing-split" style={{ alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trust</p>
              <h2 style={{ margin: '0 0 16px', fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>Every item verified. Every winner protected.</h2>
              <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--grey)', lineHeight: 1.65 }}>
                Before your winnings ship, the item passes through an independent authentication expert. If it fails, you get the full cash value — and the seller walks away with nothing.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { value: 'Every draw',    label: 'Auth on every item' },
                  { value: 'Independent',   label: 'Third-party specialists' },
                  { value: 'Pre-dispatch',  label: 'Checked before it ships' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <p className="serif" style={{ margin: '0 0 3px', fontSize: 16, color: 'var(--purple)', fontWeight: 700 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={draws[0].imageUrl} alt="Auth" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>bedrawn Auth Certificate</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Chanel Classic Flap · Beige</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 8, padding: '5px 12px', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.04em' }}>PASSED</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Specialist', value: 'Authenticate Plus' },
                    { label: 'Cert #',     value: 'AP-2026-004821' },
                    { label: 'Inspected',  value: '18 Jun 2026' },
                    { label: 'Tier',       value: 'Premium (T3)' },
                  ].map(row => (
                    <div key={row.label}>
                      <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--muted)' }}>{row.label}</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ margin: '18px 0 0', fontSize: 13, color: 'var(--grey)', lineHeight: 1.65, fontStyle: 'italic', borderLeft: '3px solid var(--border)', paddingLeft: 14 }}>
                &ldquo;Vinted shows you a badge. We verify the item before it reaches you — by an independent specialist, on every single draw.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* ─── FAQ ─── */}
      <div style={{ padding: '80px 0', background: 'var(--card)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Questions</p>
          <h2 style={{ margin: '0 0 36px', fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>Everything you want to know.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', gap: 16 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{faq.q}</span>
                  <span style={{ color: 'var(--purple)', fontSize: 22, flexShrink: 0, fontWeight: 300, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'block' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 20px' }}>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--grey)', lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── COMPARISON ─── */}
      <div style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>The landscape</p>
          <h2 style={{ margin: '0 0 10px', fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>Many players. None of them bedrawn.</h2>
          <p style={{ margin: '0 0 36px', fontSize: 15, color: 'var(--grey)', lineHeight: 1.6 }}>
            There are hundreds of resale and raffle sites. Not one combines a real marketplace with a nightly live draw at 10p.
          </p>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 100px', borderBottom: '1px solid var(--border)', padding: '14px 22px', background: 'var(--card)' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}></span>
              {['Vinted', 'eBay', 'StockX', 'bedrawn'].map(h => (
                <span key={h} style={{ fontSize: 13, fontWeight: 700, color: h === 'bedrawn' ? 'var(--purple)' : 'var(--grey)', textAlign: 'center' }}>{h}</span>
              ))}
            </div>
            {compareRows.map((row, i) => (
              <div key={row.feature} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 100px',
                padding: '14px 22px', borderBottom: i < compareRows.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'var(--card)',
              }}>
                <span style={{ fontSize: 14, color: 'var(--text)' }}>{row.feature}</span>
                {[row.vinted, row.ebay, row.stockx, row.us].map((val, j) => (
                  <span key={j} style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: val ? (j === 3 ? 'var(--green)' : 'var(--muted)') : 'var(--border)' }}>
                    {val ? '✓' : '—'}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FOUNDING SELLERS ─── */}
      <div id="sellers" style={{ padding: '80px 0', background: 'rgba(139,92,246,0.04)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 24, padding: '52px 48px' }}>
            <span style={{ display: 'inline-block', background: 'var(--gold-light)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: '0.1em', marginBottom: 18 }}>
              LIMITED — 100 SPOTS
            </span>
            <h2 style={{ margin: '0 0 14px', fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>Become a founding seller.</h2>
            <p style={{ margin: '0 0 28px', fontSize: 16, color: 'var(--grey)', lineHeight: 1.65, maxWidth: 480 }}>
              Got a bag, watch, or pair of trainers that won&apos;t sell? List it as one of our first 100 founding sellers. Your first draw is commission-free.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ display: 'flex' }}>
                {[['JK', 'var(--accent-lilac)'], ['AM', 'var(--accent-coral)'], ['PR', 'var(--accent-gold)'], ['LT', 'var(--success)'], ['MR', '#7C3AED']].map(([init, bg], i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: bg, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', marginLeft: i === 0 ? 0 : -10 }}>{init}</div>
                ))}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>5 founding sellers confirmed</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>from London, Manchester &amp; Leeds</p>
              </div>
            </div>
            <a href="#waitlist" style={{
              display: 'inline-block', padding: '14px 32px', borderRadius: 999,
              background: 'var(--accent-coral)',
              color: 'var(--white)', fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>Apply to sell →</a>
          </div>
        </div>
      </div>

      {/* ─── APP DOWNLOAD ─── */}
      <div style={{ padding: '72px 0', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,35,86,0.05), rgba(245,158,11,0.04))',
            border: '1px solid rgba(255,35,86,0.12)',
            borderRadius: 24, padding: '48px 52px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 32, flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 340px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                The best experience
              </p>
              <h2 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5, lineHeight: 1.1 }}>
                Get the bedrawn app.
              </h2>
              <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--grey)', lineHeight: 1.6 }}>
                Watch draws go live, get instant win notifications, and manage your tickets — all from your phone at 9pm.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="#"
                  aria-label="Download on the App Store"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    background: '#000000', color: '#FFFFFF',
                    borderRadius: 12, padding: '12px 22px',
                    textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <AppleIcon size={18} color="currentColor" />
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>Download on the</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>App Store</p>
                  </div>
                </a>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,35,86,0.06)', border: '1px solid rgba(255,35,86,0.15)',
                  borderRadius: 12, padding: '12px 22px', color: 'var(--accent-coral)', fontSize: 13,
                }}>
                  <PhoneIcon size={16} color="currentColor" />
                  <span style={{ fontWeight: 600 }}>Coming soon on Android</span>
                </div>
              </div>
            </div>
            <div style={{ width: 180, height: 320, borderRadius: 28, background: 'linear-gradient(160deg, #1A1030, #0D0B14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', flexShrink: 0 }}>
              <PhoneIcon size={36} color="rgba(255,255,255,0.25)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>iOS App</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>Coming soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FINAL CTA ─── */}
      <div style={{ padding: '88px 0' }} id="waitlist-bottom">
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Be there for the first draw
          </p>
          <h2 className="serif" style={{ margin: '0 0 14px', fontSize: 52, color: 'var(--text)', fontStyle: 'italic', letterSpacing: -1 }}>
            Join the waitlist.
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 16, color: 'var(--grey)', lineHeight: 1.6 }}>
            Be among the first in. Spots are limited.
          </p>
          <WaitlistForm />
          <p style={{ margin: '16px 0 0', fontSize: 12, color: 'var(--muted)' }}>
            By joining you agree to our{' '}
            <Link href="/legal/privacy" style={{ color: 'var(--grey)', textDecoration: 'underline' }}>Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/legal/terms" style={{ color: 'var(--grey)', textDecoration: 'underline' }}>Terms</Link>
          </p>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--grey)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ background: 'var(--black)', padding: '48px 24px 36px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 24 }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 40, width: 'auto', opacity: 0.85 }} />
              <p style={{ margin: '12px 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Their loss. Your win.</p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>hello@bedrawn.app</p>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {[['How it works', '#how'], ['Tonight', '#tonight'], ['Sell', '#sellers'], ['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Log in', '/login']].map(([label, href]) => (
                <Link key={label} href={href} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 22 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7, maxWidth: 760 }}>
              © 2026 bedrawn. bedrawn operates prize draws, not lotteries. Every draw offers a genuine free entry route with equal odds, in line with the Gambling Act 2005. No gambling licence required. 18+. Please play responsibly.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
