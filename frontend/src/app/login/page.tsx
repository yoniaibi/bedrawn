'use client';

import '@/lib/amplify';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'aws-amplify/auth';
import { useAuth } from '@/lib/auth';

function LoginContent() {
  const searchParams = useSearchParams();
  const justVerified = searchParams.get('verified') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });

      if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        // Account exists but email not verified
        sessionStorage.setItem('drawn_pending_email', email);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (isSignedIn) {
        login();
        router.push('/home');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ticket.svg" alt="bedrawn" style={{ height: 48, width: 'auto' }} />
        </Link>

        {justVerified && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Email verified — log in to continue</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--grey)' }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--purple)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 16, borderRadius: 999,
              background: loading ? 'var(--muted)' : 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
              border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700,
              marginTop: 8, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--grey)', fontSize: 14, marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
