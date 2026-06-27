'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmSignUp, signIn, resendSignUpCode } from 'aws-amplify/auth';
import { useAuth } from '@/lib/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? sessionStorage.getItem('drawn_pending_email') ?? '';
  const router = useRouter();
  const { login } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleDigit = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const fullCode = code.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: fullCode });

      // Auto sign-in using stored credentials
      const storedPw = sessionStorage.getItem('drawn_pending_pw');
      if (storedPw) {
        try {
          await signIn({ username: email, password: storedPw });
          sessionStorage.removeItem('drawn_pending_pw');
          sessionStorage.removeItem('drawn_pending_email');
          login();
          router.push('/interests');
          return;
        } catch {
          // signIn failed — send to login with success message
        }
      }
      // Fallback: redirect to login
      router.push('/login?verified=true');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendSignUpCode({ username: email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend code.';
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <p className="serif" style={{ fontSize: 32, color: 'var(--gold)', margin: '0 0 32px' }}>DRAWN</p>
        </Link>

        <p style={{ fontSize: 36, margin: '0 0 16px' }}>📬</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', margin: '0 0 8px' }}>Check your email</p>
        <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 8px', lineHeight: 1.5 }}>
          We sent a 6-digit verification code to
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', margin: '0 0 32px' }}>
          {email}
        </p>

        <form onSubmit={handleSubmit}>
          {/* 6-digit code inputs */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700,
                  borderRadius: 10, padding: 0,
                  border: `2px solid ${digit ? 'var(--purple)' : 'var(--border)'}`,
                  background: 'var(--card)', color: 'var(--white)',
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          {resent && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ color: 'var(--green)', fontSize: 13, margin: 0 }}>✓ New code sent — check your inbox</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || fullCode.length !== 6}
            style={{
              width: '100%', padding: 16, borderRadius: 999, border: 'none',
              background: loading || fullCode.length !== 6
                ? 'var(--muted)'
                : 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: 'var(--white)', fontSize: 16, fontWeight: 700,
              cursor: loading || fullCode.length !== 6 ? 'not-allowed' : 'pointer',
              marginBottom: 16,
            }}
          >
            {loading ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 8px' }}>
          Didn&apos;t receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>

        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Wrong email?{' '}
          <Link href="/signup" style={{ color: 'var(--grey)', textDecoration: 'none' }}>Go back</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
