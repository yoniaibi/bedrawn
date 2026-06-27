'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import ProgressBar from '@/components/ProgressBar';
import LiveDot from '@/components/LiveDot';
import { draws, tickets } from '@/lib/mockData';

export default function TicketsPage() {
  const myTickets = tickets.map(t => {
    const draw = draws.find(d => d.id === t.drawId)!;
    const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
    const odds = ((t.quantity / draw.totalTickets) * 100);
    const remaining = draw.totalTickets - draw.soldTickets;
    const price = draw.ticketPrice >= 100 ? `£${(draw.ticketPrice / 100).toFixed(2)}` : `${draw.ticketPrice}p`;
    return { ...t, draw, pct, odds, remaining, price };
  });

  const totalTickets = tickets.reduce((s, t) => s + t.quantity, 0);
  const totalValue = myTickets.reduce((s, t) => s + t.draw.retailValue, 0);

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>My Tickets</p>
        </div>

        {/* Summary strip */}
        <div style={{
          margin: 16, background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px', display: 'flex', gap: 0,
        }}>
          {[
            { label: 'Tickets', value: String(totalTickets) },
            { label: 'Pot value', value: `£${totalValue.toLocaleString()}` },
            { label: 'Draws', value: String(tickets.length) },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}>
              <p className="serif" style={{ margin: 0, fontSize: 24, color: 'var(--gold)', fontWeight: 700 }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Callout */}
        <div style={{
          margin: '0 16px 20px',
          background: 'rgba(139,92,246,0.1)', border: '1px solid var(--purple)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--white)' }}>
            Win up to <strong style={{ color: 'var(--gold)' }}>£{totalValue.toLocaleString()}</strong> for as little as <strong style={{ color: 'var(--purple)' }}>10p</strong>
          </p>
        </div>

        {/* Ticket cards */}
        {myTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <p style={{ fontSize: 48, margin: '0 0 16px' }}>🎫</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>No tickets yet</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 24px' }}>
              Enter your first draw for as little as 10p. Tonight&apos;s closes at 9pm.
            </p>
            <Link href="/home" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '12px 28px', borderRadius: 999,
                background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                border: 'none', color: 'var(--white)', fontSize: 14, fontWeight: 700,
              }}>Browse tonight&apos;s draws →</button>
            </Link>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myTickets.map(t => {
              const oddsColor = t.odds >= 1 ? 'var(--gold)' : t.odds >= 0.5 ? 'var(--purple)' : 'var(--grey)';
              return (
                <div key={t.id} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  {/* Top section */}
                  <div style={{ padding: '14px', display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--card)' }}>
                        <img src={t.draw.imageUrl} alt={t.draw.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      {t.draw.isClosingTonight && (
                        <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                          <LiveDot size={10} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.draw.title}
                        </p>
                        {t.draw.isVerified && <span style={{ color: 'var(--purple)', fontSize: 12 }}>✓</span>}
                      </div>
                      <p style={{ margin: '2px 0 8px', fontSize: 11, color: 'var(--grey)' }}>
                        {t.draw.sellerEmoji} {t.draw.seller}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)',
                          color: 'var(--purple)', fontSize: 11, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 999,
                        }}>{t.price} → £{t.draw.retailValue.toLocaleString()}</span>
                      </div>
                      <ProgressBar percent={t.pct} height={3} />
                      {t.remaining < 500 && (
                        <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--red)' }}>Only {t.remaining} tickets left</p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ padding: '0 14px 10px' }}>
                    <span style={{
                      background: t.draw.isClosingTonight ? 'rgba(236,72,153,0.15)' : 'rgba(139,92,246,0.15)',
                      border: `1px solid ${t.draw.isClosingTonight ? 'var(--pink)' : 'var(--purple)'}`,
                      color: t.draw.isClosingTonight ? 'var(--pink)' : 'var(--purple)',
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                    }}>
                      {t.draw.isClosingTonight ? 'Draws tonight at 9pm' : 'Draws tomorrow at 9pm'}
                    </span>
                  </div>

                  {/* Bottom stats */}
                  <div style={{
                    borderTop: '1px solid var(--border)', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 600 }}>{t.quantity} tickets</span>
                    <span style={{ fontSize: 12, color: 'var(--grey)' }}>{t.price} each</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: oddsColor }}>{t.odds.toFixed(2)}% odds</span>
                    <Link href={`/draw/${t.draw.id}/purchase`} style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                      <button style={{
                        padding: '5px 14px', borderRadius: 999, fontSize: 12,
                        background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)',
                        color: 'var(--purple)', fontWeight: 600,
                      }}>More</button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    </AppShell>
  );
}
