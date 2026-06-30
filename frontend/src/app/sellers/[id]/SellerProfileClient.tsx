'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import type { Draw } from '@/lib/mockData';

interface SellerProfile {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string;
  memberSince: string | null;
  completedDraws: number;
  totalValueGiven: number;
}

function AvatarCircle({ name, avatarUrl, size = 80 }: { name: string; avatarUrl: string; size?: number }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(0,0,0,0.06)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent-coral)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.42, fontWeight: 700, color: '#fff' }}>{initial}</span>
    </div>
  );
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return 'Early member';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function SellerProfileClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    if (!API) { setLoading(false); return; }

    Promise.all([
      fetch(`${API}/sellers/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/sellers/${id}/draws`).then(r => r.ok ? r.json() : null),
    ]).then(([profileData, drawsData]) => {
      if (!profileData) { setNotFound(true); return; }
      setProfile(profileData);
      if (drawsData?.draws) setDraws(drawsData.draws as Draw[]);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, API]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--text-secondary)' }}>
          Loading…
        </div>
      </AppShell>
    );
  }

  if (notFound || !profile) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <p style={{ color: 'var(--text)', fontSize: 16, margin: '0 0 12px' }}>Seller not found</p>
          <Link href="/home" style={{ color: 'var(--accent-coral)', fontSize: 14 }}>← Back to draws</Link>
        </div>
      </AppShell>
    );
  }

  const displayName = profile.name || `@${profile.handle}`;

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* Back */}
        <div style={{ paddingTop: 24, paddingBottom: 8 }}>
          <Link href="/home" style={{
            color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            ← All draws
          </Link>
        </div>

        {/* Profile header card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 18,
          padding: '28px 24px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <AvatarCircle name={displayName} avatarUrl={profile.avatarUrl} size={72} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                margin: '0 0 2px',
                fontSize: 20, fontWeight: 700,
                color: 'var(--text)',
              }}>
                {displayName}
              </h1>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>
                @{profile.handle}
              </p>
              {profile.bio && (
                <p style={{
                  margin: '0 0 12px', fontSize: 14,
                  color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  {profile.bio}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>
                Member since {formatMemberSince(profile.memberSince)}
              </p>
            </div>
          </div>

          {/* Stats row */}
          {(profile.completedDraws > 0 || profile.totalValueGiven > 0) && (
            <div style={{
              display: 'flex', gap: 0,
              marginTop: 20, paddingTop: 18,
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                  {profile.completedDraws}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  draws completed
                </div>
              </div>
              <div style={{
                width: 1, background: 'rgba(0,0,0,0.06)', margin: '0 8px',
              }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-gold)' }}>
                  £{profile.totalValueGiven.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  total value given away
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active draws */}
        <div style={{ marginBottom: 12 }}>
          <h2 style={{
            margin: '0 0 14px',
            fontSize: 15, fontWeight: 700, color: 'var(--text)',
          }}>
            {draws.length > 0
              ? `Active draws (${draws.length})`
              : 'No active draws right now'}
          </h2>

          {draws.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {draws.map(draw => (
                <DrawCard key={draw.id} draw={draw} />
              ))}
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 14,
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                {profile.name || `@${profile.handle}`} hasn't listed any draws yet.
              </p>
              {profile.completedDraws > 0 && (
                <p style={{ margin: '8px 0 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  They've completed {profile.completedDraws} draw{profile.completedDraws !== 1 ? 's' : ''} in the past.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
