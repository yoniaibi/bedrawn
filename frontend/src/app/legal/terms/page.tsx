'use client';

import Link from 'next/link';

const sections = [
  {
    title: '1. Introduction',
    body: 'Welcome to bedrawn. By accessing or using our platform, you agree to be bound by these Terms of Service. bedrawn is a luxury goods raffle platform operated from London, United Kingdom. These terms govern your use of the platform as a buyer, seller, or guest.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years of age to participate in draws on bedrawn. By creating an account, you confirm that you meet this requirement. Draws on bedrawn are available to residents of the United Kingdom only, unless otherwise stated.',
  },
  {
    title: '3. How Draws Work',
    body: 'Each draw on bedrawn operates on a ticket raffle basis. Buyers purchase tickets at a fixed price per ticket. All draws close at 9pm GMT each night. Winners are selected randomly from all eligible ticket holders at close of draw. The probability of winning is proportional to the number of tickets held.',
  },
  {
    title: '4. Free Postal Entry',
    body: 'In compliance with UK gambling regulations, every draw on bedrawn offers a free method of entry by post. Instructions for postal entry are available on each draw\'s detail page. Postal entries are entered into the same pool as paid ticket holders and have an equal chance of winning.',
  },
  {
    title: '5. Wallet & Payments',
    body: 'bedrawn operates a prepaid wallet system. Funds added to your wallet are used to purchase draw tickets. Wallet top-ups are non-refundable except where required by law. Unused wallet balances can be withdrawn upon account closure, subject to identity verification.',
  },
  {
    title: '6. Seller Terms',
    body: 'Sellers on bedrawn must complete identity verification before any listings go live. Sellers agree that items listed accurately represent the item\'s condition and authenticity. Misrepresentation may result in listing removal, account suspension, and liability for liquidated damages. Sellers receive approximately 77% of total ticket revenue from their draw upon close.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All content on bedrawn, including logos, design, and copy, is the property of bedrawn and may not be reproduced without written permission. User-generated content uploaded to the platform (including photos) grants bedrawn a licence to display and promote that content in connection with the platform.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'bedrawn is not liable for losses arising from technical issues, delayed delivery of prizes, or third-party seller conduct. Our liability to you in any circumstances is limited to the amount you paid for tickets in the relevant draw. Nothing in these terms limits liability for fraud or death or personal injury caused by negligence.',
  },
  {
    title: '9. Changes to Terms',
    body: 'bedrawn reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance. We will notify you of material changes via email or in-app notification.',
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/account" style={{ color: 'var(--grey)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Terms of Service</p>
        </div>

        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)' }}>Last updated: January 2026</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sections.map(s => (
              <div key={s.title}>
                <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--grey)', lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>For questions, contact legal@bedrawn.app</p>
            <Link href="/legal/privacy" style={{ fontSize: 12, color: 'var(--purple)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
