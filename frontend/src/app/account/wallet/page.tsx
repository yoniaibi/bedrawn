'use client';

import '@/lib/amplify';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { fetchAuthSession } from 'aws-amplify/auth';
import AppShell from '@/components/AppShell';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

const topUps = [500, 1000, 2000, 5000];

const topUpLabel = (pence: number) => `£${(pence / 100).toFixed(0)} to spend on tickets`;

const stripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#8B5CF6',
    colorBackground: '#1E1A2E',
    colorText: '#F5F3FF',
    colorDanger: '#EF4444',
    borderRadius: '10px',
    fontFamily: 'system-ui, sans-serif',
  },
};

async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

function CheckoutForm({ amountPence, onSuccess, onCancel }: {
  amountPence: number;
  onSuccess: (amount: number) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/wallet`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message ?? 'Payment failed');
      setLoading(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      onSuccess(amountPence);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)' }}>
          Adding <strong style={{ color: 'var(--text)' }}>£{(amountPence / 100).toFixed(2)}</strong> to your wallet
        </p>
        <PaymentElement />
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 16px' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%', padding: 16, borderRadius: 999, border: 'none',
          background: !stripe || loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
          color: 'var(--white)', fontSize: 16, fontWeight: 700,
          cursor: !stripe || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing…' : `Pay £${(amountPence / 100).toFixed(2)}`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={{ background: 'none', border: 'none', color: 'var(--grey)', fontSize: 14, cursor: 'pointer' }}
      >
        Cancel
      </button>
    </form>
  );
}

type Transaction = { SK: string; type: string; description: string; amountPence: number; createdAt: string };

export default function WalletPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balancePence, setBalancePence] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchBalance = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const [balRes, txRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/balance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (balRes.ok) {
        const data = await balRes.json();
        setBalancePence(data.balancePence ?? 0);
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions((data.transactions ?? []) as Transaction[]);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const startTopUp = useCallback(async (amount: number) => {
    setLoadingAmount(amount);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amountPence: amount }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const { clientSecret: cs } = await res.json();
      setClientSecret(cs);
      setSelectedAmount(amount);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start top-up');
    } finally {
      setLoadingAmount(null);
    }
  }, []);

  const handleSuccess = (amount: number) => {
    setSuccess(amount);
    setClientSecret(null);
    setSelectedAmount(null);
    // Poll for balance update — payment webhook may take a moment
    setTimeout(() => fetchBalance(), 2000);
    setTimeout(() => fetchBalance(), 6000);
  };

  const handleCancel = () => {
    setClientSecret(null);
    setSelectedAmount(null);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>My Wallet</p>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Available balance</p>
            <p className="serif" style={{ margin: 0, fontSize: 52, color: 'var(--text)', fontWeight: 700 }}>
              {balancePence === null ? '—' : `£${(balancePence / 100).toFixed(2)}`}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>Balance updates after payment confirms</p>
          </div>

          {/* Success confirmation */}
          {success !== null && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)',
              borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: 'var(--green)' }}>✓</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
                £{(success / 100).toFixed(2)} added — balance will update shortly
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>
            </div>
          )}

          {/* Payment form or top-up grid */}
          {clientSecret && selectedAmount ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <CheckoutForm
                amountPence={selectedAmount}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Top up</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {topUps.map(amount => (
                  <button
                    key={amount}
                    onClick={() => startTopUp(amount)}
                    disabled={loadingAmount !== null}
                    style={{
                      padding: '18px', borderRadius: 14,
                      background: 'var(--card)', border: '1px solid var(--border)',
                      cursor: loadingAmount !== null ? 'not-allowed' : 'pointer', textAlign: 'center',
                      opacity: loadingAmount !== null && loadingAmount !== amount ? 0.5 : 1,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <p className="serif" style={{ margin: 0, fontSize: 28, color: 'var(--text)', fontWeight: 700 }}>
                      £{amount / 100}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>
                      {loadingAmount === amount ? 'Loading…' : topUpLabel(amount)}
                    </p>
                  </button>
                ))}
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                Minimum top-up £5 · Powered by Stripe
              </p>
            </div>
          )}

          {/* Transaction history */}
          {transactions.length > 0 && (
            <div>
              <p style={{ margin: '8px 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Transaction history</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transactions.map(tx => (
                  <div key={tx.SK} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tx.description}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: tx.amountPence >= 0 ? 'var(--green)' : 'var(--text)' }}>
                      {tx.amountPence >= 0 ? '+' : ''}£{(Math.abs(tx.amountPence) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
