'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { currentUser, walletTransactions } from '@/lib/mockData';

const topUps = [500, 1000, 2000, 5000];

export default function WalletPage() {
  const [balance, setBalance] = useState(currentUser.balancePence);
  const [added, setAdded] = useState<number | null>(null);

  const handleTopUp = (amount: number) => {
    setBalance(b => b + amount);
    setAdded(amount);
    setTimeout(() => setAdded(null), 2000);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>My Wallet</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Balance */}
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Available balance</p>
            <p className="serif" style={{ margin: 0, fontSize: 52, color: 'var(--white)', fontWeight: 700 }}>
              £{(balance / 100).toFixed(2)}
            </p>
          </div>

          {/* Added confirmation */}
          {added !== null && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)',
              borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              animation: 'fade-in-up 0.3s ease-out',
            }}>
              <span>✓</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
                £{(added / 100).toFixed(2)} added to your wallet
              </span>
            </div>
          )}

          {/* Top-up grid */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>Top up</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {topUps.map(amount => (
                <button
                  key={amount}
                  onClick={() => handleTopUp(amount)}
                  style={{
                    padding: '18px', borderRadius: 14,
                    background: 'var(--card)', border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <p className="serif" style={{ margin: 0, fontSize: 28, color: 'var(--white)', fontWeight: 700 }}>£{amount / 100}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{amount} tickets at 1p</p>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>Transaction history</p>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {walletTransactions.map((tx, i) => (
                <div key={tx.id} style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < walletTransactions.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 20 }}>{tx.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{tx.description}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{tx.date}</p>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: tx.type === 'credit' ? 'var(--green)' : 'var(--red)',
                  }}>
                    {tx.type === 'credit' ? '+' : ''}£{Math.abs(tx.amount) / 100}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
