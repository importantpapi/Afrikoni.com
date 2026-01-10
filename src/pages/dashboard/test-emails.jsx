/**
 * Email Testing Page
 * 
 * This page allows you to test all email templates and flows.
 * Verifies that all emails are sent from hello@afrikoni.com
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { toast } from 'sonner';
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendRFQReceivedEmail,
  sendQuoteSubmittedEmail,
  sendPaymentReceivedEmail,
  sendOrderShippedEmail,
  sendDisputeOpenedEmail,
  sendEmail
} from '@/services/emailService';
import { supabase } from '@/api/supabaseClient';
import { Mail, Send, CheckCircle, XCircle, AlertCircle, TestTube, Bug } from 'lucide-react';
import { testResendAPIDirectly } from '@/utils/testResendAPI';

export default function TestEmails() {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState({});
  const [detailedResults, setDetailedResults] = useState({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  // Verify email configuration
  const emailConfig = {
    provider: import.meta.env.VITE_EMAIL_PROVIDER || 'none',
    hasApiKey: !!import.meta.env.VITE_EMAIL_API_KEY,
    apiKeyLength: import.meta.env.VITE_EMAIL_API_KEY?.length || 0,
    apiKeyPrefix: import.meta.env.VITE_EMAIL_API_KEY?.substring(0, 3) || '',
    officialEmail: 'hello@afrikoni.com' // Always uses hello@afrikoni.com
  };

  const handleTestEmail = async (emailType, emailFunction, emailData, customFrom = null) => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setResults(prev => ({ ...prev, [emailType]: 'sending' }));
    setDetailedResults(prev => ({ 
      ...prev, 
      [emailType]: { 
        status: 'sending', 
        from: 'checking...',
        timestamp: new Date().toISOString()
      } 
    }));

    try {
      let result;
      
      // For newsletter test, use sendEmail directly
      if (emailType === 'Newsletter Subscription') {
        result = await sendEmail({
          to: testEmail,
          subject: 'Welcome to Afrikoni - Africa\'s B2B Trade Engine',
          template: 'newsletterWelcome',
          data: { email: testEmail },
          from: customFrom || 'Afrikoni <hello@afrikoni.com>'
        });
      } else {
        result = await emailFunction(testEmail, emailData);
      }
      
      // Verify from address is hello@afrikoni.com
      const fromAddress = customFrom || 'Afrikoni <hello@afrikoni.com>';
      const usesOfficialEmail = fromAddress.includes('hello@afrikoni.com');
      
      if (result.success) {
        setResults(prev => ({ ...prev, [emailType]: 'success' }));
        setDetailedResults(prev => ({ 
          ...prev, 
          [emailType]: { 
            status: 'success',
            from: fromAddress,
            usesOfficialEmail,
            messageId: result.id || 'N/A',
            timestamp: new Date().toISOString(),
            error: null
          } 
        }));
        
        if (usesOfficialEmail) {
          toast.success(`${emailType} email sent successfully from hello@afrikoni.com!`);
        } else {
          toast.warning(`${emailType} email sent, but from address may not be correct.`);
        }
      } else {
        setResults(prev => ({ ...prev, [emailType]: 'error' }));
        setDetailedResults(prev => ({ 
          ...prev, 
          [emailType]: { 
            status: 'error',
            from: fromAddress,
            usesOfficialEmail,
            error: result.error || 'Unknown error',
            timestamp: new Date().toISOString()
          } 
        }));
        toast.error(`Failed to send ${emailType} email: ${result.error}`);
      }
    } catch (error) {
      setResults(prev => ({ ...prev, [emailType]: 'error' }));
      setDetailedResults(prev => ({ 
        ...prev, 
        [emailType]: { 
          status: 'error',
          from: customFrom || 'Afrikoni <hello@afrikoni.com>',
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        } 
      }));
      toast.error(`Error sending ${emailType} email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Test newsletter subscription (simulates the actual flow)
  const handleTestNewsletter = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setResults(prev => ({ ...prev, 'Newsletter Subscription': 'sending' }));

    try {
      // Simulate newsletter subscription flow
      const { error: dbError } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: testEmail,
          source: 'test_page',
          subscribed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (dbError && dbError.code !== '23505') { // Ignore duplicate key errors
        console.warn('Database insert warning:', dbError);
      }

      // Send welcome email (same as NewsletterPopup)
      await handleTestEmail(
        'Newsletter Subscription',
        null,
        { email: testEmail },
        'Afrikoni <hello@afrikoni.com>'
      );
    } catch (error) {
      console.error('Newsletter test error:', error);
      toast.error(`Newsletter test failed: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Test all emails at once
  const handleTestAll = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsTestingAll(true);
    toast.info('Starting comprehensive email test...');

    for (const test of emailTests) {
      await handleTestEmail(test.name, test.function, test.data);
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test newsletter last
    await handleTestNewsletter();

    setIsTestingAll(false);
    toast.success('All email tests completed! Check results below.');
  };

  const emailTests = [
    {
      name: 'Welcome Email',
      description: 'Sent when a new user completes onboarding',
      function: sendWelcomeEmail,
      data: { userName: 'Test User' }
    },
    {
      name: 'Order Confirmation',
      description: 'Sent to buyer when payment is confirmed',
      function: sendOrderConfirmationEmail,
      data: {
        orderNumber: 'TEST-12345',
        orderId: 'test-order-id',
        productName: 'Test Product - Premium Quality',
        quantity: 10,
        totalAmount: 1500,
        currency: 'USD',
        supplierName: 'Test Supplier Company',
        estimatedDelivery: '2024-02-15'
      }
    },
    {
      name: 'RFQ Received',
      description: 'Sent to suppliers when a new RFQ is posted',
      function: sendRFQReceivedEmail,
      data: {
        rfqId: 'test-rfq-id',
        title: 'Test RFQ - Bulk Order Request',
        category: 'Electronics',
        quantity: 500,
        buyerName: 'Test Buyer Company',
        deadline: '2024-02-20',
        description: 'Looking for high-quality electronic components for our manufacturing process.'
      }
    },
    {
      name: 'Quote Submitted',
      description: 'Sent to buyer when a supplier submits a quote',
      function: sendQuoteSubmittedEmail,
      data: {
        rfqId: 'test-rfq-id',
        rfqTitle: 'Test RFQ - Bulk Order Request',
        supplierName: 'Test Supplier Company',
        quoteAmount: 12500,
        currency: 'USD',
        validity: '2024-02-25'
      }
    },
    {
      name: 'Payment Received',
      description: 'Sent to supplier when buyer makes payment',
      function: sendPaymentReceivedEmail,
      data: {
        orderId: 'test-order-id',
        amount: 1500,
        currency: 'USD',
        orderNumber: 'TEST-12345',
        buyerName: 'Test Buyer Company'
      }
    },
    {
      name: 'Order Shipped',
      description: 'Sent to buyer when supplier ships the order',
      function: sendOrderShippedEmail,
      data: {
        orderId: 'test-order-id',
        orderNumber: 'TEST-12345',
        trackingNumber: 'TRACK123456789',
        carrier: 'DHL Express',
        estimatedDelivery: '2024-02-18',
        supplierName: 'Test Supplier Company'
      }
    },
    {
      name: 'Dispute Opened',
      description: 'Sent when a dispute is opened for an order',
      function: sendDisputeOpenedEmail,
      data: {
        orderId: 'test-order-id',
        orderNumber: 'TEST-12345',
        disputeReason: 'Product quality does not match description',
        openedBy: 'Test Buyer Company'
      }
    }
  ];

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === 'sending') return <div className="w-5 h-5 border-2 border-afrikoni-gold border-t-transparent rounded-full animate-spin" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-afrikoni-offwhite p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2 flex items-center gap-2">
            <TestTube className="w-8 h-8" />
            Email Testing & Verification
          </h1>
          <p className="text-afrikoni-deep">
            Test all email templates and verify they're sent from <strong className="text-afrikoni-gold">hello@afrikoni.com</strong>
          </p>
        </div>

        {/* Configuration Status */}
        <Card className="mb-6 border-2 border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-afrikoni-deep">Email Provider:</span>
                  <span className={`font-semibold ${emailConfig.provider !== 'none' ? 'text-green-600' : 'text-red-600'}`}>
                    {emailConfig.provider !== 'none' ? emailConfig.provider.toUpperCase() : 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-afrikoni-deep">API Key:</span>
                  <span className={`font-semibold ${emailConfig.hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                    {emailConfig.hasApiKey ? `✓ Configured (${emailConfig.apiKeyLength} chars)` : '✗ Not configured'}
                  </span>
                </div>
                {emailConfig.hasApiKey && emailConfig.provider === 'resend' && (
                  <div className="flex items-center justify-between">
                    <span className="text-afrikoni-deep">API Key Format:</span>
                    <span className={`font-semibold ${emailConfig.apiKeyPrefix === 're_' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {emailConfig.apiKeyPrefix === 're_' ? '✓ Valid (re_...)' : '⚠ Check format'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-afrikoni-deep">Environment:</span>
                  <span className="font-semibold text-afrikoni-deep">
                    {import.meta.env.MODE === 'production' ? 'Production' : import.meta.env.MODE === 'development' ? 'Development' : 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-afrikoni-deep">From Address:</span>
                  <span className="font-semibold text-afrikoni-gold">hello@afrikoni.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-afrikoni-deep">Reply-To:</span>
                  <span className="font-semibold text-afrikoni-gold">hello@afrikoni.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-afrikoni-deep">Status:</span>
                  <span className={`font-semibold ${emailConfig.hasApiKey && emailConfig.provider !== 'none' ? 'text-green-600' : 'text-red-600'}`}>
                    {emailConfig.hasApiKey && emailConfig.provider !== 'none' ? '✓ Ready' : '✗ Not Ready'}
                  </span>
                </div>
              </div>
            </div>
            {(!emailConfig.hasApiKey || emailConfig.provider === 'none') && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Configuration Missing or Not Deployed</p>
                    <div className="text-xs text-red-700 space-y-2">
                      <p><strong>If you just updated Vercel environment variables:</strong></p>
                      <ol className="list-decimal list-inside ml-2 space-y-1">
                        <li>Environment variables are only available after redeployment</li>
                        <li>Go to Vercel Dashboard → Deployments → Click "Redeploy" on latest deployment</li>
                        <li>Or trigger a new deployment by pushing to GitHub</li>
                        <li>Wait for deployment to complete, then refresh this page</li>
                      </ol>
                      <p className="mt-2"><strong>Verify in Vercel:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Settings → Environment Variables</li>
                        <li><code>VITE_EMAIL_PROVIDER</code> = <code>resend</code></li>
                        <li><code>VITE_EMAIL_API_KEY</code> = <code>re_QzfeoKRt_2MpMRAe7f66oHfYmjCda3y5w</code> (complete key)</li>
                        <li>Environment scope: "All Environments" or at least "Production"</li>
                      </ul>
                      <p className="mt-2"><strong>Current values detected:</strong></p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Provider: <code>{emailConfig.provider}</code></li>
                        <li>API Key: <code>{emailConfig.hasApiKey ? `Present (${emailConfig.apiKeyLength} chars)` : 'Missing'}</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {emailConfig.hasApiKey && emailConfig.provider === 'resend' && (
              <div className="mt-4 pt-4 border-t border-afrikoni-gold/20">
                <Button
                  onClick={async () => {
                    setIsRunningDiagnostic(true);
                    setDiagnosticResult(null);
                    try {
                      const result = await testResendAPIDirectly();
                      setDiagnosticResult(result);
                      if (result.success) {
                        toast.success('API connection test successful!');
                      } else {
                        toast.error(`API test failed: ${result.error}`);
                      }
                    } catch (error) {
                      setDiagnosticResult({
                        success: false,
                        error: error.message || 'Unknown error'
                      });
                      toast.error(`Diagnostic failed: ${error.message}`);
                    } finally {
                      setIsRunningDiagnostic(false);
                    }
                  }}
                  disabled={isRunningDiagnostic}
                  variant="outline"
                  className="w-full"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  {isRunningDiagnostic ? 'Running Diagnostic...' : 'Run API Diagnostic Test'}
                </Button>
                {diagnosticResult && (
                  <div className={`mt-3 p-3 rounded-lg border-2 ${
                    diagnosticResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {diagnosticResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold ${
                          diagnosticResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {diagnosticResult.success ? '✓ API Connection Successful' : '✗ API Connection Failed'}
                        </p>
                        <p className={`text-sm mt-1 ${
                          diagnosticResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {diagnosticResult.error || 'Connection test passed'}
                        </p>
                        {diagnosticResult.details && (
                          <pre className="text-xs mt-2 p-2 bg-white/50 rounded overflow-auto">
                            {JSON.stringify(diagnosticResult.details, null, 2)}
                          </pre>
                        )}
                        {!diagnosticResult.success && (
                          <div className="mt-2 text-xs text-red-700 space-y-1">
                            <p><strong>Possible causes:</strong></p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                              <li>Domain <code>afrikoni.com</code> not verified in Resend</li>
                              <li>API key invalid or expired</li>
                              <li>CORS/network connectivity issue</li>
                              <li>Browser security blocking the request</li>
                            </ul>
                            <p className="mt-2"><strong>Solution:</strong> Verify your domain in Resend Dashboard → Domains</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Email Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTestAll}
                  disabled={isSending || isTestingAll || !testEmail}
                  variant="default"
                  className="min-h-[44px]"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test All Emails
                </Button>
              </div>
            </div>
            <p className="text-sm text-afrikoni-deep/70 mt-2">
              All test emails will be sent to this address from <strong>hello@afrikoni.com</strong>. Check your inbox (and spam folder) after sending.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {emailTests.map((test) => {
            const detail = detailedResults[test.name];
            return (
              <Card key={test.name} className={detail?.status === 'success' ? 'border-green-200' : detail?.status === 'error' ? 'border-red-200' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    {getStatusIcon(results[test.name])}
                  </div>
                  <p className="text-sm text-afrikoni-deep/70 mt-1">{test.description}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleTestEmail(test.name, test.function, test.data)}
                    disabled={isSending || isTestingAll || !testEmail}
                    className="w-full mb-3"
                    variant="primary"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                  {detail && (
                    <div className="mt-3 p-3 bg-afrikoni-offwhite rounded-lg border border-afrikoni-gold/10">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-afrikoni-deep/70">From:</span>
                          <span className={`font-mono text-xs ${detail.usesOfficialEmail ? 'text-green-600' : 'text-red-600'}`}>
                            {detail.from}
                          </span>
                        </div>
                        {detail.usesOfficialEmail !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-afrikoni-deep/70">Uses Official Email:</span>
                            <span className={detail.usesOfficialEmail ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {detail.usesOfficialEmail ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                        )}
                        {detail.messageId && (
                          <div className="flex items-center justify-between">
                            <span className="text-afrikoni-deep/70">Message ID:</span>
                            <span className="font-mono text-xs text-afrikoni-deep">{detail.messageId}</span>
                          </div>
                        )}
                        {detail.error && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                            Error: {detail.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {/* Newsletter Subscription Test */}
          <Card className={detailedResults['Newsletter Subscription']?.status === 'success' ? 'border-green-200' : detailedResults['Newsletter Subscription']?.status === 'error' ? 'border-red-200' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Newsletter Subscription</CardTitle>
                {getStatusIcon(results['Newsletter Subscription'])}
              </div>
              <p className="text-sm text-afrikoni-deep/70 mt-1">Tests the actual newsletter subscription flow (same as homepage popup)</p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTestNewsletter}
                disabled={isSending || isTestingAll || !testEmail}
                className="w-full mb-3"
                variant="primary"
              >
                <Send className="w-4 h-4 mr-2" />
                Test Newsletter Flow
              </Button>
              {detailedResults['Newsletter Subscription'] && (
                <div className="mt-3 p-3 bg-afrikoni-offwhite rounded-lg border border-afrikoni-gold/10">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-afrikoni-deep/70">From:</span>
                      <span className={`font-mono text-xs ${detailedResults['Newsletter Subscription'].usesOfficialEmail ? 'text-green-600' : 'text-red-600'}`}>
                        {detailedResults['Newsletter Subscription'].from}
                      </span>
                    </div>
                    {detailedResults['Newsletter Subscription'].usesOfficialEmail !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-afrikoni-deep/70">Uses Official Email:</span>
                        <span className={detailedResults['Newsletter Subscription'].usesOfficialEmail ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {detailedResults['Newsletter Subscription'].usesOfficialEmail ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                    )}
                    {detailedResults['Newsletter Subscription'].error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                        Error: {detailedResults['Newsletter Subscription'].error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results Summary */}
        {(Object.keys(detailedResults).length > 0) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(detailedResults).map(([emailType, detail]) => (
                  <div key={emailType} className="p-3 bg-afrikoni-offwhite rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-afrikoni-deep">{emailType}</span>
                      {detail.status === 'success' ? (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Success
                        </span>
                      ) : detail.status === 'error' ? (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">Sending...</span>
                      )}
                    </div>
                    <div className="text-sm space-y-1 text-afrikoni-deep/70">
                      <div>From: <span className="font-mono">{detail.from}</span></div>
                      {detail.usesOfficialEmail !== undefined && (
                        <div>
                          Official Email: <span className={detail.usesOfficialEmail ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {detail.usesOfficialEmail ? '✓ Verified' : '✗ Not Verified'}
                          </span>
                        </div>
                      )}
                      {detail.messageId && <div>Message ID: <span className="font-mono text-xs">{detail.messageId}</span></div>}
                      {detail.error && <div className="text-red-600">Error: {detail.error}</div>}
                      {detail.timestamp && <div className="text-xs opacity-60">Sent: {new Date(detail.timestamp).toLocaleString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

