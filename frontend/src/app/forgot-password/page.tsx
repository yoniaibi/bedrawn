'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <p className="serif" style={{ fontSize: 32, color: 'var(--gold)', margin: '0 0 32px' }}>DRAWN</p>
        </Link>

        {sent ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>Check your email</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 32px' }}>
              We sent a reset link to <strong style={{ color: 'var(--white)' }}>{email}</strong>
            </p>
            <Link href="/login" style={{ color: 'var(--purple)', fontSize: 14, textDecoration: 'none' }}>← Back to login</Link>
          </>
        ) : (
          <>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>Forgot password?</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 32px' }}>Enter your email and we&apos;ll send a reset link</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%', padding: 16, borderRadius: 999,
                  background: !email || loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
                  border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700,
                  cursor: !email || loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p style={{ marginTop: 24, color: 'var(--grey)', fontSize: 14 }}>
              <Link href="/login" style={{ color: 'var(--purple)', textDecoration: 'none' }}>← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
