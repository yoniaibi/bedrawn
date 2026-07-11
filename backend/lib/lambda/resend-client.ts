import { Resend } from 'resend';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });

let _resend: Resend | null = null;

async function getResend(): Promise<Resend> {
  if (_resend) return _resend;
  const paramName = process.env.RESEND_API_KEY_PARAM ?? '/bedrawn/resend/api-key-full';
  const res = await ssmClient.send(new GetParameterCommand({ Name: paramName, WithDecryption: true }));
  _resend = new Resend(res.Parameter!.Value!);
  return _resend;
}

export const FROM = 'bedrawn <noreply@bedrawn.app>';
export const FROM_SUPPORT = 'bedrawn <support@bedrawn.app>';

export async function sendWinnerEmail(to: string, drawTitle: string, drawId: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🎉 You won the ${drawTitle} draw!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0D0B14;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#EC4899;padding:32px 40px">
          <h1 style="margin:0;font-size:28px">You won! 🎉</h1>
        </div>
        <div style="padding:32px 40px">
          <p style="font-size:16px;line-height:1.6">Congratulations — you've been selected as the winner of the <strong>${drawTitle}</strong> draw on bedrawn.</p>
          <p style="font-size:15px;color:#9CA3AF">The seller has been notified and will be in touch within 24 hours to arrange delivery.</p>
          <a href="https://bedrawn.app/draw/${drawId}/winner" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#EC4899;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            View your win →
          </a>
        </div>
        <div style="padding:16px 40px;border-top:1px solid #2A2440">
          <p style="font-size:12px;color:#4B5563;margin:0">bedrawn · Every night at 9pm · <a href="https://bedrawn.app" style="color:#EC4899">bedrawn.app</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendSellerResolvedEmail(
  to: string,
  drawTitle: string,
  soldTickets: number,
  ticketPricePence: number,
  verificationFeePence = 0,
): Promise<void> {
  const resend = await getResend();
  const grossPounds = ((soldTickets * ticketPricePence) / 100).toFixed(2);
  const platformFeePounds = ((soldTickets * ticketPricePence * 0.12) / 100).toFixed(2);
  const legitFeePounds = (verificationFeePence / 100).toFixed(2);
  const netPounds = ((soldTickets * ticketPricePence * 0.88 - verificationFeePence) / 100).toFixed(2);
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your draw resolved — ${drawTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0D0B14;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#8B5CF6;padding:32px 40px">
          <h1 style="margin:0;font-size:24px">Draw resolved ✓</h1>
        </div>
        <div style="padding:32px 40px">
          <p style="font-size:16px;line-height:1.6">Your draw for <strong>${drawTitle}</strong> has been resolved and a winner selected.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr style="border-bottom:1px solid #2A2440">
              <td style="padding:10px 0;color:#9CA3AF;font-size:14px">Tickets sold</td>
              <td style="padding:10px 0;text-align:right;font-size:14px">${soldTickets}</td>
            </tr>
            <tr style="border-bottom:1px solid #2A2440">
              <td style="padding:10px 0;color:#9CA3AF;font-size:14px">Gross revenue</td>
              <td style="padding:10px 0;text-align:right;font-size:14px">£${grossPounds}</td>
            </tr>
            <tr style="border-bottom:1px solid #2A2440">
              <td style="padding:10px 0;color:#9CA3AF;font-size:14px">Platform fee (12%)</td>
              <td style="padding:10px 0;text-align:right;font-size:14px;color:#EF4444">−£${platformFeePounds}</td>
            </tr>
            ${verificationFeePence > 0 ? `
            <tr style="border-bottom:1px solid #2A2440">
              <td style="padding:10px 0;color:#9CA3AF;font-size:14px">LegitApp authentication</td>
              <td style="padding:10px 0;text-align:right;font-size:14px;color:#EF4444">−£${legitFeePounds}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#fff;font-size:14px;font-weight:700">You receive</td>
              <td style="padding:10px 0;text-align:right;font-size:14px;font-weight:700;color:#10B981">£${netPounds}</td>
            </tr>
          </table>
          <p style="font-size:14px;color:#9CA3AF">Your payout will be processed within 24 hours of the winner confirming delivery. Check your seller dashboard for updates.</p>
          <a href="https://bedrawn.app/seller/dashboard" style="display:inline-block;margin-top:16px;padding:14px 28px;background:#8B5CF6;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            View dashboard →
          </a>
        </div>
        <div style="padding:16px 40px;border-top:1px solid #2A2440">
          <p style="font-size:12px;color:#4B5563;margin:0">bedrawn · Every night at 9pm · <a href="https://bedrawn.app" style="color:#8B5CF6">bedrawn.app</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendVerificationRejectedEmail(to: string, drawTitle: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM_SUPPORT,
    to,
    subject: `Authentication update — ${drawTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0D0B14;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#374151;padding:32px 40px">
          <h1 style="margin:0;font-size:24px">Authentication result</h1>
        </div>
        <div style="padding:32px 40px">
          <p style="font-size:16px;line-height:1.6">We're sorry — your listing <strong>${drawTitle}</strong> could not be authenticated by LegitApp.</p>
          <p style="font-size:14px;color:#9CA3AF;line-height:1.6">The authentication fee has been waived and your listing has not gone live.</p>
          <p style="font-size:14px;color:#9CA3AF;line-height:1.6">You're welcome to relist with clearer photos or contact LegitApp directly at <a href="https://legitapp.com" style="color:#8B5CF6">legitapp.com</a> for more detail on the outcome.</p>
          <a href="https://bedrawn.app/seller/dashboard" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#8B5CF6;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            View dashboard →
          </a>
        </div>
        <div style="padding:16px 40px;border-top:1px solid #2A2440">
          <p style="font-size:12px;color:#4B5563;margin:0">bedrawn · <a href="https://bedrawn.app" style="color:#8B5CF6">bedrawn.app</a></p>
        </div>
      </div>
    `,
  });
}

// ─── Post-draw verification + shipping emails (warm cream aesthetic) ─────────
// bg #FAF8F5 · text #1A1410 · accent #EC4899

function creamShell(heading: string, inner: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#FAF8F5;color:#1A1410;border-radius:12px;overflow:hidden;border:1px solid #EDE7DE">
      <div style="background:#EC4899;padding:28px 40px">
        <h1 style="margin:0;font-size:24px;color:#fff">${heading}</h1>
      </div>
      <div style="padding:32px 40px">
        ${inner}
      </div>
      <div style="padding:16px 40px;border-top:1px solid #EDE7DE">
        <p style="font-size:12px;color:#8A8178;margin:0">bedrawn · <a href="https://www.bedrawn.app" style="color:#EC4899">bedrawn.app</a></p>
      </div>
    </div>
  `;
}

const creamButton = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#EC4899;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${label}</a>`;

export async function sendVerificationPassedEmail(to: string, drawTitle: string, winnerId: string, winnerHandle: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your item is verified — ship it now',
    html: creamShell('Verified — time to ship', `
      <p style="font-size:16px;line-height:1.6"><strong>${drawTitle}</strong> passed authentication. The winner is <strong>@${winnerHandle}</strong>.</p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B">Please ship the item with <strong>tracked postage</strong> and upload the tracking number in your account. Your payout releases 7 days after tracking is uploaded, or as soon as the winner confirms delivery.</p>
      ${creamButton('https://www.bedrawn.app/account/draws', 'Upload tracking →')}
    `),
  });
}

export async function sendSellerResolvedPendingAuthEmail(to: string, drawTitle: string, soldTickets: number, ticketPricePence: number): Promise<void> {
  const resend = await getResend();
  const grossPounds = ((soldTickets * ticketPricePence) / 100).toFixed(2);
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your draw resolved — verification in progress',
    html: creamShell('Draw resolved', `
      <p style="font-size:16px;line-height:1.6">Your draw for <strong>${drawTitle}</strong> has closed and a winner has been picked — ${soldTickets} tickets sold (£${grossPounds} gross).</p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B">We're authenticating the item now. This usually takes up to 24 hours — you'll get an email telling you when to ship.</p>
      ${creamButton('https://www.bedrawn.app/account/draws', 'View your draws →')}
    `),
  });
}

export async function sendWinnerTrackingEmail(to: string, drawTitle: string, carrier: string, trackingNumber: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your item is on its way!',
    html: creamShell('On its way', `
      <p style="font-size:16px;line-height:1.6">The seller has shipped <strong>${drawTitle}</strong>.</p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B">Carrier: <strong>${carrier}</strong><br/>Tracking: <strong>${trackingNumber}</strong></p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B">Once it arrives, confirm delivery in your account — otherwise it auto-releases in 7 days.</p>
      ${creamButton('https://www.bedrawn.app/account/draws', 'Confirm delivery →')}
    `),
  });
}

export async function sendDisputeReceivedEmail(to: string, drawTitle: string, drawId: string, reason: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM_SUPPORT,
    to,
    subject: `Dispute raised — ${drawTitle}`,
    html: creamShell('Dispute raised', `
      <p style="font-size:16px;line-height:1.6">The winner of <strong>${drawTitle}</strong> raised a dispute:</p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B;border-left:3px solid #EC4899;padding-left:12px">${reason}</p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B">The payout is on hold until the dispute is resolved.</p>
      ${creamButton(`https://www.bedrawn.app/admin/draws/${drawId}`, 'Review dispute →')}
    `),
  });
}

export async function sendAutoReleasedSellerEmail(to: string, drawTitle: string, netPounds: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payout released — ${drawTitle}`,
    html: creamShell('Payout released', `
      <p style="font-size:16px;line-height:1.6">The 7-day delivery window for <strong>${drawTitle}</strong> closed with no dispute, so your payout of <strong>£${netPounds}</strong> has been auto-released to your Stripe account.</p>
      ${creamButton('https://www.bedrawn.app/account/draws', 'View your draws →')}
    `),
  });
}

export async function sendAutoReleasedWinnerEmail(to: string, drawTitle: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Delivery window closed — ${drawTitle}`,
    html: creamShell('Delivery window closed', `
      <p style="font-size:16px;line-height:1.6">Your 7-day window for <strong>${drawTitle}</strong> has closed, so we've assumed the item was delivered and released the seller's payout.</p>
      <p style="font-size:15px;line-height:1.6;color:#5C544B">If something's wrong, contact support and we'll look into it.</p>
      ${creamButton('https://www.bedrawn.app/account/draws', 'View your draws →')}
    `),
  });
}

export async function sendCancelledEmail(to: string, drawTitle: string, refundPounds: string): Promise<void> {
  const resend = await getResend();
  await resend.emails.send({
    from: FROM_SUPPORT,
    to,
    subject: `Draw cancelled — refund issued for ${drawTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0D0B14;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#374151;padding:32px 40px">
          <h1 style="margin:0;font-size:24px">Draw cancelled</h1>
        </div>
        <div style="padding:32px 40px">
          <p style="font-size:16px;line-height:1.6">The draw for <strong>${drawTitle}</strong> did not reach its reserve and has been cancelled.</p>
          <p style="font-size:16px">A refund of <strong style="color:#10B981">£${refundPounds}</strong> has been added to your bedrawn wallet.</p>
          <a href="https://bedrawn.app/account/wallet" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#EC4899;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            View wallet →
          </a>
        </div>
        <div style="padding:16px 40px;border-top:1px solid #2A2440">
          <p style="font-size:12px;color:#4B5563;margin:0">bedrawn · Every night at 9pm · <a href="https://bedrawn.app" style="color:#EC4899">bedrawn.app</a></p>
        </div>
      </div>
    `,
  });
}
