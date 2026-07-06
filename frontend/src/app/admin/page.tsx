'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';


interface AdminDraw {
  id: string;
  title: string;
  status: string;
  sellerHandle: string;
  ticketPricePence: number;
  totalTickets: number;
  soldTickets: number;
  minTickets: number;
  retailValuePence: number;
  closingDate: string;
  winnerId?: string;
  cancelReason?: string;
  resolvedAt?: string;
  createdAt: string;
  category: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open:      { bg: 'rgba(16,185,129,0.12)',  color: 'var(--green)'  },
  resolved:  { bg: 'rgba(245,158,11,0.12)',  color: 'var(--gold)'   },
  cancelled: { bg: 'rgba(239,68,68,0.12)',   color: 'var(--red)'    },
};

function fmt(pence: number) {
  return pence >= 100 ? `£${(pence / 100).toLocaleString()}` : `${pence}p`;
}

export default function AdminPage() {
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [email, setEmail] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolveResult, setResolveResult] = useState<Record<string, string>>({});
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [postalForm, setPostalForm] = useState<Record<string, { name: string; email: string }>>({});
  const [postalAdding, setPostalAdding] = useState<string | null>(null);
  const [postalResult, setPostalResult] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) { setError('Not authenticated'); setLoading(false); return; }

        const payload = JSON.parse(atob(token.split('.')[1]));
        setEmail(payload.email ?? payload.username ?? '');
        setAuthToken(token);

        // Auth is enforced by the API — a 403 response means not an admin.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 403) { setError('Access denied — admin only'); setLoading(false); return; }
        if (!res.ok) { setError(`API error ${res.status}`); setLoading(false); return; }
        const data = await res.json();
        setDraws(data.draws ?? []);
        setCounts(data.counts ?? {});
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddPostalEntry = async (drawId: string) => {
    const form = postalForm[drawId] ?? { name: '', email: '' };
    if (!form.name.trim() || !form.email.trim()) {
      setPostalResult(prev => ({ ...prev, [drawId]: 'Error: name and email required' }));
      return;
    }
    setPostalAdding(drawId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${drawId}/postal-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPostalResult(prev => ({ ...prev, [drawId]: `Error: ${data.error}` }));
      } else {
        setPostalResult(prev => ({ ...prev, [drawId]: `Added postal entry for ${form.name} (${form.email})` }));
        setPostalForm(prev => ({ ...prev, [drawId]: { name: '', email: '' } }));
        setDraws(prev => prev.map(d => d.id === drawId ? { ...d, soldTickets: d.soldTickets + 1 } : d));
      }
    } catch (e) {
      setPostalResult(prev => ({ ...prev, [drawId]: e instanceof Error ? e.message : 'Failed' }));
    } finally {
      setPostalAdding(null);
    }
  };

  const handleCancel = async (drawId: string, drawTitle: string) => {
    const reason = prompt(`Cancel reason for:\n"${drawTitle}"\n\nAll entrants will be refunded. Enter reason (or leave blank):`, 'Cancelled by admin');
    if (reason === null) return; // user pressed Cancel in prompt
    setCancelling(drawId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${drawId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ reason: reason || 'Cancelled by admin' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveResult(prev => ({ ...prev, [drawId]: `Error: ${data.error}` }));
      } else {
        setResolveResult(prev => ({ ...prev, [drawId]: `Cancelled. ${data.refunded} entrant(s) refunded.` }));
        setDraws(prev => prev.map(d => d.id === drawId ? { ...d, status: 'cancelled', cancelReason: data.reason } : d));
        setCounts(prev => ({ ...prev, open: Math.max(0, (prev.open ?? 1) - 1), cancelled: (prev.cancelled ?? 0) + 1 }));
      }
    } catch (e) {
      setResolveResult(prev => ({ ...prev, [drawId]: e instanceof Error ? e.message : 'Failed' }));
    } finally {
      setCancelling(null);
    }
  };

  const handleResolve = async (drawId: string, drawTitle: string) => {
    if (!confirm(`Manually resolve draw:\n"${drawTitle}"\n\nThis will pick a winner now. Continue?`)) return;
    setResolving(drawId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${drawId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveResult(prev => ({ ...prev, [drawId]: `Error: ${data.error}` }));
      } else if (data.result === 'resolved') {
        setResolveResult(prev => ({ ...prev, [drawId]: `Winner: ${data.winnerId} (${data.soldTickets} tickets sold)` }));
        setDraws(prev => prev.map(d => d.id === drawId ? { ...d, status: 'resolved', winnerId: data.winnerId } : d));
        setCounts(prev => ({ ...prev, open: Math.max(0, (prev.open ?? 1) - 1), resolved: (prev.resolved ?? 0) + 1 }));
      } else {
        setResolveResult(prev => ({ ...prev, [drawId]: `Cancelled: ${data.reason}` }));
        setDraws(prev => prev.map(d => d.id === drawId ? { ...d, status: 'cancelled' } : d));
        setCounts(prev => ({ ...prev, open: Math.max(0, (prev.open ?? 1) - 1), cancelled: (prev.cancelled ?? 0) + 1 }));
      }
    } catch (e) {
      setResolveResult(prev => ({ ...prev, [drawId]: e instanceof Error ? e.message : 'Failed' }));
    } finally {
      setResolving(null);
    }
  };

  const displayed = filter === 'all' ? draws : draws.filter(d => d.status === filter);

  if (loading) return <AppShell><div style={{ padding: 40, textAlign: 'center', color: 'var(--grey)' }}>Loading admin panel…</div></AppShell>;

  if (error) return (
    <AppShell>
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', fontSize: 16, fontWeight: 700 }}>{error}</p>
        <Link href="/home" style={{ color: 'var(--purple)', fontSize: 14 }}>← Back to home</Link>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Admin Panel</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)' }}>Signed in as {email}</p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 }}>
          {[
            { label: 'Open',      value: counts.open      ?? 0, color: 'var(--green)' },
            { label: 'Resolved',  value: counts.resolved  ?? 0, color: 'var(--gold)' },
            { label: 'Cancelled', value: counts.cancelled ?? 0, color: 'var(--red)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
          {['all', 'open', 'resolved', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
              background: filter === f ? 'var(--purple)' : 'var(--card)',
              border: `1px solid ${filter === f ? 'var(--purple)' : 'var(--border)'}`,
              color: filter === f ? 'var(--white)' : 'var(--grey)',
              fontWeight: filter === f ? 700 : 500,
              textTransform: 'capitalize',
            }}>{f} {f === 'all' ? `(${draws.length})` : `(${counts[f] ?? 0})`}</button>
          ))}
        </div>

        {/* Draws table */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(d => {
            const pct = d.totalTickets > 0 ? Math.round((d.soldTickets / d.totalTickets) * 100) : 0;
            const st = STATUS_STYLE[d.status] ?? STATUS_STYLE.open;
            const revenue = d.soldTickets * d.ticketPricePence;
            const result = resolveResult[d.id];
            return (
              <div key={d.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: st.bg, color: st.color, fontWeight: 700 }}>
                        {d.status}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{d.category}</span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.title}
                    </p>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--grey)' }}>
                      @{d.sellerHandle} · closes {d.closingDate} · {fmt(d.ticketPricePence)}/ticket · retail {fmt(d.retailValuePence)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {d.status === 'open' && (
                      <>
                        <button
                          onClick={() => handleResolve(d.id, d.title)}
                          disabled={resolving === d.id || cancelling === d.id}
                          style={{
                            padding: '5px 12px', borderRadius: 8, cursor: (resolving === d.id || cancelling === d.id) ? 'default' : 'pointer',
                            background: 'rgba(245,158,11,0.15)', border: '1px solid var(--gold)',
                            color: 'var(--gold)', fontSize: 12, fontWeight: 700,
                            opacity: (resolving === d.id || cancelling === d.id) ? 0.6 : 1,
                          }}
                        >
                          {resolving === d.id ? 'Resolving…' : 'Resolve now'}
                        </button>
                        <button
                          onClick={() => handleCancel(d.id, d.title)}
                          disabled={resolving === d.id || cancelling === d.id}
                          style={{
                            padding: '5px 12px', borderRadius: 8, cursor: (resolving === d.id || cancelling === d.id) ? 'default' : 'pointer',
                            background: 'rgba(239,68,68,0.10)', border: '1px solid var(--red)',
                            color: 'var(--red)', fontSize: 12, fontWeight: 700,
                            opacity: (resolving === d.id || cancelling === d.id) ? 0.6 : 1,
                          }}
                        >
                          {cancelling === d.id ? 'Cancelling…' : 'Cancel draw'}
                        </button>
                      </>
                    )}
                    <Link href={`/draw/${d.id}`} style={{ color: 'var(--purple)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                      View →
                    </Link>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: d.status === 'resolved' ? 'var(--gold)' : d.status === 'cancelled' ? 'var(--red)' : 'var(--purple)', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--grey)' }}>
                  <span>{d.soldTickets.toLocaleString()} / {d.totalTickets.toLocaleString()} tickets ({pct}%) — min {d.minTickets?.toLocaleString()}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Revenue: {fmt(revenue)}</span>
                </div>

                {result && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: result.startsWith('Error') ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.08)', border: `1px solid ${result.startsWith('Error') ? 'var(--red)' : 'var(--gold)'}`, borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: result.startsWith('Error') ? 'var(--red)' : 'var(--gold)', fontWeight: 700 }}>Result: </span>
                    <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{result}</span>
                  </div>
                )}
                {!result && d.status === 'resolved' && d.winnerId && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid var(--gold)', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Winner: </span>
                    <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{d.winnerId}</span>
                  </div>
                )}
                {!result && d.status === 'cancelled' && d.cancelReason && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--red)', fontWeight: 700 }}>Cancelled: </span>
                    <span style={{ color: 'var(--text)' }}>{d.cancelReason}</span>
                  </div>
                )}

                {/* Postal entry registration — only shown for open draws */}
                {d.status === 'open' && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Register postal entry</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        placeholder="Full name"
                        value={postalForm[d.id]?.name ?? ''}
                        onChange={e => setPostalForm(prev => ({ ...prev, [d.id]: { ...prev[d.id] ?? { name: '', email: '' }, name: e.target.value } }))}
                        style={{ flex: 1, minWidth: 120, padding: '6px 10px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12 }}
                      />
                      <input
                        placeholder="Email address"
                        type="email"
                        value={postalForm[d.id]?.email ?? ''}
                        onChange={e => setPostalForm(prev => ({ ...prev, [d.id]: { ...prev[d.id] ?? { name: '', email: '' }, email: e.target.value } }))}
                        style={{ flex: 1, minWidth: 160, padding: '6px 10px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12 }}
                      />
                      <button
                        onClick={() => handleAddPostalEntry(d.id)}
                        disabled={postalAdding === d.id}
                        style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--purple)', border: 'none', color: 'var(--white)', fontSize: 12, fontWeight: 700, cursor: postalAdding === d.id ? 'default' : 'pointer', opacity: postalAdding === d.id ? 0.6 : 1 }}
                      >
                        {postalAdding === d.id ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                    {postalResult[d.id] && (
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: postalResult[d.id].startsWith('Error') ? 'var(--red)' : 'var(--green)' }}>
                        {postalResult[d.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {displayed.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--grey)', padding: 40 }}>No draws in this category</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
