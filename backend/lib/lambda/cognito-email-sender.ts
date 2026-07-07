import { buildClient, CommitmentPolicy, KmsKeyringNode } from '@aws-crypto/client-node';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Resend } from 'resend';

const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);
const ssmClient = new SSMClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });

const FROM = 'BeDrawn <verification@bedrawn.app>';

let _resend: Resend | null = null;
async function getResend(): Promise<Resend> {
  if (_resend) return _resend;
  const res = await ssmClient.send(new GetParameterCommand({
    Name: process.env.RESEND_API_KEY_PARAM ?? '/bedrawn/resend/api-key-full',
    WithDecryption: true,
  }));
  _resend = new Resend(res.Parameter!.Value!);
  return _resend;
}

async function decryptCode(encryptedCode: string): Promise<string> {
  const keyring = new KmsKeyringNode({ keyIds: [process.env.KMS_KEY_ARN!] });
  const { plaintext } = await decrypt(keyring, Buffer.from(encryptedCode, 'base64'));
  return plaintext.toString();
}

function brandedLayout(content: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0D0B14;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#FF2356 0%,#FF4E6A 100%);padding:28px 40px;display:flex;align-items:center;gap:12px">
        <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fff">BeDrawn</span>
      </div>
      <div style="padding:32px 40px">
        ${content}
      </div>
      <div style="padding:16px 40px;border-top:1px solid #2A2440">
        <p style="font-size:12px;color:#4B5563;margin:0">
          BeDrawn · Every night at 9pm ·
          <a href="https://bedrawn.app" style="color:#FF2356;text-decoration:none">bedrawn.app</a>
        </p>
      </div>
    </div>
  `;
}

export const handler = async (event: any): Promise<any> => {
  const triggerSource: string = event.triggerSource ?? '';
  const userAttrs = event.request?.userAttributes ?? {};
  const name: string = userAttrs.name || userAttrs.email?.split('@')[0] || 'there';
  const toEmail: string = userAttrs.email;

  if (!toEmail) return event;

  let code = '';
  if (event.request?.code) {
    try {
      code = await decryptCode(event.request.code);
    } catch (err) {
      console.error('KMS decryption failed:', err);
      return event;
    }
  }

  const resend = await getResend();

  try {
    if (triggerSource === 'CustomEmailSender_SignUp' || triggerSource === 'CustomEmailSender_ResendCode') {
      await resend.emails.send({
        from: FROM,
        to: toEmail,
        subject: `Your BeDrawn verification code: ${code}`,
        html: brandedLayout(`
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Verify your email</h2>
          <p style="color:#9CA3AF;margin:0 0 28px;font-size:15px">Hi ${name}, welcome to BeDrawn. Enter this code to confirm your account:</p>
          <div style="background:#1A1628;border:1px solid #2A2440;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#FF2356">${code}</span>
          </div>
          <p style="color:#4B5563;font-size:13px;margin:0">This code expires in 24 hours. If you didn't create a BeDrawn account, you can safely ignore this email.</p>
        `),
      });
    } else if (triggerSource === 'CustomEmailSender_ForgotPassword') {
      await resend.emails.send({
        from: FROM,
        to: toEmail,
        subject: `Reset your BeDrawn password`,
        html: brandedLayout(`
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Reset your password</h2>
          <p style="color:#9CA3AF;margin:0 0 28px;font-size:15px">Hi ${name}, use this code to set a new password for your BeDrawn account:</p>
          <div style="background:#1A1628;border:1px solid #2A2440;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#FF2356">${code}</span>
          </div>
          <p style="color:#4B5563;font-size:13px;margin:0 0 8px">This code expires in 1 hour.</p>
          <p style="color:#4B5563;font-size:13px;margin:0">If you didn't request a password reset, your account is safe — no changes have been made.</p>
        `),
      });
    } else if (
      triggerSource === 'CustomEmailSender_UpdateUserAttribute' ||
      triggerSource === 'CustomEmailSender_VerifyUserAttribute'
    ) {
      await resend.emails.send({
        from: FROM,
        to: toEmail,
        subject: `Your BeDrawn verification code: ${code}`,
        html: brandedLayout(`
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Verify your new email</h2>
          <p style="color:#9CA3AF;margin:0 0 28px;font-size:15px">Hi ${name}, enter this code to verify your updated email address:</p>
          <div style="background:#1A1628;border:1px solid #2A2440;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#FF2356">${code}</span>
          </div>
          <p style="color:#4B5563;font-size:13px;margin:0">This code expires in 24 hours.</p>
        `),
      });
    }
  } catch (err) {
    console.error(`Failed to send ${triggerSource} email to ${toEmail}:`, err);
  }

  return event;
};
