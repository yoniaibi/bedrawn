'use client';

import '@/lib/amplify';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { fetchAuthSession } from 'aws-amplify/auth';

// LegitApp cheapest tier fees (sourced from legitapp.com/pricing, GBP pence)
const LEGIT_FEE_MAP: Record<string, { feePence: number; turnaround: string; hints: string[] }> = {
  'Bags': {
    feePence: 800,
    turnaround: '3 hours',
    hints: ['Front of bag', 'Back of bag', 'Interior lining', 'Serial / date code stamp', 'Hardware closeup', 'Logo closeup'],
  },
  'Trainers': {
    feePence: 250,
    turnaround: '30 min',
    hints: ['Both shoes from front', 'Side profile (both)', 'Sole (both)', 'Tongue label with size', 'Box with label'],
  },
  'Watches': {
    feePence: 1200,
    turnaround: '4 hours',
    hints: ['Dial (front)', 'Side (both sides)', 'Caseback', 'Crown', 'Serial engraving', 'Box & papers if present'],
  },
  'Jewellery': {
    feePence: 800,
    turnaround: '3 hours',
    hints: ['Front', 'Back', 'Hallmark / stamp', 'Clasp / closure', 'Brand markings'],
  },
  'Streetwear': {
    feePence: 320,
    turnaround: '4 hours',
    hints: ['Front full garment', 'Back full garment', 'Inside neck label', 'Size tag', 'Logo closeup'],
  },
  'Fashion': {
    feePence: 800,
    turnaround: '3 hours',
    hints: ['Front full', 'Back full', 'Care label', 'Size label', 'Brand tag', 'Logo / stitching closeup'],
  },
};

const DESIGNER_CATEGORIES = new Set(Object.keys(LEGIT_FEE_MAP));

// Step layout: 0=Type, 1=Details, 2=Auth (designer only), 3=Photos, 4=Pricing, 5=Review
const STEPS_FULL = ['Type', 'Details', 'Auth', 'Photos', 'Pricing', 'Review'];
const STEPS_SHORT = ['Type', 'Details', 'Photos', 'Pricing', 'Review'];

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
import { TICKET_PRICE_LADDER_PENCE, MIN_RETAIL_VALUE_PENCE, PLATFORM_FEE_PCT, PROCESSING_FIXED_PENCE, DRAW_NIGHTS, formatTicketPricePence } from '@/config/businessConfig';

/** Returns the next N valid close dates (Tue/Thu, ≥7 days out, ≤60 days out) */
function getValidCloseDates(max = 12): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(today);
  d.setDate(d.getDate() + 7);
  while (dates.length < max) {
    const dow = d.getDay(); // 0=Sun 2=Tue 4=Thu
    const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diffDays > 60) break;
    if (dow === 2 || dow === 4) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

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
  const [customPrice, setCustomPrice] = useState('');
  const [totalTickets, setTotalTickets] = useState('');
  const [reservePct, setReservePct] = useState(25);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [drawDurationDays, setDrawDurationDays] = useState(30);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [closeDate, setCloseDate] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [stepError, setStepError] = useState('');
  const [kycStatus, setKycStatus] = useState<'loading' | 'ok' | 'required'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) { setKycStatus('required'); return; }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ statusCheck: true }),
        });
        if (res.ok) {
          const data = await res.json();
          setKycStatus(data.chargesEnabled && data.payoutsEnabled ? 'ok' : 'required');
        } else {
          setKycStatus('required');
        }
      } catch {
        setKycStatus('required');
      }
    })();
  }, []);

  const handlePhotoUpload = async (file: File, slot: number) => {
    if (!file) return;
    setUploading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) return;
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setPhotoUrls(prev => {
        const next = [...prev];
        next[slot] = publicUrl;
        return next;
      });
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
    }
  };

  const isDesigner = DESIGNER_CATEGORIES.has(category);
  const legitInfo = LEGIT_FEE_MAP[category];

  const STEPS = isDesigner ? STEPS_FULL : STEPS_SHORT;
  // Map physical step (0-5) to display progress index
  const displayStep = (!isDesigner && step >= 3) ? step - 1 : step;

  function addDays(n: number) {
    const d = new Date(Date.now() + n * 86400000);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function parseLabelPence(label: string): number {
    if (!label) return 0;
    if (label.startsWith('£')) return Math.round(parseFloat(label.slice(1)) * 100);
    return parseInt(label.replace('p', ''), 10) || 0;
  }
  const resolvedTicketPricePence = ticketPrice === 'Custom' ? parseFloat(customPrice || '0') : parseLabelPence(ticketPrice);
  const grossEarnings = retailValue && ticketPrice && totalTickets && resolvedTicketPricePence > 0
    ? (resolvedTicketPricePence / 100) * parseInt(totalTickets, 10) * (1 - PLATFORM_FEE_PCT)
    : null;
  const legitFeeDeduction = verificationRequested && legitInfo ? legitInfo.feePence / 100 : 0;
  const netEarnings = grossEarnings !== null ? grossEarnings - legitFeeDeduction : null;

  function handleNext() {
    setStepError('');
    if (step === 0 && !type) { setStepError('Please select a draw type to continue.'); return; }
    if (step === 1) {
      if (!title.trim()) { setStepError('Please enter a title for your listing.'); return; }
      if (!condition) { setStepError('Please select the condition of your item.'); return; }
      if (!category) { setStepError('Please select a category.'); return; }
      // Jump over auth step if not a designer category
      setStep(isDesigner ? 2 : 3);
      return;
    }
    if (step === 3 && !photoUrls[0]) { setStepError('Please upload at least one photo — the hero image is required.'); return; }
    if (step === 4) {
      if (!retailValue) { setStepError('Please enter the retail value.'); return; }
      if (parseFloat(retailValue) * 100 < MIN_RETAIL_VALUE_PENCE) {
        setStepError(`Minimum retail value is £${MIN_RETAIL_VALUE_PENCE / 100}. bedrawn is for authenticated designer bags worth £200 or more.`);
        return;
      }
      if (!ticketPrice) { setStepError('Please select a ticket price.'); return; }
      if (ticketPrice === 'Custom' && (!customPrice || parseFloat(customPrice) <= 0)) { setStepError('Please enter your custom ticket price in pence (e.g. 15 for 15p).'); return; }
      if (!totalTickets) { setStepError('Please enter the total number of tickets.'); return; }
      if (!closeDate) { setStepError('Please select a close date for your draw.'); return; }
    }
    setStep(s => s + 1);
  }

  function handleBack() {
    setStepError('');
    // Jump over auth step backwards if not a designer category
    if (step === 3) { setStep(isDesigner ? 2 : 1); return; }
    setStep(s => s - 1);
  }

  if (kycStatus === 'loading') {
    return (
      <AppShell>
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--grey)' }}>Checking your seller status…</div>
      </AppShell>
    );
  }

  if (kycStatus === 'required') {
    return (
      <AppShell>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Verify your identity first</p>
          <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 24px', lineHeight: 1.6 }}>
            You need to complete Stripe identity verification before listing items.
            This protects buyers and ensures you can receive payouts.
          </p>
          <Link href="/seller/dashboard" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '13px 28px', borderRadius: 999, background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)', border: 'none', color: 'var(--white)', fontSize: 15, fontWeight: 700 }}>
              Complete verification →
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (submitted) {
    return (
      <AppShell>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: pendingVerification ? 'rgba(245,158,11,0.15)' : 'var(--green-light)',
            border: `2px solid ${pendingVerification ? 'var(--gold)' : 'var(--green)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <span style={{ fontSize: 28, color: pendingVerification ? 'var(--gold)' : 'var(--green)', fontWeight: 700 }}>
              {pendingVerification ? '🔍' : '✓'}
            </span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            {pendingVerification ? 'Sent for authentication' : 'Listing submitted!'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--grey)', margin: '0 0 24px', lineHeight: 1.6 }}>
            {pendingVerification
              ? `Your item has been sent to LegitApp for authentication. This typically takes ${legitInfo?.turnaround ?? 'a few hours'}. We'll notify you by email once it's verified and your listing goes live.`
              : "We'll review your listing within 24 hours and notify you when it's live."}
          </p>
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
                <div style={{ height: 3, borderRadius: 999, width: '100%', background: i <= displayStep ? 'var(--purple)' : 'var(--border)' }} />
                <span style={{ fontSize: 9, color: i <= displayStep ? 'var(--purple)' : 'var(--muted)' }}>{s}</span>
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

          {/* Step 1: Details */}
          {step === 1 && (
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
                {category && DESIGNER_CATEGORIES.has(category) && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--gold)' }}>
                    ✓ Authentication available for this category — you&apos;ll choose on the next step
                  </p>
                )}
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

          {/* Step 2: Authentication (designer categories only) */}
          {step === 2 && legitInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Authenticate this item?</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--grey)', lineHeight: 1.6 }}>
                  LegitApp verifies your {category.toLowerCase()} using expert authenticators. Verified items earn a trust badge on the draw page, which increases buyer confidence and ticket sales.
                </p>
              </div>

              {/* Skip option */}
              <button
                onClick={() => { setVerificationRequested(false); }}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: !verificationRequested ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                  border: `2px solid ${!verificationRequested ? 'var(--purple)' : 'var(--border)'}`,
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: !verificationRequested ? 'var(--purple)' : 'var(--text)' }}>No authentication</p>
                  {!verificationRequested && <span style={{ color: 'var(--purple)', fontSize: 12 }}>✓ Selected</span>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', lineHeight: 1.5 }}>
                  List immediately. No badge. Buyer trust is based on your photos and description alone.
                </p>
              </button>

              {/* Verify option */}
              <button
                onClick={() => { setVerificationRequested(true); }}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: verificationRequested ? 'rgba(245,158,11,0.08)' : 'var(--card)',
                  border: `2px solid ${verificationRequested ? 'var(--gold)' : 'var(--border)'}`,
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: verificationRequested ? 'var(--gold)' : 'var(--text)' }}>
                    LegitApp authentication
                  </p>
                  <span style={{
                    background: 'rgba(245,158,11,0.2)', border: '1px solid var(--gold)',
                    color: 'var(--gold)', fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 999,
                  }}>£{(legitInfo.feePence / 100).toFixed(2)}</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--grey)', lineHeight: 1.5 }}>
                  Two expert authenticators review your photos. Result in {legitInfo.turnaround}. Listing goes live only after passing.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['Expert reviewed', 'Certificate issued', 'Verified badge on listing', 'Fee deducted from payout'].map(f => (
                    <span key={f} style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 999,
                      background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', border: '1px solid rgba(245,158,11,0.3)',
                    }}>{f}</span>
                  ))}
                </div>
              </button>

              {verificationRequested && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gold)', lineHeight: 1.5 }}>
                    <strong>£{(legitInfo.feePence / 100).toFixed(2)}</strong> will be deducted from your payout when the draw resolves. No upfront payment required.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Add photos</p>
              {verificationRequested && legitInfo ? (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>
                    LegitApp requires these specific shots for {category.toLowerCase()}:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {legitInfo.hints.map((hint, i) => (
                      <div key={hint} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', background: photoUrls[i] ? 'var(--green)' : 'var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: photoUrls[i] ? '#000' : 'var(--muted)', fontWeight: 700, flexShrink: 0,
                        }}>{photoUrls[i] ? '✓' : i + 1}</span>
                        <span style={{ fontSize: 12, color: photoUrls[i] ? 'var(--text)' : 'var(--grey)' }}>{hint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--grey)' }}>Up to 6 photos. First photo is your hero image.</p>
              )}
              {uploading && <p style={{ fontSize: 12, color: 'var(--purple)', marginBottom: 12 }}>Uploading…</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <label key={i} style={{ cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f, i); }}
                    />
                    <div style={{
                      aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
                      background: photoUrls[i] ? 'transparent' : i === 0 ? 'rgba(124,58,237,0.06)' : 'var(--card)',
                      border: `2px dashed ${photoUrls[i] ? 'var(--green)' : i === 0 ? 'var(--purple)' : 'var(--border)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      position: 'relative',
                    }}>
                      {photoUrls[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                      ) : (
                        <>
                          <span style={{ fontSize: 22, color: 'var(--muted)' }}>+</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                            {verificationRequested && legitInfo ? (legitInfo.hints[i] ?? `Photo ${i + 1}`) : (i === 0 ? 'Hero' : `Photo ${i + 1}`)}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {verificationRequested && !photoUrls[0] && (
                <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                  Upload all required shots for the best chance of a quick authentication result.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Retail value (£)</label>
                <input type="number" value={retailValue} onChange={e => setRetailValue(e.target.value)} placeholder="e.g. 6800" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 8 }}>Ticket price</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TICKET_PRICE_LADDER_PENCE.map(p => {
                    const label = formatTicketPricePence(p);
                    return (
                      <button key={p} onClick={() => setTicketPrice(label)} style={{
                        padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
                        background: ticketPrice === label ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                        border: `1px solid ${ticketPrice === label ? 'var(--purple)' : 'var(--border)'}`,
                        color: ticketPrice === label ? 'var(--purple)' : 'var(--grey)',
                      }}>{label}</button>
                    );
                  })}
                  <button onClick={() => setTicketPrice('Custom')} style={{
                    padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
                    background: ticketPrice === 'Custom' ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                    border: `1px solid ${ticketPrice === 'Custom' ? 'var(--purple)' : 'var(--border)'}`,
                    color: ticketPrice === 'Custom' ? 'var(--purple)' : 'var(--grey)',
                  }}>Custom</button>
                </div>
                {ticketPrice === 'Custom' && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Custom price (pence, e.g. 15 for 15p)</label>
                    <input type="number" min="1" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="e.g. 15" style={{ maxWidth: 160 }} />
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Total tickets available</label>
                <input type="number" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} placeholder="e.g. 13600" />
              </div>
              <div>
                <div>
                <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 4 }}>Close date</label>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                  Draws close on Tuesday or Thursday evenings. Choose a date at least 7 days out.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {getValidCloseDates(10).map(d => {
                    const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                    const iso = d.toISOString().split('T')[0];
                    const sel = closeDate?.toISOString().split('T')[0] === iso;
                    const diffDays = Math.round((d.getTime() - Date.now()) / 86400000);
                    return (
                      <button key={iso} onClick={() => { setCloseDate(d); setDrawDurationDays(diffDays); }} style={{
                        flex: '1 1 110px', padding: '10px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 12,
                        background: sel ? 'rgba(124,58,237,0.08)' : 'var(--card)',
                        border: `1.5px solid ${sel ? 'var(--purple)' : 'var(--border)'}`,
                        color: sel ? 'var(--purple)' : 'var(--grey)',
                      }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 12 }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 10, color: sel ? 'var(--purple)' : 'var(--muted)' }}>
                          Postal by {new Date(d.getTime() - 4 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 4 }}>Reserve — minimum tickets to proceed</label>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                  If fewer than this many tickets are sold, the draw cancels and buyers are fully refunded.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setReservePct(pct)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: reservePct === pct ? 'rgba(255,35,86,0.08)' : 'var(--card)',
                        border: `1.5px solid ${reservePct === pct ? 'var(--accent-coral)' : 'var(--border)'}`,
                        color: reservePct === pct ? 'var(--accent-coral)' : 'var(--grey)',
                      }}
                    >{pct}%</button>
                  ))}
                </div>
                {totalTickets && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                    Reserve = {Math.ceil(parseInt(totalTickets, 10) * reservePct / 100).toLocaleString()} tickets
                  </p>
                )}
              </div>
              {netEarnings !== null && (
                <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid var(--green)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--grey)' }}>{Math.round((1 - PLATFORM_FEE_PCT) * 100)}% seller share</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>£{grossEarnings!.toFixed(2)}</span>
                  </div>
                  {legitFeeDeduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--grey)' }}>LegitApp authentication</span>
                      <span style={{ fontSize: 13, color: 'var(--gold)' }}>−£{legitFeeDeduction.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>You receive (full sell-out)</span>
                    <strong style={{ color: 'var(--green)', fontSize: 16 }}>£{netEarnings.toFixed(2)}</strong>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
                    Needs {Math.ceil(parseInt(totalTickets, 10) * reservePct / 100).toLocaleString()} tickets sold ({reservePct}% reserve) or cancels
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Review your listing</p>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Type', value: type || '—' },
                  { label: 'Title', value: title || '—' },
                  { label: 'Condition', value: condition || '—' },
                  { label: 'Category', value: category || '—' },
                  { label: 'Style', value: style || '—' },
                  { label: 'Authentication', value: verificationRequested && legitInfo ? `LegitApp (£${(legitInfo.feePence / 100).toFixed(2)}, from payout)` : 'None' },
                  { label: 'Retail value', value: retailValue ? `£${retailValue}` : '—' },
                  { label: 'Ticket price', value: ticketPrice || '—' },
                  { label: 'Total tickets', value: totalTickets || '—' },
                  { label: 'Reserve', value: `${reservePct}% (${totalTickets ? Math.ceil(parseInt(totalTickets, 10) * reservePct / 100).toLocaleString() : '—'} tickets)` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--grey)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: row.label === 'Authentication' && verificationRequested ? 'var(--gold)' : 'var(--text)', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      {verificationRequested && legitInfo && ` I agree that £${(legitInfo.feePence / 100).toFixed(2)} will be deducted from my payout for LegitApp authentication.`}
                    </p>
                  </div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <button onClick={() => setAgreed2(a => !a)} style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      background: agreed2 ? 'var(--purple)' : 'transparent',
                      border: `2px solid ${agreed2 ? 'var(--purple)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      {agreed2 && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                    </button>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)', lineHeight: 1.5 }}>
                      I have read and agree to Section 7 (authentication and liquidated damages) of the Seller Terms, including that bedrawn may withhold payment pending resolution of any dispute about item authenticity or condition.
                    </p>
                  </div>
                </div>
              </div>
              {submitError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{submitError}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  if (!agreed || !agreed2 || submitting) return;
                  setSubmitting(true);
                  setSubmitError('');
                  try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.idToken?.toString();
                    if (!token) throw new Error('Please log in to list an item');
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/draws`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        title, description: desc, category, style, condition, type,
                        ticketPrice: ticketPrice === 'Custom' ? `${customPrice}p` : ticketPrice,
                        totalTickets, retailValue, reservePct,
                        imageUrls: photoUrls.filter(Boolean),
                        verificationRequested,
                        drawDurationDays,
                      }),
                    });
                    if (!res.ok) {
                      const b = await res.json().catch(() => ({}));
                      throw new Error(b.error ?? `Error ${res.status}`);
                    }
                    const data = await res.json();
                    setPendingVerification(data.pendingVerification ?? false);
                    setSubmitted(true);
                  } catch (err: unknown) {
                    setSubmitError(err instanceof Error ? err.message : 'Submission failed');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!agreed || !agreed2 || submitting}
                style={{
                  width: '100%', padding: 16, borderRadius: 999, border: 'none',
                  background: agreed && agreed2 && !submitting ? 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' : 'var(--muted)',
                  color: 'var(--white)', fontSize: 16, fontWeight: 700, cursor: agreed && agreed2 && !submitting ? 'pointer' : 'not-allowed',
                }}
              >{submitting ? 'Submitting…' : 'Submit listing'}</button>
            </div>
          )}

          {/* Nav buttons */}
          {step < 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              {stepError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{stepError}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                {step > 0 && (
                  <button onClick={handleBack} style={{
                    flex: 1, padding: 14, borderRadius: 999, background: 'var(--card)',
                    border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer',
                  }}>Back</button>
                )}
                <button
                  onClick={handleNext}
                  style={{
                    flex: 2, padding: 14, borderRadius: 999,
                    background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                    border: 'none', color: 'var(--white)', fontWeight: 700, cursor: 'pointer', fontSize: 15,
                  }}
                >
                  {step === 4 ? 'Review listing' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
