'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { TARGETS } from '@/config/metricTargets';
import type { DrawCohort } from '@/types/metrics';

const T = { text: '#1C1917', textSec: '#78716C', textTert: '#A8A29E', bgRaised: '#FFFFFF', bgElevated: '#F5F2ED', bgOverlay: '#EDE8E1', border: 'rgba(0,0,0,0.10)', borderSub: 'rgba(0,0,0,0.06)', coral: '#FF2356', gold: '#F59E0B', goldBg: 'rgba(245,158,11,0.10)', green: '#059669', greenBg: 'rgba(5,150,105,0.08)', red: '#DC2626', redBg: 'rgba(220,38,38,0.08)', shadow: '0 1px 3px rgba(0,0,0,0.08)' };

function fmtP(p: number) { return `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }
function computeMargin(c: DrawCohort) {
  const opsCost = Math.round(c.opsMinutes * TARGETS.opsHourlyRatePence / 60);
  return c.platformFee - c.authCost - c.processingCost - c.shippingCost - opsCost;
}

export default function AdminEconomicsPage() {
  const [cohorts, setCohorts] = useState<DrawCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthSession().then(async s => {
      const t = s.tokens?.idToken?.toString() ?? '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) { const d = await res.json(); setCohorts(d.cohorts ?? []); }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading…</div>;

  const resolved = cohorts.filter(c => c.status === 'resolved');
  const margins  = cohorts.map(computeMargin);
  const totalFee = cohorts.reduce((s, c) => s + c.platformFee, 0);
  const totalCost= cohorts.reduce((s, c) => s + c.authCost + c.processingCost + c.shippingCost + Math.round(c.opsMinutes * TARGETS.opsHourlyRatePence / 60), 0);
  const cumulativeMargin = margins.reduce((a, b) => a + b, 0);
  const avgMargin = margins.length > 0 ? Math.round(cumulativeMargin / margins.length) : 0;

  // Projection strip — uses last 4 resolved draws
  const last4 = resolved.slice(-4);
  const avgLast4Margin = last4.length > 0 ? Math.round(last4.map(computeMargin).reduce((a, b) => a + b, 0) / last4.length) : 0;
  const drawsPerWeek   = 7; // conservative estimate — update manually
  const monthlyProjection = avgLast4Margin * drawsPerWeek * 4;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Economics — Unit Economics</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: T.textSec }}>Contribution margin per draw · cost breakdown · projection</p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Cumulative margin',  value: fmtP(cumulativeMargin), color: cumulativeMargin >= 0 ? T.green : T.red },
          { label: 'Avg margin / draw',  value: fmtP(avgMargin),        color: avgMargin >= 0 ? T.green : T.red },
          { label: 'Total fee revenue',  value: fmtP(totalFee)          },
          { label: 'Total costs',        value: fmtP(totalCost),        color: T.red },
          { label: 'Draws tracked',      value: cohorts.length.toString() },
          { label: 'Draws resolved',     value: resolved.length.toString() },
        ].map(k => (
          <div key={k.label} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadow }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: k.color ?? T.text, fontFamily: 'Georgia, serif' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Projection strip */}
      {last4.length >= 2 && (
        <div style={{ padding: '14px 18px', background: avgLast4Margin >= 0 ? T.greenBg : T.redBg, border: `1px solid ${avgLast4Margin >= 0 ? T.green : T.red}`, borderRadius: 12, marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 13, color: T.text }}>
            At current avg margin <strong>{fmtP(avgLast4Margin)}</strong> (last {last4.length} draws) and {drawsPerWeek} draws/week,
            estimated monthly contribution ≈ <strong style={{ color: monthlyProjection >= 0 ? T.green : T.red }}>{fmtP(monthlyProjection)}</strong>.
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textSec }}>Plain arithmetic from last {last4.length} resolved draws — not a financial projection.</p>
        </div>
      )}

      {/* Per-draw margin bar chart (text-based for simplicity) */}
      {cohorts.length === 0 ? (
        <div style={{ padding: '40px 24px', background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, textAlign: 'center' }}>
          <p style={{ color: T.textSec, fontSize: 13 }}>No cohorts yet. <a href="/admin/entry" style={{ color: T.coral }}>Add your first draw →</a></p>
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Margin per draw</p>
          <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` }}>
                  {['Draw', 'Fee rev', 'Auth', 'Processing', 'Shipping', 'Ops', 'Margin'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c, i) => {
                  const opsCost = Math.round(c.opsMinutes * TARGETS.opsHourlyRatePence / 60);
                  const margin  = computeMargin(c);
                  const maxAbs  = Math.max(...margins.map(Math.abs), 1);
                  const barW    = Math.round(Math.abs(margin) / maxAbs * 80);
                  return (
                    <tr key={c.cohortId} style={{ borderBottom: i < cohorts.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: T.text, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec }}>{fmtP(c.platformFee)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec }}>{fmtP(c.authCost)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec }}>{fmtP(c.processingCost)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec }}>{fmtP(c.shippingCost)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: T.textSec }}>{fmtP(opsCost)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 6, background: T.bgOverlay, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${barW}%`, background: margin >= 0 ? T.green : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: margin >= 0 ? T.green : T.red }}>{margin >= 0 ? '+' : '−'}{fmtP(Math.abs(margin))}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cumulative progression */}
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Cumulative margin progression</p>
          <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, boxShadow: T.shadow }}>
            {cohorts.reduce<{ running: number; els: React.ReactNode[] }>((acc, c, i) => {
              acc.running += computeMargin(c);
              const pct = Math.abs(acc.running) / Math.max(...cohorts.map((_, j) => {
                let r = 0; for (let k = 0; k <= j; k++) r += computeMargin(cohorts[k]); return Math.abs(r);
              }), 1) * 100;
              acc.els.push(
                <div key={c.cohortId} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < cohorts.length - 1 ? 6 : 0 }}>
                  <span style={{ fontSize: 11, color: T.textSec, minWidth: 20, textAlign: 'right' }}>{i + 1}</span>
                  <div style={{ flex: 1, height: 8, background: T.bgOverlay, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: acc.running >= 0 ? T.green : T.red, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: acc.running >= 0 ? T.green : T.red, minWidth: 60, textAlign: 'right' }}>
                    {acc.running >= 0 ? '+' : '−'}{fmtP(Math.abs(acc.running))}
                  </span>
                </div>,
              );
              return acc;
            }, { running: 0, els: [] }).els}
          </div>
        </>
      )}
    </div>
  );
}
