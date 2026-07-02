'use client';

import '@/lib/amplify';
import Logo from '@/components/Logo';
import { useState } from 'react';
import Link from 'next/link';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'confirm' | 'done'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword({ username: email });
      setStep('confirm');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) return;
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code or code expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo width={140} />
        </Link>

        {step === 'done' ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Password updated!</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 32px', lineHeight: 1.5 }}>
              You can now log in with your new password.
            </p>
            <Link href="/login" style={{
              display: 'block', padding: '14px 0', borderRadius: 999,
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontWeight: 700, textDecoration: 'none', fontSize: 16,
            }}>
              Log in now
            </Link>
          </>
        ) : step === 'confirm' ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Check your email</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>
            <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Verification code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  style={{ letterSpacing: 6, textAlign: 'center', fontSize: 20 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || code.length < 6 || !newPassword}
                style={{
                  width: '100%', padding: 16, borderRadius: 999,
                  background: loading || code.length < 6 || !newPassword ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
                  border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700,
                  cursor: loading || code.length < 6 || !newPassword ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Updating…' : 'Set new password'}
              </button>
              <button
                type="button"
                onClick={() => { setError(''); setStep('email'); }}
                style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: 13, cursor: 'pointer' }}
              >
                ← Use a different email
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Forgot password?</p>
            <p style={{ color: 'var(--grey)', fontSize: 14, margin: '0 0 32px' }}>Enter your email and we&apos;ll send a reset code</p>
            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}
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
                {loading ? 'Sending…' : 'Send reset code'}
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
