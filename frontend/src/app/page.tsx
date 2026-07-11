'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';
import { AppleIcon, PhoneIcon } from '@/components/icons';

type Draw = {
  id: string;
  title: string;
  ticketPrice: number;
  retailValue: number;
  totalTickets: number;
  soldTickets: number;
  imageUrl: string;
  isClosingTonight: boolean;
  status: string;
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=1200&fit=crop&q=90';

/* ─── Light luxury palette ─── */
const CREAM = '#FAF8F5';           // page background — warm cream
const ALT = '#F5EFEA';             // warmer cream for alternate sections
const INK = '#1A1410';             // deep warm black
const SUB = '#6B5E52';             // warm brown-grey
const FAINT = '#A8A29E';           // tertiary text
const PINK = '#EC4899';            // CTAs, urgency, energy
const PINK_DEEP = '#DB2777';       // pink for small text on light bg
const GOLD = '#F59E0B';            // winners only
const LILAC = '#7C3AED';           // trust, verification
const BORDER = 'rgba(0,0,0,0.07)';
const CARD_SHADOW = '0 2px 16px rgba(0,0,0,0.07)';
const CTA_GRADIENT = 'linear-gradient(135deg, #EC4899 0%, #F59E0B 130%)';

const TICKER_WINS = [
  { user: '@jade.london', item: 'Chanel Classic Flap', price: '£2.40' },
  { user: '@tomk', item: 'New Balance 2002R', price: '£0.80' },
  { user: '@sophie.bx', item: 'Cartier Tank Must', price: '£4.10' },
  { user: '@marcus_w', item: 'Louis Vuitton Speedy 30', price: '£1.60' },
  { user: '@ella.vintage', item: 'Dior Saddle Bag', price: '£3.20' },
  { user: '@harrykicks', item: 'Jordan 1 Retro High', price: '£0.60' },
  { user: '@nina.rose', item: 'Bottega Veneta Jodie', price: '£2.90' },
  { user: '@jamiedrops', item: 'Omega Seamaster', price: '£5.50' },
];

const DEMO_NAMES = ['@sophie.bx', '@marcus_w', '@ella.vintage', '@harrykicks', '@nina.rose', '@tomk', '@lex.arch', '@amelia.j', '@dan_north', '@priya.s'];
const DEMO_WINNER = '@jade.london';

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
  { feature: 'Tickets from 10p',          vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Nightly live draw',          vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Independent authentication', vinted: false, ebay: false, stockx: true,  us: true },
  { feature: 'Cash payout if fake',        vinted: false, ebay: false, stockx: false, us: true },
  { feature: 'Anyone can list',            vinted: true,  ebay: true,  stockx: false, us: true },
  { feature: 'Free entry route',           vinted: false, ebay: false, stockx: false, us: true },
];

const features = [
  { title: 'Win for 10p',          desc: "A designer bag, a watch, the trainers you couldn't justify. Tickets start at 10p — win it for the price of nothing." },
  { title: "Sell what won't sell", desc: "That coat that's sat on Vinted for months? List it, and a crowd of ticket buyers turns it into real cash, fast." },
  { title: 'Tickets from 10p',     desc: 'Less than a penny sweet. An impulse, not a decision — so draws fill fast.' },
  { title: 'Built-in trust',       desc: 'Items held in custody before going live. Escrow on every payment. Verified sellers only.' },
  { title: 'Watch it live',        desc: 'Every draw resolves live at 9pm — the wheel spins, the crowd reacts, and someone wins.' },
  { title: 'Free to enter',        desc: 'Every draw has a genuine free entry route. A prize draw, not gambling — no licence needed.' },
];

const steps = [
  { num: '01', color: 'var(--accent-lilac)', title: 'List',  desc: 'Snap your bag, trainers, or watch. Set a ticket price and quantity. Ship it to us — it goes live with a Verified badge.' },
  { num: '02', color: 'var(--accent-coral)', title: 'Enter', desc: 'Buyers grab tickets from 10p. Up to 25% of any draw. A free postal entry route is always available.' },
  { num: '03', color: 'var(--accent-coral)', title: 'Watch', desc: 'At 9pm the whole draw resolves live. The wheel spins, names land, and the crowd reacts in real time.' },
  { num: '04', color: 'var(--accent-gold)',  title: 'Win',   desc: 'The winner gets it shipped free. The seller gets paid within 24 hours. The item finds a new home.' },
];

const CONFETTI_COLORS = ['#F59E0B', '#EC4899', '#7C3AED', '#FCD34D', '#FB7185', '#F9A8D4'];

const fmtPrice = (pence: number) => (pence >= 100 ? `£${(pence / 100).toFixed(2)}` : `${pence}p`);

/** Deterministic PRNG — keeps render pure and SSR/client markup identical. */
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function Confetti({ count = 28, loop = false, contained = false }: { count?: number; loop?: boolean; contained?: boolean }) {
  const pieces = useMemo(() => {
    const rnd = seededRandom(count * 7919 + (loop ? 1 : 0) * 104729 + (contained ? 1 : 0) * 1299709);
    return Array.from({ length: count }, (_, i) => ({
      left: rnd() * 100,
      delay: rnd() * (loop ? 5 : 0.5),
      duration: (contained ? 1.8 : 3) + rnd() * (contained ? 1.4 : 3),
      w: 5 + rnd() * 6,
      rotate: rnd() * 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
  }, [count, loop, contained]);
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: -16,
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 0.45,
            background: p.color,
            borderRadius: 1.5,
            opacity: 0,
            transform: `rotate(${p.rotate}deg)`,
            animation: `${contained ? 'confetti-drop' : 'confetti-fall'} ${p.duration}s linear ${p.delay}s ${loop ? 'infinite' : 'both'}`,
          }}
        />
      ))}
    </div>
  );
}

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
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(5,150,105,0.30)', boxShadow: CARD_SHADOW, borderRadius: 16, padding: compact ? '16px 18px' : '22px 24px', textAlign: 'center' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#fff', fontSize: 18, fontWeight: 700 }}>✓</div>
        <p style={{ margin: '0 0 4px', fontSize: compact ? 14 : 16, fontWeight: 700, color: '#059669' }}>You&apos;re on the list!</p>
        <p style={{ margin: 0, fontSize: 12, color: SUB }}>We&apos;ll let you know when bedrawn launches.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: 10, flexDirection: compact ? 'row' : 'column' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{
            flex: 1, padding: compact ? '12px 16px' : '15px 18px', fontSize: 15, height: 'auto',
            border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12,
            background: '#FFFFFF', color: INK, outline: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: compact ? '12px 24px' : '15px 0',
            borderRadius: 999, border: 'none',
            background: status === 'loading' ? '#E7E0D8' : CTA_GRADIENT,
            color: status === 'loading' ? FAINT : '#FFFFFF', fontSize: 15, fontWeight: 700,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: status === 'loading' ? 'none' : '0 8px 24px rgba(236,72,153,0.30)',
          }}
        >
          {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      {(errMsg || status === 'error') && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#DC2626' }}>{errMsg || 'Something went wrong.'}</p>
      )}
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 10px', fontSize: 11, color: PINK_DEEP, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em' }}>
      {children}
    </p>
  );
}

export default function LandingPage() {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [demoPhase, setDemoPhase] = useState<'spinning' | 'flash' | 'winner'>('spinning');
  const [nameIdx, setNameIdx] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && isAuthed) router.replace('/home');
  }, [isAuthed, authLoading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws`);
        if (!res.ok) return;
        const j = await res.json();
        if (cancelled || !Array.isArray(j.draws)) return;
        const live = (j.draws as Draw[])
          .filter(d => d.status !== 'resolved' && d.status !== 'cancelled')
          .sort((a, b) => Number(b.isClosingTonight) - Number(a.isClosingTonight));
        setDraws(live.slice(0, 4));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.revealed)');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [draws, authLoading]);

  useEffect(() => {
    const el = demoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setDemoActive(e.isIntersecting), { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [authLoading]);

  useEffect(() => {
    if (!demoActive) return;
    let spinTimer: ReturnType<typeof setInterval> | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setDemoPhase('spinning');
      spinTimer = setInterval(() => setNameIdx(i => (i + 1) % DEMO_NAMES.length), 90);
      timers.push(setTimeout(() => { clearInterval(spinTimer); setDemoPhase('flash'); }, 3200));
      timers.push(setTimeout(() => setDemoPhase('winner'), 3900));
      timers.push(setTimeout(run, 8600));
    };
    run();
    return () => {
      clearInterval(spinTimer);
      timers.forEach(clearTimeout);
    };
  }, [demoActive]);

  const heroDraws = draws.slice(0, 2);
  const tickerItems = [...TICKER_WINS, ...TICKER_WINS];

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 80, width: 'auto' }} />
      </div>
    );
  }

  return (
    <div className="landing-light">

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(250,248,245,0.88)' : 'rgba(250,248,245,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 28px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
          <div className="desktop-flex" style={{ gap: 32, alignItems: 'center' }}>
            {[['Tonight', '#tonight'], ['The 9pm moment', '#moment'], ['How it works', '#how'], ['Sell', '#sellers']].map(([label, href]) => (
              <a key={href} href={href} style={{ color: SUB, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: SUB, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            <a href="#waitlist" style={{
              background: CTA_GRADIENT,
              color: '#FFFFFF', fontSize: 14, fontWeight: 700,
              padding: '10px 22px', borderRadius: 999, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(236,72,153,0.28)',
            }}>Join waitlist</a>
          </div>
        </div>
      </nav>

      {/* ─── SPLIT HERO ─── */}
      <section className="landing-hero-grid" style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="hero-image-pane" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="Editorial fashion — designer handbags"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent 0%, transparent 68%, ${CREAM} 100%)` }} />
          <div style={{ position: 'absolute', left: 24, bottom: 28, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${BORDER}`, boxShadow: CARD_SHADOW, borderRadius: 999, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: INK }}>Chanel Classic Flap · £5,200 retail</p>
              <p style={{ margin: 0, fontSize: 11, color: GOLD, fontWeight: 700 }}>won for £2.40 in tickets</p>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: CREAM }}>
          <div style={{ position: 'relative', padding: '120px 48px 72px', maxWidth: 640, width: '100%', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.25)',
              borderRadius: 999, padding: '6px 16px', marginBottom: 28,
            }}>
              <LiveDot size={6} />
              <span style={{ color: PINK_DEEP, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em' }}>LAUNCHING SOON · DRAWN NIGHTLY AT 9PM</span>
            </div>

            <h1 style={{ margin: 0, color: INK, fontSize: 'clamp(44px, 5.2vw, 72px)', fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.03em' }}>
              Their loss.
            </h1>
            <h1 className="serif" style={{ margin: '4px 0 24px', color: 'transparent', fontSize: 'clamp(48px, 5.6vw, 78px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', background: 'linear-gradient(120deg, #EC4899 10%, #F59E0B 95%)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
              Your win.
            </h1>

            <p style={{ margin: '0 0 24px', fontSize: 17, color: SUB, lineHeight: 1.7, maxWidth: 480 }}>
              Authenticated designer handbags, watches and trainers — won for as little as <span style={{ color: INK, fontWeight: 700 }}>10p a ticket</span>. Every draw resolves live at 9pm.
            </p>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#FFFFFF', border: `1px solid ${BORDER}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderRadius: 999, padding: '9px 20px', marginBottom: 28,
            }}>
              <span style={{ color: SUB, fontSize: 13 }}>Tonight&apos;s draw closes in</span>
              <CountdownTimer style={{ color: PINK_DEEP, fontWeight: 800, fontSize: 15 }} />
            </div>

            {heroDraws.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {heroDraws.map(d => {
                  const pct = d.totalTickets > 0 ? Math.min(100, Math.round((d.soldTickets / d.totalTickets) * 100)) : 0;
                  return (
                    <a key={d.id} href="#tonight" className="draw-card-light" style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 16, padding: '10px 14px', textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.imageUrl} alt={d.title} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</p>
                        <div style={{ height: 3, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #EC4899, #F59E0B)' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: PINK_DEEP }}>{fmtPrice(d.ticketPrice)}</p>
                        <p style={{ margin: 0, fontSize: 10, color: FAINT, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <LiveDot size={5} /> {pct}% sold
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            <div id="waitlist" style={{ maxWidth: 460 }}>
              <WaitlistForm />
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12.5, color: FAINT }}>
              Free postal entry on every draw · No purchase necessary · 18+
            </p>
          </div>
        </div>
      </section>

      {/* ─── WINNER TICKER ─── */}
      <div className="ticker-strip-coral">
        <div className="ticker-track">
          {tickerItems.map((w, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 14 }}>🏆</span>
              <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 800 }}>{w.user}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>just won</span>
              <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 700 }}>{w.item}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>for</span>
              <span style={{ fontSize: 13, color: '#FDE68A', fontWeight: 800 }}>{w.price}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', paddingLeft: 20 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── TONIGHT'S DRAWS ─── */}
      {draws.length > 0 && (
        <section id="tonight" style={{ position: 'relative', padding: '110px 0', background: CREAM }}>
          <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
            <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <SectionLabel>Live now</SectionLabel>
                <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(30px, 3.4vw, 44px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>Drawing at 9pm tonight.</h2>
                <p style={{ margin: 0, fontSize: 15, color: SUB }}>Real items, held in our custody, authenticated before they go live.</p>
              </div>
              <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 999, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <LiveDot size={6} />
                <span style={{ color: PINK_DEEP, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' }}>CLOSES IN</span>
                <CountdownTimer style={{ color: INK, fontWeight: 800, fontSize: 13 }} />
              </div>
            </div>

            <div className="landing-showcase-grid">
              {draws.map(d => {
                const pct = d.totalTickets > 0 ? Math.min(100, Math.round((d.soldTickets / d.totalTickets) * 100)) : 0;
                return (
                  <a key={d.id} href="#waitlist" className="reveal" style={{ textDecoration: 'none' }}>
                    <div className="draw-card-light" style={{ borderRadius: 20, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.imageUrl} alt={d.title} className="card-image-img" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(26,20,16,0.62) 100%)' }} />
                        {d.isClosingTonight && (
                          <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: PINK_DEEP, fontSize: 10, fontWeight: 800, padding: '5px 11px', borderRadius: 999, letterSpacing: '0.1em', boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}>
                            <LiveDot size={5} /> TONIGHT 9PM
                          </span>
                        )}
                        <span style={{ position: 'absolute', bottom: 12, left: 12, color: '#FFFFFF', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
                          £{d.retailValue.toLocaleString()} retail
                        </span>
                      </div>
                      <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{d.title}</p>
                        <div style={{ marginTop: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: FAINT }}>{d.soldTickets.toLocaleString()} / {d.totalTickets.toLocaleString()} tickets</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 70 ? PINK_DEEP : SUB }}>{pct}%</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 14 }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #EC4899, #F59E0B)' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: INK }}>{fmtPrice(d.ticketPrice)} <span style={{ fontSize: 11, fontWeight: 500, color: FAINT }}>/ ticket</span></span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: PINK_DEEP }}>Get tickets →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── WIN MOMENT — the one dark, dramatic spread ─── */}
      <section id="moment" ref={demoRef} style={{ position: 'relative', padding: '110px 0', overflow: 'hidden', background: 'linear-gradient(180deg, #17111F 0%, #100C18 100%)' }}>
        <div className="orb-pink" style={{ width: 520, height: 520, bottom: -200, right: -120 }} />
        <div className="orb-purple" style={{ width: 420, height: 420, top: -140, left: -140 }} />
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          <div className="landing-split" style={{ alignItems: 'center' }}>
            <div className="reveal">
              <p style={{ margin: '0 0 10px', fontSize: 11, color: '#F9A8D4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em' }}>The 9pm moment</p>
              <h2 style={{ margin: '0 0 18px', fontSize: 'clamp(32px, 3.6vw, 48px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.08 }}>
                Every night, someone wins <span className="serif" style={{ color: '#F7E7CE' }}>the thing they couldn&apos;t justify.</span>
              </h2>
              <p style={{ margin: '0 0 28px', fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, maxWidth: 480 }}>
                At 9pm every draw closes at once. Names spin live in the app, the crowd reacts in real time, and a cryptographically fair RNG picks one winner. Then it ships — free, authenticated, straight to their door.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['Provably fair RNG', 'Live chat & reactions', 'Results by 9:15pm'].map(t => (
                  <span key={t} className="glass-dark" style={{ borderRadius: 999, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{t}</span>
                ))}
              </div>
            </div>

            <div className="reveal">
              <div className="glass-dark" style={{ borderRadius: 24, padding: 0, position: 'relative', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.55)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LiveDot size={7} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#F9A8D4', letterSpacing: '0.14em' }}>LIVE DRAW</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', fontWeight: 600 }}>Chanel Classic Flap</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>2,847 watching</span>
                </div>

                <div style={{ position: 'relative', height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {demoPhase === 'spinning' && (
                    <>
                      <p style={{ margin: '0 0 14px', fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.2em', fontWeight: 700 }}>DRAWING WINNER</p>
                      <p key={nameIdx} className="win-demo-name" style={{ margin: 0, fontSize: 34, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                        {DEMO_NAMES[nameIdx]}
                      </p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: PINK, animationDelay: `${i * 0.2}s`, display: 'inline-block' }} />
                        ))}
                      </div>
                    </>
                  )}

                  {demoPhase === 'flash' && (
                    <>
                      <p style={{ margin: 0, fontSize: 34, fontWeight: 800, color: '#F7E7CE', letterSpacing: '-0.02em' }}>{DEMO_WINNER}</p>
                      <div className="gold-flash-overlay" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.55) 0%, rgba(245,158,11,0.12) 45%, transparent 75%)', pointerEvents: 'none' }} />
                    </>
                  )}

                  {demoPhase === 'winner' && (
                    <>
                      <Confetti count={30} contained />
                      <div style={{ textAlign: 'center', animation: 'modalEnter 0.45s var(--ease-spring) both', position: 'relative' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 30 }}>🏆</p>
                        <p className="serif" style={{ margin: '0 0 6px', fontSize: 36, color: GOLD, fontWeight: 700, letterSpacing: '-0.01em', textShadow: '0 0 40px rgba(245,158,11,0.5)' }}>{DEMO_WINNER}</p>
                        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2em' }}>WINS THE CHANEL CLASSIC FLAP</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.62)' }}>for <span style={{ color: GOLD, fontWeight: 800 }}>£2.40</span> in tickets</p>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>5,000 tickets · 10p each</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Provably fair · CSPRNG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ position: 'relative', padding: '110px 0', background: ALT }}>
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <SectionLabel>The loop</SectionLabel>
            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(32px, 3.6vw, 48px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>List. Enter. Watch. Win.</h2>
            <p style={{ margin: 0, fontSize: 16, color: SUB, lineHeight: 1.65, maxWidth: 540 }}>
              One loop that didn&apos;t exist before — a marketplace where everything resolves live at 9pm.
            </p>
          </div>
          <div className="landing-steps-grid">
            {steps.map(step => (
              <div key={step.title} className="reveal" style={{ background: '#FFFFFF', padding: '30px 26px', borderRadius: 20, borderTop: `3px solid ${step.color}`, boxShadow: CARD_SHADOW }}>
                <p className="serif" style={{ margin: '0 0 18px', fontSize: 46, fontWeight: 700, color: step.color, lineHeight: 1 }}>{step.num}</p>
                <p style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: INK }}>{step.title}</p>
                <p style={{ margin: 0, fontSize: 14, color: SUB, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY BEDRAWN ─── */}
      <section style={{ position: 'relative', padding: '110px 0', background: CREAM }}>
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          <div className="reveal" style={{ marginBottom: 44 }}>
            <SectionLabel>Why us</SectionLabel>
            <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(32px, 3.6vw, 48px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>Win big. Sell easy.</h2>
            <p style={{ margin: 0, fontSize: 16, color: SUB, lineHeight: 1.65, maxWidth: 560 }}>
              Two sides, one marketplace. Buyers win things worth hundreds for pennies. Sellers finally move what wouldn&apos;t sell.
            </p>
          </div>
          <div className="landing-features-grid">
            {features.map(card => (
              <div key={card.title} className="reveal" style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 18, padding: 26, boxShadow: CARD_SHADOW }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <span style={{ color: PINK_DEEP, fontSize: 15, lineHeight: 1 }}>✓</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: INK }}>{card.title}</p>
                <p style={{ margin: 0, fontSize: 13.5, color: SUB, lineHeight: 1.65 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUTHENTICATION ─── */}
      <section style={{ position: 'relative', padding: '110px 0', background: '#FFFFFF', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          <div className="landing-split" style={{ alignItems: 'center' }}>
            <div className="reveal">
              <p style={{ margin: '0 0 10px', fontSize: 11, color: LILAC, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em' }}>Trust</p>
              <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(30px, 3.2vw, 42px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.12 }}>Every item verified. Every winner protected.</h2>
              <p style={{ margin: '0 0 28px', fontSize: 15, color: SUB, lineHeight: 1.7 }}>
                Before your winnings ship, the item passes through an independent authentication expert. If it fails, you get the full cash value — and the seller walks away with nothing.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { value: 'Every draw',   label: 'Auth on every item' },
                  { value: 'Independent',  label: 'Third-party specialists' },
                  { value: 'Pre-dispatch', label: 'Checked before it ships' },
                ].map(s => (
                  <div key={s.label} style={{ background: ALT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                    <p className="serif" style={{ margin: '0 0 4px', fontSize: 16, color: LILAC, fontWeight: 700 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: FAINT }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal">
              <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 22, padding: 28, boxShadow: '0 8px 32px rgba(26,20,16,0.09)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: ALT }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draws[0]?.imageUrl ?? HERO_IMAGE} alt="Authenticated item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', fontSize: 10, color: FAINT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>bedrawn Auth Certificate</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: INK }}>Chanel Classic Flap · Beige</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.30)', borderRadius: 8, padding: '5px 12px', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#059669', letterSpacing: '0.06em' }}>PASSED</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Specialist', value: 'Authenticate Plus' },
                    { label: 'Cert #',     value: 'AP-2026-004821' },
                    { label: 'Inspected',  value: '18 Jun 2026' },
                    { label: 'Tier',       value: 'Premium (T3)' },
                  ].map(row => (
                    <div key={row.label}>
                      <p style={{ margin: '0 0 3px', fontSize: 11, color: FAINT }}>{row.label}</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: INK }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ margin: '18px 0 0', fontSize: 13.5, color: SUB, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `3px solid rgba(124,58,237,0.35)`, paddingLeft: 16 }}>
                &ldquo;Vinted shows you a badge. We verify the item before it reaches you — by an independent specialist, on every single draw.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section style={{ position: 'relative', padding: '110px 0', background: CREAM }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 28px' }}>
          <div className="reveal" style={{ marginBottom: 36 }}>
            <SectionLabel>The landscape</SectionLabel>
            <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(30px, 3.2vw, 42px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>Many players. None of them bedrawn.</h2>
            <p style={{ margin: 0, fontSize: 15, color: SUB, lineHeight: 1.65 }}>
              There are hundreds of resale and raffle sites. Not one combines a real marketplace with a nightly live draw at 10p.
            </p>
          </div>
          <div className="reveal" style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', boxShadow: CARD_SHADOW }}>
            <div className="compare-grid-row" style={{ borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', background: ALT }}>
              <span />
              {['Vinted', 'eBay', 'StockX', 'bedrawn'].map(h => (
                <span key={h} style={{ fontSize: 13, fontWeight: 700, color: h === 'bedrawn' ? PINK_DEEP : SUB, textAlign: 'center' }}>{h}</span>
              ))}
            </div>
            {compareRows.map((row, i) => (
              <div key={row.feature} className="compare-grid-row" style={{
                padding: '15px 24px',
                borderBottom: i < compareRows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
              }}>
                <span style={{ fontSize: 14, color: INK }}>{row.feature}</span>
                {[row.vinted, row.ebay, row.stockx, row.us].map((val, j) => (
                  <span key={j} style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: val ? (j === 3 ? PINK_DEEP : FAINT) : 'rgba(0,0,0,0.15)' }}>
                    {val ? '✓' : '—'}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOUNDING SELLERS ─── */}
      <section id="sellers" style={{ position: 'relative', padding: '110px 0', background: 'linear-gradient(180deg, #F5EFEA 0%, #FAF0F3 100%)' }}>
        <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto', padding: '0 28px' }}>
          <div className="reveal" style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 26, padding: 'clamp(32px, 5vw, 56px)', boxShadow: '0 8px 32px rgba(26,20,16,0.08)' }}>
            <span style={{ display: 'inline-block', background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.25)', color: PINK_DEEP, fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 999, letterSpacing: '0.14em', marginBottom: 20 }}>
              LIMITED — 100 SPOTS
            </span>
            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(30px, 3.4vw, 44px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>Become a founding seller.</h2>
            <p style={{ margin: '0 0 28px', fontSize: 16, color: SUB, lineHeight: 1.7, maxWidth: 480 }}>
              Got a bag, watch, or pair of trainers that won&apos;t sell? List it as one of our first 100 founding sellers. Your first draw is commission-free.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {[['JK', '#7C3AED'], ['AM', '#EC4899'], ['PR', '#F59E0B'], ['LT', '#059669'], ['MR', '#6D28D9']].map(([init, bg], i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: bg, border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', marginLeft: i === 0 ? 0 : -10 }}>{init}</div>
                ))}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, color: INK, fontWeight: 600 }}>5 founding sellers confirmed</p>
                <p style={{ margin: 0, fontSize: 12, color: FAINT }}>from London, Manchester &amp; Leeds</p>
              </div>
            </div>
            <a href="#waitlist-bottom" style={{
              display: 'inline-block', padding: '15px 36px', borderRadius: 999,
              background: CTA_GRADIENT,
              color: '#FFFFFF', fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(236,72,153,0.30)',
            }}>Apply to sell →</a>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ position: 'relative', padding: '110px 0', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 28px' }}>
          <div className="reveal" style={{ marginBottom: 36 }}>
            <SectionLabel>Questions</SectionLabel>
            <h2 style={{ margin: 0, fontSize: 'clamp(30px, 3.2vw, 42px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>Everything you want to know.</h2>
          </div>
          <div className="reveal" style={{ display: 'flex', flexDirection: 'column' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 4px', background: 'none', border: 'none', cursor: 'pointer', gap: 16 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: INK, textAlign: 'left' }}>{faq.q}</span>
                  <span style={{ color: PINK, fontSize: 22, flexShrink: 0, fontWeight: 300, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'block' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 4px 20px' }}>
                    <p style={{ margin: 0, fontSize: 14, color: SUB, lineHeight: 1.75 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP ─── */}
      <section style={{ position: 'relative', padding: '90px 0', background: CREAM }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 28px' }}>
          <div className="reveal" style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 26, padding: 'clamp(32px, 5vw, 52px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', boxShadow: CARD_SHADOW }}>
            <div style={{ flex: '1 1 340px' }}>
              <SectionLabel>The best experience</SectionLabel>
              <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Get the bedrawn app.
              </h2>
              <p style={{ margin: '0 0 28px', fontSize: 15, color: SUB, lineHeight: 1.65 }}>
                Watch draws go live, get instant win notifications, and manage your tickets — all from your phone at 9pm.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="#"
                  aria-label="Download on the App Store"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    background: INK, color: '#FFFFFF',
                    borderRadius: 12, padding: '12px 22px',
                    textDecoration: 'none',
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
                  background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.22)',
                  borderRadius: 12, padding: '12px 22px', color: PINK_DEEP, fontSize: 13,
                }}>
                  <PhoneIcon size={16} color="currentColor" />
                  <span style={{ fontWeight: 600 }}>Coming soon on Android</span>
                </div>
              </div>
            </div>
            <div style={{ width: 180, height: 320, borderRadius: 28, background: 'linear-gradient(160deg, #2A2118, #1A1410)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 24px 48px rgba(26,20,16,0.25)', flexShrink: 0 }}>
              <PhoneIcon size={36} color="rgba(255,255,255,0.30)" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>iOS App</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section id="waitlist-bottom" style={{ position: 'relative', padding: '130px 0 140px', overflow: 'hidden', background: CREAM }}>
        <Confetti count={34} loop />
        <div className="reveal" style={{ position: 'relative', maxWidth: 620, margin: '0 auto', padding: '0 28px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: PINK_DEEP, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em' }}>
            Be there for the first draw
          </p>
          <h2 className="serif" style={{ margin: '0 0 16px', fontSize: 'clamp(42px, 5vw, 60px)', color: INK, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Join the waitlist.
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: 16, color: SUB, lineHeight: 1.65 }}>
            Every night at 9pm, someone wins. Be among the first in — spots are limited.
          </p>
          <WaitlistForm />
          <p style={{ margin: '18px 0 0', fontSize: 12, color: FAINT }}>
            By joining you agree to our{' '}
            <Link href="/legal/privacy" style={{ color: SUB, textDecoration: 'underline' }}>Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/legal/terms" style={{ color: SUB, textDecoration: 'underline' }}>Terms</Link>
          </p>
          <p style={{ marginTop: 16, fontSize: 14, color: SUB }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: PINK_DEEP, textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: ALT, borderTop: `1px solid ${BORDER}`, padding: '52px 28px 36px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 24 }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 40, width: 'auto' }} />
              <p style={{ margin: '12px 0 4px', fontSize: 13, color: SUB }}>Their loss. Your win.</p>
              <p style={{ margin: 0, fontSize: 13, color: FAINT }}>hello@bedrawn.app</p>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[['How it works', '#how'], ['Tonight', '#tonight'], ['Sell', '#sellers'], ['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Log in', '/login']].map(([label, href]) => (
                <Link key={label} href={href} style={{ color: SUB, fontSize: 13, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 22 }}>
            <p style={{ margin: 0, fontSize: 11, color: FAINT, lineHeight: 1.7, maxWidth: 760 }}>
              © 2026 bedrawn. bedrawn operates prize draws, not lotteries. Every draw offers a genuine free entry route with equal odds, in line with the Gambling Act 2005. No gambling licence required. 18+. Please play responsibly.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
