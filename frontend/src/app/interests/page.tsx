'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const interests = [
  { id: 'fashion',     label: 'Fashion' },
  { id: 'watches',     label: 'Watches' },
  { id: 'luxury',      label: 'Luxury' },
  { id: 'streetwear',  label: 'Streetwear' },
  { id: 'vintage',     label: 'Vintage' },
  { id: 'bags',        label: 'Bags' },
  { id: 'trainers',    label: 'Trainers' },
  { id: 'jewellery',   label: 'Jewellery' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'tech',        label: 'Tech' },
];

export default function InterestsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const { login } = useAuth();
  const router = useRouter();

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleContinue = () => {
    login();
    router.push('/home');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ticket.svg" alt="BeDrawn" style={{ height: 48, width: 'auto' }} />
        </Link>

        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', margin: '0 0 8px' }}>What are you into?</p>
        <p style={{ textAlign: 'center', color: 'var(--grey)', fontSize: 14, margin: '0 0 32px' }}>
          Choose your interests to personalise your feed
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          {interests.map(item => {
            const active = selected.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
                  background: active ? 'var(--purple-light)' : 'var(--card)',
                  border: `2px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
                  color: active ? 'var(--purple)' : 'var(--grey)',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          style={{
            width: '100%', padding: 16, borderRadius: 999,
            background: 'linear-gradient(135deg, var(--purple), var(--pink))',
            border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700,
            marginBottom: 12, cursor: 'pointer',
          }}
        >
          {selected.length > 0 ? `Continue with ${selected.length} interest${selected.length !== 1 ? 's' : ''}` : 'Continue'}
        </button>
        <button
          onClick={handleContinue}
          style={{ width: '100%', padding: 12, borderRadius: 999, background: 'transparent', border: 'none', color: 'var(--grey)', fontSize: 14, cursor: 'pointer' }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
