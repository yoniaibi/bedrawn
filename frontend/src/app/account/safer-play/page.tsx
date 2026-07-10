'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';

const LIMIT_OPTIONS = [
  { label: 'No limit', value: null },
  { label: '£5 / month', value: 500 },
  { label: '£10 / month', value: 1000 },
  { label: '£20 / month', value: 2000 },
  { label: '£50 / month', value: 5000 },
  { label: '£100 / month', value: 10000 },
  { label: '£0 — pause all spending', value: 0 },
];

const BREAK_OPTIONS = [
  { label: '6 months', months: 6 },
  { label: '9 months', months: 9 },
  { label: '12 months', months: 12 },
  { label: '24 months', months: 24 },
  { label: 'Permanently', months: -1 },
];

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SaferPlayPage() {
  const [spendLimitPence, setSpendLimitPence] = useState<number | null>(null);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const [monthlySpendPence, setMonthlySpendPence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [pendingLimit, setPendingLimit] = useState<number | null | 'custom'>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showBreakConfirm, setShowBreakConfirm] = useState<number | null>(null);
  const [breakDone, setBreakDone] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    fetchAuthSession().then(async s => {
      const t = s.tokens?.idToken?.toString() ?? '';
      setToken(t);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/safer-play`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const d = await res.json();
        setSpendLimitPence(d.spendLimitPence ?? null);
        setSuspendedUntil(d.suspendedUntil ?? null);
        setMonthlySpendPence(d.monthlySpendPence ?? 0);
      }
      setLoading(false);
    });
  }, []);

  const saveLimit = async (pence: number | null) => {
    setSaving(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/safer-play`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ spendLimitPence: pence }),
    });
    setSpendLimitPence(pence);
    setSaving(false);
    setShowLimitModal(false);
  };

  const confirmBreak = async (months: number) => {
    setSaving(true);
    const until = months === -1 ? '9999-12-31T00:00:00.000Z' : addMonths(new Date(), months).toISOString();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/safer-play`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ suspendedUntil: until }),
    });
    setSuspendedUntil(until);
    setSaving(false);
    setShowBreakConfirm(null);
    setBreakDone(true);
  };

  if (loading) return <AppShell><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading…</div></AppShell>;

  if (breakDone) return (
    <AppShell>
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Your break has started</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Your account is paused{suspendedUntil && suspendedUntil !== '9999-12-31T00:00:00.000Z' ? ` until ${fmtDate(new Date(suspendedUntil))}` : ' permanently'}. All marketing has been suppressed.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 16 }}>If you need support, visit <a href="/safer-play" style={{ color: 'var(--accent-lilac)' }}>our Safer Play page</a>.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/account" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Safer Play</h1>
        </div>

        {/* Monthly spend limit */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Monthly spend limit</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                {spendLimitPence === null ? 'No limit set' : spendLimitPence === 0 ? '£0 — spending paused' : `£${(spendLimitPence / 100).toFixed(0)} per month`}
              </p>
            </div>
            <button onClick={() => setShowLimitModal(true)} style={{ padding: '7px 14px', borderRadius: 999, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Change</button>
          </div>
        </div>

        {/* This month's spend */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '16px 20px', marginBottom: 12 }}>
          <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>This month&apos;s spend</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
            £{(monthlySpendPence / 100).toFixed(2)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>Top-ups this calendar month</p>
        </div>

        {/* Take a break */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '16px 20px', marginBottom: 12 }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Take a break</p>
          {suspendedUntil ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--success)' }}>
              Your account is paused until {suspendedUntil === '9999-12-31T00:00:00.000Z' ? 'permanently' : fmtDate(new Date(suspendedUntil))}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BREAK_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setShowBreakConfirm(opt.months)}
                  style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{opt.label}</span>
                  {opt.months > 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Returns {fmtDate(addMonths(new Date(), opt.months))}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Get support */}
        <Link href="/safer-play" style={{ display: 'block', padding: '14px 20px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 14, textDecoration: 'none', color: 'var(--accent-lilac)', fontSize: 14, fontWeight: 600 }}>
          Get support — GamCare, BeGambleAware & more →
        </Link>

        {/* Limit modal */}
        {showLimitModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }} onClick={() => setShowLimitModal(false)}>
            <div style={{ width: '100%', maxWidth: 480, background: 'var(--bg-raised)', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Set monthly spend limit</p>
              {LIMIT_OPTIONS.map(opt => (
                <button key={opt.label} onClick={() => saveLimit(opt.value)} disabled={saving} style={{ display: 'block', width: '100%', padding: '12px 16px', marginBottom: 8, borderRadius: 10, background: spendLimitPence === opt.value ? 'rgba(124,58,237,0.08)' : 'var(--bg-elevated)', border: `1px solid ${spendLimitPence === opt.value ? 'var(--accent-lilac)' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  {opt.label}
                </button>
              ))}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Custom amount (£)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" min={1} value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="e.g. 75" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-default)', fontSize: 14 }} />
                  <button onClick={() => customAmount && saveLimit(Math.round(parseFloat(customAmount) * 100))} disabled={!customAmount || saving} style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--accent-pink)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Set</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Break confirm modal */}
        {showBreakConfirm !== null && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-raised)', borderRadius: 20, padding: 24 }}>
              <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Start your break?</p>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your account will be suspended immediately{showBreakConfirm > 0 ? ` until ${fmtDate(addMonths(new Date(), showBreakConfirm))}` : ' permanently'}. This cannot be reversed early.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowBreakConfirm(null)} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => confirmBreak(showBreakConfirm)} disabled={saving} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Starting…' : 'Start break'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
