'use client';

import { useRef, useEffect, useCallback } from 'react';

export interface WheelEntry {
  handle: string;
  tickets: number;
  color: string;
  isYou?: boolean;
}

interface PrizeWheelProps {
  entries: WheelEntry[];
  size?: number;
  rotation: number;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

export default function PrizeWheel({ entries, size = 300, rotation }: PrizeWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const total = entries.reduce((s, e) => s + e.tickets, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = Math.round(r * 0.27);

  let cumAngle = 0;
  const segments = entries.map(entry => {
    const angle = total > 0 ? (entry.tickets / total) * 360 : 360 / entries.length;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { entry, startAngle, angle };
  });

  return (
    <div style={{ position: 'relative', display: 'inline-block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.45))' }}>
      {/* Gold pointer at top */}
      <div style={{
        position: 'absolute',
        top: -4,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '9px solid transparent',
        borderRight: '9px solid transparent',
        borderTop: '22px solid #F59E0B',
        zIndex: 10,
        filter: 'drop-shadow(0 2px 6px rgba(245,158,11,0.7))',
      }} />

      <svg
        ref={svgRef}
        width={size}
        height={size}
        style={{ transform: `rotate(${rotation}deg)`, display: 'block', willChange: 'transform' }}
      >
        <defs>
          {segments.map(({ entry }, i) => (
            <radialGradient key={i} id={`seg-grad-${i}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor={lighten(entry.color, 40)} stopOpacity="1" />
              <stop offset="100%" stopColor={entry.color} stopOpacity="1" />
            </radialGradient>
          ))}
          <filter id="inner-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="hub-grad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2D2540" />
            <stop offset="100%" stopColor="#0D0B14" />
          </radialGradient>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 5} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Segments */}
        {segments.map(({ entry, startAngle, angle }, i) => {
          const start = polarToXY(cx, cy, r, startAngle);
          const end = polarToXY(cx, cy, r, startAngle + angle);
          const largeArc = angle > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;

          const midAngle = startAngle + angle / 2;
          const labelR = r * 0.62;
          const label = polarToXY(cx, cy, labelR, midAngle);
          const tickR = r * 0.82;
          const tick = polarToXY(cx, cy, tickR, midAngle);
          const showText = angle > 14;
          const showHandle = angle > 22;

          return (
            <g key={i}>
              <path
                d={d}
                fill={entry.isYou ? `url(#seg-grad-${i})` : `url(#seg-grad-${i})`}
                stroke="rgba(13,11,20,0.6)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Scallop tick at rim for each segment */}
              <circle
                cx={tick.x}
                cy={tick.y}
                r={3}
                fill="rgba(255,255,255,0.25)"
              />
              {showHandle && (
                <text
                  x={label.x}
                  y={label.y - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={entry.isYou ? '#FFFFFF' : 'rgba(255,255,255,0.92)'}
                  fontSize={Math.min(10, angle * 0.28 + 7)}
                  fontWeight={entry.isYou ? '800' : '600'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                  transform={`rotate(${midAngle - 90}, ${label.x}, ${label.y - 5})`}
                >
                  {entry.handle.length > 8 ? entry.handle.slice(0, 8) : entry.handle}
                </text>
              )}
              {showText && (
                <text
                  x={label.x}
                  y={label.y + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.65)"
                  fontSize={Math.min(8, angle * 0.2 + 6)}
                  fontWeight="500"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                  transform={`rotate(${midAngle - 90}, ${label.x}, ${label.y + 9})`}
                >
                  {entry.tickets}🎟
                </text>
              )}
            </g>
          );
        })}

        {/* Hub shadow ring */}
        <circle cx={cx} cy={cy} r={innerR + 6} fill="rgba(0,0,0,0.4)" />

        {/* Hub glass */}
        <circle cx={cx} cy={cy} r={innerR + 3} fill="url(#hub-grad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        {/* Hub highlight */}
        <circle cx={cx - innerR * 0.25} cy={cy - innerR * 0.25} r={innerR * 0.35} fill="rgba(255,255,255,0.05)" />

        {/* Hub text */}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9" fontWeight="800" letterSpacing="2.5" style={{ userSelect: 'none' }}>
          DRAWN
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" style={{ userSelect: 'none' }}>
          ◆
        </text>
      </svg>
    </div>
  );
}

export function usePrizeWheelSpin(entries: WheelEntry[]) {
  const rotationRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef<(r: number) => void>(() => {});
  const doneRef = useRef<(winner: WheelEntry) => void>(() => {});

  const setOnFrame = useCallback((cb: (r: number) => void) => { callbackRef.current = cb; }, []);
  const setOnDone = useCallback((cb: (w: WheelEntry) => void) => { doneRef.current = cb; }, []);

  const spin = useCallback(() => {
    if (rafRef.current) return;

    const total = entries.reduce((s, e) => s + e.tickets, 0);
    let roll = Math.random() * total;
    let pickedIdx = entries.length - 1;
    let cum = 0;
    for (let i = 0; i < entries.length; i++) {
      cum += entries[i].tickets;
      if (roll < cum) { pickedIdx = i; break; }
    }

    // Compute cumulative angles
    let runAngle = 0;
    const segAngles = entries.map(e => {
      const start = runAngle;
      const a = (e.tickets / total) * 360;
      runAngle += a;
      return { start, angle: a };
    });

    const seg = segAngles[pickedIdx];
    const midAngle = seg.start + seg.angle / 2;

    // We want the midAngle segment to land under the pointer (top = 0°).
    // The pointer sits at 0°. After rotate(R), a point at angle A from top appears at A-R from pointer.
    // We want: midAngle - targetRotation ≡ 0 (mod 360)
    // => targetRotation = currentRot + (5 full turns) + adjustment
    const currentRot = rotationRef.current % 360;
    const extra = 1800 + ((360 - midAngle - currentRot % 360 + 360) % 360);
    const targetRot = rotationRef.current + extra;

    const startRot = rotationRef.current;
    const startTime = performance.now();
    const duration = 4200;

    const animate = (now: number) => {
      const elapsed = Math.min(now - startTime, duration);
      const t = elapsed / duration;
      // Ease out quint
      const eased = 1 - Math.pow(1 - t, 5);
      const current = startRot + (targetRot - startRot) * eased;
      rotationRef.current = current;
      callbackRef.current(current);

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = targetRot;
        rafRef.current = undefined;
        doneRef.current(entries[pickedIdx]);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [entries]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return { spin, setOnFrame, setOnDone };
}
