'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { TopNav, BottomNav } from './Nav';
import Logo from './Logo';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthed) router.replace('/');
  }, [isAuthed, authLoading, router]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <Logo width={140} bg="var(--white)" />
          <div style={{
            width: 24, height: 24,
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent-coral)',
            borderRadius: '50%',
            margin: '20px auto 0',
            animation: 'spin-slow 0.8s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TopNav />
      <main style={{ paddingTop: 60, paddingBottom: 96, maxWidth: 960, margin: '0 auto' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
