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
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'Fashion', label: 'Fashion', emoji: '👗' },
  { id: 'Watches', label: 'Watches', emoji: '⌚' },
  { id: 'Trainers', label: 'Trainers', emoji: '👟' },
  { id: 'Bags', label: 'Bags', emoji: '👜' },
  { id: 'Jewellery', label: 'Jewellery', emoji: '💍' },
  { id: 'Streetwear', label: 'Streetwear', emoji: '🧢' },
];

const filters = ['Tonight', 'Womenswear', 'Menswear', 'High Value', 'Bundles', 'Just Listed'];

export default function HomePage() {
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('');
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [streakPulse, setStreakPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setWinnerIdx(i => (i + 1) % recentWinners.length), 9000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setStreakPulse(currentUser.streak >= 2);
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

  const womenswear = draws.filter(d => d.style === 'Womenswear').slice(0, 6);
  const menswear = draws.filter(d => d.style === 'Menswear').slice(0, 6);
  const unisex = draws.filter(d => d.style === 'Unisex').slice(0, 6);

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Navbar */}
        <div style={{
          padding: '16px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0,
          background: 'var(--bg)', zIndex: 10,
        }}>
          <p className="serif" style={{ fontSize: 24, color: 'var(--gold)', margin: 0 }}>DRAWN</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(245,158,11,0.15)', border: '1px solid var(--gold)',
              borderRadius: 999, padding: '4px 10px',
              animation: streakPulse ? 'pulse-scale 1.2s ease-in-out infinite' : undefined,
            }}>
              <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700 }}>🔥 {currentUser.streak}</span>
            </div>
            <Link href="/search" style={{ fontSize: 18, textDecoration: 'none' }}>🔍</Link>
            <Link href="/account/wallet" style={{
              background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)',
              borderRadius: 999, padding: '4px 12px', textDecoration: 'none',
            }}>
              <span style={{ color: 'var(--purple)', fontSize: 13, fontWeight: 700 }}>
                £{(currentUser.balancePence / 100).toFixed(2)}
              </span>
            </Link>
          </div>
        </div>

        {/* Activity ticker */}
        <ActivityTicker messages={activityMessages} />

        {/* Won banner */}
        <div style={{
          margin: '12px 16px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid var(--gold)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>You won!</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>Air Jordan 1 Retro High OG · tap to view</p>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: 18 }}>›</span>
        </div>

        {/* Hero draw */}
        <Link href={`/draw/${hero.id}`} style={{ textDecoration: 'none', display: 'block', margin: '0 16px 16px' }}>
          <div style={{
            borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)',
            background: hero.imageColor, height: 240, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 30%, rgba(13,11,20,0.95))',
              padding: '12px 16px 20px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: 'rgba(236,72,153,0.2)', border: '1px solid var(--pink)',
                  color: 'var(--pink)', fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 999,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <LiveDot size={6} /> CLOSING TONIGHT · 9PM
                </span>
                <span style={{ color: 'var(--grey)', fontSize: 11 }}>247 👁 watching</span>
              </div>

              <div>
                <p className="serif" style={{ fontSize: 22, color: 'var(--white)', margin: '0 0 4px', lineHeight: 1.2 }}>
                  {hero.title}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--grey)' }}>
                  {hero.sellerEmoji} {hero.seller}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    background: 'rgba(139,92,246,0.2)', border: '1px solid var(--purple)',
                    color: 'var(--purple)', fontSize: 13, fontWeight: 700,
                    padding: '4px 12px', borderRadius: 999,
                  }}>{heroPrice} → £{hero.retailValue.toLocaleString()}</span>
                </div>
                <ProgressBar percent={heroPct} height={4} />
                <p style={{ margin: '4px 0 10px', fontSize: 11, color: 'var(--muted)' }}>
                  {heroPct}% of tickets sold
                </p>
                <button style={{
                  padding: '10px 28px', borderRadius: 999,
                  background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                  border: 'none', color: 'var(--white)', fontSize: 14, fontWeight: 700,
                }}>Enter draw</button>
              </div>
            </div>
          </div>
        </Link>

        {/* Recent winner banner */}
        <div style={{
          margin: '0 16px 16px',
          background: 'var(--card2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>
            🏆 <strong style={{ color: 'var(--white)' }}>{w.handle}</strong> just won {w.item} · paid {w.paid}p · worth{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>£{w.value.toLocaleString()}</span>
          </p>
        </div>

        {/* Tonight strip */}
        <div style={{
          margin: '0 16px 16px', padding: '12px 14px',
          background: 'rgba(236,72,153,0.1)', border: '1px solid var(--pink)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--white)', fontWeight: 600 }}>
              {tonightCount} draws tonight at 9pm · you&apos;re in 3
            </p>
            <CountdownTimer className="text-sm font-bold" style={{ color: 'var(--pink)' }} />
          </div>
          <Link href="/live" style={{
            color: 'var(--pink)', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            padding: '6px 14px', border: '1px solid var(--pink)', borderRadius: 999,
          }}>Watch live →</Link>
        </div>

        {/* Category pills */}
        <div style={{ overflowX: 'auto', padding: '0 16px 4px' }} className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: '8px 16px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: category === cat.id ? 'var(--purple)' : 'var(--card)',
                  border: `1px solid ${category === cat.id ? 'var(--purple)' : 'var(--border)'}`,
                  color: category === cat.id ? 'var(--white)' : 'var(--grey)',
                  fontSize: 13, fontWeight: category === cat.id ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ overflowX: 'auto', padding: '12px 16px 4px' }} className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(filter === f ? '' : f)}
                style={{
                  padding: '6px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: filter === f ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: `1px solid ${filter === f ? 'var(--purple)' : 'var(--border)'}`,
                  color: filter === f ? 'var(--purple)' : 'var(--muted)',
                  fontSize: 12, fontWeight: filter === f ? 600 : 400,
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Womenswear row */}
        <div style={{ padding: '20px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>Womenswear & Accessories</p>
            <span style={{ fontSize: 12, color: 'var(--purple)', cursor: 'pointer' }}>See all</span>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 16px 16px' }} className="scrollbar-hide">
            <div style={{ display: 'flex', gap: 12, width: 'max-content' }}>
              {womenswear.map(d => (
                <div key={d.id} style={{ width: 160 }}>
                  <DrawCard draw={d} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Menswear row */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>Menswear & Streetwear</p>
            <span style={{ fontSize: 12, color: 'var(--purple)', cursor: 'pointer' }}>See all</span>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 16px 16px' }} className="scrollbar-hide">
            <div style={{ display: 'flex', gap: 12, width: 'max-content' }}>
              {menswear.map(d => (
                <div key={d.id} style={{ width: 160 }}>
                  <DrawCard draw={d} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unisex row */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>Unisex & Everything Else</p>
            <span style={{ fontSize: 12, color: 'var(--purple)', cursor: 'pointer' }}>See all</span>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 16px 16px' }} className="scrollbar-hide">
            <div style={{ display: 'flex', gap: 12, width: 'max-content' }}>
              {unisex.map(d => (
                <div key={d.id} style={{ width: 160 }}>
                  <DrawCard draw={d} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ padding: '8px 16px 24px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', margin: '0 0 12px' }}>
            {category === 'all' ? 'All draws' : category} {filter ? `· ${filter}` : ''}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map((d, i) => {
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--grey)' }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎯</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--white)', margin: '0 0 4px' }}>No draws found</p>
              <p style={{ fontSize: 13 }}>Try a different filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            All draws verified · Every night at 9pm · Free postal entry available
          </p>
        </div>
      </div>
    </AppShell>
  );
}
