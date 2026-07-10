'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import { HARM_TRIGGER_PENCE } from '@/config/businessConfig';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function HarmBanner() {
  const [show, setShow] = useState(false);
  const [spend, setSpend] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem('bedrawn_harm_dismissed');
    if (dismissed === currentMonth()) return;

    fetchAuthSession().then(async s => {
      const t = s.tokens?.idToken?.toString();
      if (!t) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/safer-play`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      const monthly: number = d.monthlySpendPence ?? 0;
      if (monthly >= HARM_TRIGGER_PENCE) {
        setSpend(monthly);
        setShow(true);
      }
    }).catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem('bedrawn_harm_dismissed', currentMonth());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      background: 'rgba(124,58,237,0.06)',
      border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 12,
      padding: '12px 16px',
      margin: '0 0 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💜</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          Spending check-in
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          You&apos;ve spent <strong>£{(spend / 100).toFixed(2)}</strong> this month. Take a moment to check your safer play settings if you&apos;d like to set a limit.
        </p>
        <Link href="/account/safer-play" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-lilac)', textDecoration: 'none' }}>
          Safer play settings →
        </Link>
      </div>
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', color: 'var(--text-tertiary)',
        fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0,
      }}>×</button>
    </div>
  );
}
