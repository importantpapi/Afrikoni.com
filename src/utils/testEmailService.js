/**
 * Email Service Test Utility
 * 
 * Use this to test email configuration
 * Call from browser console: testEmailService('your@email.com')
 */

export async function testEmailService(testEmail) {
  const { sendEmail } = await import('@/services/emailService');

  console.log('🧪 Testing Email Service...');
  console.log('Config:', {
    provider: import.meta.env.VITE_EMAIL_PROVIDER,
    hasKey: !!import.meta.env.VITE_EMAIL_API_KEY,
    keyLength: import.meta.env.VITE_EMAIL_API_KEY?.length || 0
  });

  try {
    const result = await sendEmail({
      to: testEmail || 'test@afrikoni.com',
      subject: 'Test Email from Afrikoni',
      template: 'newsletterWelcome',
      data: { email: testEmail || 'test@afrikoni.com' }
    });

    if (result.success) {
      console.log('✅ Email sent successfully!', result);
      return { success: true, message: 'Email sent successfully' };
    } else {
      console.error('❌ Email failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    return { success: false, error: error.message };
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.testEmailService = testEmailService;
}

