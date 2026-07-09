'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

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

const BRANDS = ['chanel', 'lv', 'bottega', 'prada', 'celine'];

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
      {sub && <p style={{ margin: '-3px 0 5px', fontSize: 11, color: T.textTert }}>{sub}</p>}
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, height: 'auto',
  border: `1px solid ${T.border}`, background: T.bgRaised, color: T.text, fontSize: 13,
  fontFamily: 'inherit', boxSizing: 'border-box',
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: T.shadow, marginBottom: 20 }}>
      <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 700, color: T.coral, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</p>
      {children}
    </div>
  );
}

// ─── New draw form ────────────────────────────────────────────────────────────
function NewDrawForm({ token, onCreated }: { token: string; onCreated: (id: string, label: string) => void }) {
  const [f, setF] = useState({ label: '', brandId: 'chanel', retailValuePence: '', ticketPricePence: '', totalTickets: '', thresholdTickets: '', listedAt: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.label || !f.totalTickets || !f.thresholdTickets || !f.ticketPricePence) { setResult('Error: fill all required fields'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...f,
          retailValuePence:  Math.round(parseFloat(f.retailValuePence  || '0') * 100),
          ticketPricePence:  Math.round(parseFloat(f.ticketPricePence  || '0') * 100),
          totalTickets:      parseInt(f.totalTickets),
          thresholdTickets:  parseInt(f.thresholdTickets),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(`Error: ${data.error}`); return; }
      setResult(`Created — ID: ${data.cohortId}`);
      onCreated(data.cohortId, f.label);
      setF({ label: '', brandId: 'chanel', retailValuePence: '', ticketPricePence: '', totalTickets: '', thresholdTickets: '', listedAt: new Date().toISOString().slice(0, 10) });
    } finally { setSaving(false); }
  };

  return (
    <Card title="New draw cohort">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Label *" sub="e.g. Draw #4 — Chanel Classic Flap">
            <input style={inp} value={f.label} onChange={set('label')} placeholder="Draw #4 — Chanel Classic Flap" />
          </Field>
        </div>
        <Field label="Brand *">
          <select style={inp} value={f.brandId} onChange={set('brandId')}>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Listed date *">
          <input style={inp} type="date" value={f.listedAt} onChange={set('listedAt')} />
        </Field>
        <Field label="Retail value £" sub="RRP of the item">
          <input style={inp} type="number" step="0.01" value={f.retailValuePence} onChange={set('retailValuePence')} placeholder="4800" />
        </Field>
        <Field label="Ticket price £ *">
          <input style={inp} type="number" step="0.01" value={f.ticketPricePence} onChange={set('ticketPricePence')} placeholder="1.00" />
        </Field>
        <Field label="Total tickets *" sub="Max capacity">
          <input style={inp} type="number" value={f.totalTickets} onChange={set('totalTickets')} placeholder="1850" />
        </Field>
        <Field label="Threshold tickets *" sub="Minimum to proceed">
          <input style={inp} type="number" value={f.thresholdTickets} onChange={set('thresholdTickets')} placeholder="462" />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Creating…' : 'Create draw'}
        </button>
        {result && <span style={{ fontSize: 12, color: result.startsWith('Error') ? T.red : T.green }}>{result}</span>}
      </div>
    </Card>
  );
}

// ─── Daily snapshot form ──────────────────────────────────────────────────────
function DailySnapshotForm({ token, cohorts }: { token: string; cohorts: Array<{ cohortId: string; label: string }> }) {
  const [f, setF] = useState({ cohortId: '', date: new Date().toISOString().slice(0, 10), ticketsSold: '', uniqueVisitors: '', newBuyerCount: '', shareLinkVisits: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.cohortId) { setResult('Error: select a draw'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts/${f.cohortId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date:           f.date,
          ticketsSold:    parseInt(f.ticketsSold    || '0'),
          uniqueVisitors: parseInt(f.uniqueVisitors || '0'),
          newBuyerCount:  parseInt(f.newBuyerCount  || '0'),
          shareLinkVisits:parseInt(f.shareLinkVisits|| '0'),
          notes: f.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(`Error: ${data.error}`); return; }
      setResult(`Snapshot saved for ${f.date}`);
      setF(p => ({ ...p, ticketsSold: '', uniqueVisitors: '', newBuyerCount: '', shareLinkVisits: '', notes: '' }));
    } finally { setSaving(false); }
  };

  return (
    <Card title="Daily snapshot">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Draw *">
            <select style={inp} value={f.cohortId} onChange={set('cohortId')}>
              <option value="">Select a draw…</option>
              {cohorts.map(c => <option key={c.cohortId} value={c.cohortId}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Date *">
          <input style={inp} type="date" value={f.date} onChange={set('date')} />
        </Field>
        <Field label="Tickets sold (cumulative)">
          <input style={inp} type="number" value={f.ticketsSold} onChange={set('ticketsSold')} placeholder="247" />
        </Field>
        <Field label="Unique visitors" sub="Stripe link / Linktree / IG insights">
          <input style={inp} type="number" value={f.uniqueVisitors} onChange={set('uniqueVisitors')} placeholder="1840" />
        </Field>
        <Field label="New buyer count">
          <input style={inp} type="number" value={f.newBuyerCount} onChange={set('newBuyerCount')} placeholder="12" />
        </Field>
        <Field label="Share link visits">
          <input style={inp} type="number" value={f.shareLinkVisits} onChange={set('shareLinkVisits')} placeholder="34" />
        </Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Notes">
            <textarea style={{ ...inp, height: 'auto', resize: 'vertical', padding: '8px 12px' }} rows={2} value={f.notes} onChange={set('notes')} placeholder="e.g. Spike from IG story at 6pm, winner reshared" />
          </Field>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save snapshot'}
        </button>
        {result && <span style={{ fontSize: 12, color: result.startsWith('Error') ? T.red : T.green }}>{result}</span>}
      </div>
    </Card>
  );
}

// ─── Resolution form ──────────────────────────────────────────────────────────
function ResolutionForm({ token, cohorts }: { token: string; cohorts: Array<{ cohortId: string; label: string; locked?: boolean }> }) {
  const [f, setF] = useState({ cohortId: '', status: 'resolved', closedAt: new Date().toISOString().slice(0, 10), buyers: '', newBuyers: '', repeatBuyers: '', winnerShared: 'false', grossRevenue: '', authCost: '', processingCost: '', shippingCost: '', opsMinutes: '', amend: false });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.cohortId) { setResult('Error: select a draw'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts/${f.cohortId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status:         f.status,
          closedAt:       f.closedAt,
          buyers:         parseInt(f.buyers         || '0'),
          newBuyers:      parseInt(f.newBuyers       || '0'),
          repeatBuyers:   parseInt(f.repeatBuyers    || '0'),
          winnerShared:   f.winnerShared === 'true',
          grossRevenue:   Math.round(parseFloat(f.grossRevenue    || '0') * 100),
          authCost:       Math.round(parseFloat(f.authCost        || '0') * 100),
          processingCost: Math.round(parseFloat(f.processingCost  || '0') * 100),
          shippingCost:   Math.round(parseFloat(f.shippingCost    || '0') * 100),
          opsMinutes:     parseInt(f.opsMinutes      || '0'),
          amend:          f.amend,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(`Error: ${data.error}`); return; }
      setResult('Cohort resolved and locked.');
    } finally { setSaving(false); }
  };

  const selectedCohort = cohorts.find(c => c.cohortId === f.cohortId);

  return (
    <Card title="Resolve draw">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Draw *">
            <select style={inp} value={f.cohortId} onChange={set('cohortId')}>
              <option value="">Select a draw…</option>
              {cohorts.map(c => <option key={c.cohortId} value={c.cohortId}>{c.label}{c.locked ? ' (locked)' : ''}</option>)}
            </select>
          </Field>
        </div>

        {selectedCohort?.locked && (
          <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: T.goldBg, border: `1px solid ${T.gold}`, borderRadius: 8, marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 12, color: T.gold }}>
              <strong>Locked.</strong> Check "Amend" below to override — this logs an audit record.
            </p>
          </div>
        )}

        <Field label="Outcome *">
          <select style={inp} value={f.status} onChange={set('status')}>
            <option value="resolved">Resolved — winner drawn</option>
            <option value="cancelled">Cancelled — refunded</option>
            <option value="rolled">Rolled over</option>
          </select>
        </Field>
        <Field label="Close date *">
          <input style={inp} type="date" value={f.closedAt} onChange={set('closedAt')} />
        </Field>
        <Field label="Buyers (unique)">
          <input style={inp} type="number" value={f.buyers} onChange={set('buyers')} placeholder="37" />
        </Field>
        <Field label="New buyers (first ever)">
          <input style={inp} type="number" value={f.newBuyers} onChange={set('newBuyers')} placeholder="14" />
        </Field>
        <Field label="Repeat buyers">
          <input style={inp} type="number" value={f.repeatBuyers} onChange={set('repeatBuyers')} placeholder="23" />
        </Field>
        <Field label="Winner shared?">
          <select style={inp} value={f.winnerShared} onChange={set('winnerShared')}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </Field>
        <Field label="Gross revenue £" sub="Total ticket sales">
          <input style={inp} type="number" step="0.01" value={f.grossRevenue} onChange={set('grossRevenue')} placeholder="1245.00" />
        </Field>
        <Field label="Auth cost £" sub="LegitApp / authentication fee">
          <input style={inp} type="number" step="0.01" value={f.authCost} onChange={set('authCost')} placeholder="15.00" />
        </Field>
        <Field label="Processing cost £" sub="Stripe fees">
          <input style={inp} type="number" step="0.01" value={f.processingCost} onChange={set('processingCost')} placeholder="42.00" />
        </Field>
        <Field label="Shipping cost £">
          <input style={inp} type="number" step="0.01" value={f.shippingCost} onChange={set('shippingCost')} placeholder="12.00" />
        </Field>
        <Field label="Ops time (minutes)" sub="Founder time at £25/h">
          <input style={inp} type="number" value={f.opsMinutes} onChange={set('opsMinutes')} placeholder="90" />
        </Field>

        {selectedCohort?.locked && (
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.textSec, cursor: 'pointer' }}>
              <input type="checkbox" checked={f.amend} onChange={e => setF(p => ({ ...p, amend: e.target.checked }))} />
              Amend locked cohort (logs audit record)
            </label>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Resolve & lock'}
        </button>
        {result && <span style={{ fontSize: 12, color: result.startsWith('Error') ? T.red : T.green }}>{result}</span>}
      </div>
    </Card>
  );
}

// ─── Buyer log ────────────────────────────────────────────────────────────────
function BuyerLogForm({ token, cohorts }: { token: string; cohorts: Array<{ cohortId: string; label: string }> }) {
  const [cohortId, setCohortId] = useState('');
  const [emailsRaw, setEmailsRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');

  const submit = async () => {
    if (!cohortId || !emailsRaw.trim()) { setResult('Error: select a draw and paste emails'); return; }
    const emails = emailsRaw.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
    if (!emails.length) { setResult('Error: no valid email addresses found'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts/${cohortId}/buyers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(`Error: ${data.error}`); return; }
      setResult(`Processed ${data.processed} buyer${data.processed !== 1 ? 's' : ''}. Emails are hashed — raw data not stored.`);
      setEmailsRaw('');
    } finally { setSaving(false); }
  };

  return (
    <Card title="Buyer log — repeat-rate tracking">
      <p style={{ margin: '0 0 14px', fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>
        Paste buyer emails from Stripe. They are hashed (SHA-256) immediately and the originals are never stored. Cross-draw repeat rates are computed from the hashes only.
      </p>
      <Field label="Draw *">
        <select style={inp} value={cohortId} onChange={e => setCohortId(e.target.value)}>
          <option value="">Select a draw…</option>
          {cohorts.map(c => <option key={c.cohortId} value={c.cohortId}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Buyer emails" sub="One per line, or comma/semicolon separated">
        <textarea
          style={{ ...inp, height: 'auto', resize: 'vertical', padding: '8px 12px' }}
          rows={6}
          value={emailsRaw}
          onChange={e => setEmailsRaw(e.target.value)}
          placeholder={'alice@example.com\nbob@example.com\n...'}
        />
      </Field>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', borderRadius: 9999, background: T.coral, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Processing…' : 'Hash & store'}
        </button>
        {result && <span style={{ fontSize: 12, color: result.startsWith('Error') ? T.red : T.green, maxWidth: 420 }}>{result}</span>}
      </div>
    </Card>
  );
}

// ─── Main entry page ──────────────────────────────────────────────────────────
export default function AdminEntryPage() {
  const [token, setToken]   = useState('');
  const [cohorts, setCohorts] = useState<Array<{ cohortId: string; label: string; locked?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<'draw' | 'snapshot' | 'resolve' | 'buyers'>('draw');

  useEffect(() => {
    fetchAuthSession().then(async session => {
      const t = session.tokens?.idToken?.toString() ?? '';
      setToken(t);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cohorts`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setCohorts((data.cohorts ?? []).map((c: any) => ({ cohortId: c.cohortId, label: c.label, locked: c.locked })));
      }
      setLoading(false);
    });
  }, []);

  const handleCreated = (id: string, label: string) => {
    setCohorts(prev => [{ cohortId: id, label }, ...prev]);
    setActiveForm('snapshot');
  };

  const TABS = [
    { key: 'draw',     label: 'New draw'       },
    { key: 'snapshot', label: 'Daily snapshot'  },
    { key: 'resolve',  label: 'Resolve draw'    },
    { key: 'buyers',   label: 'Buyer log'       },
  ] as const;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textTert, fontSize: 14 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.01em' }}>Manual Entry</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: T.textSec }}>Mode A — Wizard of Oz phase. Enter draw data manually to track the seven Lean metrics from day one.</p>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveForm(tab.key)} style={{
            padding: '7px 16px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit', background: activeForm === tab.key ? T.coralBg : T.bgRaised,
            border: `1.5px solid ${activeForm === tab.key ? 'rgba(255,35,86,0.25)' : T.border}`,
            color: activeForm === tab.key ? T.coral : T.textSec,
          }}>{tab.label}</button>
        ))}
      </div>

      {activeForm === 'draw'     && <NewDrawForm     token={token} onCreated={handleCreated} />}
      {activeForm === 'snapshot' && <DailySnapshotForm token={token} cohorts={cohorts} />}
      {activeForm === 'resolve'  && <ResolutionForm  token={token} cohorts={cohorts} />}
      {activeForm === 'buyers'   && <BuyerLogForm    token={token} cohorts={cohorts} />}
    </div>
  );
}
