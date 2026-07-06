'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import CountdownTimer from '@/components/CountdownTimer';
import type { Draw } from '@/lib/mockData';

interface Particle { id: number; x: number; color: string; delay: number; duration: number }

function SuccessContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const qty = parseInt(searchParams.get('qty') ?? '1');
  const total = parseInt(searchParams.get('total') ?? '0');
  const [draw, setDraw] = useState<Draw | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) return;
    const segments = window.location.pathname.split('/').filter(Boolean);
    const realId = segments[1] || id;
    fetch(`${url}/draws/${realId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.draw) setDraw(data.draw as Draw); })
      .catch(() => {});
  }, []); // empty deps — reads real URL at mount

  useEffect(() => {
    const colors = ['#8B5CF6', '#FF2356', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i, x: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 0.5, duration: 1.5 + Math.random() * 1,
    })));
  }, []);

  if (!draw) return null;

  const odds = Math.max(1, Math.round(draw.totalTickets / qty));
  const totalDisplay = total >= 100 ? `£${(total / 100).toFixed(2)}` : `${total}p`;

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: `${p.x}%`, top: -20,
              width: 8, height: 8, borderRadius: '50%', background: p.color,
              animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            }} />
          ))}
        </div>
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 }}>✓</span>
          </div>
          <div>
            <p className="serif" style={{ fontSize: 36, color: 'var(--text)', margin: '0 0 8px' }}>You&apos;re in!</p>
            <p style={{ fontSize: 16, color: 'var(--grey)', margin: 0 }}>Your tickets are confirmed</p>
          </div>
          <div style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', textAlign: 'left' }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{draw.title}</p>
            {[
              { label: 'Tickets', value: `${qty} ticket${qty !== 1 ? 's' : ''}` },
              { label: 'Total paid', value: totalDisplay },
              { label: 'Your odds', value: `1 in ${odds}`, highlight: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--grey)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.highlight ? 'var(--gold)' : 'var(--text)' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', background: 'rgba(255,35,86,0.1)', border: '1px solid var(--pink)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: 1 }}>Draw starts in</p>
            <CountdownTimer className="text-3xl font-bold" />
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--grey)' }}>Tonight at 9pm</p>
          </div>
          <Link href="/live" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{ width: '100%', padding: 16, borderRadius: 999, background: 'linear-gradient(135deg, var(--purple), var(--pink))', border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700 }}>
              Watch live at 9pm →
            </button>
          </Link>
          <Link href="/home" style={{ color: 'var(--grey)', fontSize: 14, textDecoration: 'none' }}>Browse more draws</Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function SuccessClient({ id }: { id: string }) {
  return (
    <Suspense fallback={null}>
      <SuccessContent id={id} />
    </Suspense>
  );
}
