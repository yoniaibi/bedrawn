'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BottomNav, Sidebar } from './Nav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) router.replace('/');
  }, [isAuthed, router]);

  if (!isAuthed) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar for wide screens */}
      <div style={{ display: 'none' }} className="sidebar-container">
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {children}
      </div>

      {/* Bottom nav for narrow screens */}
      <BottomNav />

      <style>{`
        @media (min-width: 768px) {
          .sidebar-container { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
