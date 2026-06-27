'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  percent: number;
  height?: number;
}

export default function ProgressBar({ percent, height = 4 }: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const t = setTimeout(() => setWidth(percent), 50);
      return () => clearTimeout(t);
    }
  }, [percent]);

  const fill = percent >= 85 ? 'var(--red)' : 'var(--purple)';

  return (
    <div style={{ background: 'var(--border)', borderRadius: 999, height, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          background: fill,
          borderRadius: 999,
          transition: 'width 0.8s ease',
        }}
      />
    </div>
  );
}
