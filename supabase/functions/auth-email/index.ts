// Auth email helper function
// Generates Supabase auth links (signup verification, password recovery)
// and sends branded Afrikoni emails via Resend using hello@afrikoni.com.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const OFFICIAL_EMAIL = 'hello@afrikoni.com';
const OFFICIAL_EMAIL_NAME = 'Afrikoni';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('auth-email function missing SUPABASE_URL or SERVICE_ROLE_KEY');
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const baseStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4A574 0%, #8B4513 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .button { display: inline-block; padding: 12px 24px; background: #D4A574; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
    }
  </style>
`;

function wrapTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${baseStyles}
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">AFRIKONI</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Trade. Trust. Thrive.</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 10px 0;">
          <strong>Afrikoni</strong> - Africa's Leading B2B Marketplace
        </p>
        <p style="margin: 0 0 10px 0;">
          <a href="https://afrikoni.com" style="color: #D4A574; text-decoration: none;">Visit Website</a> |
          <a href="https://afrikoni.com/help" style="color: #D4A574; text-decoration: none;">Help Center</a> |
          <a href="mailto:hello@afrikoni.com" style="color: #D4A574; text-decoration: none;">Contact Us</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #999;">
          You're receiving this email because you have an account with Afrikoni.<br />
          Questions? Reply to this email or contact us at <a href="mailto:hello@afrikoni.com" style="color: #D4A574;">hello@afrikoni.com</a><br />
          © ${new Date().getFullYear()} Afrikoni. All rights reserved.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

type Payload = {
  type: 'password_reset' | 'email_verification';
  email: string;
  name?: string;
  redirectTo?: string;
};

async function generateAuthLink(payload: Payload): Promise<string> {
  const redirectTo =
    payload.redirectTo || `${SUPABASE_URL}/auth/v1/verify`;

  const type =
    payload.type === 'password_reset' ? 'recovery' : 'signup';

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: type as any,
    email: payload.email,
    options: { redirectTo },
  });

  if (error) throw error;

  // supabase v2 returns action_link on data and in properties
  const link =
    (data as any)?.action_link ||
    (data as any)?.properties?.action_link;

  if (!link) {
    throw new Error('No action_link returned from Supabase');
  }

  return link as string;
}

async function sendViaResend(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${OFFICIAL_EMAIL_NAME} <${OFFICIAL_EMAIL}>`,
      to: [to],
      subject,
      html,
      reply_to: OFFICIAL_EMAIL,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }
}

function buildPasswordResetHtml(name: string, link: string) {
  const content = `
    <h2 style="color: #8B4513; margin-top: 0;">Password Reset Request</h2>
    <p>Hello ${name || 'there'},</p>
    <p>We received a request to reset your password for your Afrikoni account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link}" class="button">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #666;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${link}" style="color: #D4A574; word-break: break-all;">${link}</a>
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If you didn't request this, you can safely ignore this email and your password will remain unchanged.
    </p>
  `;
  return wrapTemplate(content);
}

function buildVerificationHtml(name: string, link: string) {
  const content = `
    <h2 style="color: #8B4513; margin-top: 0;">Verify Your Email Address</h2>
    <p>Hello ${name || 'there'},</p>
    <p>Thank you for signing up with Afrikoni! Please verify your email address to complete your account setup.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link}" class="button">Verify Email Address</a>
    </div>
    <p style="font-size: 14px; color: #666;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${link}" style="color: #D4A574; word-break: break-all;">${link}</a>
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      This link will expire soon for security reasons. If you didn't create an account, you can safely ignore this email.
    </p>
  `;
  return wrapTemplate(content);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.email || !payload?.type) {
      return new Response('Invalid payload', { status: 400 });
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const link = await generateAuthLink(payload);

    if (payload.type === 'password_reset') {
      const html = buildPasswordResetHtml(payload.name || 'there', link);
      await sendViaResend(payload.email, 'Reset Your Afrikoni Password', html);
    } else {
      const html = buildVerificationHtml(payload.name || 'there', link);
      await sendViaResend(payload.email, 'Verify Your Afrikoni Account', html);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('auth-email error', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});


