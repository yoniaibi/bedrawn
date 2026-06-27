'use client';

import '@/lib/amplify';
import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { fetchAuthSession } from 'aws-amplify/auth';

const STEPS = ['Type', 'Photos', 'Details', 'Pricing', 'Review'];
const TYPES = [
  { id: 'single',     label: 'Single item', icon: '◻' },
  { id: 'bundle',     label: 'Bundle',      icon: '◈' },
  { id: 'vintage',    label: 'Vintage',     icon: '◌' },
  { id: 'luxury',     label: 'Luxury',      icon: '◆' },
  { id: 'streetwear', label: 'Streetwear',  icon: '△' },
  { id: 'tech',       label: 'Tech',        icon: '□' },
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const CATEGORIES = ['Bags', 'Trainers', 'Watches', 'Jewellery', 'Streetwear', 'Fashion', 'Tech', 'Other'];
const STYLES = ['Womenswear', 'Menswear', 'Unisex'];
const TICKET_PRICES = ['10p', '25p', '50p', '£1', 'Custom'];

export default function ListItemPage() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [retailValue, setRetailValue] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const earnings = retailValue && ticketPrice
    ? parseFloat(retailValue) * 0.88
    : null;

  if (submitted) {
    return (
      <AppShell>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--green-light)', border: '2px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <span style={{ fontSize: 28, color: 'var(--green)', fontWeight: 700 }}>✓</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Listing submitted!</p>
          <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 24px' }}>We&apos;ll review your listing within 24 hours and notify you when it&apos;s live.</p>
          <Link href="/seller/dashboard" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '12px 28px', borderRadius: 999, background: 'var(--purple)', border: 'none', color: 'var(--white)', fontSize: 14, fontWeight: 700 }}>
              Go to dashboard
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/seller/dashboard" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>List a new item</p>
        </div>

        {/* Progress */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ height: 3, borderRadius: 999, width: '100%', background: i <= step ? 'var(--purple)' : 'var(--border)' }} />
                <span style={{ fontSize: 9, color: i <= step ? 'var(--purple)' : 'var(--muted)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {/* Step 0: Type */}
          {step === 0 && (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>What type of draw?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TYPES.map(t => (
                  <button key={t.id} onClick={() => setType(t.id)} style={{
                    padding: '20px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: type === t.id ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                    border: `2px solid ${type === t.id ? 'var(--purple)' : 'var(--border)'}`,
                  }}>
                    <p style={{ fontSize: 22, margin: '0 0 6px', color: type === t.id ? 'var(--purple)' : 'var(--muted)', fontWeight: 700 }}>{t.icon}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: type === t.id ? 'var(--purple)' : 'var(--text)' }}>{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Photos */}
          {step === 1 && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Add photos</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)' }}>Up to 6 photos. First photo is your hero image.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} style={{
                    aspectRatio: '1', borderRadius: 10,
                    background: i === 0 ? 'rgba(124,58,237,0.06)' : 'var(--card)',
                    border: `2px dashed ${i === 0 ? 'var(--purple)' : 'var(--border)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 22, color: 'var(--muted)' }}>+</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{i === 0 ? 'Hero' : `Photo ${i + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chanel Classic Flap — Black Caviar" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="Describe your item honestly and in detail..." style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 8 }}>Condition</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {CONDITIONS.map(c => (
                    <button key={c} onClick={() => setCondition(c)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                      background: condition === c ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                      border: `1px solid ${condition === c ? 'var(--purple)' : 'var(--border)'}`,
                      color: condition === c ? 'var(--purple)' : 'var(--grey)',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 8 }}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{
                      padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12,
                      background: category === c ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                      border: `1px solid ${category === c ? 'var(--purple)' : 'var(--border)'}`,
                      color: category === c ? 'var(--purple)' : 'var(--grey)',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 8 }}>Style</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {STYLES.map(s => (
                    <button key={s} onClick={() => setStyle(s)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                      background: style === s ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                      border: `1px solid ${style === s ? 'var(--purple)' : 'var(--border)'}`,
                      color: style === s ? 'var(--purple)' : 'var(--grey)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Retail value (£)</label>
                <input type="number" value={retailValue} onChange={e => setRetailValue(e.target.value)} placeholder="e.g. 6800" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 8 }}>Ticket price</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TICKET_PRICES.map(p => (
                    <button key={p} onClick={() => setTicketPrice(p)} style={{
                      padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
                      background: ticketPrice === p ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                      border: `1px solid ${ticketPrice === p ? 'var(--purple)' : 'var(--border)'}`,
                      color: ticketPrice === p ? 'var(--purple)' : 'var(--grey)',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Total tickets available</label>
                <input type="number" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} placeholder="e.g. 13600" />
              </div>
              {earnings && (
                <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid var(--green)', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>
                    At full sell-out you earn{' '}
                    <strong style={{ color: 'var(--green)', fontSize: 16 }}>£{earnings.toFixed(2)}</strong>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--grey)' }}>88% of total ticket revenue</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Review your listing</p>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Type', value: type || '—' },
                  { label: 'Title', value: title || '—' },
                  { label: 'Condition', value: condition || '—' },
                  { label: 'Category', value: category || '—' },
                  { label: 'Style', value: style || '—' },
                  { label: 'Retail value', value: retailValue ? `£${retailValue}` : '—' },
                  { label: 'Ticket price', value: ticketPrice || '—' },
                  { label: 'Total tickets', value: totalTickets || '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--grey)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <button onClick={() => setAgreed(a => !a)} style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: agreed ? 'var(--purple)' : 'transparent',
                    border: `2px solid ${agreed ? 'var(--purple)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    {agreed && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                  </button>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', lineHeight: 1.5 }}>
                    I confirm the item is as described. I understand that misrepresentation may result in liquidated damages and removal from the platform.
                  </p>
                </div>
              </div>
              {submitError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{submitError}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  if (!agreed || submitting) return;
                  setSubmitting(true);
                  setSubmitError('');
                  try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.accessToken?.toString();
                    if (!token) throw new Error('Please log in to list an item');
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ title, description: desc, category, style, condition, type, ticketPrice, totalTickets, retailValue }),
                    });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      throw new Error(body.error ?? `Error ${res.status}`);
                    }
                    setSubmitted(true);
                  } catch (err: unknown) {
                    setSubmitError(err instanceof Error ? err.message : 'Submission failed');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!agreed || submitting}
                style={{
                  width: '100%', padding: 16, borderRadius: 999, border: 'none',
                  background: agreed && !submitting ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'var(--muted)',
                  color: 'var(--white)', fontSize: 16, fontWeight: 700, cursor: agreed && !submitting ? 'pointer' : 'not-allowed',
                }}
              >{submitting ? 'Submitting…' : 'Submit listing'}</button>
            </div>
          )}

          {/* Nav buttons */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  flex: 1, padding: 14, borderRadius: 999, background: 'var(--card)',
                  border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer',
                }}>Back</button>
              )}
              <button onClick={() => setStep(s => s + 1)} style={{
                flex: 2, padding: 14, borderRadius: 999,
                background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                border: 'none', color: 'var(--white)', fontWeight: 700, cursor: 'pointer', fontSize: 15,
              }}>
                {step === 3 ? 'Review listing' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
