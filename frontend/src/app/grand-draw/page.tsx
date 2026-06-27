'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import CountdownTimer from '@/components/CountdownTimer';
import LiveDot from '@/components/LiveDot';
import ProgressBar from '@/components/ProgressBar';
import { currentUser, grandDraw } from '@/lib/mockData';

const today = new Date();
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const todayDate = today.getDate();

const monthName = today.toLocaleString('default', { month: 'long' });
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const daysLeft = Math.ceil((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

const loginDays = [1, 2, 3, 4, 7, 8, 9, 10, 14, 15, 16, 17, 21, 22, 23, todayDate];

export default function GrandDrawPage() {
  const [claimed, setClaimed] = useState(false);
  const entries = currentUser.grandDrawEntries;
  const odds = Math.round(grandDraw.totalEntries / entries);
  const entriesPct = Math.min(100, (entries / 30) * 100);

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="serif" style={{ fontSize: 24, color: 'var(--gold)', margin: 0 }}>DRAWN</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--white)' }}>{monthName}</p>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Prize card */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(135deg, #2D1B4E, #1a0a2e)',
            border: '1px solid var(--purple)', padding: 24,
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{
                background: 'rgba(139,92,246,0.3)', border: '1px solid var(--purple)',
                color: 'var(--purple)', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <LiveDot size={6} /> GRAND DRAW
              </span>
            </div>
            <p style={{ fontSize: 48, margin: '0 0 8px' }}>{grandDraw.emoji}</p>
            <p className="serif" style={{ fontSize: 28, color: 'var(--white)', margin: '0 0 4px' }}>{grandDraw.prize}</p>
            <p style={{ fontSize: 13, color: 'var(--grey)', margin: '0 0 16px' }}>This month&apos;s Grand Draw prize</p>
            <span style={{
              background: 'rgba(245,158,11,0.2)', border: '1px solid var(--gold)',
              color: 'var(--gold)', fontSize: 13, fontWeight: 700,
              padding: '6px 16px', borderRadius: 999,
            }}>Worth £{grandDraw.value.toLocaleString()} | Fund growing daily</span>
          </div>

          {/* Countdown */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Draw resolves in
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              {[
                { label: 'Days', value: daysLeft },
                { label: 'Hours', value: new Date().getHours() === 21 ? 0 : (21 - new Date().getHours()) },
                { label: 'Mins', value: new Date().getMinutes() },
              ].map(unit => (
                <div key={unit.label} style={{ textAlign: 'center' }}>
                  <p className="serif" style={{ fontSize: 40, color: 'var(--white)', margin: 0, fontWeight: 700 }}>
                    {String(unit.value).padStart(2, '0')}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>{unit.label}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--pink)' }}>Last day of {monthName} · 9pm</p>
          </div>

          {/* Entries card */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: 1 }}>Your entries this month</p>
            <p className="serif" style={{ fontSize: 48, color: 'var(--gold)', margin: '0 0 4px', fontWeight: 700 }}>{entries}</p>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--grey)' }}>Your odds: 1 in {odds}</p>
            <ProgressBar percent={entriesPct} height={6} />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>{grandDraw.totalEntries} total entries in pool</p>
          </div>

          {/* Claim button */}
          <button
            onClick={() => setClaimed(true)}
            disabled={claimed}
            style={{
              width: '100%', padding: 16, borderRadius: 999, border: 'none',
              background: claimed ? 'var(--muted)' : 'var(--green)',
              color: 'var(--white)', fontSize: 16, fontWeight: 700,
              cursor: claimed ? 'not-allowed' : 'pointer',
              opacity: claimed ? 0.7 : 1,
            }}
          >
            {claimed ? '✓ +1 ticket claimed for today' : '🎟 Claim today\'s ticket'}
          </button>

          {/* Streak card */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 40, margin: 0 }}>🔥</p>
                <p className="serif" style={{ fontSize: 32, color: 'var(--white)', margin: 0, fontWeight: 700 }}>{currentUser.streak}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>Day streak</p>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--grey)' }}>Longest: 12 days</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)' }}>All-time earned: 23 tickets</p>
              </div>
            </div>
            {currentUser.streak >= 7 && (
              <div style={{
                background: 'rgba(245,158,11,0.1)', border: '1px solid var(--gold)',
                borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⭐</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>7-day streak achievement unlocked!</span>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px',
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>Login calendar · {monthName}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', paddingBottom: 4 }}>{d}</div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const logged = loginDays.includes(day);
                const isToday = day === todayDate;
                const future = day > todayDate;
                return (
                  <div key={day} style={{
                    aspectRatio: '1', borderRadius: 4,
                    background: logged ? 'var(--gold)' : future ? 'var(--card2)' : 'var(--border)',
                    border: isToday ? '2px solid var(--pink)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                    color: logged ? '#000' : 'var(--muted)',
                    fontWeight: logged ? 700 : 400,
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--gold)' }} />
                <span style={{ fontSize: 10, color: 'var(--grey)' }}>Logged in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, border: '2px solid var(--pink)' }} />
                <span style={{ fontSize: 10, color: 'var(--grey)' }}>Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--border)' }} />
                <span style={{ fontSize: 10, color: 'var(--grey)' }}>Missed</span>
              </div>
            </div>
          </div>

          {/* Past draw */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>Last month&apos;s draw</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 32, margin: 0 }}>👜</p>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>Louis Vuitton Neverfull</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--gold)' }}>Worth £1,200</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--grey)' }}>Won by @luxe_fan_99</p>
              </div>
              <span style={{
                marginLeft: 'auto', background: 'rgba(16,185,129,0.15)',
                border: '1px solid var(--green)', color: 'var(--green)',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              }}>WINNER</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
