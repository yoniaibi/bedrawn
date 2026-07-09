'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function getRealId(idProp: string): string {
  if (typeof window === 'undefined') return idProp;
  const segments = window.location.pathname.split('/').filter(Boolean);
  return segments[1] || idProp;
}

function formatUKDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface DrawInfo {
  id: string;
  title: string;
  closingDate?: string;
  postalDeadline?: string;
  status?: string;
}

const POSTAL_ADDRESS = process.env.NEXT_PUBLIC_POSTAL_ADDRESS ?? 'bedrawn, [Postal Address — check bedrawn.app]';

export default function PostalEntryClient({ params }: { params: { id: string } }) {
  const [draw, setDraw] = useState<DrawInfo | null>(null);

  useEffect(() => {
    const id = getRealId(params.id);
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) return;
    fetch(`${url}/draws/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.draw) setDraw(data.draw as DrawInfo); })
      .catch(() => {});
  }, [params.id]);

  const drawId = draw?.id ?? getRealId(params.id);
  const closingFormatted = draw?.closingDate ? formatUKDate(draw.closingDate) : '—';
  const postalFormatted = draw?.postalDeadline ? formatUKDate(draw.postalDeadline) : '—';
  const isClosed = draw?.status && draw.status !== 'open' && draw.status !== 'pending_verification';

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          .form-wrap { background: white !important; padding: 0 !important; }
        }
        @page { size: A5 portrait; margin: 0.8cm; }
      `}</style>

      <div className="no-print" style={{ background: '#0D0B14', padding: '20px 16px 0', borderBottom: '1px solid #2A2440' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Link href={`/draw/${drawId}`} style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}>
            ← Back to draw
          </Link>
          <div style={{ padding: '20px 0 20px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Free postal entry</p>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 480 }}>
              No purchase necessary. Print the form below, fill it in by hand and post it to us before the postal deadline.
              One postal entry per person per draw. Photocopies not accepted.
            </p>
            {isClosed ? (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#EF4444', fontSize: 14, margin: 0 }}>This draw is no longer accepting entries.</p>
              </div>
            ) : (
              <button
                onClick={() => window.print()}
                style={{
                  padding: '12px 28px', borderRadius: 999, background: '#8B5CF6', border: 'none',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 4,
                }}
              >
                Print this form ↓
              </button>
            )}
            {draw?.postalDeadline && (
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
                Postal entries must be received by {postalFormatted}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="form-wrap" style={{ background: '#0D0B14', padding: '24px 16px 48px' }}>
        <div style={{
          maxWidth: 560, margin: '0 auto', background: '#fff', color: '#000',
          padding: '24px 28px', fontFamily: 'Georgia, serif', fontSize: 12,
          lineHeight: 1.5, borderRadius: 4, boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, fontStyle: 'italic', color: '#111', letterSpacing: -0.5 }}>bedrawn</p>
              <p style={{ margin: '2px 0 0', fontSize: 9, color: '#666', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>bedrawn.app</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#111', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>Free Postal Entry</p>
              <p style={{ margin: '2px 0 0', fontSize: 9, color: '#888', fontFamily: 'sans-serif' }}>No purchase necessary</p>
            </div>
          </div>

          <div style={{ borderTop: '2px solid #111', marginBottom: 14 }} />

          <div style={{ background: '#F8F8F8', border: '1px solid #ddd', borderRadius: 4, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontFamily: 'sans-serif', color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Draw Details</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'sans-serif' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#666', paddingBottom: 4, width: '32%', verticalAlign: 'top' }}>Draw</td>
                  <td style={{ fontWeight: 700, color: '#111', paddingBottom: 4 }}>{draw?.title ?? 'Loading…'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', paddingBottom: 4, verticalAlign: 'top' }}>Draw ID</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#111', letterSpacing: 0.5, paddingBottom: 4 }}>{drawId}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', paddingBottom: 4 }}>Draw closes</td>
                  <td style={{ fontWeight: 600, color: '#111', paddingBottom: 4 }}>{closingFormatted} at 9pm</td>
                </tr>
                <tr>
                  <td style={{ color: '#c00', fontWeight: 700 }}>Postal deadline</td>
                  <td style={{ fontWeight: 700, color: '#c00' }}>
                    {postalFormatted} at 9pm
                    <span style={{ fontWeight: 400, color: '#666', fontSize: 10, marginLeft: 4 }}>(must be received, not postmarked)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: 10, fontFamily: 'sans-serif', color: '#333', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
            Your Details — please print clearly in block capitals
          </p>

          {[{ label: 'Full name', lines: 1 }, { label: 'bedrawn account email or username', lines: 1 }].map(field => (
            <div key={field.label} style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 2px', fontSize: 10, fontFamily: 'sans-serif', color: '#666' }}>{field.label}</p>
              {Array.from({ length: field.lines }).map((_, i) => (
                <div key={i} style={{ borderBottom: '1px solid #333', height: 26, marginBottom: 2 }} />
              ))}
            </div>
          ))}

          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontFamily: 'sans-serif', color: '#666' }}>
              Delivery address <span style={{ fontWeight: 700, color: '#111' }}>(where to send your prize if you win)</span>
            </p>
            {['Address line 1', 'Address line 2 (optional)', 'Town / City', 'County (optional)', 'Postcode'].map(line => (
              <div key={line} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: '#888', fontFamily: 'sans-serif', whiteSpace: 'nowrap', width: 100, flexShrink: 0, paddingBottom: 2 }}>{line}</span>
                <div style={{ flex: 1, borderBottom: '1px solid #333', height: 24 }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontFamily: 'sans-serif', color: '#666' }}>
              Phone number <span style={{ color: '#aaa' }}>(optional — only used if we can&#39;t reach you by email)</span>
            </p>
            <div style={{ borderBottom: '1px solid #333', height: 26 }} />
          </div>

          <div style={{ borderTop: '1px solid #ccc', marginBottom: 10 }} />

          <div style={{ background: '#F8F8F8', border: '1px solid #e0e0e0', borderRadius: 3, padding: '8px 10px', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 9, fontFamily: 'sans-serif', color: '#444', lineHeight: 1.7 }}>
              <strong>No purchase necessary.</strong> One postal entry per person per draw. Handwritten entries only — photocopies not accepted.
              Entry must be <strong>received</strong> by the postal deadline above (not postmarked). This is a UK prize draw, not a lottery.
              By entering you agree to bedrawn&apos;s terms at bedrawn.app/terms.
              Promoter: bedrawn. Winners selected by cryptographically secure random draw at 9pm on the draw close date.
            </p>
          </div>

          <div style={{ border: '2px dashed #999', borderRadius: 4, padding: '10px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 9, fontFamily: 'sans-serif', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Post this form to</p>
            <p style={{ margin: 0, fontSize: 12, fontFamily: 'sans-serif', fontWeight: 700, color: '#111', lineHeight: 1.6 }}>{POSTAL_ADDRESS}</p>
            <p style={{ margin: '4px 0 0', fontSize: 9, fontFamily: 'sans-serif', color: '#888' }}>
              Please use an envelope. Postcard entries (handwritten on a postcard, no form required) are also accepted.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
