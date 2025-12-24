/**
 * Configure Supabase Email Settings
 * 
 * This script configures Supabase to send emails from hello@afrikoni.com
 * with custom Afrikoni-branded templates.
 * 
 * Requirements:
 * - Supabase service role key (get from Supabase Dashboard → Settings → API)
 * - Node.js installed
 * 
 * Usage:
 * 1. Set SUPABASE_SERVICE_ROLE_KEY in your environment
 * 2. Set SUPABASE_PROJECT_REF (your project reference ID)
 * 3. Run: node scripts/configure-supabase-email.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('\n📝 To get your service role key:');
  console.log('   1. Go to Supabase Dashboard → Settings → API');
  console.log('   2. Copy the "service_role" key (keep it secret!)');
  console.log('   3. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  process.exit(1);
}

if (!SUPABASE_PROJECT_REF) {
  console.error('❌ Error: Could not determine project reference');
  console.log('   Set SUPABASE_PROJECT_REF in .env or ensure VITE_SUPABASE_URL is set\n');
  process.exit(1);
}

const MANAGEMENT_API_URL = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}`;

// Afrikoni email confirmation template (Supabase format)
const CONFIRM_SIGNUP_TEMPLATE = {
  subject: 'Verify Your Afrikoni Account',
  content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">AFRIKONI</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Trade. Trust. Thrive.</p>
    </div>
    <div class="content">
      <h2 style="color: #8B4513; margin-top: 0;">Verify Your Email Address</h2>
      <p>Thank you for signing up with Afrikoni! Please verify your email address to complete your account setup.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" style="color: #D4A574; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
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
        You're receiving this email because you signed up for an account with Afrikoni.<br>
        Questions? Reply to this email or contact us at <a href="mailto:hello@afrikoni.com" style="color: #D4A574;">hello@afrikoni.com</a><br>
        © ${new Date().getFullYear()} Afrikoni. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
};

async function configureSupabaseEmail() {
  console.log('🚀 Configuring Supabase Email Settings...\n');
  console.log(`📧 Project: ${SUPABASE_PROJECT_REF}`);
  console.log(`📧 Sender: hello@afrikoni.com\n`);

  try {
    // Note: Supabase Management API doesn't directly support email template updates
    // These need to be done via the dashboard. This script provides the template.
    
    console.log('⚠️  IMPORTANT: Supabase email templates must be configured manually in the dashboard.\n');
    console.log('📋 Follow these steps:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + SUPABASE_PROJECT_REF + '/auth/templates');
    console.log('2. Click on "Confirm signup" template');
    console.log('3. Update the following:\n');
    console.log('   SUBJECT:');
    console.log('   ' + CONFIRM_SIGNUP_TEMPLATE.subject + '\n');
    console.log('   CONTENT:');
    console.log('   (Copy the template from: scripts/supabase-email-template.html)\n');
    console.log('4. Go to: https://supabase.com/dashboard/project/' + SUPABASE_PROJECT_REF + '/settings/auth');
    console.log('5. Under "SMTP Settings" or "Email Settings":');
    console.log('   - Set Sender email: hello@afrikoni.com');
    console.log('   - Set Sender name: Afrikoni');
    console.log('   - If using custom SMTP, configure your SMTP provider\n');
    console.log('6. Save all changes\n');
    
    // Save template to file for easy copy-paste
    const fs = await import('fs');
    const templatePath = 'scripts/supabase-email-template.html';
    fs.writeFileSync(templatePath, CONFIRM_SIGNUP_TEMPLATE.content);
    console.log('✅ Email template saved to: ' + templatePath);
    console.log('   You can copy this file content into Supabase dashboard\n');
    
    console.log('✨ Configuration guide complete!');
    console.log('   After updating the dashboard, test by signing up with a new email.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', await error.response.text());
    }
    process.exit(1);
  }
}

configureSupabaseEmail();

