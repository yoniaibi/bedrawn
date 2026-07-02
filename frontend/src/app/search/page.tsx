'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import DrawCard from '@/components/DrawCard';
import { draws as mockDraws } from '@/lib/mockData';
import type { Draw } from '@/lib/mockData';

const trending = ['Chanel', 'Rolex', 'Jordan 1', 'Supreme', 'Bottega', 'MacBook'];
const filterChips = ['All', 'Tonight', 'Bundles', 'High Value', 'Just Listed'];
const categories = [
  { emoji: '👗', label: 'Fashion' },
  { emoji: '👟', label: 'Sneakers' },
  { emoji: '⌚', label: 'Watches' },
  { emoji: '👜', label: 'Bags' },
  { emoji: '💍', label: 'Jewellery' },
  { emoji: '📱', label: 'Tech' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [recent, setRecent] = useState<string[]>(['Cartier', 'Jordan 1']);
  const [results, setResults] = useState<Draw[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/draws?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.draws?.length) {
          setResults(data.draws as Draw[]);
          setSearching(false);
          return;
        }
      }
    } catch {}
    // Fall back to searching mock data locally
    const lower = q.trim().toLowerCase();
    const local = mockDraws.filter(d =>
      d.title.toLowerCase().includes(lower) ||
      d.seller.toLowerCase().includes(lower) ||
      (d.sellerName ?? '').toLowerCase().includes(lower) ||
      d.tags.some(t => t.toLowerCase().includes(lower)) ||
      d.category.toLowerCase().includes(lower)
    );
    setResults(local);
    setSearching(false);
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim() && !recent.includes(q.trim())) {
      setRecent(r => [q.trim(), ...r].slice(0, 5));
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(q), 350);
  };

  const filtered = results.filter(d => {
    if (filter === 'Tonight') return d.isClosingTonight;
    if (filter === 'Bundles') return d.isBundle;
    if (filter === 'High Value') return d.retailValue >= 1000;
    return true;
  });

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Search bar */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search draws, brands, sellers…"
              style={{ paddingLeft: 36, borderRadius: 999 }}
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--grey)', fontSize: 18, cursor: 'pointer' }}
            >✕</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ overflowX: 'auto', padding: '12px 16px' }} className="scrollbar-hide">
          <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
            {filterChips.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                  background: filter === f ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: `1px solid ${filter === f ? 'var(--purple)' : 'var(--border)'}`,
                  color: filter === f ? 'var(--purple)' : 'var(--grey)',
                  fontSize: 13, fontWeight: filter === f ? 600 : 400,
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        {!query ? (
          <div style={{ padding: '0 16px' }}>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--grey)' }}>Recent searches</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {recent.map(r => (
                    <button key={r} onClick={() => setQuery(r)} style={{
                      padding: '6px 14px', borderRadius: 999, background: 'var(--card)',
                      border: '1px solid var(--border)', color: 'var(--white)', fontSize: 13, cursor: 'pointer',
                    }}>{r}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--grey)' }}>Trending</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {trending.map(t => (
                  <button key={t} onClick={() => setQuery(t)} style={{
                    padding: '6px 14px', borderRadius: 999,
                    background: 'rgba(139,92,246,0.1)', border: '1px solid var(--purple)',
                    color: 'var(--purple)', fontSize: 13, cursor: 'pointer',
                  }}>🔥 {t}</button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--grey)' }}>Browse categories</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {categories.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => setQuery(cat.label)}
                    style={{
                      padding: '16px 8px', borderRadius: 12, background: 'var(--card)',
                      border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: 24, margin: '0 0 4px' }}>{cat.emoji}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : searching ? (
          <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--muted)', fontSize: 14 }}>Searching…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 32px' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)', margin: '0 0 4px' }}>No draws matched &quot;{query}&quot;</p>
            <p style={{ fontSize: 13, color: 'var(--grey)' }}>Try a different search</p>
          </div>
        ) : (
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filtered.map(d => <DrawCard key={d.id} draw={d} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
