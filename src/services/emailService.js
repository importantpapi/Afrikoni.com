/**
 * Email Service for Afrikoni
 * 
 * ✅ SECURITY: All emails now sent via Supabase Edge Function
 * API keys are stored server-side only (never exposed in frontend bundle)
 * 
 * To configure:
 * 1. Add RESEND_API_KEY to Supabase Edge Function secrets
 * 2. Edge Function: supabase/functions/send-email/index.ts
 * 
 * ⚠️ DO NOT add VITE_EMAIL_API_KEY to .env (security risk)
 */

import { emailTemplates } from './emailTemplates';
import { supabase } from '@/api/supabaseClient';

// Official Afrikoni email - must use hello@afrikoni.com
const OFFICIAL_EMAIL = 'hello@afrikoni.com';
const OFFICIAL_EMAIL_NAME = 'Afrikoni';

/**
 * Send email via Supabase Edge Function (secure, server-side)
 * ✅ SECURITY: API key never exposed to frontend
 */
export async function sendEmail({
  to,
  subject,
  template,
  data = {},
  from = `${OFFICIAL_EMAIL_NAME} <${OFFICIAL_EMAIL}>`,
}) {
  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: 'Invalid email address' };
  }

  try {
    const html = emailTemplates[template] 
      ? emailTemplates[template](data) 
      : emailTemplates.default(data);
    
    // ✅ Always use Edge Function (no direct API calls)
    return await sendViaSupabase({ to, subject, html, from });
  } catch (error) {
    console.error('📧 Email send error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email. Please try again.' 
    };
  }
}

/**
 * Send via Supabase Edge Function
 * ✅ SECURITY: All email sending now goes through secure Edge Function
 */
async function sendViaSupabase({ to, subject, html, from }) {
  try {
    console.log('📧 Sending email via Edge Function:', { to, subject, from });
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, from }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send a request to the Edge Function' 
      };
    }

    if (!data) {
      console.error('❌ No data returned from Edge Function');
      return { 
        success: false, 
        error: 'No response from email service' 
      };
    }

    console.log('✅ Edge Function response:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to call send-email function:', error);
    return { 
      success: false, 
      error: error.message || 'Email service unavailable' 
    };
  }
}

/**
 * ❌ DEPRECATED: Direct Resend API calls removed for security
 * All emails now sent via Edge Function (see sendViaSupabase)
 */
async function sendViaResend({ to, subject, html, from }) {
  console.error('❌ Direct Resend API calls are disabled. Use Edge Function instead.');
  return { 
    success: false, 
    error: 'Direct API calls disabled. Contact support if this issue persists.' 
  };
}

/**
 * ❌ DEPRECATED: Direct SendGrid calls removed (unused)
 */
async function sendViaSendGrid({ to, subject, html, from }) {
  console.error('❌ SendGrid not configured. Use Resend via Edge Function.');
  return { success: false, error: 'SendGrid not supported' };
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

export async function sendPasswordResetConfirmationEmail(userEmail, userName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Your Afrikoni Password Has Been Changed',
    template: 'passwordResetConfirmation',
    data: { userName }
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

export async function sendAccountLockedEmail(userEmail, userName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Security Alert – Your Afrikoni Account Is Temporarily Locked',
    template: 'accountLocked',
    data: { userName }
  });
}

export async function sendBusinessPendingApprovalEmail(userEmail, userName, companyName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Your Afrikoni Business Account Is Under Review',
    template: 'businessPendingApproval',
    data: { userName, companyName }
  });
}

export async function sendBusinessApprovedEmail(userEmail, userName, companyName) {
  return await sendEmail({
    to: userEmail,
    subject: 'Congratulations! Your Afrikoni Business Account Is Active',
    template: 'businessApproved',
    data: { userName, companyName }
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

