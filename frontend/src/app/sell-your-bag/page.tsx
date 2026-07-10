'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { PLATFORM_FEE_PCT, PROCESSING_FIXED_PENCE, MIN_RETAIL_VALUE_PENCE, FOUNDING_SELLER_CAP } from '@/config/businessConfig';

const VESTIAIRE_FEE = 0.20;
const EBAY_FEE = 0.128;
const EBAY_FIXED_PENCE = 30;

const HOW_IT_WORKS = [
  { step: '1', title: 'List your bag', desc: 'Add photos, description and your reserve price. Listing is free and takes about 10 minutes.' },
  { step: '2', title: 'Get authenticated', desc: 'LegitApp\'s experts verify your item. Authenticated bags earn a trust badge and sell faster.' },
  { step: '3', title: 'Your draw goes live', desc: 'Buyers enter from 10p per ticket. Your draw runs until the reserve is met or the close date arrives.' },
  { step: '4', title: 'Winner confirmed, you get paid', desc: 'Once the winner confirms delivery, we transfer your money within 24 hours.' },
];

const FAQS = [
  { q: 'What bags can I sell?', a: 'Any authenticated designer handbag worth £200 or more. We currently support Chanel, Louis Vuitton, Bottega Veneta, Prada, Celine, and other luxury brands.' },
  { q: 'How does authentication work?', a: 'We work with LegitApp — expert human authenticators review your photos and issue a certificate. Costs from £8 and is deducted from your payout, not charged upfront.' },
  { q: 'What\'s the bedrawn fee?', a: `bedrawn takes ${PLATFORM_FEE_PCT * 100}% of ticket revenue plus £${(PROCESSING_FIXED_PENCE / 100).toFixed(2)} to cover payment processing. No upfront costs, ever.` },
  { q: 'What is the reserve?', a: 'You set a minimum number of tickets that must sell before the draw can proceed. If the reserve isn\'t met by the close date, all buyers are fully refunded and you keep nothing — but there\'s no cost to you.' },
  { q: 'How quickly do I get paid?', a: 'We initiate your Stripe payout within 24 hours of the winner confirming delivery. Most UK bank accounts receive funds within 1–2 business days.' },
  { q: 'Is it free to list?', a: 'Completely free to list. You only pay the platform fee when your draw resolves — and only on the ticket revenue actually collected.' },
];

export default function SellYourBagPage() {
  const [retailValue, setRetailValue] = useState(800);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);

  const minVal = MIN_RETAIL_VALUE_PENCE / 100; // £200
  const maxVal = 5000;

  const bedrawnFee = retailValue * PLATFORM_FEE_PCT + PROCESSING_FIXED_PENCE / 100;
  const bedrawnPayout = retailValue - bedrawnFee;
  const vestiairePayout = retailValue * (1 - VESTIAIRE_FEE);
  const ebayPayout = retailValue - retailValue * EBAY_FEE - EBAY_FIXED_PENCE / 100;

  const maxBar = Math.max(bedrawnPayout, vestiairePayout, ebayPayout);

  const handleEmailCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyOk || !email) return;
    // Best-effort — fire and forget, UI updates immediately
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'seller' }),
      });
    } catch {}
    setEmailSent(true);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* ── Hero ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(236,72,153,0.05))',
          border: '1px solid var(--border-default)',
          borderRadius: 20, padding: '48px 32px',
          textAlign: 'center', marginBottom: 40, marginTop: 24,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-lilac)' }}>
            For sellers
          </p>
          <h1 style={{ margin: '0 0 16px', fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            A better way to sell<br />
            <span style={{ fontStyle: 'italic', color: 'var(--accent-pink)', fontFamily: 'Georgia, serif' }}>your designer bag</span>
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            No hagglers. No slow listings. Buyers compete for your bag through a timed draw — you get paid fast, at a price you set.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/seller/list" style={{
              display: 'inline-block', padding: '14px 28px', borderRadius: 999,
              background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
              color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}>
              List your bag →
            </Link>
            <Link href="/seller/dashboard" style={{
              display: 'inline-block', padding: '14px 28px', borderRadius: 999,
              border: '1.5px solid var(--border-default)', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
            }}>
              Seller dashboard
            </Link>
          </div>
          {/* Trust signals */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['100% authenticated', 'Paid within 24h', 'Free to list', 'UK only · £200+ bags'].map(s => (
              <span key={s} style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#10B981' }}>✓</span> {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Founding Seller offer ── */}
        <div style={{
          background: 'rgba(245,158,11,0.07)',
          border: '1.5px solid rgba(245,158,11,0.35)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 40,
          display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>◆</span>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--accent-gold)' }}>
              Founding Seller — first {FOUNDING_SELLER_CAP} sellers
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The first {FOUNDING_SELLER_CAP} verified sellers receive a permanent Founding Seller badge on all their listings — a mark of trust that stays with you as the platform grows.
            </p>
            <Link href="/seller/dashboard" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-gold)', textDecoration: 'none' }}>
              Claim your spot →
            </Link>
          </div>
        </div>

        {/* ── Payout comparison ── */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            How much will you earn?
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Drag the slider to see your estimated payout vs other platforms.
          </p>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your bag&apos;s retail value</label>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
                £{retailValue.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={minVal}
              max={maxVal}
              step={50}
              value={retailValue}
              onChange={e => setRetailValue(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-pink)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              <span>£{minVal}</span>
              <span>£{maxVal.toLocaleString()}</span>
            </div>
          </div>

          {[
            { name: 'bedrawn', payout: bedrawnPayout, accent: 'var(--accent-pink)', note: `${PLATFORM_FEE_PCT * 100}% + £${(PROCESSING_FIXED_PENCE / 100).toFixed(2)} fee` },
            { name: 'Vestiaire Collective', payout: vestiairePayout, accent: 'var(--text-tertiary)', note: '20% commission' },
            { name: 'eBay', payout: ebayPayout, accent: 'var(--text-tertiary)', note: '12.8% + 30p fee' },
          ].map(row => (
            <div key={row.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.name === 'bedrawn' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{row.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>{row.note}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: row.name === 'bedrawn' ? 'var(--accent-pink)' : 'var(--text-secondary)' }}>
                  £{row.payout.toFixed(0)}
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(row.payout / maxBar) * 100}%`,
                  background: row.accent, borderRadius: 99, transition: 'width 300ms ease',
                }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12 }}>
            Estimates based on full sell-out at your retail value. Actual earnings depend on tickets sold.
          </p>
        </div>

        {/* ── How it works ── */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #EC4899, #F472B6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{item.step}</span>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            FAQs
          </h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: 0 }}>
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '16px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{faq.q}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 18, flexShrink: 0 }}>{expandedFaq === i ? '−' : '+'}</span>
              </button>
              {expandedFaq === i && (
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Email capture ── */}
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-default)',
          borderRadius: 20, padding: '32px 28px', textAlign: 'center',
        }}>
          {emailSent ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>You&apos;re on the list!</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>We&apos;ll be in touch when your seller account is ready.</p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Ready to sell?</p>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>Join the seller waitlist and we&apos;ll set you up to list your first bag.</p>
              <form onSubmit={handleEmailCapture} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, margin: '0 auto' }}>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-default)', fontSize: 14 }}
                />
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer' }}>
                  <input type="checkbox" checked={privacyOk} onChange={e => setPrivacyOk(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    I agree to bedrawn&apos;s <Link href="/legal/privacy" style={{ color: 'var(--accent-lilac)' }}>Privacy Policy</Link> and to receiving seller updates by email.
                  </span>
                </label>
                <button
                  type="submit" disabled={!privacyOk || !email}
                  style={{
                    padding: '14px', borderRadius: 999, border: 'none',
                    background: privacyOk && email ? 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' : 'var(--bg-overlay)',
                    color: privacyOk && email ? '#fff' : 'var(--text-tertiary)',
                    fontWeight: 700, fontSize: 15, cursor: privacyOk && email ? 'pointer' : 'not-allowed',
                  }}
                >
                  Join waitlist →
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </AppShell>
  );
}
