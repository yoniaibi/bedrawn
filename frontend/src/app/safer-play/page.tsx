import Link from 'next/link';

export default function SaferPlayPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 60px' }}>
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ textDecoration: 'none', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>bedrawn</Link>
        <span style={{ color: 'var(--border-default)', fontSize: 18 }}>·</span>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Safer Play</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Safer Play</h1>
        <p style={{ margin: '0 0 40px', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          bedrawn is a prize draw service. We want you to enjoy it — and we take our responsibility around gambling-adjacent harm seriously. Here&apos;s how we help you stay in control.
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Your controls</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { title: 'Monthly spend limit', desc: 'Cap how much you can top up each calendar month. Set it to £0 to pause all spending.' },
              { title: 'Take a break', desc: 'Pause your account for 6, 9, 12, or 24 months — or permanently. Your account is suspended immediately.' },
              { title: 'Spending check-in', desc: 'We show a banner when your monthly spend crosses £200, with a direct link to these tools.' },
            ].map(item => (
              <div key={item.title} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/account/safer-play" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 999, background: 'var(--accent-pink)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Go to your safer play settings →
            </Link>
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Free support — available 24/7</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>GamCare</p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Free, confidential support for anyone affected by problem gambling — including friends and family. Available 24 hours a day, 7 days a week.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="tel:08088020133" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-lilac)', textDecoration: 'none' }}>0808 802 0133</a>
                <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent-lilac)', textDecoration: 'none' }}>gamcare.org.uk →</a>
              </div>
            </div>
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>BeGambleAware</p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Information, advice and support to help keep gambling fun and prevent harm.
              </p>
              <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent-lilac)', textDecoration: 'none' }}>begambleaware.org →</a>
            </div>
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Gamblers Anonymous UK</p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Peer support meetings for people with a gambling problem, run by people who have been through it.
              </p>
              <a href="https://www.gamblersanonymous.org.uk" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent-lilac)', textDecoration: 'none' }}>gamblersanonymous.org.uk →</a>
            </div>
          </div>
        </section>

        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          bedrawn is a prize draw, not a lottery. No purchase is ever necessary to enter or win. 18+ only.
        </p>
      </div>
    </div>
  );
}
