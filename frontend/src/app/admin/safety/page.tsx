'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const T = { text: '#1C1917', textSec: '#78716C', textTert: '#A8A29E', bgRaised: '#FFFFFF', bgElevated: '#F5F2ED', border: 'rgba(0,0,0,0.10)', borderSub: 'rgba(0,0,0,0.06)', coral: '#FF2356', gold: '#F59E0B', goldBg: 'rgba(245,158,11,0.10)', green: '#059669', greenBg: 'rgba(5,150,105,0.08)', red: '#DC2626', redBg: 'rgba(220,38,38,0.08)', shadow: '0 1px 3px rgba(0,0,0,0.08)' };

// Safety data comes from the main table scan — fields written by spend-limit / harm-banner events
export default function AdminSafetyPage() {
  const [stats, setStats]     = useState({ spendLimitsSet: 0, suspended: 0, harmBannersThisMonth: 0, creditCapHits: 0 });
  const [note, setNote]       = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [savedNote, setSavedNote]     = useState('');
  const [savedDate, setSavedDate]     = useState('');
  const [token, setToken]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthSession().then(async s => {
      const t = s.tokens?.idToken?.toString() ?? '';
      setToken(t);
      // Fetch safety stats from the admin API
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/safety`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const d = await res.json();
        setStats(d.stats ?? stats);
        setSavedNote(d.monthlyNote?.note ?? '');
        setSavedDate(d.monthlyNote?.date ?? '');
      }
      setLoading(false);
    });
  }, []);

  const saveNote = async () => {
    if (!note.trim()) return;
    setNoteLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/safety/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: note.trim(), date: new Date().toISOString().slice(0, 7) }),
      });
      setSavedNote(note.trim());
      setSavedDate(new Date().toISOString().slice(0, 7));
      setNote('');
    } finally { setNoteLoading(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Safety — DCMS Compliance</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: T.textSec }}>Aggregate harm monitoring · monthly compliance record · no individual purchase drill-down</p>

      {/* Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Spend limits set',    value: stats.spendLimitsSet,       color: T.gold },
          { label: 'Accounts suspended',  value: stats.suspended,            color: stats.suspended > 0 ? T.red : T.text },
          { label: 'Harm banners (MTD)',  value: stats.harmBannersThisMonth,  color: stats.harmBannersThisMonth > 0 ? T.gold : T.text },
          { label: 'Credit cap hits (MTD)', value: stats.creditCapHits,      color: stats.creditCapHits > 0 ? T.gold : T.text },
        ].map(k => (
          <div key={k.label} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: T.shadow }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: k.color, fontFamily: 'Georgia, serif' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Harm banner note */}
      <div style={{ padding: '14px 16px', background: T.redBg, border: `1px solid ${T.red}`, borderRadius: 12, marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.5 }}>
          <strong>Data minimisation:</strong> This screen shows aggregate monitoring only. Individual purchase histories are not accessible here — individual review happens only via support tickets, per the DCMS accountability pillar.
        </p>
      </div>

      {/* Monthly compliance note */}
      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Monthly compliance note</p>
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 20px', boxShadow: T.shadow }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>
          The DCMS Code requires written evidence that harm monitoring occurred each month. Record your review here — this note is saved with date and cannot be deleted.
        </p>
        {savedNote && (
          <div style={{ padding: '10px 12px', background: T.bgElevated, borderRadius: 8, marginBottom: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: T.textTert, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last saved — {savedDate}</p>
            <p style={{ margin: 0, fontSize: 13, color: T.text }}>{savedNote}</p>
          </div>
        )}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={`e.g. ${new Date().toISOString().slice(0, 7)} — Reviewed harm indicators. ${stats.harmBannersThisMonth} harm banners shown this month. No accounts suspended. No escalation required.`}
          rows={4}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
        />
        <button onClick={saveNote} disabled={!note.trim() || noteLoading} style={{ marginTop: 8, padding: '7px 18px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (!note.trim() || noteLoading) ? 0.6 : 1 }}>
          {noteLoading ? 'Saving…' : 'Save compliance note'}
        </button>
      </div>
    </div>
  );
}
