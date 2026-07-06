'use client';

import '@/lib/amplify';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from 'aws-amplify/auth';

const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function SignupPage() {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!handle.trim()) e.handle = 'Username is required';
    else if (!HANDLE_RE.test(handle)) e.handle = '3–20 characters, letters, numbers or underscores only';
    if (!email.includes('@')) e.email = 'Enter a valid email address';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!agreed) e.agreed = 'You must accept the Terms of Service';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      });
      sessionStorage.setItem('drawn_pending_email', email);
      sessionStorage.setItem('drawn_pending_handle', handle);
      sessionStorage.setItem('drawn_pending_name', name);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrors({ submit: message });
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ticket.svg" alt="BeDrawn" style={{ height: 48, width: 'auto' }} />
        </Link>
        <p style={{ textAlign: 'center', color: 'var(--grey)', fontSize: 15, margin: '0 0 32px' }}>Create your account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            {errors.name && <p style={{ color: 'var(--red)', fontSize: 12, margin: '4px 0 0' }}>{errors.name}</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', fontSize: 14, fontWeight: 700, pointerEvents: 'none' }}>@</span>
              <input
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourname"
                style={{ paddingLeft: 28 }}
              />
            </div>
            {errors.handle && <p style={{ color: 'var(--red)', fontSize: 12, margin: '4px 0 0' }}>{errors.handle}</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            {errors.email && <p style={{ color: 'var(--red)', fontSize: 12, margin: '4px 0 0' }}>{errors.email}</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
            {errors.password && <p style={{ color: 'var(--red)', fontSize: 12, margin: '4px 0 0' }}>{errors.password}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <button
              type="button"
              onClick={() => setAgreed(a => !a)}
              style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                background: agreed ? 'var(--purple)' : 'transparent',
                border: `2px solid ${agreed ? 'var(--purple)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {agreed && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
            </button>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.4 }}>
              I agree to BeDrawn&apos;s{' '}
              <Link href="/legal/terms" style={{ color: 'var(--purple)', textDecoration: 'none' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/legal/privacy" style={{ color: 'var(--purple)', textDecoration: 'none' }}>Privacy Policy</Link>
            </p>
          </div>
          {errors.agreed && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{errors.agreed}</p>}

          {errors.submit && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 16, borderRadius: 999,
              background: loading ? 'var(--muted)' : 'linear-gradient(135deg, var(--purple), var(--pink))',
              border: 'none', color: 'var(--white)', fontSize: 16, fontWeight: 700,
              marginTop: 8, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--grey)', fontSize: 14, marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
