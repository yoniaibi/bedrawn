'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import { TARGETS } from '@/config/metricTargets';
import type { DrawCohort, DailySnapshot } from '@/types/metrics';

const T = {
  text: '#1C1917', textSec: '#78716C', textTert: '#A8A29E',
  bgRaised: '#FFFFFF', bgElevated: '#F5F2ED', bgOverlay: '#EDE8E1',
  border: 'rgba(0,0,0,0.10)', borderSub: 'rgba(0,0,0,0.06)',
  coral: '#FF2356', coralBg: 'rgba(255,35,86,0.08)',
  gold: '#F59E0B', goldBg: 'rgba(245,158,11,0.10)',
  green: '#059669', greenBg: 'rgba(5,150,105,0.08)',
  red: '#DC2626', redBg: 'rgba(220,38,38,0.08)',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const thStyle: React.CSSProperties = { padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` };
const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 13, color: T.text, verticalAlign: 'middle' };

function fmtP(p: number) { return `£${(p / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}` }

// ─── Cohort detail panel ──────────────────────────────────────────────────────
function CohortDetail({ cohort, token, onClose }: { cohort: DrawCohort; token: string; onClose: () => void }) {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [comparing, setComparing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [cancelResult, setCancelResult] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts/${cohort.cohortId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => setSnapshots(d.snapshots ?? []));
  }, [cohort.cohortId, token]);

  const fill    = cohort.thresholdTickets > 0 ? Math.round(cohort.ticketsSold / cohort.thresholdTickets * 100) : 0;
  const opsCost = Math.round(cohort.opsMinutes * TARGETS.opsHourlyRatePence / 60);
  const margin  = cohort.platformFee - cohort.authCost - cohort.processingCost - cohort.shippingCost - opsCost;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.35)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 520, height: 'calc(100vh - 32px)', background: '#fff', borderRadius: 16, overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800, color: T.text }}>{cohort.label}</p>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, textTransform: 'uppercase', background: cohort.mode === 'manual' ? T.goldBg : T.greenBg, color: cohort.mode === 'manual' ? T.gold : T.green }}>{cohort.mode}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.textTert }}>✕</button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Fill rate', value: `${fill}%`, color: fill >= 70 ? T.green : fill >= 40 ? T.gold : T.red },
            { label: 'Buyers',    value: cohort.buyers.toString() },
            { label: 'New buyers', value: cohort.newBuyers.toString() },
            { label: 'Tickets sold', value: `${cohort.ticketsSold}/${cohort.thresholdTickets}` },
            { label: 'Views', value: cohort.uniqueVisitors.toString() },
            { label: 'Share visits', value: cohort.shareLinkVisits.toString() },
            { label: 'Gross rev', value: fmtP(cohort.grossRevenue) },
            { label: 'Platform fee (12%)', value: fmtP(cohort.platformFee) },
            { label: 'Margin', value: margin >= 0 ? `+${fmtP(margin)}` : `-${fmtP(Math.abs(margin))}`, color: margin >= 0 ? T.green : T.red },
          ].map(k => (
            <div key={k.label} style={{ background: T.bgElevated, borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{k.label}</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: k.color ?? T.text }}>{k.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Economics ledger */}
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Economics</p>
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
          {[
            { label: 'Gross revenue',    val: cohort.grossRevenue,    sign: 1  },
            { label: 'Platform fee (12%)', val: cohort.platformFee,   sign: 1  },
            { label: 'Auth cost',        val: cohort.authCost,        sign: -1 },
            { label: 'Processing cost',  val: cohort.processingCost,  sign: -1 },
            { label: 'Shipping cost',    val: cohort.shippingCost,    sign: -1 },
            { label: `Ops (${cohort.opsMinutes}m @ £25/h)`, val: opsCost, sign: -1 },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
              <span style={{ fontSize: 12, color: T.textSec }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: row.sign > 0 ? T.text : T.textSec }}>{row.sign > 0 ? '' : '−'}{fmtP(row.val)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: T.bgElevated, borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Contribution margin</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: margin >= 0 ? T.green : T.red }}>
              {margin >= 0 ? '+' : '−'}{fmtP(Math.abs(margin))}
            </span>
          </div>
        </div>

        {/* Day-by-day snapshots */}
        {snapshots.length > 0 && (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily snapshots</p>
            <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` }}>
                    {['Date', 'Tickets', 'Visitors', 'New buyers', 'Shares'].map(h => (
                      <th key={h} style={{ ...thStyle, fontSize: 9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.sort((a, b) => a.date.localeCompare(b.date)).map((s, i, arr) => (
                    <tr key={s.date} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ ...tdStyle, fontSize: 12, fontWeight: 600 }}>{s.date}</td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{s.ticketsSold}</td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{s.uniqueVisitors || '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{s.newBuyerCount || '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{s.shareLinkVisits || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Winner share */}
        <div style={{ padding: '10px 12px', background: cohort.winnerShared ? T.greenBg : T.bgElevated, border: `1px solid ${cohort.winnerShared ? T.green : T.border}`, borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: cohort.winnerShared ? T.green : T.textSec, fontWeight: cohort.winnerShared ? 700 : 400 }}>
            {cohort.winnerShared ? '✓ Winner shared the result' : 'Winner did not share (or not yet recorded)'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Compare panel ────────────────────────────────────────────────────────────
function ComparePanel({ cohorts, selectedIds, onToggle, onClose }: {
  cohorts: DrawCohort[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const selected = cohorts.filter(c => selectedIds.has(c.cohortId));
  if (selected.length < 2) return null;

  const METRICS: Array<{ key: keyof DrawCohort | 'fillPct' | 'margin' | 'vtConversion'; label: string; fmt: (c: DrawCohort) => string }> = [
    { key: 'fillPct',      label: 'Fill rate',          fmt: c => `${c.thresholdTickets > 0 ? Math.round(c.ticketsSold / c.thresholdTickets * 100) : 0}%` },
    { key: 'vtConversion', label: 'View → ticket',      fmt: c => c.uniqueVisitors > 0 ? `${(c.buyers / c.uniqueVisitors * 100).toFixed(1)}%` : '—' },
    { key: 'buyers',       label: 'Buyers',             fmt: c => c.buyers.toString() },
    { key: 'newBuyers',    label: 'New buyers',         fmt: c => c.newBuyers.toString() },
    { key: 'margin',       label: 'Contribution margin', fmt: c => { const m = c.platformFee - c.authCost - c.processingCost - c.shippingCost - Math.round(c.opsMinutes * TARGETS.opsHourlyRatePence / 60); return m >= 0 ? `+${fmtP(m)}` : `-${fmtP(Math.abs(m))}`; } },
    { key: 'winnerShared', label: 'Winner shared',       fmt: c => c.winnerShared ? 'Yes' : 'No' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 700, background: '#fff', borderRadius: 16, overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 24, maxHeight: '90vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>Draw comparison</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.textTert }}>✕</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` }}>
              <th style={{ ...thStyle, width: 140 }}>Metric</th>
              {selected.map(c => <th key={c.cohortId} style={{ ...thStyle, fontWeight: 700, color: T.text, fontSize: 11 }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => (
              <tr key={m.key} style={{ borderBottom: i < METRICS.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                <td style={{ ...tdStyle, color: T.textSec, fontSize: 12 }}>{m.label}</td>
                {selected.map(c => <td key={c.cohortId} style={{ ...tdStyle, fontWeight: 600 }}>{m.fmt(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Operational draw card (resolve / cancel) ─────────────────────────────────
function OpCard({ draw, token, onUpdate }: { draw: any; token: string; onUpdate: () => void }) {
  const [resolving, setResolving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [postalName, setPostalName] = useState('');
  const [postalEmail, setPostalEmail] = useState('');
  const [postalAdding, setPostalAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const pct = draw.totalTickets > 0 ? Math.round(draw.soldTickets / draw.totalTickets * 100) : 0;

  const handleResolve = async () => {
    if (!confirm(`Resolve "${draw.title}"? This will pick a winner now.`)) return;
    setResolving(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${draw.id}/resolve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setMsg(d.result === 'resolved' ? `Winner: ${d.winnerId?.slice(0,8)}…` : `Cancelled: ${d.reason}`);
    setResolving(false);
    onUpdate();
  };

  const handleCancel = async () => {
    const reason = prompt(`Cancel reason for "${draw.title}"?`, 'Cancelled by admin');
    if (!reason) return;
    setCancelling(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${draw.id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) });
    const d = await res.json();
    setMsg(res.ok ? `Cancelled. ${d.refunded} refunded.` : `Error: ${d.error}`);
    setCancelling(false);
    onUpdate();
  };

  const handlePostal = async () => {
    if (!postalName || !postalEmail) { setMsg('Error: name and email required'); return; }
    setPostalAdding(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws/${draw.id}/postal-entry`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: postalName, email: postalEmail }) });
    const d = await res.json();
    setMsg(res.ok ? `Postal entry added for ${postalName}` : `Error: ${d.error}`);
    setPostalAdding(false);
    if (res.ok) { setPostalName(''); setPostalEmail(''); }
  };

  const ST: Record<string, { bg: string; color: string }> = { open: { bg: T.greenBg, color: T.green }, resolved: { bg: T.goldBg, color: T.gold }, cancelled: { bg: T.redBg, color: T.red } };
  const st = ST[draw.status] ?? ST.open;

  return (
    <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 9999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: st.bg, color: st.color }}>{draw.status}</span>
            <span style={{ fontSize: 11, color: T.textTert }}>{draw.category}</span>
          </div>
          <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draw.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: T.textSec }}>@{draw.sellerHandle} · closes {draw.closingDate} · £{(draw.ticketPricePence/100).toFixed(2)}/ticket</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {draw.status === 'open' && (
            <>
              <button onClick={handleResolve} disabled={resolving || cancelling} style={{ padding: '5px 11px', borderRadius: 8, background: T.goldBg, border: `1px solid ${T.gold}`, color: T.gold, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{resolving ? '…' : 'Resolve'}</button>
              <button onClick={handleCancel} disabled={resolving || cancelling} style={{ padding: '5px 11px', borderRadius: 8, background: T.redBg, border: `1px solid ${T.red}`, color: T.red, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{cancelling ? '…' : 'Cancel'}</button>
            </>
          )}
          <Link href={`/draw/${draw.id}`} style={{ color: T.coral, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>View →</Link>
        </div>
      </div>
      <div style={{ height: 3, background: T.bgOverlay, borderRadius: 2, marginBottom: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: draw.status === 'resolved' ? T.gold : draw.status === 'cancelled' ? T.red : T.coral, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec }}>
        <span>{draw.soldTickets}/{draw.totalTickets} tickets ({pct}%) — min {draw.minTickets}</span>
        <span style={{ fontWeight: 600, color: T.text }}>Revenue: £{((draw.soldTickets * draw.ticketPricePence)/100).toFixed(0)}</span>
      </div>
      {msg && <p style={{ margin: '6px 0 0', fontSize: 11, color: msg.startsWith('Error') ? T.red : T.green }}>{msg}</p>}
      {draw.status === 'open' && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Postal entry</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={postalName} onChange={e => setPostalName(e.target.value)} placeholder="Full name" style={{ flex: 1, minWidth: 100, padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgRaised, color: T.text, fontSize: 12, height: 'auto' }} />
            <input value={postalEmail} onChange={e => setPostalEmail(e.target.value)} placeholder="Email" type="email" style={{ flex: 2, minWidth: 140, padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgRaised, color: T.text, fontSize: 12, height: 'auto' }} />
            <button onClick={handlePostal} disabled={postalAdding} style={{ padding: '5px 12px', borderRadius: 6, background: T.coral, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{postalAdding ? '…' : 'Add'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main draws page ──────────────────────────────────────────────────────────
export default function AdminDrawsPage() {
  const [view, setView]           = useState<'cohorts' | 'ops'>('cohorts');
  const [cohorts, setCohorts]     = useState<DrawCohort[]>([]);
  const [opDraws, setOpDraws]     = useState<any[]>([]);
  const [token, setToken]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [detail, setDetail]       = useState<DrawCohort | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [opFilter, setOpFilter]   = useState('all');
  const [opCounts, setOpCounts]   = useState<Record<string, number>>({});

  const load = async (t: string) => {
    const [cRes, oRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts`, { headers: { Authorization: `Bearer ${t}` } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws`,   { headers: { Authorization: `Bearer ${t}` } }),
    ]);
    if (cRes.ok) { const d = await cRes.json(); setCohorts(d.cohorts ?? []); }
    if (oRes.ok) { const d = await oRes.json(); setOpDraws(d.draws ?? []); setOpCounts(d.counts ?? {}); }
    setLoading(false);
  };

  useEffect(() => {
    fetchAuthSession().then(s => {
      const t = s.tokens?.idToken?.toString() ?? '';
      setToken(t);
      load(t);
    });
  }, []);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id);
      return next;
    });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading…</div>;

  const opDisplayed = opFilter === 'all' ? opDraws : opDraws.filter(d => d.status === opFilter);

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Draws</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textSec }}>Cohort analytics · Operational management</p>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.borderSub}`, marginBottom: 20 }}>
        {[{ k: 'cohorts', l: 'Analytics cohorts' }, { k: 'ops', l: `Operations (${opDraws.length})` }].map(t => (
          <button key={t.k} onClick={() => setView(t.k as any)} style={{
            padding: '9px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            fontWeight: view === t.k ? 700 : 500, color: view === t.k ? T.coral : T.textSec,
            borderBottom: `2px solid ${view === t.k ? T.coral : 'transparent'}`,
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── Cohorts tab ── */}
      {view === 'cohorts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: T.textSec }}>{cohorts.length} cohorts · select up to 4 to compare</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {compareIds.size >= 2 && (
                <button onClick={() => setShowCompare(true)} style={{ padding: '6px 16px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Compare ({compareIds.size})
                </button>
              )}
              <Link href="/admin/entry" style={{ padding: '6px 16px', borderRadius: 9999, background: T.bgRaised, border: `1px solid ${T.border}`, color: T.textSec, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>+ Add draw</Link>
            </div>
          </div>

          {cohorts.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14 }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: T.textSec }}>No cohorts yet. <Link href="/admin/entry" style={{ color: T.coral }}>Add your first draw →</Link></p>
            </div>
          ) : (
            <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 32 }}></th>
                    {['Draw', 'Mode', 'Fill %', 'Views→Buyers', 'New / Repeat', 'Rollovers', 'Margin', 'Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c, i) => {
                    const fill = c.thresholdTickets > 0 ? Math.round(c.ticketsSold / c.thresholdTickets * 100) : 0;
                    const vtc  = c.uniqueVisitors > 0 ? `${(c.buyers / c.uniqueVisitors * 100).toFixed(1)}%` : '—';
                    const opsCost = Math.round(c.opsMinutes * TARGETS.opsHourlyRatePence / 60);
                    const margin  = c.platformFee - c.authCost - c.processingCost - c.shippingCost - opsCost;
                    const selected = compareIds.has(c.cohortId);
                    return (
                      <tr key={c.cohortId} onClick={() => setDetail(c)} style={{ borderBottom: i < cohorts.length - 1 ? `1px solid ${T.borderSub}` : 'none', cursor: 'pointer', background: selected ? T.coralBg : 'transparent' }}>
                        <td style={{ ...tdStyle, paddingRight: 0 }} onClick={e => { e.stopPropagation(); toggleCompare(c.cohortId); }}>
                          <input type="checkbox" checked={selected} readOnly style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, textTransform: 'uppercase', background: c.mode === 'manual' ? T.goldBg : T.greenBg, color: c.mode === 'manual' ? T.gold : T.green }}>{c.mode}</span>
                        </td>
                        <td style={{ ...tdStyle, color: fill >= 70 ? T.green : fill >= 40 ? T.gold : T.red, fontWeight: 700 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {fill}%
                            <span style={{ display: 'inline-block', width: 40, height: 4, background: T.bgOverlay, borderRadius: 2, overflow: 'hidden' }}>
                              <span style={{ display: 'block', height: '100%', width: `${Math.min(fill, 100)}%`, background: fill >= 70 ? T.green : fill >= 40 ? T.gold : T.red }} />
                            </span>
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: T.textSec }}>{vtc}</td>
                        <td style={{ ...tdStyle, color: T.textSec }}>{c.newBuyers} / {c.repeatBuyers}</td>
                        <td style={{ ...tdStyle, color: T.textSec }}>{c.rolloverCount}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: margin >= 0 ? T.green : T.red }}>
                          {margin >= 0 ? '+' : '−'}{fmtP(Math.abs(margin))}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, textTransform: 'uppercase', background: c.status === 'resolved' ? T.goldBg : c.status === 'cancelled' ? T.redBg : T.greenBg, color: c.status === 'resolved' ? T.gold : c.status === 'cancelled' ? T.red : T.green }}>{c.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Operations tab ── */}
      {view === 'ops' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[['all', opDraws.length], ['open', opCounts.open ?? 0], ['resolved', opCounts.resolved ?? 0], ['cancelled', opCounts.cancelled ?? 0]].map(([f, n]) => (
              <button key={f} onClick={() => setOpFilter(f as string)} style={{
                padding: '6px 14px', borderRadius: 9999, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                background: opFilter === f ? T.coralBg : T.bgRaised,
                border: `1.5px solid ${opFilter === f ? 'rgba(255,35,86,0.25)' : T.border}`,
                color: opFilter === f ? T.coral : T.textSec, fontWeight: opFilter === f ? 700 : 500,
                textTransform: 'capitalize',
              }}>{f} ({n})</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {opDisplayed.map(d => <OpCard key={d.id} draw={d} token={token} onUpdate={() => load(token)} />)}
            {opDisplayed.length === 0 && <p style={{ color: T.textTert, fontSize: 13 }}>No draws in this category.</p>}
          </div>
        </div>
      )}

      {detail && <CohortDetail cohort={detail} token={token} onClose={() => setDetail(null)} />}
      {showCompare && <ComparePanel cohorts={cohorts} selectedIds={compareIds} onToggle={toggleCompare} onClose={() => setShowCompare(false)} />}
    </div>
  );
}
