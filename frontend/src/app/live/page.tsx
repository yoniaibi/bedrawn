'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import LiveDot from '@/components/LiveDot';
import CountdownTimer from '@/components/CountdownTimer';
import ProgressBar from '@/components/ProgressBar';
import PrizeWheel, { usePrizeWheelSpin } from '@/components/PrizeWheel';
import type { WheelEntry } from '@/components/PrizeWheel';
import type { Draw } from '@/lib/mockData';

// ─── Demo participants ────────────────────────────────────────────────────────
const DEMO_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#FF2356', '#06B6D4', '#F97316'];
const DEMO_BASE: WheelEntry[] = [
  { handle: '@sarah_j',    tickets: 3,  color: '#8B5CF6' },
  { handle: '@marcus_t',   tickets: 7,  color: '#3B82F6' },
  { handle: '@collector',  tickets: 12, color: '#10B981' },
  { handle: '@luxe_fan',   tickets: 2,  color: '#F59E0B' },
  { handle: '@fashionista',tickets: 4,  color: '#FF2356' },
  { handle: '@streetwear', tickets: 2,  color: '#06B6D4' },
  { handle: '@watchman99', tickets: 5,  color: '#F97316' },
];

const CHAT_INIT = [
  { id: '1', handle: '@sarah_j',    color: '#8B5CF6', text: 'Fingers crossed tonight 🤞' },
  { id: '2', handle: '@marcus_t',   color: '#3B82F6', text: 'That bag is INSANE value' },
  { id: '3', handle: '@collector',  color: '#10B981', text: 'Got my 12 tickets in 👌' },
  { id: '4', handle: '@luxe_fan',   color: '#F59E0B', text: 'First time entering, nervous!' },
  { id: '5', handle: '@fashionista',color: '#FF2356', text: 'GOOD LUCK EVERYONE 🎉' },
  { id: '6', handle: '@streetwear', color: '#06B6D4', text: 'Still got 45 mins to buy 🏃' },
  { id: '7', handle: '@watchman99', color: '#F97316', text: 'The wheel spin is so satisfying' },
];

const EMOJIS = ['🔥', '❤️', '😍', '🏆', '💜', '🎉'];

export default function LivePage() {
  // ── Wheel state ─────────────────────────────────────────────────────────────
  const [yourTickets, setYourTickets] = useState(5);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelEntry | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState(CHAT_INIT);
  const [chatInput, setChatInput] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const emojiCounterRef = useRef(0);
  const chatRef = useRef<HTMLDivElement>(null);

  // ── Live draws ──────────────────────────────────────────────────────────────
  const [tonightDraws, setTonightDraws] = useState<Draw[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) return;
    fetch(`${url}/draws`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const all: Draw[] = data?.draws ?? [];
        setTonightDraws(all.filter(d => d.isClosingTonight));
      })
      .catch(() => {});
  }, []);

  // ── Build entries with YOU ──────────────────────────────────────────────────
  const entries: WheelEntry[] = [
    ...DEMO_BASE,
    ...(yourTickets > 0 ? [{ handle: 'YOU', tickets: yourTickets, color: '#FF2356', isYou: true }] : []),
  ];
  const total = entries.reduce((s, e) => s + e.tickets, 0);
  const yourShare = yourTickets > 0 ? (yourTickets / total) * 100 : 0;
  const oddsIn = yourTickets > 0 ? Math.round(total / yourTickets) : 0;

  // ── Wheel spin hook ─────────────────────────────────────────────────────────
  const { spin, setOnFrame, setOnDone } = usePrizeWheelSpin(entries);

  useEffect(() => {
    setOnFrame(r => setRotation(r));
  }, [setOnFrame]);

  useEffect(() => {
    setOnDone(w => {
      setSpinning(false);
      setWinner(w);
      setShowWinner(true);
      setTimeout(() => setShowWinner(false), 4000);
    });
  }, [setOnDone]);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);
    setShowWinner(false);
    spin();
  }, [spinning, spin]);

  // ── Chat helpers ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      id: String(Date.now()), handle: '@you',
      color: '#FF2356', text: chatInput.trim(),
    }]);
    setChatInput('');
  };

  const floatEmoji = (emoji: string) => {
    const id = emojiCounterRef.current++;
    setFloatingEmojis(prev => [...prev, { id, emoji, x: 10 + Math.random() * 80 }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 1200);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Live header bar ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #0D0B14 0%, #1A1030 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <LiveDot />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
            LIVE · The 9pm Draw
          </p>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>247 watching</span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#FF2356', display: 'inline-block',
              animation: 'livepulse 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* ── Arena section (dark) ────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(180deg, #0D0B14 0%, #110E1C 60%, #15112A 100%)',
          padding: '32px 20px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Ambient glow blobs */}
          <div style={{
            position: 'absolute', top: -60, left: '20%',
            width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: -40, right: '15%',
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,35,86,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Countdown pill */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 999,
              padding: '8px 20px',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draw in</span>
              <CountdownTimer style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em' }} />
            </div>
          </div>

          {/* Prize wheel */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, position: 'relative' }}>
            <PrizeWheel entries={entries} size={300} rotation={rotation} />

            {/* Winner reveal overlay */}
            {showWinner && winner && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
                animation: 'modalEnter 0.3s ease-out',
              }}>
                <div style={{
                  background: 'rgba(13,11,20,0.88)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `2px solid ${winner.color}`,
                  borderRadius: 20, padding: '16px 32px',
                  textAlign: 'center',
                  boxShadow: `0 0 40px ${winner.color}55`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>🎉</div>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Winner</p>
                  <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{winner.handle}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: winner.color }}>{winner.tickets} ticket{winner.tickets !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </div>

          {/* Spin button */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <button
              onClick={handleSpin}
              disabled={spinning}
              style={{
                padding: '12px 40px', borderRadius: 999,
                background: spinning
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #FF2356, #8B5CF6)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF', fontSize: 14, fontWeight: 700,
                cursor: spinning ? 'not-allowed' : 'pointer',
                letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                transition: 'all 250ms ease-out',
                boxShadow: spinning ? 'none' : '0 4px 20px rgba(255,35,86,0.35)',
              }}
            >
              {spinning ? 'Spinning…' : '✦ Spin Demo'}
            </button>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
              Simulated draw · results are random
            </p>
          </div>

          {/* ── Odds showcase ───────────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '20px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
              Your odds · live preview
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>
              Move the slider to see how more tickets grow your slice
            </p>

            {/* Slider row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>Your tickets</span>
              <input
                type="range"
                min={0}
                max={30}
                value={yourTickets}
                onChange={e => setYourTickets(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#FF2356',
                  height: 4,
                  cursor: 'pointer',
                }}
              />
              <div style={{
                minWidth: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,35,86,0.20)',
                border: '1px solid rgba(255,35,86,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FF2356' }}>{yourTickets}</span>
              </div>
            </div>

            {/* Your odds callout */}
            {yourTickets > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,35,86,0.12), rgba(139,92,246,0.08))',
                border: '1px solid rgba(255,35,86,0.20)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Your chance</p>
                  <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                    1 in {oddsIn}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Slice</p>
                  <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#FF2356' }}>
                    {yourShare.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Participant bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[...DEMO_BASE, ...(yourTickets > 0 ? [{ handle: 'YOU', tickets: yourTickets, color: '#FF2356', isYou: true }] : [])]
                .sort((a, b) => b.tickets - a.tickets)
                .map((entry, i) => {
                  const share = (entry.tickets / total) * 100;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 84, fontSize: 11, fontWeight: entry.isYou ? 700 : 400,
                        color: entry.isYou ? '#FF2356' : 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        flexShrink: 0,
                      }}>
                        {entry.handle}
                      </span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${share}%`,
                          background: entry.isYou
                            ? 'linear-gradient(90deg, #FF2356, #FF6B35)'
                            : entry.color,
                          borderRadius: 99,
                          transition: 'width 300ms ease-out',
                        }} />
                      </div>
                      <span style={{ width: 36, fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'right', flexShrink: 0 }}>
                        {share.toFixed(1)}%
                      </span>
                      <span style={{ width: 56, fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right', flexShrink: 0 }}>
                        {entry.tickets} tickets
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ── Emoji reactions ──────────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.98)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => floatEmoji(e)}
                style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--border-default)',
                  fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 100ms ease-out, box-shadow 100ms ease-out',
                  boxShadow: 'var(--shadow-xs)',
                }}
                onMouseDown={ev => (ev.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={ev => (ev.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={ev => (ev.currentTarget.style.transform = 'scale(1)')}
              >{e}</button>
            ))}
          </div>
          {floatingEmojis.map(fe => (
            <div
              key={fe.id}
              className="animate-float-up"
              style={{ position: 'absolute', bottom: 46, left: `${fe.x}%`, fontSize: 26, pointerEvents: 'none' }}
            >{fe.emoji}</div>
          ))}
        </div>

        {/* ── Live chat ────────────────────────────────────────────────────────── */}
        <div style={{
          margin: '16px 20px',
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF2356', flexShrink: 0, animation: 'livepulse 1.5s ease-in-out infinite' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Live chat</p>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>247 watching</span>
          </div>
          <div
            ref={chatRef}
            style={{ height: 180, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
            className="scrollbar-hide"
          >
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: msg.color,
                  whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 1,
                }}>{msg.handle}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 8 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Say something…"
              style={{ flex: 1, height: 38, padding: '0 12px', fontSize: 13, borderRadius: 999 }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: '0 18px', height: 38, borderRadius: 999,
                background: 'var(--accent-coral)', border: 'none',
                color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                flexShrink: 0,
              }}
            >Send</button>
          </div>
        </div>

        {/* ── Tonight's draws ──────────────────────────────────────────────────── */}
        {tonightDraws.length > 0 && (
          <div style={{ padding: '4px 20px 24px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
              Tonight's draws
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tonightDraws.map((d, i) => {
                const pct = Math.round((d.soldTickets / d.totalTickets) * 100);
                const price = d.ticketPrice >= 100 ? `£${(d.ticketPrice / 100).toFixed(2)}` : `${d.ticketPrice}p`;
                return (
                  <Link key={d.id} href={`/draw/${d.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      className="tonight-row"
                      style={{
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: 14, padding: '11px 14px',
                        display: 'flex', gap: 12, alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--accent-coral)', fontWeight: 800, width: 20, textAlign: 'center' }}>{i + 1}</span>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-elevated)' }}>
                        <img src={d.imageUrl} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                        <p style={{ margin: '2px 0 5px', fontSize: 11, color: 'var(--text-tertiary)' }}>{price} → £{d.retailValue.toLocaleString()}</p>
                        <ProgressBar percent={pct} height={3} />
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {tonightDraws.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Draws begin at 9pm</p>
            <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>Browse open draws and enter before tonight&apos;s reveal</p>
            <Link href="/home" style={{
              display: 'inline-block', padding: '10px 24px', borderRadius: 999,
              background: 'var(--accent-coral)', color: '#FFFFFF',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>Browse draws →</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
