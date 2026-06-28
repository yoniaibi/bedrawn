'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'bedrawn_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', flex: '1 1 300px', lineHeight: 1.55 }}>
        We use cookies to keep you signed in and understand how you use DRAWN.
        Read our{' '}
        <Link href="/legal/privacy" style={{ color: 'var(--purple)', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          onClick={reject}
          style={{
            padding: '9px 20px', borderRadius: 999, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--grey)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: '9px 20px', borderRadius: 999, border: 'none',
            background: 'var(--purple)', color: 'var(--white)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Accept cookies
        </button>
      </div>
    </div>
  );
}
