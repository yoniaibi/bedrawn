'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const T = { text: '#1C1917', textSec: '#78716C', textTert: '#A8A29E', bgRaised: '#FFFFFF', bgElevated: '#F5F2ED', bgOverlay: '#EDE8E1', border: 'rgba(0,0,0,0.10)', borderSub: 'rgba(0,0,0,0.06)', coral: '#FF2356', coralBg: 'rgba(255,35,86,0.08)', gold: '#F59E0B', goldBg: 'rgba(245,158,11,0.10)', green: '#059669', greenBg: 'rgba(5,150,105,0.08)', red: '#DC2626', redBg: 'rgba(220,38,38,0.08)', shadow: '0 1px 3px rgba(0,0,0,0.08)' };

export default function AdminSellersPage() {
  const [sellers, setSellers]  = useState<any[]>([]);
  const [repeatPct, setRepeatPct] = useState(0);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    fetchAuthSession().then(async s => {
      const t = s.tokens?.idToken?.toString() ?? '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/sellers`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) { const d = await res.json(); setSellers(d.sellers ?? []); setRepeatPct(d.sellerRepeatPct ?? 0); }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Sellers — Supply Health</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: T.textSec }}>Seller repeat rate · listing funnel · flag review</p>

      {/* Headline KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Seller repeat rate', value: `${repeatPct.toFixed(1)}%`, sub: 'target ≥50% (healthy)', color: repeatPct >= 50 ? T.green : repeatPct >= 20 ? T.gold : T.red },
          { label: 'Total sellers',  value: sellers.length.toString(),          sub: 'unique sellers' },
          { label: 'Repeat listers', value: sellers.filter(s => s.repeatLister).length.toString(), sub: '2+ listings' },
          { label: 'Total listings', value: sellers.reduce((sum, s) => sum + s.listings, 0).toString(), sub: 'across all draws' },
        ].map(k => (
          <div key={k.label} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadow }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: k.color ?? T.text, fontFamily: 'Georgia, serif' }}>{k.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textTert }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {sellers.length === 0 ? (
        <div style={{ padding: '40px 24px', background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, textAlign: 'center' }}>
          <p style={{ color: T.textSec, fontSize: 13 }}>No seller data yet. Add manual cohorts with seller IDs in <a href="/admin/entry" style={{ color: T.coral }}>Manual Entry</a>.</p>
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Seller table</p>
          <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` }}>
                  {['Seller ID', 'Listings', 'Resolved', 'Repeat?', 'Avg fill %'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sellers.map((s, i) => (
                  <tr key={s.sellerId} style={{ borderBottom: i < sellers.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: T.textSec }}>{s.sellerId}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: T.text }}>{s.listings}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: T.green, fontWeight: 600 }}>{s.resolvedDraws}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, textTransform: 'uppercase', background: s.repeatLister ? T.greenBg : T.bgElevated, color: s.repeatLister ? T.green : T.textTert }}>{s.repeatLister ? 'Yes' : 'No'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: s.avgFillPct != null ? (s.avgFillPct >= 70 ? T.green : s.avgFillPct >= 40 ? T.gold : T.red) : T.textTert, fontWeight: 600 }}>
                      {s.avgFillPct != null ? `${s.avgFillPct}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
