'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BottomNav, Sidebar } from './Nav';

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
          <p className="serif" style={{ fontSize: 32, color: 'var(--gold)', margin: '0 0 16px' }}>DRAWN</p>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--purple)', borderRadius: '50%', margin: '0 auto', animation: 'spin-slow 0.8s linear infinite' }} />
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
