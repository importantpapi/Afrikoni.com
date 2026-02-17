/**
 * Test Resend API directly from browser
 * This helps diagnose CORS and API key issues
 */

export async function testResendAPIDirectly() {
  const apiKey = import.meta.env.VITE_EMAIL_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'API key not found in environment variables'
    };
  }

  console.log('🧪 Testing Resend API directly...');
  console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Afrikoni <hello@afrikoni.com>',
        to: ['test@afrikoni.com'],
        subject: 'Test Email',
        html: '<p>This is a test email</p>'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        details: errorData
      };
    }

    const data = await response.json();
    console.log('Success response:', data);

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Fetch error:', error);

    // Check for CORS error
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      return {
        success: false,
        error: 'CORS or network error. This might mean: 1) Resend API doesn\'t allow browser requests, 2) Network connectivity issue, 3) Browser security blocking the request.',
        details: error.message
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error
    };
  }
}

// Make it available in browser console for testing
if (typeof window !== 'undefined') {
  window.testResendAPI = testResendAPIDirectly;
}

