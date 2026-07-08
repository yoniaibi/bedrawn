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
