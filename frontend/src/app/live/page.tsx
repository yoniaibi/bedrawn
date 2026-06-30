'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import LiveDot from '@/components/LiveDot';
import CountdownTimer from '@/components/CountdownTimer';
import ProgressBar from '@/components/ProgressBar';
import { chatMessages, draws } from '@/lib/mockData';

const wheelColors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#A78BFA', '#F472B6'];
const wheelHandles = ['@sarah_j', '@yoniaibi', '@collector', '@luxe_fan', '@hypekid', '@watchman', '@fashionista', '@streetwear_g'];

const emojis = ['🔥', '❤️', '😍', '🏆', '💜', '🎉'];

export default function LivePage() {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [rotation, setRotation] = useState(0);
  const emojiCounter = useRef(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let angle = 0;
    const id = setInterval(() => {
      angle += 0.5;
      setRotation(angle);
    }, 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: String(Date.now()),
      handle: 'you',
      color: '#8B5CF6',
      message: input.trim(),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
  };

  const floatEmoji = (emoji: string) => {
    const id = emojiCounter.current++;
    const x = Math.random() * 80 + 10;
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 1200);
  };

  const tonightDraws = draws.filter(d => d.isClosingTonight);
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 95;
  const segAngle = 360 / wheelHandles.length;

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 16 }}>
        {/* Header */}
        <div style={{
          padding: '16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <LiveDot />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>LIVE · The 9pm Draw</p>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--grey)' }}>247 👁</span>
          </div>
        </div>

        {/* Prize wheel */}
        <div style={{ padding: '24px 16px', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <svg
              width={size} height={size}
              style={{ transform: `rotate(${rotation}deg)`, display: 'block' }}
            >
              {wheelHandles.map((_, i) => {
                const startAngle = (i * segAngle - 90) * (Math.PI / 180);
                const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
                const x1 = cx + r * Math.cos(startAngle);
                const y1 = cy + r * Math.sin(startAngle);
                const x2 = cx + r * Math.cos(endAngle);
                const y2 = cy + r * Math.sin(endAngle);
                const largeArc = segAngle > 180 ? 1 : 0;
                const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                return <path key={i} d={d} fill={wheelColors[i % wheelColors.length]} opacity={0.85} />;
              })}
              <circle cx={cx} cy={cy} r={30} fill="var(--bg)" />
              <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--white)" fontSize="11" fontWeight="bold">DRAWN</text>
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
            </div>
          </div>

          {/* Countdown overlay */}
          <div style={{
            marginTop: 16, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 24px', display: 'inline-block',
          }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Draw starts in
            </p>
            <CountdownTimer className="text-3xl font-bold" style={{ color: 'var(--text)' }} />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--pink)' }}>Don&apos;t miss the reveal</p>
          </div>
        </div>

        {/* Emoji reactions */}
        <div style={{ position: 'relative', padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', position: 'relative' }}>
            {emojis.map(e => (
              <button
                key={e}
                onClick={() => floatEmoji(e)}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--card)', border: '1px solid var(--border)',
                  fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >{e}</button>
            ))}
          </div>
          {floatingEmojis.map(fe => (
            <div
              key={fe.id}
              className="animate-float-up"
              style={{
                position: 'absolute', bottom: 44,
                left: `${fe.x}%`, fontSize: 24,
                pointerEvents: 'none',
              }}
            >{fe.emoji}</div>
          ))}
        </div>

        {/* Chat */}
        <div style={{ margin: '0 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>Live chat</p>
          </div>
          <div ref={chatRef} style={{ height: 200, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: msg.color, whiteSpace: 'nowrap' }}>{msg.handle}</span>
                <span style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.4 }}>{msg.message}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Say something…"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 999 }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: '8px 16px', borderRadius: 999,
                background: 'var(--purple)', border: 'none',
                color: 'var(--white)', fontSize: 13, fontWeight: 700,
              }}
            >Send</button>
          </div>
        </div>

        {/* Tonight's draws */}
        <div style={{ padding: '20px 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', margin: '0 0 12px' }}>Tonight&apos;s draws</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tonightDraws.map((d, i) => {
              const pct = Math.round((d.soldTickets / d.totalTickets) * 100);
              const price = d.ticketPrice >= 100 ? `£${(d.ticketPrice / 100).toFixed(2)}` : `${d.ticketPrice}p`;
              return (
                <Link key={d.id} href={`/draw/${d.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 20, color: 'var(--purple)', fontWeight: 700, width: 24 }}>{i + 1}</span>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--card)' }}>
                      <img src={d.imageUrl} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                      <p style={{ margin: '2px 0', fontSize: 11, color: 'var(--grey)' }}>{price} → £{d.retailValue.toLocaleString()}</p>
                      <ProgressBar percent={pct} height={3} />
                    </div>
                    <span style={{
                      background: 'rgba(139,92,246,0.2)', border: '1px solid var(--purple)',
                      color: 'var(--purple)', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
                    }}>3 tickets</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
