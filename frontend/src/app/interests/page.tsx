'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const interests = [
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'watches', label: 'Watches', emoji: '⌚' },
  { id: 'luxury', label: 'Luxury', emoji: '💎' },
  { id: 'streetwear', label: 'Streetwear', emoji: '🧢' },
  { id: 'vintage', label: 'Vintage', emoji: '🕰' },
  { id: 'bags', label: 'Bags', emoji: '👜' },
  { id: 'trainers', label: 'Trainers', emoji: '👟' },
  { id: 'jewellery', label: 'Jewellery', emoji: '💍' },
  { id: 'accessories', label: 'Accessories', emoji: '🎀' },
  { id: 'tech', label: 'Tech', emoji: '📱' },
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
        <p className="serif" style={{ fontSize: 32, color: 'var(--gold)', textAlign: 'center', margin: '0 0 8px' }}>DRAWN</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', textAlign: 'center', margin: '0 0 8px' }}>What are you into?</p>
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
                  padding: '10px 18px', borderRadius: 999, cursor: 'pointer',
                  background: active ? 'rgba(139,92,246,0.2)' : 'var(--card)',
                  border: `2px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
                  color: active ? 'var(--purple)' : 'var(--white)',
                  fontSize: 14, fontWeight: active ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
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
            marginBottom: 12,
          }}
        >
          {selected.length > 0 ? `Continue with ${selected.length} interest${selected.length !== 1 ? 's' : ''}` : 'Continue'}
        </button>
        <button
          onClick={handleContinue}
          style={{ width: '100%', padding: 12, borderRadius: 999, background: 'transparent', border: 'none', color: 'var(--grey)', fontSize: 14 }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
