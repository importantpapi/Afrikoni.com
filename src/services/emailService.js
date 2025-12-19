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
  from = 'Afrikoni <hello@afrikoni.com>', // Official email: hello@afrikoni.com
}) {
  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: 'Invalid email address' };
  }

  if (!EMAIL_API_KEY || EMAIL_PROVIDER === 'none') {
    if (import.meta.env.DEV) {
      console.log('📧 Email (not sent - no provider configured):', {
        to,
        subject,
        template,
        data
      });
    }
    return { success: false, error: 'Email provider not configured. Please contact support.' };
  }

  // Validate API key format for Resend
  if (EMAIL_PROVIDER === 'resend' && EMAIL_API_KEY && !EMAIL_API_KEY.startsWith('re_')) {
    console.warn('⚠️ Resend API key format may be incorrect (should start with "re_")');
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
    console.error('📧 Email send error:', error);
    console.error('Email config:', {
      provider: EMAIL_PROVIDER,
      hasKey: !!EMAIL_API_KEY,
      keyLength: EMAIL_API_KEY?.length || 0
    });
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Send via Resend (https://resend.com)
 */
async function sendViaResend({ to, subject, html, from }) {
  // Ensure all emails use hello@afrikoni.com as official address
  const officialEmail = 'hello@afrikoni.com';
  const fromAddress = from || `Afrikoni <${officialEmail}>`;
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_API_KEY}`
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html,
      reply_to: officialEmail, // All replies go to hello@afrikoni.com
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    
    // Provide user-friendly error messages
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check email configuration.');
    } else if (response.status === 403) {
      throw new Error('Email sending not authorized. Please verify domain settings.');
    } else if (response.status === 422) {
      throw new Error(`Invalid email: ${errorMessage}`);
    } else {
      throw new Error(`Email send failed: ${errorMessage}`);
    }
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid({ to, subject, html, from }) {
  // Ensure all emails use hello@afrikoni.com as official address
  const officialEmail = 'hello@afrikoni.com';
  const fromAddress = from || `Afrikoni <${officialEmail}>`;
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMAIL_API_KEY}`
    },
    body: JSON.stringify({
      personalizations: [{ 
        to: [{ email: to }],
        reply_to: { email: officialEmail } // All replies go to hello@afrikoni.com
      }],
      from: { email: fromAddress },
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

export async function sendPasswordResetEmail(userEmail, resetLink, userName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Reset Your Afrikoni Password',
    template: 'passwordReset',
    data: { resetLink, userName, expiresIn: '24 hours' }
  });
}

export async function sendAccountVerificationEmail(userEmail, verificationLink, userName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Verify Your Afrikoni Account',
    template: 'accountVerification',
    data: { verificationLink, userName }
  });
}

export async function sendOrderCancelledEmail(userEmail, orderData) {
  return await sendEmail({
    to: userEmail,
    subject: `Order #${orderData.orderNumber} Cancelled`,
    template: 'orderCancelled',
    data: orderData
  });
}

export async function sendOrderDeliveredEmail(userEmail, orderData) {
  return await sendEmail({
    to: userEmail,
    subject: `Order #${orderData.orderNumber} Delivered`,
    template: 'orderDelivered',
    data: orderData
  });
}

export async function sendPaymentReleasedEmail(userEmail, paymentData) {
  return await sendEmail({
    to: userEmail,
    subject: `Payment Released for Order #${paymentData.orderNumber}`,
    template: 'paymentReleased',
    data: paymentData
  });
}

