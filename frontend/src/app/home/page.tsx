'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import ProgressBar from '@/components/ProgressBar';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';

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

const filters = ['Drawing Tonight', 'Womenswear', 'Menswear', 'High Value', 'Bundles', 'Just Listed'];

export default function HomePage() {
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('');
  const [allDraws, setAllDraws] = useState<Draw[]>([]);
  const [drawsLoading, setDrawsLoading] = useState(true);
  const [drawsError, setDrawsError] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setDrawsLoading(false); return; }
    fetch(`${url}/draws`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => { setAllDraws(data?.draws ?? []); })
      .catch(() => setDrawsError(true))
      .finally(() => setDrawsLoading(false));
  }, []);

  const filtered = allDraws.filter(d => {
    if (category !== 'all' && d.category !== category) return false;
    if (filter === 'Drawing Tonight') return d.isClosingTonight;
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

  const drawingTonight = allDraws.filter(d => d.isClosingTonight).slice(0, 8);
  const womenswear = allDraws.filter(d => d.style === 'Womenswear').slice(0, 8);
  const menswear = allDraws.filter(d => d.style === 'Menswear').slice(0, 8);

  if (drawsLoading) return (
    <AppShell>
      <div style={{ padding: '20px 16px' }}>
        {/* Skeleton hero */}
        <div className="skeleton-card" style={{ borderRadius: 20, marginBottom: 20, aspectRatio: '16/7' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-overlay)' }} />
        </div>
        {/* Skeleton strip label */}
        <div className="skeleton" style={{ height: 12, width: 140, borderRadius: 6, marginBottom: 16 }} />
        {/* Skeleton draw grid */}
        <div className="draw-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-img" />
              <div className="skeleton-line" />
              <div className="skeleton-line-short" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
  if (drawsError) return <AppShell><div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}><p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Couldn&apos;t load draws</p><p>Please refresh the page.</p></div></AppShell>;
  if (!hero) return <AppShell><div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}><p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No draws yet</p><p>Items go live once they hit their reserve. Check back soon — draws are added daily.</p></div></AppShell>;

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
                {hero.isClosingTonight && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: 'rgba(255,35,86,0.18)',
                      border: '1px solid rgba(255,35,86,0.40)',
                      color: '#FFFFFF', fontSize: 10, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 6,
                      display: 'flex', alignItems: 'center', gap: 5,
                      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                      backdropFilter: 'blur(8px)',
                    }}>
                      <LiveDot size={5} /> Closing Tonight
                    </span>
                  </div>
                )}

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
                      <CountdownTimer closingDate={hero.closingDate} />
                    </span>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    height: 52, borderRadius: 999, border: 'none',
                    background: 'var(--accent-coral)', color: '#FFFFFF',
                    fontSize: 15, fontWeight: 700, padding: '0 28px',
                    letterSpacing: '0.01em',
                    boxShadow: '0 4px 16px rgba(255,35,86,0.30)',
                  }}>
                    Enter draw — {heroPrice} per ticket
                  </span>
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
              {tonightCount > 0
                ? `${tonightCount} draw${tonightCount > 1 ? 's' : ''} drawing tonight at 9pm`
                : 'No draws scheduled tonight yet'}
            </p>
          </div>
          <Link href="/live" style={{
            color: 'var(--accent-coral)', fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
            padding: '7px 16px', border: '1px solid rgba(255,35,86,0.30)',
            borderRadius: 10, whiteSpace: 'nowrap',
            background: 'rgba(255,35,86,0.06)',
          }}>
            Watch live →
          </Link>
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
                {f}{f === 'Drawing Tonight' && tonightCount > 0 ? ` · ${tonightCount}` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ── Drawing Tonight row ── */}
        {drawingTonight.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LiveDot size={6} />
              <h2 className="section-title" style={{ marginBottom: 0 }}>Drawing Tonight · 9pm</h2>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{drawingTonight.length} draw{drawingTonight.length > 1 ? 's' : ''}</span>
          </div>
          <div className="scroll-strip" style={{ margin: '0 -16px' }}>
            {drawingTonight.map(d => (
              <div key={d.id} style={{ width: 168, flexShrink: 0 }}>
                <DrawCard draw={d} />
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Womenswear row ── */}
        {womenswear.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="section-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Womenswear</h2>
            <Link href="/categories" className="section-link">See all</Link>
          </div>
          <div className="scroll-strip" style={{ margin: '0 -16px' }}>
            {womenswear.map(d => (
              <div key={d.id} style={{ width: 168, flexShrink: 0 }}>
                <DrawCard draw={d} />
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Menswear row ── */}
        {menswear.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="section-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Menswear</h2>
            <Link href="/categories" className="section-link">See all</Link>
          </div>
          <div className="scroll-strip" style={{ margin: '0 -16px' }}>
            {menswear.map(d => (
              <div key={d.id} style={{ width: 168, flexShrink: 0 }}>
                <DrawCard draw={d} />
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── Main grid ── */}
        <section>
          <div className="section-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              {category === 'all' ? 'All draws' : category}
              {filter ? <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 8 }}>{filter}</span> : null}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{filtered.length} draws</span>
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
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Get the BeDrawn app</p>
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
