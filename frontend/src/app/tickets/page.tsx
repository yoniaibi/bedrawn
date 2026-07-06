'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import LiveDot from '@/components/LiveDot';
import { fetchAuthSession } from 'aws-amplify/auth';

interface Entry {
  drawId: string;
  drawTitle: string;
  drawImageUrl?: string;
  ticketCount: number;
  ticketPricePence: number;
  enteredAt: string;
  closingDate: string;
  status: string;
  isWinner: boolean;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch { return null; }
}

function ukDateToday(): string {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })
    .split('/').reverse().join('-');
}

export default function TicketsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) { setLoading(false); return; }
    getAuthToken().then(token => {
      if (!token) { setLoading(false); return; }
      fetch(`${url}/me/entries`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.entries) setEntries(data.entries as Entry[]); })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const today = ukDateToday();
  const activeEntries = entries.filter(e => e.status === 'open' && !e.isWinner);
  const totalTickets = activeEntries.reduce((s, e) => s + e.ticketCount, 0);
  const closingTonight = activeEntries.filter(e => e.closingDate === today).length;

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--grey)' }}>Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>My Tickets</p>
        </div>

        <div style={{
          margin: 16, background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px', display: 'flex', gap: 0,
        }}>
          {[
            { label: 'Tickets', value: String(totalTickets) },
            { label: 'Active draws', value: String(activeEntries.length) },
            { label: 'Closing tonight', value: String(closingTonight) },
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

        {activeEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: 'var(--muted)' }}>◈</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>No tickets yet</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 24px' }}>
              Enter your first draw for as little as 10p. Tonight&apos;s closes at 9pm.
            </p>
            <Link href="/home" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '12px 28px', borderRadius: 999,
                background: 'linear-gradient(135deg, #FF2356 0%, #FF4E6A 100%)',
                border: 'none', color: 'var(--white)', fontSize: 14, fontWeight: 700,
              }}>Browse tonight&apos;s draws →</button>
            </Link>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeEntries.map(entry => {
              const isClosingTonight = entry.closingDate === today;
              const price = entry.ticketPricePence >= 100
                ? `£${(entry.ticketPricePence / 100).toFixed(2)}`
                : `${entry.ticketPricePence}p`;
              return (
                <div key={entry.drawId} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px', display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--card2)' }}>
                        {entry.drawImageUrl && (
                          <img src={entry.drawImageUrl} alt={entry.drawTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      {isClosingTonight && (
                        <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                          <LiveDot size={10} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.drawTitle}
                      </p>
                      <span style={{
                        background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)',
                        color: 'var(--purple)', fontSize: 11, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 999, display: 'inline-block',
                      }}>
                        {entry.ticketCount} ticket{entry.ticketCount !== 1 ? 's' : ''} · {price} each
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '0 14px 10px' }}>
                    <span style={{
                      background: isClosingTonight ? 'rgba(255,35,86,0.15)' : 'rgba(139,92,246,0.15)',
                      border: `1px solid ${isClosingTonight ? 'var(--accent-coral)' : 'var(--purple)'}`,
                      color: isClosingTonight ? 'var(--accent-coral)' : 'var(--purple)',
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                    }}>
                      {isClosingTonight ? 'Draws tonight at 9pm' : `Closes ${entry.closingDate}`}
                    </span>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border)', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--grey)' }}>
                      Entered {new Date(entry.enteredAt).toLocaleDateString('en-GB')}
                    </span>
                    <Link href={`/draw/${entry.drawId}/purchase`} style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                      <button style={{
                        padding: '5px 14px', borderRadius: 999, fontSize: 12,
                        background: 'rgba(139,92,246,0.15)', border: '1px solid var(--purple)',
                        color: 'var(--purple)', fontWeight: 600,
                      }}>Buy more</button>
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
