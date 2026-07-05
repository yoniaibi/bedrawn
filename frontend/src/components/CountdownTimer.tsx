'use client';

import { useEffect, useState } from 'react';

/**
 * closingDate: YYYY-MM-DD (UK date). Counts down to 21:00 UTC on that date.
 * When not provided, falls back to the next 21:00 UTC.
 */
function getSecondsUntilClose(closingDate?: string): number {
  const now = Date.now();
  let target: Date;
  if (closingDate) {
    target = new Date(`${closingDate}T21:00:00Z`);
  } else {
    target = new Date();
    target.setUTCHours(21, 0, 0, 0);
    if (target.getTime() <= now) target.setUTCDate(target.getUTCDate() + 1);
  }
  return Math.max(0, Math.floor((target.getTime() - now) / 1000));
}

export default function CountdownTimer({
  closingDate,
  className = '',
  style,
}: {
  closingDate?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [secs, setSecs] = useState(() => getSecondsUntilClose(closingDate));

  useEffect(() => {
    const id = setInterval(() => setSecs(getSecondsUntilClose(closingDate)), 1000);
    return () => clearInterval(id);
  }, [closingDate]);

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
