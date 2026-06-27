'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BottomNav, Sidebar } from './Nav';
import Logo from './Logo';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthed) router.replace('/');
  }, [isAuthed, authLoading, router]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Logo width={160} />
          <div style={{ width: 28, height: 28, border: '2.5px solid var(--border)', borderTopColor: 'var(--purple)', borderRadius: '50%', margin: '20px auto 0', animation: 'spin-slow 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: 'none' }} className="sidebar-container">
        <Sidebar />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {children}
      </div>
      <BottomNav />
      <style>{`
        @media (min-width: 768px) {
          .sidebar-container { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
