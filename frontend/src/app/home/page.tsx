'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import ProgressBar from '@/components/ProgressBar';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';

import { draws as mockDraws, currentUser, activityMessages, recentWinners } from '@/lib/mockData';
import type { Draw } from '@/lib/mockData';

const categories = [
  { id: 'all',         label: 'All' },
  { id: 'Fashion',     label: 'Fashion' },
  { id: 'Watches',     label: 'Watches' },
  { id: 'Trainers',    label: 'Trainers' },
  { id: 'Bags',        label: 'Bags' },
  { id: 'Jewellery',   label: 'Jewellery' },
  { id: 'Streetwear',  label: 'Streetwear' },
];

const filters = ['Tonight', 'Womenswear', 'Menswear', 'High Value', 'Bundles', 'Just Listed'];

export default function HomePage() {
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('');
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [allDraws, setAllDraws] = useState<Draw[]>(mockDraws);

  useEffect(() => {
    const id = setInterval(() => setWinnerIdx(i => (i + 1) % recentWinners.length), 9000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) return;
    fetch(`${url}/draws`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.draws?.length) setAllDraws(data.draws as Draw[]); })
      .catch(() => {});
  }, []);

  const filtered = allDraws.filter(d => {
    if (category !== 'all' && d.category !== category) return false;
    if (filter === 'Tonight') return d.isClosingTonight;
    if (filter === 'Womenswear') return d.style === 'Womenswear';
    if (filter === 'Menswear') return d.style === 'Menswear';
    if (filter === 'High Value') return d.retailValue >= 1000;
    if (filter === 'Bundles') return d.isBundle;
    return true;
  });

  const hero = allDraws.find(d => d.isClosingTonight) ?? allDraws[0];
  const heroPct = hero ? Math.round((hero.soldTickets / hero.totalTickets) * 100) : 0;
  const heroPrice = hero ? (hero.ticketPrice >= 100 ? `£${(hero.ticketPrice / 100).toFixed(2)}` : `${hero.ticketPrice}p`) : '';
  const tonightCount = allDraws.filter(d => d.isClosingTonight).length;
  const w = recentWinners[winnerIdx];

  const womenswear = allDraws.filter(d => d.style === 'Womenswear').slice(0, 8);
  const menswear = allDraws.filter(d => d.style === 'Menswear').slice(0, 8);

  if (!hero) return <AppShell><div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}>Loading draws…</div></AppShell>;

  return (
    <AppShell>
      <div className="page-container" style={{ paddingTop: 20, paddingBottom: 32 }}>

        {/* ── Hero section ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 20,
          marginBottom: 32,
        }}>
          {/* Hero draw card — desktop: large image left */}
          <Link href={`/draw/${hero.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="hero-draw" style={{
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid var(--border)',
              height: 360,
              position: 'relative',
              background: 'var(--card)',
            }}>
              <img
                src={hero.imageUrl}
                alt={hero.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.75) 100%)',
                padding: '20px 24px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: 'rgba(244,114,182,0.15)',
                    border: '1px solid rgba(244,114,182,0.35)',
                    color: '#F472B6', fontSize: 10, fontWeight: 600,
                    padding: '3px 10px', borderRadius: 6,
                    display: 'flex', alignItems: 'center', gap: 5,
                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                    backdropFilter: 'blur(8px)',
                  }}>
                    <LiveDot size={5} /> Closing Tonight
                  </span>
                </div>

                <div>
                  <p className="serif" style={{ fontSize: 28, color: 'var(--white)', margin: '0 0 6px', lineHeight: 1.2 }}>
                    {hero.title}
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    by {hero.seller}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                    <span className="serif" style={{ fontSize: 28, color: 'var(--accent-pink)', fontWeight: 700 }}>{heroPrice}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>→</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.70)' }}>£{hero.retailValue.toLocaleString()} retail</span>
                  </div>
                  <ProgressBar percent={heroPct} height={4} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 16px' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{heroPct}% sold</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                      <CountdownTimer />
                    </span>
                  </div>
                  <button style={{
                    height: 52, borderRadius: 10, border: 'none',
                    background: 'var(--accent-pink)', color: '#FFFFFF',
                    fontSize: 15, fontWeight: 700, padding: '0 28px', cursor: 'pointer',
                    letterSpacing: '0.01em',
                  }}>
                    Enter draw — {heroPrice} per ticket
                  </button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Tonight strip ── */}
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LiveDot size={7} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {tonightCount} draws closing tonight at 9pm
            </p>
          </div>
          <Link href="/live" style={{
            color: 'var(--accent-lilac)', fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
            padding: '7px 16px', border: '1px solid var(--border-accent)',
            borderRadius: 10, whiteSpace: 'nowrap',
            background: 'rgba(196,181,253,0.08)',
          }}>
            Watch live →
          </Link>
        </div>

        {/* ── Recent winner ── */}
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.handle}</span>{' '}
            just won {w.item} — paid {w.paid}p, retail{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>£{w.value.toLocaleString()}</span>
          </p>
        </div>

        {/* ── Filter chips (category + filter combined) ── */}
        <div style={{ overflowX: 'auto', marginBottom: 24 }} className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`chip${category === cat.id ? ' active' : ''}`}
                style={{ fontFamily: 'inherit' }}
              >
                {cat.label}
              </button>
            ))}
            <div style={{ width: 1, background: 'var(--border-subtle)', margin: '0 4px' }} />
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(filter === f ? '' : f)}
                className={`chip${filter === f ? ' active' : ''}`}
                style={{ fontFamily: 'inherit' }}
              >
                {f}{f === 'Tonight' && tonightCount > 0 ? ` · ${tonightCount}` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ── Womenswear row ── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Womenswear &amp; Accessories</h2>
            <Link href="/categories" style={{ fontSize: 12, color: 'var(--accent-lilac)', textDecoration: 'none', fontWeight: 600 }}>See all</Link>
          </div>
          <div style={{ overflowX: 'auto' }} className="scrollbar-hide">
            <div style={{ display: 'flex', gap: 14, width: 'max-content', paddingBottom: 4 }}>
              {womenswear.map(d => (
                <div key={d.id} style={{ width: 180 }}>
                  <DrawCard draw={d} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Menswear row ── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Menswear &amp; Streetwear</h2>
            <Link href="/categories" style={{ fontSize: 12, color: 'var(--accent-lilac)', textDecoration: 'none', fontWeight: 600 }}>See all</Link>
          </div>
          <div style={{ overflowX: 'auto' }} className="scrollbar-hide">
            <div style={{ display: 'flex', gap: 14, width: 'max-content', paddingBottom: 4 }}>
              {menswear.map(d => (
                <div key={d.id} style={{ width: 180 }}>
                  <DrawCard draw={d} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Main grid ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              {category === 'all' ? 'All draws' : category}
              {filter ? <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 8 }}>{filter}</span> : null}
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{filtered.length} draws</span>
          </div>

          <div className="draw-grid">
            {filtered.map(d => {
              if (d.isBundle) {
                return (
                  <div key={d.id} style={{ gridColumn: '1 / -1' }}>
                    <DrawCard draw={d} fullWidth />
                  </div>
                );
              }
              return <DrawCard key={d.id} draw={d} />;
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--grey)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>No draws found</p>
              <p style={{ fontSize: 13 }}>Try a different category or filter</p>
            </div>
          )}
        </section>

        {/* App download banner */}
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: '20px 24px', marginTop: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Get the DRAWN app</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Watch draws go live at 9pm and get instant win notifications</p>
          </div>
          <a href="#" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#000', color: '#fff',
            borderRadius: 10, padding: '10px 20px',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            Download on App Store
          </a>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            All draws verified · Every night at 9pm · Free postal entry available
          </p>
        </div>
      </div>
    </AppShell>
  );
}
