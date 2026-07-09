'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import { TARGETS, PIVOT_SENTENCES, type MetricKey } from '@/config/metricTargets';
import type { MetricSnapshot, PivotTrigger, DrawCohort } from '@/types/metrics';

// ─── Design tokens ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtVal(key: MetricKey, val: number): string {
  if (key === 'viralCoefficient') return val.toFixed(2);
  if (key === 'contributionMargin') return val >= 0 ? `+£${(val / 100).toFixed(0)}` : `-£${Math.abs(val / 100).toFixed(0)}`;
  return `${val.toFixed(1)}%`;
}

function metricStatus(key: MetricKey, val: number, drawCount: number): 'healthy' | 'warning' | 'danger' | 'pending' {
  const t = TARGETS[key];
  if (!t || typeof t !== 'object') return 'pending';
  if (drawCount < t.pivotAfterDraws) return 'pending';
  if (key === 'contributionMargin') {
    return val >= 0 ? 'healthy' : 'danger';
  }
  if (val >= t.healthy) return 'healthy';
  if (val >= t.pivot) return 'warning';
  return 'danger';
}

const STATUS_COLOUR = { healthy: T.green, warning: T.gold, danger: T.red, pending: T.textTert };
const STATUS_BG     = { healthy: T.greenBg, warning: T.goldBg, danger: T.redBg, pending: T.bgElevated };

// ─── Metric tile ──────────────────────────────────────────────────────────────
function MetricTile({ metricKey, value, drawCount }: { metricKey: MetricKey; value: number; drawCount: number }) {
  const status  = metricStatus(metricKey, value, drawCount);
  const colour  = STATUS_COLOUR[status];
  const t       = TARGETS[metricKey];
  const targetLabel = typeof t === 'object'
    ? (metricKey === 'contributionMargin' ? 'target ≥ £0 by draw 6' : `target ≥${t.healthy}${metricKey === 'viralCoefficient' ? '' : '%'}`)
    : '';

  const LABELS: Record<MetricKey, string> = {
    fillRatePct:        'Fill Rate',
    viewToTicketPct:    'View → Ticket',
    repeatBuyerPct:     'Repeat Buyers',
    sellerRepeatPct:    'Seller Repeat',
    winnerSharePct:     'Winner Share',
    viralCoefficient:   'Viral Coefficient',
    contributionMargin: 'Contribution Margin',
  };

  return (
    <Link href={`/admin/draws`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: T.bgRaised, borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${T.border}`, boxShadow: T.shadow,
        display: 'flex', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}>
        {/* Status strip */}
        <div style={{ width: 5, background: colour, flexShrink: 0 }} />
        <div style={{ padding: '14px 16px', flex: 1 }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {LABELS[metricKey]}
          </p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: status === 'pending' ? T.textTert : colour, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
            {status === 'pending' ? '—' : fmtVal(metricKey, value)}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: T.textTert }}>{targetLabel}</p>
          {status === 'pending' && (
            <p style={{ margin: '2px 0 0', fontSize: 10, color: T.textTert }}>
              {typeof t === 'object' ? `needs ${t.pivotAfterDraws} draws` : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Pivot trigger card ───────────────────────────────────────────────────────
function PivotCard({ trigger, onDecisionLogged }: { trigger: PivotTrigger; onDecisionLogged: (metric: string, note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const session = await fetchAuthSession();
      const token   = session.tokens?.idToken?.toString();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/metrics/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ metric: trigger.metric, note: note.trim(), decision: 'logged' }),
      });
      onDecisionLogged(trigger.metric, note.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: T.redBg, border: `1px solid ${T.red}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Pivot trigger — {trigger.metric}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.5 }}>{trigger.sentence}</p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textSec }}>
            Current: {trigger.value.toFixed(1)} · Trigger: {trigger.threshold} · After {trigger.drawCount} draws
          </p>
        </div>
        {!open && !trigger.decisionNote && (
          <button onClick={() => setOpen(true)} style={{
            padding: '6px 14px', borderRadius: 8, background: T.red, border: 'none',
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>Log decision</button>
        )}
      </div>
      {trigger.decisionNote && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 6, fontSize: 12, color: T.textSec }}>
          <strong style={{ color: T.text }}>Decision logged:</strong> {trigger.decisionNote}
          {trigger.decisionAt && <span style={{ marginLeft: 8, color: T.textTert }}>— {trigger.decisionAt.slice(0, 10)}</span>}
        </div>
      )}
      {open && !trigger.decisionNote && (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: T.text }}>Persevere or pivot? Log the decision + rationale:</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Persevere — fill rate low because we only ran 2 bags. Increasing to 5 bags/week next cycle."
            rows={3}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, background: '#fff', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={save} disabled={!note.trim() || saving} style={{
              padding: '6px 14px', borderRadius: 8, background: T.red, border: 'none',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (!note.trim() || saving) ? 0.6 : 1,
            }}>{saving ? 'Saving…' : 'Save decision'}</button>
            <button onClick={() => setOpen(false)} style={{
              padding: '6px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textSec, fontSize: 12, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main overview ────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const [metrics, setMetrics]   = useState<MetricSnapshot | null>(null);
  const [cohorts, setCohorts]   = useState<DrawCohort[]>([]);
  const [triggers, setTriggers] = useState<PivotTrigger[]>([]);
  const [loading, setLoading]   = useState(true);
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const session = await fetchAuthSession();
        const token   = session.tokens?.idToken?.toString() ?? '';
        setAuthToken(token);
        const [mRes, cRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (mRes.ok) setMetrics(await mRes.json());
        if (cRes.ok) {
          const data = await cRes.json();
          setCohorts((data.cohorts ?? []).slice(0, 5));
          setTriggers(data.pivotTriggers ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDecisionLogged = (metric: string, note: string) => {
    setTriggers(prev => prev.map(t => t.metric === metric ? { ...t, decisionNote: note, decisionAt: new Date().toISOString() } : t));
  };

  const drawCount = metrics?.drawCount ?? 0;

  const METRIC_KEYS: MetricKey[] = ['fillRatePct', 'viewToTicketPct', 'repeatBuyerPct', 'sellerRepeatPct', 'winnerSharePct', 'viralCoefficient', 'contributionMargin'];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading metrics…</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Weekly Review</h1>
        <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>{drawCount} draw{drawCount !== 1 ? 's' : ''} in model · {metrics ? `computed ${metrics.computedAt.slice(0, 10)}` : 'no data yet'}</p>
      </div>

      {/* Seven metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 28 }}>
        {METRIC_KEYS.map(key => (
          <MetricTile key={key} metricKey={key} value={metrics ? (metrics as any)[key] ?? 0 : 0} drawCount={drawCount} />
        ))}
      </div>

      {/* Pivot trigger panel */}
      {triggers.filter(t => !t.decisionNote).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Pivot triggers ({triggers.filter(t => !t.decisionNote).length})
          </p>
          {triggers.map(t => (
            <PivotCard key={t.metric} trigger={t} onDecisionLogged={handleDecisionLogged} />
          ))}
        </div>
      )}

      {/* No data callout */}
      {drawCount === 0 && (
        <div style={{ padding: '32px 24px', background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, textAlign: 'center', marginBottom: 28 }}>
          <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: T.text }}>No cohorts yet</p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textSec }}>Add your first manual draw to start tracking the seven Lean metrics.</p>
          <Link href="/admin/entry" style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: 9999,
            background: T.coral, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>Add first draw →</Link>
        </div>
      )}

      {/* Last 5 draws */}
      {cohorts.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Draws</p>
            <Link href="/admin/draws" style={{ fontSize: 12, color: T.coral, textDecoration: 'none', fontWeight: 600 }}>See all →</Link>
          </div>
          <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` }}>
                  {['Draw', 'Mode', 'Fill %', 'Buyers', 'Margin', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c, i) => {
                  const fill    = c.thresholdTickets > 0 ? Math.round(c.ticketsSold / c.thresholdTickets * 100) : 0;
                  const opsCost = Math.round(c.opsMinutes * TARGETS.opsHourlyRatePence / 60);
                  const margin  = c.platformFee - c.authCost - c.processingCost - c.shippingCost - opsCost;
                  return (
                    <tr key={c.cohortId} style={{ borderBottom: i < cohorts.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: T.text }}>{c.label}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.06em', background: c.mode === 'manual' ? T.goldBg : T.greenBg, color: c.mode === 'manual' ? T.gold : T.green }}>
                          {c.mode}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: fill >= 70 ? T.green : fill >= 40 ? T.gold : T.red, fontWeight: 700 }}>{fill}%</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: T.textSec }}>{c.buyers}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: margin >= 0 ? T.green : T.red, fontWeight: 600 }}>
                        {margin >= 0 ? `+£${(margin / 100).toFixed(0)}` : `-£${Math.abs(margin / 100).toFixed(0)}`}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: c.status === 'resolved' ? T.goldBg : c.status === 'cancelled' ? T.redBg : T.greenBg,
                          color: c.status === 'resolved' ? T.gold : c.status === 'cancelled' ? T.red : T.green,
                        }}>{c.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
