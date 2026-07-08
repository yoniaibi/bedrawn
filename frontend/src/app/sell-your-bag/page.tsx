'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const FEE_CONFIG = {
  bedrawn:   { pct: 0.12,  fixedPence: 1700 },
  vestiaire: { pct: 0.20,  fixedPence: 0 },
  ebay:      { pct: 0.128, fixedPence: 30 },
};

const BRAND_CHIPS = ['Chanel', 'Louis Vuitton', 'Bottega Veneta', 'Prada', 'Celine'];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'List your bag',
    desc: 'Add photos and we arrange authentication. Free to list, takes about 10 minutes.',
  },
  {
    step: '2',
    title: 'Your draw goes live',
    desc: 'Buyers enter from 10p a ticket, every day until the draw fills up.',
  },
  {
    step: '3',
    title: 'Winner confirmed, you get paid',
    desc: 'We transfer your money within 24 hours of the winner confirming delivery.',
  },
];

const TRUST_SIGNALS = [
  '100% authenticated',
  'Payment in 24 hours',
  'Free to list',
  'UK only · £200+ bags',
];

export default function SellYourBagPage() {
  const [retailValue, setRetailValue] = useState(500);

  const bedrawnPayout = retailValue - retailValue * FEE_CONFIG.bedrawn.pct - FEE_CONFIG.bedrawn.fixedPence / 100;
  const vestiairePayout = retailValue * (1 - FEE_CONFIG.vestiaire.pct);
  const ebayPayout = retailValue - retailValue * FEE_CONFIG.ebay.pct - FEE_CONFIG.ebay.fixedPence / 100;

  return (
    <AppShell>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 64px' }}>

        {/* ── Hero ── */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '48px 32px',
          textAlign: 'center',
          marginBottom: 40,
          marginTop: 24,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--accent-coral)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            Sell on bedrawn
          </p>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, margin: '0 0 16px' }}>
            Sell your designer bag.<br />Get paid tomorrow.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--grey)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            List your bag tonight. Your draw fills up. We transfer your money within 24 hours of the winner confirming delivery.
          </p>
          <Link href="/signup" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--accent-coral)',
            color: '#fff',
            borderRadius: 999,
            padding: '14px 36px',
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(255,35,86,0.28)',
          }}>
            List my bag →
          </Link>
        </div>

        {/* ── Payout comparison widget ── */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 40,
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            See what you&apos;d earn
          </h2>

          {/* Retail value input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--grey)', marginBottom: 8, fontWeight: 600 }}>
              Retail value (£)
            </label>
            <input
              type="number"
              min={200}
              value={retailValue}
              onChange={e => setRetailValue(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-raised)',
                color: 'var(--text)',
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Comparison rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* bedrawn */}
            <div style={{
              border: '2px solid #059669',
              borderRadius: 12,
              padding: '16px 18px',
              background: 'rgba(5,150,105,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>bedrawn</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>12% + £17 fee</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 1px', fontSize: 22, fontWeight: 800, color: '#059669' }}>
                    £{bedrawnPayout.toFixed(0)}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#059669', fontWeight: 600 }}>You earn</p>
                </div>
              </div>
            </div>

            {/* Vestiaire */}
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Vestiaire Collective</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>20% fee</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 1px', fontSize: 22, fontWeight: 700, color: 'var(--grey)' }}>
                    £{vestiairePayout.toFixed(0)}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>You earn</p>
                </div>
              </div>
            </div>

            {/* eBay */}
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>eBay</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--grey)' }}>12.8% + 30p fee</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 1px', fontSize: 22, fontWeight: 700, color: 'var(--grey)' }}>
                    £{ebayPayout.toFixed(0)}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--grey)' }}>You earn</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} style={{
                display: 'flex',
                gap: 16,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 20px',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent-coral)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15, flexShrink: 0,
                }}>
                  {step.step}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{step.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust signals ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 40,
        }}>
          {TRUST_SIGNALS.map(signal => (
            <span key={signal} style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              ✓ {signal}
            </span>
          ))}
        </div>

        {/* ── Brands we accept ── */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Brands we accept</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {BRAND_CHIPS.map(brand => (
              <span key={brand} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
              }}>
                {brand}
              </span>
            ))}
            <span style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--grey)',
            }}>
              More coming soon
            </span>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/signup" style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--accent-coral)',
            color: '#fff',
            borderRadius: 999,
            padding: '16px 48px',
            textDecoration: 'none',
            fontSize: 17,
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(255,35,86,0.28)',
          }}>
            Ready to list? →
          </Link>
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--grey)' }}>
            Free to list · No subscription · UK bags only · £200+ retail value
          </p>
        </div>
      </div>
    </AppShell>
  );
}
