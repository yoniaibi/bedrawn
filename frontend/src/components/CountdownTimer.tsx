'use client';

import { useEffect, useState } from 'react';

function getSecondsTo9pm() {
  const now = new Date();
  const target = new Date();
  target.setHours(21, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

export default function CountdownTimer({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const [secs, setSecs] = useState(getSecondsTo9pm);

  useEffect(() => {
    const id = setInterval(() => setSecs(getSecondsTo9pm()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className={`serif ${className}`} style={{ color: 'var(--white)', ...style }}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
