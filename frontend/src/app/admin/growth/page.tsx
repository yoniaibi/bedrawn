'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const T = { text: '#1C1917', textSec: '#78716C', textTert: '#A8A29E', bgRaised: '#FFFFFF', bgElevated: '#F5F2ED', border: 'rgba(0,0,0,0.10)', borderSub: 'rgba(0,0,0,0.06)', coral: '#FF2356', coralBg: 'rgba(255,35,86,0.08)', gold: '#F59E0B', green: '#059669', red: '#DC2626', shadow: '0 1px 3px rgba(0,0,0,0.08)' };

export default function AdminGrowthPage() {
  const [drawId, setDrawId] = useState('');
  const [refHandle, setRefHandle] = useState('');
  const [link, setLink] = useState('');
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthSession().then(async s => {
      const t = s.tokens?.idToken?.toString() ?? '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) { const d = await res.json(); setCohorts(d.cohorts ?? []); }
      setLoading(false);
    });
  }, []);

  const generateLink = () => {
    if (!drawId || !refHandle) return;
    const slug = refHandle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setLink(`https://www.bedrawn.app/draw/${drawId}?ref=influencer:${slug}`);
  };

  // Compute source breakdown from cohorts
  const totalBuyers      = cohorts.reduce((s, c) => s + (c.buyers ?? 0), 0);
  const shareNewBuyers   = cohorts.reduce((s, c) => s + (c.buyersFromShares ?? 0), 0);
  const vc               = totalBuyers > 0 ? (shareNewBuyers / totalBuyers).toFixed(2) : '—';
  const winnerSharedCount = cohorts.filter(c => c.winnerShared).length;
  const resolved         = cohorts.filter(c => c.status === 'resolved');

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Growth — Viral Engine</h1>
      <p style={{ margin: '0 0 28px', fontSize: 13, color: T.textSec }}>Source attribution · winner share funnel · referral link generator</p>

      {/* Viral coefficient headline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Viral coefficient', value: vc, sub: 'target ≥0.5 (healthy)' },
          { label: 'Winners who shared', value: resolved.length > 0 ? `${Math.round(winnerSharedCount / resolved.length * 100)}%` : '—', sub: `${winnerSharedCount}/${resolved.length} winners` },
          { label: 'Buyers from shares', value: shareNewBuyers.toString(), sub: 'across all draws' },
          { label: 'Total buyers', value: totalBuyers.toString(), sub: 'unique across draws' },
        ].map(k => (
          <div key={k.label} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadow }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text, fontFamily: 'Georgia, serif' }}>{k.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textTert }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Winner share funnel */}
      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Winner share funnel</p>
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 28 }}>
        {[
          { step: 'Draws resolved',    n: resolved.length,    pct: null },
          { step: 'Winners who shared', n: winnerSharedCount, pct: resolved.length > 0 ? Math.round(winnerSharedCount / resolved.length * 100) : null },
          { step: 'Share link visits',  n: cohorts.reduce((s, c) => s + (c.shareLinkVisits ?? 0), 0), pct: winnerSharedCount > 0 ? null : null },
          { step: 'Buyers from shares', n: shareNewBuyers,   pct: totalBuyers > 0 ? Math.round(shareNewBuyers / totalBuyers * 100) : null },
        ].map((row, i, arr) => (
          <div key={row.step} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.coralBg, color: T.coral, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 12 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 13, color: T.text }}>{row.step}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.text, marginRight: row.pct != null ? 12 : 0 }}>{row.n}</span>
            {row.pct != null && <span style={{ fontSize: 12, color: T.textSec }}>({row.pct}%)</span>}
          </div>
        ))}
      </div>

      {/* Per-draw source attribution */}
      {cohorts.length > 0 && (
        <>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Per-draw source data</p>
          <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bgElevated, borderBottom: `1px solid ${T.borderSub}` }}>
                  {['Draw', 'Buyers', 'From shares', 'VC', 'Winner shared'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c, i) => {
                  const cVC = c.buyers > 0 ? (c.buyersFromShares / c.buyers).toFixed(2) : '—';
                  return (
                    <tr key={c.cohortId} style={{ borderBottom: i < cohorts.length - 1 ? `1px solid ${T.borderSub}` : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: T.text }}>{c.label}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: T.textSec }}>{c.buyers}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: T.textSec }}>{c.buyersFromShares ?? 0}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: parseFloat(cVC) >= 0.5 ? T.green : parseFloat(cVC) >= 0.2 ? T.gold : T.red }}>{cVC}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: c.winnerShared ? T.green : T.textTert }}>{c.winnerShared ? 'Yes ✓' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Referral link generator */}
      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Referral link generator</p>
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 20px', boxShadow: T.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Draw</label>
            <select value={drawId} onChange={e => setDrawId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgRaised, color: T.text, fontSize: 13, fontFamily: 'inherit', height: 'auto' }}>
              <option value="">Select draw…</option>
              {cohorts.map(c => <option key={c.cohortId} value={c.drawId ?? c.cohortId}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Influencer handle</label>
            <input value={refHandle} onChange={e => setRefHandle(e.target.value)} placeholder="e.g. lydia" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgRaised, color: T.text, fontSize: 13, height: 'auto', boxSizing: 'border-box' }} />
          </div>
          <button onClick={generateLink} style={{ padding: '8px 16px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Generate</button>
        </div>
        {link && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bgElevated, borderRadius: 8, padding: '10px 12px' }}>
            <code style={{ flex: 1, fontSize: 12, color: T.text, wordBreak: 'break-all' }}>{link}</code>
            <button onClick={() => navigator.clipboard.writeText(link)} style={{ padding: '5px 12px', borderRadius: 8, background: T.bgRaised, border: `1px solid ${T.border}`, color: T.textSec, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>Copy</button>
          </div>
        )}
      </div>
    </div>
  );
}
