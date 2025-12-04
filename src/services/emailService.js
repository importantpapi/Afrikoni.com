/**
 * Email Service for Afrikoni
 * 
 * Supports multiple email providers:
 * - Resend (recommended)
 * - SendGrid
 * - Supabase Edge Functions
 * 
 * To enable:
 * 1. Choose a provider and get API key
 * 2. Add to .env: VITE_EMAIL_PROVIDER=resend (or sendgrid, supabase)
 * 3. Add API key: VITE_EMAIL_API_KEY=your_api_key
 * 4. Uncomment the provider code below
 */

import { emailTemplates } from './emailTemplates';

const EMAIL_PROVIDER = import.meta.env.VITE_EMAIL_PROVIDER || 'none';
const EMAIL_API_KEY = import.meta.env.VITE_EMAIL_API_KEY;

/**
 * Send email using configured provider
 */
export async function sendEmail({
  to,
  subject,
  template,
  data = {},
  from = 'Afrikoni <hello@afrikoni.com>'
}) {
  if (!EMAIL_API_KEY || EMAIL_PROVIDER === 'none') {
    if (import.meta.env.DEV) {
      console.log('📧 Email (not sent - no provider configured):', {
        to,
        subject,
        template,
        data
      });
    }
    return { success: false, error: 'Email provider not configured' };
  }

  try {
    const html = emailTemplates[template] ? emailTemplates[template](data) : emailTemplates.default(data);
    
    switch (EMAIL_PROVIDER) {
      case 'resend':
        return await sendViaResend({ to, subject, html, from });
      
      case 'sendgrid':
        return await sendViaSendGrid({ to, subject, html, from });
      
      case 'supabase':
        return await sendViaSupabase({ to, subject, html, from });
      
      default:
        throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
    }
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Resend (https://resend.com)
 */
async function sendViaResend({ to, subject, html, from }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_API_KEY}`
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid({ to, subject, html, from }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_API_KEY}`
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send email via SendGrid');
  }

  return { success: true };
}

/**
 * Send via Supabase Edge Function
 * Requires a Supabase Edge Function to be deployed
 */
async function sendViaSupabase({ to, subject, html, from }) {
  const { supabase } = await import('@/api/supabaseClient');
  
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject,
      html,
      from
    }
  });

  if (error) throw error;
  return { success: true, data };
}

/**
 * Convenience functions for common emails
 */
export async function sendWelcomeEmail(userEmail, userName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Afrikoni!',
    template: 'welcome',
    data: { userName }
  });
}

export async function sendOrderConfirmationEmail(userEmail, orderData) {
  return await sendEmail({
    to: userEmail,
    subject: `Order Confirmation #${orderData.orderNumber}`,
    template: 'orderConfirmation',
    data: orderData
  });
}

export async function sendRFQReceivedEmail(userEmail, rfqData) {
  return await sendEmail({
    to: userEmail,
    subject: `New RFQ: ${rfqData.title}`,
    template: 'rfqReceived',
    data: rfqData
  });
}

export async function sendQuoteSubmittedEmail(userEmail, quoteData) {
  return await sendEmail({
    to: userEmail,
    subject: `New Quote for Your RFQ`,
    template: 'quoteSubmitted',
    data: quoteData
  });
}

export async function sendPaymentReceivedEmail(userEmail, paymentData) {
  return await sendEmail({
    to: userEmail,
    subject: `Payment Received - ${paymentData.amount}`,
    template: 'paymentReceived',
    data: paymentData
  });
}

export async function sendOrderShippedEmail(userEmail, orderData) {
  return await sendEmail({
    to: userEmail,
    subject: `Your Order #${orderData.orderNumber} Has Shipped`,
    template: 'orderShipped',
    data: orderData
  });
}

export async function sendDisputeOpenedEmail(userEmail, disputeData) {
  return await sendEmail({
    to: userEmail,
    subject: `Dispute Opened for Order #${disputeData.orderNumber}`,
    template: 'disputeOpened',
    data: disputeData
  });
}

