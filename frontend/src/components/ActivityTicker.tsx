'use client';

import { useEffect, useState } from 'react';

export default function ActivityTicker({ messages }: { messages: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      style={{
        background: 'var(--card2)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 16px',
        transition: 'opacity 0.4s',
        opacity: visible ? 1 : 0,
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--grey)', margin: 0 }}>
        ⚡ {messages[idx]}
      </p>
    </div>
  );
}
