'use client';

export default function LiveDot({ size = 8 }: { size?: number }) {
  return (
    <span
      className="animate-pulse-dot inline-block rounded-full"
      style={{ width: size, height: size, background: 'var(--pink)', flexShrink: 0 }}
    />
  );
}
