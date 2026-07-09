'use client';

import '@/lib/amplify';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface BrandAggregate {
  brandId: string;
  period: string;
  totalDraws: number;
  completedDraws: number;
  cancelledDraws: number;
  completionRate: number;
  totalRevenuePence: number;
  avgRevenuePence: number;
  avgEffectiveSalePricePence: number;
  avgRetailValueGBP: number;
  avgDiscountToRetailPct: number;
  avgSaveCount: number;
  avgHoursToThreshold: number | null;
  authTotal: number;
  authPassCount: number;
  authPassRate: number;
  topModels: Array<{
    itemSlug: string;
    modelName: string;
    drawCount: number;
    completedDraws: number;
    avgRevenuePence: number;
    avgHoursToThreshold: number | null;
  }>;
  conditionBreakdown: Record<string, { count: number; avgRevenuePence: number; completionRate: number }>;
  ticketPriceBreakdown: Record<number, { count: number; avgRevenuePence: number }>;
  updatedAt: string;
}

interface CatalogueItem {
  itemSlug: string;
  brandId: string;
  modelName: string;
  listingCount: number;
  completedDraws: number;
  avgHoursToThreshold: number | null;
  avgEffectiveSalePricePence: number | null;
  avgSaveCount: number | null;
  retailPriceLow?: number;
  retailPriceHigh?: number;
}

interface BrandReport {
  brandId: string;
  period: string;
  aggregate: BrandAggregate | null;
  availablePeriods: string[];
  catalogue: CatalogueItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANDS = [
  { id: 'all',     label: 'All Brands' },
  { id: 'chanel',  label: 'Chanel'     },
  { id: 'lv',      label: 'Louis Vuitton' },
  { id: 'bottega', label: 'Bottega Veneta' },
  { id: 'prada',   label: 'Prada'      },
  { id: 'celine',  label: 'Celine'     },
] as const;

const BRAND_IDS = ['chanel', 'lv', 'bottega', 'prada', 'celine'] as const;

// ─── Design tokens (warm light theme matching globals.css) ────────────────────

const T = {
  bg:         '#FAFAF8',
  bgRaised:   '#FFFFFF',
  bgElevated: '#F5F2ED',
  bgOverlay:  '#EDE8E1',
  text:       '#1C1917',
  textSec:    '#78716C',
  textTert:   '#A8A29E',
  coral:      '#FF2356',
  coralBg:    'rgba(255,35,86,0.08)',
  coralBorder:'rgba(255,35,86,0.25)',
  gold:       '#F59E0B',
  goldBg:     'rgba(245,158,11,0.10)',
  green:      '#059669',
  greenBg:    'rgba(5,150,105,0.08)',
  red:        '#DC2626',
  redBg:      'rgba(220,38,38,0.08)',
  border:     'rgba(0,0,0,0.10)',
  borderSub:  'rgba(0,0,0,0.06)',
  shadow:     '0 1px 4px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
  shadowSm:   '0 1px 2px rgba(0,0,0,0.06)',
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtP(pence: number) {
  return pence >= 100
    ? `£${(pence / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
    : `${pence}p`;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtHours(h: number | null) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h.toFixed(1)}h`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 18px', boxShadow: T.shadowSm }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: accent ? T.coral : T.text, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textTert }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '24px 0 12px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
      {children}
    </p>
  );
}

const tableWrap: React.CSSProperties = {
  background: T.bgRaised, border: `1px solid ${T.border}`,
  borderRadius: 14, overflow: 'hidden', boxShadow: T.shadowSm,
};
const thBase: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', color: T.textTert, fontWeight: 600,
  fontSize: 10, whiteSpace: 'nowrap', borderBottom: `1px solid ${T.borderSub}`,
  background: T.bgElevated, textTransform: 'uppercase', letterSpacing: '0.08em',
};
const tdBase: React.CSSProperties = { padding: '10px 14px', fontSize: 13, color: T.text };

// ─── Analytics section ────────────────────────────────────────────────────────

function AnalyticsSection({ authToken }: { authToken: string }) {
  const [reports, setReports] = useState<Record<string, BrandReport>>({});
  const [loading, setLoading] = useState(true);
  const [activeBrand, setActiveBrand] = useState<string>('all');
  const [period, setPeriod] = useState('all_time');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(['all_time']);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authToken || !apiBase) return;
    setLoading(true);
    Promise.all(
      BRAND_IDS.map(brandId =>
        fetch(`${apiBase}/analytics/brands/${brandId}?period=${period}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }).then(r => r.ok ? r.json() : null).catch(() => null),
      ),
    ).then(results => {
      const map: Record<string, BrandReport> = {};
      BRAND_IDS.forEach((id, i) => { if (results[i]) map[id] = results[i] as BrandReport; });
      setReports(map);
      const allPeriods = new Set<string>(['all_time']);
      Object.values(map).forEach(r => r.availablePeriods.forEach(p => allPeriods.add(p)));
      setAvailablePeriods([...allPeriods].sort().reverse());
      setLoading(false);
    });
  }, [authToken, period, apiBase]);

  const selectedBrands = activeBrand === 'all' ? BRAND_IDS : [activeBrand as typeof BRAND_IDS[number]];
  const activeReports  = selectedBrands.map(b => reports[b]).filter(Boolean);

  const agg = activeReports.reduce<{
    totalDraws: number; completedDraws: number; cancelledDraws: number;
    totalRevenuePence: number; avgHoursSum: number; avgHoursCount: number;
    authPassed: number; authTotal: number; avgSaveSum: number; avgRetailSum: number;
  }>((acc, r) => {
    const a = r.aggregate;
    if (!a) return acc;
    return {
      totalDraws:       acc.totalDraws + a.totalDraws,
      completedDraws:   acc.completedDraws + a.completedDraws,
      cancelledDraws:   acc.cancelledDraws + a.cancelledDraws,
      totalRevenuePence:acc.totalRevenuePence + a.totalRevenuePence,
      avgHoursSum:      acc.avgHoursSum + (a.avgHoursToThreshold ?? 0),
      avgHoursCount:    acc.avgHoursCount + (a.avgHoursToThreshold != null ? 1 : 0),
      authPassed:       acc.authPassed + a.authPassCount,
      authTotal:        acc.authTotal + a.authTotal,
      avgSaveSum:       acc.avgSaveSum + a.avgSaveCount,
      avgRetailSum:     acc.avgRetailSum + a.avgRetailValueGBP,
    };
  }, { totalDraws: 0, completedDraws: 0, cancelledDraws: 0, totalRevenuePence: 0, avgHoursSum: 0, avgHoursCount: 0, authPassed: 0, authTotal: 0, avgSaveSum: 0, avgRetailSum: 0 });

  const completionRate      = agg.totalDraws > 0 ? agg.completedDraws / agg.totalDraws * 100 : 0;
  const authPassRate        = agg.authTotal > 0   ? agg.authPassed / agg.authTotal * 100 : 0;
  const avgHoursToThreshold = agg.avgHoursCount > 0 ? agg.avgHoursSum / agg.avgHoursCount : null;
  const avgSaveCount        = activeReports.length > 0 ? agg.avgSaveSum / activeReports.length : 0;

  const catalogue = activeReports.flatMap(r => r.catalogue).sort((a, b) => (b.completedDraws ?? 0) - (a.completedDraws ?? 0));
  const topModels = activeReports.flatMap(r => r.aggregate?.topModels ?? []).sort((a, b) => b.completedDraws - a.completedDraws).slice(0, 10);

  const conditionMerged: Record<string, { count: number; avgRevenuePence: number; completionRate: number }> = {};
  activeReports.forEach(r => {
    Object.entries(r.aggregate?.conditionBreakdown ?? {}).forEach(([cond, stat]) => {
      if (!conditionMerged[cond]) conditionMerged[cond] = { count: 0, avgRevenuePence: 0, completionRate: 0 };
      conditionMerged[cond].count += stat.count;
      conditionMerged[cond].avgRevenuePence = Math.round((conditionMerged[cond].avgRevenuePence + stat.avgRevenuePence) / 2);
      conditionMerged[cond].completionRate  = Math.round(((conditionMerged[cond].completionRate + stat.completionRate * 100) / 2) * 10) / 10;
    });
  });

  const priceMerged: Record<number, { count: number; avgRevenuePence: number }> = {};
  activeReports.forEach(r => {
    Object.entries(r.aggregate?.ticketPriceBreakdown ?? {}).forEach(([price, stat]) => {
      const p = Number(price);
      if (!priceMerged[p]) priceMerged[p] = { count: 0, avgRevenuePence: 0 };
      priceMerged[p].count += stat.count;
      priceMerged[p].avgRevenuePence = Math.round((priceMerged[p].avgRevenuePence + stat.avgRevenuePence) / 2);
    });
  });

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading analytics…</div>;

  if (agg.totalDraws === 0) return (
    <div style={{ padding: '60px 24px', textAlign: 'center', background: T.bgRaised, borderRadius: 14, border: `1px solid ${T.border}` }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>No analytics data yet</p>
      <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
        Data appears here once CDK is deployed and draws start completing.<br />
        Events are recorded from the next ticket purchase onwards.
      </p>
    </div>
  );

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BRANDS.map(b => (
            <button key={b.id} onClick={() => setActiveBrand(b.id)} style={{
              padding: '6px 14px', borderRadius: 9999, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              background: activeBrand === b.id ? T.coralBg : T.bgRaised,
              border: `1.5px solid ${activeBrand === b.id ? T.coralBorder : T.border}`,
              color: activeBrand === b.id ? T.coral : T.textSec,
              fontWeight: activeBrand === b.id ? 700 : 500,
            }}>{b.label}</button>
          ))}
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{
          padding: '6px 12px', borderRadius: 8, background: T.bgRaised,
          border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit',
        }}>
          {availablePeriods.map(p => <option key={p} value={p}>{p === 'all_time' ? 'All time' : p}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <SectionTitle>Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        <StatCard label="Total draws"      value={agg.totalDraws.toString()} />
        <StatCard label="Completed"        value={agg.completedDraws.toString()} accent />
        <StatCard label="Completion rate"  value={fmtPct(completionRate)} accent />
        <StatCard label="Total revenue"    value={fmtP(agg.totalRevenuePence)} />
        <StatCard label="Avg to threshold" value={fmtHours(avgHoursToThreshold)} sub="lower = stronger demand" />
        <StatCard label="Avg saves / draw" value={avgSaveCount.toFixed(1)} sub="interest without purchase" />
        <StatCard label="Auth pass rate"   value={agg.authTotal > 0 ? fmtPct(authPassRate) : '—'} sub={`${agg.authPassed}/${agg.authTotal}`} />
        <StatCard label="Avg retail value" value={activeReports.length > 0 ? `£${Math.round(agg.avgRetailSum / activeReports.length).toLocaleString()}` : '—'} />
      </div>

      {/* Top models */}
      {topModels.length > 0 && (
        <>
          <SectionTitle>Top Models by Demand</SectionTitle>
          <div style={tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Model', 'Draws', 'Completed', 'Completion', 'Avg Revenue', 'Avg to Threshold'].map(h => <th key={h} style={thBase}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {topModels.map((m, i) => {
                  const rate = m.drawCount > 0 ? m.completedDraws / m.drawCount * 100 : 0;
                  return (
                    <tr key={m.itemSlug} style={{ borderBottom: i < topModels.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ ...tdBase, fontWeight: 600 }}>{m.modelName}</td>
                      <td style={{ ...tdBase, color: T.textSec }}>{m.drawCount}</td>
                      <td style={{ ...tdBase, color: T.green, fontWeight: 600 }}>{m.completedDraws}</td>
                      <td style={tdBase}>
                        <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: rate >= 70 ? T.greenBg : T.goldBg, color: rate >= 70 ? T.green : T.gold }}>{fmtPct(rate)}</span>
                      </td>
                      <td style={{ ...tdBase, fontWeight: 700 }}>{fmtP(m.avgRevenuePence)}</td>
                      <td style={{ ...tdBase, color: T.textSec }}>{fmtHours(m.avgHoursToThreshold)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Condition + Price side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {Object.keys(conditionMerged).length > 0 && (
          <div>
            <SectionTitle>Condition Performance</SectionTitle>
            <div style={tableWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Condition', 'Draws', 'Completion', 'Avg Rev'].map(h => <th key={h} style={thBase}>{h}</th>)}</tr></thead>
                <tbody>
                  {Object.entries(conditionMerged).sort((a, b) => b[1].count - a[1].count).map(([cond, stat], i, arr) => (
                    <tr key={cond} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ ...tdBase, fontWeight: 600, textTransform: 'capitalize' }}>{cond.replace(/_/g, ' ')}</td>
                      <td style={{ ...tdBase, color: T.textSec }}>{stat.count}</td>
                      <td style={{ ...tdBase, color: stat.completionRate >= 70 ? T.green : T.gold, fontWeight: 700 }}>{fmtPct(stat.completionRate)}</td>
                      <td style={{ ...tdBase, fontWeight: 600 }}>{fmtP(stat.avgRevenuePence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {Object.keys(priceMerged).length > 0 && (
          <div>
            <SectionTitle>Ticket Price Performance</SectionTitle>
            <div style={tableWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Ticket price', 'Draws', 'Avg Revenue'].map(h => <th key={h} style={thBase}>{h}</th>)}</tr></thead>
                <tbody>
                  {Object.entries(priceMerged).sort((a, b) => Number(a[0]) - Number(b[0])).map(([price, stat], i, arr) => (
                    <tr key={price} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ ...tdBase, fontWeight: 700 }}>{fmtP(Number(price))}</td>
                      <td style={{ ...tdBase, color: T.textSec }}>{stat.count}</td>
                      <td style={{ ...tdBase, fontWeight: 600 }}>{fmtP(stat.avgRevenuePence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Item catalogue */}
      {catalogue.length > 0 && (
        <>
          <SectionTitle>Item Catalogue — {catalogue.length} model{catalogue.length !== 1 ? 's' : ''}</SectionTitle>
          <div style={tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Model', 'Brand', 'Listed', 'Completed', 'Avg Sale Price', 'Avg to Threshold', 'Avg Retail'].map(h => <th key={h} style={thBase}>{h}</th>)}</tr></thead>
              <tbody>
                {catalogue.map((item, i) => (
                  <tr key={item.itemSlug} style={{ borderBottom: i < catalogue.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                    <td style={{ ...tdBase, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.modelName}</td>
                    <td style={{ ...tdBase, color: T.textTert, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{item.brandId}</td>
                    <td style={{ ...tdBase, color: T.textSec }}>{item.listingCount}</td>
                    <td style={{ ...tdBase, color: T.green, fontWeight: 700 }}>{item.completedDraws}</td>
                    <td style={{ ...tdBase, fontWeight: 600 }}>{item.avgEffectiveSalePricePence != null ? fmtP(item.avgEffectiveSalePricePence) : '—'}</td>
                    <td style={{ ...tdBase, color: T.textSec }}>{fmtHours(item.avgHoursToThreshold ?? null)}</td>
                    <td style={{ ...tdBase, color: T.textTert }}>{item.retailPriceLow ? `£${item.retailPriceLow.toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Period switcher for single brand */}
      {activeBrand !== 'all' && activeReports[0]?.aggregate && (activeReports[0]?.availablePeriods ?? []).length > 1 && (
        <>
          <SectionTitle>{BRANDS.find(b => b.id === activeBrand)?.label} — Period</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(activeReports[0]?.availablePeriods ?? []).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '5px 12px', borderRadius: 9999, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                background: period === p ? T.coralBg : T.bgRaised,
                border: `1.5px solid ${period === p ? T.coralBorder : T.border}`,
                color: period === p ? T.coral : T.textSec,
                fontWeight: period === p ? 700 : 500,
              }}>{p === 'all_time' ? 'All time' : p}</button>
            ))}
          </div>
        </>
      )}

      {/* API note */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 10 }}>
        <p style={{ margin: 0, fontSize: 11, color: T.textSec }}>
          <strong style={{ color: T.text }}>Brand report API:</strong>{' '}
          <code style={{ fontFamily: 'monospace', color: T.coral }}>GET /analytics/brands/{'{brandId}'}?period=all_time&includeDraws=true</code>
          <br />Add <code>includeDraws=true</code> to include per-draw records for brand partner exports.
        </p>
      </div>
    </div>
  );
}

// ─── Main admin page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [draws, setDraws]           = useState<AdminDraw[]>([]);
  const [counts, setCounts]         = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');
  const [email, setEmail]           = useState('');
  const [authToken, setAuthToken]   = useState('');
  const [tab, setTab]               = useState<'draws' | 'analytics'>('draws');
  const [resolving, setResolving]   = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [resolveResult, setResolveResult] = useState<Record<string, string>>({});
  const [postalForm, setPostalForm] = useState<Record<string, { name: string; email: string }>>({});
  const [postalAdding, setPostalAdding] = useState<string | null>(null);
  const [postalResult, setPostalResult] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const session = await fetchAuthSession();
        const token   = session.tokens?.idToken?.toString();
        if (!token) { setError('Not authenticated'); setLoading(false); return; }
        const payload = JSON.parse(atob(token.split('.')[1]));
        setEmail(payload.email ?? payload.username ?? '');
        setAuthToken(token);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/draws`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 403) { setError('Access denied — admin only'); setLoading(false); return; }
        if (!res.ok)            { setError(`API error ${res.status}`);    setLoading(false); return; }
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

  const handleAddPostalEntry = useCallback(async (drawId: string) => {
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
  }, [authToken, postalForm]);

  const handleCancel = useCallback(async (drawId: string, drawTitle: string) => {
    const reason = prompt(`Cancel reason for:\n"${drawTitle}"\n\nAll entrants will be refunded.`, 'Cancelled by admin');
    if (reason === null) return;
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
  }, [authToken]);

  const handleResolve = useCallback(async (drawId: string, drawTitle: string) => {
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
        const w = data.winnerId ? `${data.winnerId.slice(0, 8)}…` : 'unknown';
        setResolveResult(prev => ({ ...prev, [drawId]: `Winner: ${w} (${data.soldTickets} tickets sold)` }));
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
  }, [authToken]);

  const displayed = filter === 'all' ? draws : draws.filter(d => d.status === filter);

  if (loading) return (
    <AppShell><div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading admin panel…</div></AppShell>
  );
  if (error) return (
    <AppShell>
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: T.red, fontSize: 16, fontWeight: 700 }}>{error}</p>
        <Link href="/home" style={{ color: T.coral, fontSize: 14 }}>← Back to home</Link>
      </div>
    </AppShell>
  );

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    open:      { bg: T.greenBg, color: T.green },
    resolved:  { bg: T.goldBg,  color: T.gold  },
    cancelled: { bg: T.redBg,   color: T.red   },
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${T.borderSub}` }}>
          <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Admin Panel</p>
          <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>Signed in as {email}</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '16px 16px 0' }}>
          {[
            { label: 'Open',      value: counts.open      ?? 0, color: T.green },
            { label: 'Resolved',  value: counts.resolved  ?? 0, color: T.gold  },
            { label: 'Cancelled', value: counts.cancelled ?? 0, color: T.red   },
          ].map(stat => (
            <div key={stat.label} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, textAlign: 'center', boxShadow: T.shadowSm }}>
              <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: T.textSec, fontWeight: 500 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 0, padding: '16px 16px 0', borderBottom: `1px solid ${T.borderSub}` }}>
          {([
            { key: 'draws',     label: 'Draws Management' },
            { key: 'analytics', label: 'Data & Analytics'  },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', background: 'transparent', border: 'none',
              color: tab === t.key ? T.coral : T.textSec,
              borderBottom: `2px solid ${tab === t.key ? T.coral : 'transparent'}`,
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── DRAWS TAB ────────────────────────────────────────────────────── */}
        {tab === 'draws' && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['all', 'open', 'resolved', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 16px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  background: filter === f ? T.coralBg : T.bgRaised,
                  border: `1.5px solid ${filter === f ? T.coralBorder : T.border}`,
                  color: filter === f ? T.coral : T.textSec,
                  fontWeight: filter === f ? 700 : 500,
                  textTransform: 'capitalize',
                }}>{f} {f === 'all' ? `(${draws.length})` : `(${counts[f] ?? 0})`}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayed.map(d => {
                const pct     = d.totalTickets > 0 ? Math.round(d.soldTickets / d.totalTickets * 100) : 0;
                const st      = STATUS_STYLE[d.status] ?? STATUS_STYLE.open;
                const revenue = d.soldTickets * d.ticketPricePence;
                const result  = resolveResult[d.id];
                return (
                  <div key={d.id} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadowSm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999, background: st.bg, color: st.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.status}</span>
                          <span style={{ fontSize: 11, color: T.textTert }}>{d.category}</span>
                        </div>
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: T.textSec }}>
                          @{d.sellerHandle} · closes {d.closingDate} · {fmtP(d.ticketPricePence)}/ticket · retail {fmtP(d.retailValuePence)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {d.status === 'open' && (
                          <>
                            <button onClick={() => handleResolve(d.id, d.title)} disabled={resolving === d.id || cancelling === d.id} style={{
                              padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                              background: T.goldBg, border: `1px solid ${T.gold}`, color: T.gold,
                              fontSize: 12, fontWeight: 700, opacity: (resolving === d.id || cancelling === d.id) ? 0.6 : 1,
                            }}>{resolving === d.id ? 'Resolving…' : 'Resolve now'}</button>
                            <button onClick={() => handleCancel(d.id, d.title)} disabled={resolving === d.id || cancelling === d.id} style={{
                              padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                              background: T.redBg, border: `1px solid ${T.red}`, color: T.red,
                              fontSize: 12, fontWeight: 700, opacity: (resolving === d.id || cancelling === d.id) ? 0.6 : 1,
                            }}>{cancelling === d.id ? 'Cancelling…' : 'Cancel draw'}</button>
                          </>
                        )}
                        <Link href={`/draw/${d.id}`} style={{ color: T.coral, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>View →</Link>
                      </div>
                    </div>

                    <div style={{ height: 4, background: T.bgOverlay, borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: d.status === 'resolved' ? T.gold : d.status === 'cancelled' ? T.red : T.coral }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec }}>
                      <span>{d.soldTickets.toLocaleString()} / {d.totalTickets.toLocaleString()} tickets ({pct}%) — min {d.minTickets?.toLocaleString()}</span>
                      <span style={{ fontWeight: 700, color: T.text }}>Revenue: {fmtP(revenue)}</span>
                    </div>

                    {result && (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12, background: result.startsWith('Error') ? T.redBg : T.goldBg, border: `1px solid ${result.startsWith('Error') ? T.red : T.gold}` }}>
                        <span style={{ color: result.startsWith('Error') ? T.red : T.gold, fontWeight: 700 }}>Result: </span>
                        <span style={{ color: T.text, fontFamily: 'monospace' }}>{result}</span>
                      </div>
                    )}
                    {!result && d.status === 'resolved' && d.winnerId && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: T.goldBg, border: `1px solid ${T.gold}`, borderRadius: 8, fontSize: 12 }}>
                        <span style={{ color: T.gold, fontWeight: 700 }}>Winner: </span>
                        <span style={{ color: T.text, fontFamily: 'monospace' }}>{d.winnerId}</span>
                      </div>
                    )}
                    {!result && d.status === 'cancelled' && d.cancelReason && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: T.redBg, border: `1px solid ${T.red}`, borderRadius: 8, fontSize: 12 }}>
                        <span style={{ color: T.red, fontWeight: 700 }}>Cancelled: </span>
                        <span style={{ color: T.text }}>{d.cancelReason}</span>
                      </div>
                    )}

                    {d.status === 'open' && (
                      <div style={{ marginTop: 10, padding: '10px 12px', background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Register postal entry</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input
                            placeholder="Full name"
                            value={postalForm[d.id]?.name ?? ''}
                            onChange={e => setPostalForm(prev => ({ ...prev, [d.id]: { ...prev[d.id] ?? { name: '', email: '' }, name: e.target.value } }))}
                            style={{ flex: 1, minWidth: 120, padding: '6px 10px', height: 'auto', borderRadius: 6, background: T.bgRaised, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}
                          />
                          <input
                            placeholder="Email address"
                            type="email"
                            value={postalForm[d.id]?.email ?? ''}
                            onChange={e => setPostalForm(prev => ({ ...prev, [d.id]: { ...prev[d.id] ?? { name: '', email: '' }, email: e.target.value } }))}
                            style={{ flex: 1, minWidth: 160, padding: '6px 10px', height: 'auto', borderRadius: 6, background: T.bgRaised, border: `1px solid ${T.border}`, color: T.text, fontSize: 12 }}
                          />
                          <button onClick={() => handleAddPostalEntry(d.id)} disabled={postalAdding === d.id} style={{
                            padding: '6px 14px', borderRadius: 6, background: T.coral, border: 'none',
                            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            opacity: postalAdding === d.id ? 0.6 : 1,
                          }}>
                            {postalAdding === d.id ? 'Adding…' : 'Add'}
                          </button>
                        </div>
                        {postalResult[d.id] && (
                          <p style={{ margin: '6px 0 0', fontSize: 11, color: postalResult[d.id].startsWith('Error') ? T.red : T.green }}>{postalResult[d.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {displayed.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: T.textTert, fontSize: 14 }}>No draws in this category</div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ─────────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div style={{ padding: '16px 16px 0' }}>
            {authToken && <AnalyticsSection authToken={authToken} />}
          </div>
        )}
      </div>
    </AppShell>
  );
}
