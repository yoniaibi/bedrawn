'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import ProgressBar from '@/components/ProgressBar';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';
import ActivityTicker from '@/components/ActivityTicker';
import { draws, currentUser, activityMessages, recentWinners } from '@/lib/mockData';

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

  useEffect(() => {
    const id = setInterval(() => setWinnerIdx(i => (i + 1) % recentWinners.length), 9000);
    return () => clearInterval(id);
  }, []);

  const filtered = draws.filter(d => {
    if (category !== 'all' && d.category !== category) return false;
    if (filter === 'Tonight') return d.isClosingTonight;
    if (filter === 'Womenswear') return d.style === 'Womenswear';
    if (filter === 'Menswear') return d.style === 'Menswear';
    if (filter === 'High Value') return d.retailValue >= 1000;
    if (filter === 'Bundles') return d.isBundle;
    return true;
  });

  const hero = draws.find(d => d.isClosingTonight) ?? draws[0];
  const heroPct = Math.round((hero.soldTickets / hero.totalTickets) * 100);
  const heroPrice = hero.ticketPrice >= 100 ? `£${(hero.ticketPrice / 100).toFixed(2)}` : `${hero.ticketPrice}p`;
  const tonightCount = draws.filter(d => d.isClosingTonight).length;
  const w = recentWinners[winnerIdx];

  const womenswear = draws.filter(d => d.style === 'Womenswear').slice(0, 8);
  const menswear = draws.filter(d => d.style === 'Menswear').slice(0, 8);

  return (
    <AppShell>
      {/* Activity ticker — full width */}
      <div style={{ background: 'var(--purple)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <ActivityTicker messages={activityMessages} />
        </div>
      </div>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: 'rgba(236,72,153,0.9)',
                    color: 'var(--white)', fontSize: 11, fontWeight: 700,
                    padding: '5px 12px', borderRadius: 999,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <LiveDot size={6} /> CLOSING TONIGHT · 9PM
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: 999 }}>
                    247 watching
                  </span>
                </div>

                <div>
                  <p className="serif" style={{ fontSize: 28, color: 'var(--white)', margin: '0 0 6px', lineHeight: 1.2 }}>
                    {hero.title}
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    by {hero.seller}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{
                      background: 'var(--purple)', color: 'var(--white)',
                      fontSize: 14, fontWeight: 800, padding: '6px 16px', borderRadius: 999,
                    }}>{heroPrice}</span>
                    <span style={{
                      background: 'rgba(217,119,6,0.9)', color: 'var(--white)',
                      fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 999,
                    }}>£{hero.retailValue.toLocaleString()} retail</span>
                  </div>
                  <ProgressBar percent={heroPct} height={4} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 16px' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{heroPct}% sold</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                      <CountdownTimer />
                    </span>
                  </div>
                  <button className="btn-primary" style={{
                    padding: '12px 32px', borderRadius: 999,
                    background: 'var(--white)', border: 'none',
                    color: 'var(--purple)', fontSize: 15, fontWeight: 700,
                  }}>
                    Enter draw · {heroPrice}
                  </button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Tonight strip ── */}
        <div style={{
          background: 'var(--purple-light)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 14, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>
              {tonightCount} draws closing tonight at 9pm
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--grey)' }}>
              You are entered in 3 of them
            </p>
          </div>
          <Link href="/live" style={{
            color: 'var(--purple)', fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
            padding: '8px 18px', border: '1.5px solid var(--purple)',
            borderRadius: 999, whiteSpace: 'nowrap',
          }}>
            Watch live
          </Link>
        </div>

        {/* ── Recent winner ── */}
        <div style={{
          background: 'var(--gold-light)',
          border: '1px solid rgba(217,119,6,0.25)',
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 28,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>
            <span style={{ fontWeight: 700, color: 'var(--gold)' }}>Winner</span>{' '}
            <strong>{w.handle}</strong> just won {w.item} — paid {w.paid}p, worth{' '}
            <span style={{ fontWeight: 700, color: 'var(--gold)' }}>£{w.value.toLocaleString()}</span>
          </p>
        </div>

        {/* ── Category pills ── */}
        <div style={{ overflowX: 'auto', marginBottom: 6 }} className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="pill-btn"
                style={{
                  padding: '8px 18px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: category === cat.id ? 'var(--purple)' : 'var(--white)',
                  border: `1.5px solid ${category === cat.id ? 'var(--purple)' : 'var(--border)'}`,
                  color: category === cat.id ? 'var(--white)' : 'var(--text)',
                  fontSize: 13, fontWeight: category === cat.id ? 700 : 500,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ overflowX: 'auto', marginBottom: 28 }} className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingBottom: 4 }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(filter === f ? '' : f)}
                style={{
                  padding: '6px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: filter === f ? 'var(--purple-light)' : 'transparent',
                  border: `1px solid ${filter === f ? 'var(--purple)' : 'var(--border)'}`,
                  color: filter === f ? 'var(--purple)' : 'var(--grey)',
                  fontSize: 12, fontWeight: filter === f ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* ── Womenswear row ── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Womenswear &amp; Accessories</h2>
            <Link href="/categories" style={{ fontSize: 13, color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>See all</Link>
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
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Menswear &amp; Streetwear</h2>
            <Link href="/categories" style={{ fontSize: 13, color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>See all</Link>
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
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
              {category === 'all' ? 'All draws' : category}
              {filter ? <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--grey)', marginLeft: 8 }}>{filter}</span> : null}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} draws</span>
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

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 48, paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            All draws verified · Every night at 9pm · Free postal entry available
          </p>
        </div>
      </div>
    </AppShell>
  );
}
