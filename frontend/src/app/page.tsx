'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';
import { recentWinners } from '@/lib/mockData';

const heroItems = ['#1a1a2e', '#8B1A1A', '#0a2744', '#2D1B4E', '#B8860B', '#111111'];

export default function LandingPage() {
  const { isAuthed } = useAuth();
  const router = useRouter();
  const [winnerIdx, setWinnerIdx] = useState(0);

  useEffect(() => {
    if (isAuthed) router.replace('/home');
  }, [isAuthed, router]);

  useEffect(() => {
    const id = setInterval(() => setWinnerIdx(i => (i + 1) % recentWinners.length), 4000);
    return () => clearInterval(id);
  }, []);

  const w = recentWinners[winnerIdx];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430 }}>
        {/* Header */}
        <div style={{ padding: '48px 24px 24px', textAlign: 'center' }}>
          <p className="serif" style={{ fontSize: 48, color: 'var(--gold)', margin: 0, letterSpacing: 2 }}>DRAWN</p>
          <p style={{ fontSize: 18, color: 'var(--white)', margin: '8px 0 0', fontWeight: 300 }}>
            Win designer things for pennies.
          </p>
          <p style={{ fontSize: 14, color: 'var(--grey)', margin: '4px 0 0' }}>
            Real luxury. Verified sellers. Every night at 9pm.
          </p>
        </div>

        {/* Countdown pill */}
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            border: '1px solid var(--pink)', borderRadius: 999,
            padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <LiveDot />
            <span style={{ fontSize: 13, color: 'var(--pink)', fontWeight: 600 }}>Closes tonight</span>
            <CountdownTimer className="font-bold" />
          </div>
        </div>

        {/* Hero grid */}
        <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
          {heroItems.map((color, i) => (
            <div key={i} style={{ height: 100, borderRadius: 12, background: color, border: '1px solid var(--border)' }} />
          ))}
        </div>

        {/* Winner carousel */}
        <div style={{ margin: '0 24px 24px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', padding: '14px 16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Recent winner 🏆</p>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--white)', fontWeight: 600 }}>{w.handle}</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)' }}>
            {w.item} · paid {w.paid}p · won{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>£{w.value.toLocaleString()}</span>
          </p>
        </div>

        {/* How it works */}
        <div style={{ padding: '0 24px 32px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--white)', margin: '0 0 16px' }}>How it works</p>
          {[
            { n: 1, title: 'Browse luxury draws', desc: 'Find high-value items from verified sellers.' },
            { n: 2, title: 'Buy tickets for pennies', desc: 'As little as 10p per ticket.' },
            { n: 3, title: 'Win at 9pm tonight', desc: 'Live draw every single night.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(139,92,246,0.2)', border: '1px solid var(--purple)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 14 }}>{step.n}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--white)', fontSize: 14 }}>{step.title}</p>
                <p style={{ margin: 0, color: 'var(--grey)', fontSize: 13 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: 16, borderRadius: 999,
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700,
            }}>
              Get started — it&apos;s free
            </button>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <span style={{ color: 'var(--grey)', fontSize: 14 }}>
              Already have an account?{' '}
              <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Log in</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
