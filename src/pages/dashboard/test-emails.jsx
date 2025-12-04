/**
 * Email Testing Page
 * 
 * This page allows you to test all email templates and flows.
 * Only accessible in development mode or by admins.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';

export default function TestEmails() {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState({});

  // Only allow in development or for admins
  const isDev = import.meta.env.DEV;
  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-afrikoni-deep">
              Email testing is only available in development mode.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTestEmail = async (emailType, emailFunction, emailData) => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setResults(prev => ({ ...prev, [emailType]: 'sending' }));

    try {
      const result = await emailFunction(testEmail, emailData);
      
      if (result.success) {
        setResults(prev => ({ ...prev, [emailType]: 'success' }));
        toast.success(`${emailType} email sent successfully!`);
      } else {
        setResults(prev => ({ ...prev, [emailType]: 'error' }));
        toast.error(`Failed to send ${emailType} email: ${result.error}`);
      }
    } catch (error) {
      setResults(prev => ({ ...prev, [emailType]: 'error' }));
      toast.error(`Error sending ${emailType} email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
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
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Email Testing</h1>
          <p className="text-afrikoni-deep">
            Test all email templates and flows. Emails will be sent from <strong>hello@afrikoni.com</strong>
          </p>
        </div>

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
            </div>
            <p className="text-sm text-afrikoni-deep/70 mt-2">
              All test emails will be sent to this address. Check your inbox (and spam folder) after sending.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {emailTests.map((test) => (
            <Card key={test.name}>
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
                  disabled={isSending || !testEmail}
                  className="w-full"
                  variant="primary"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Email Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Email Provider:</span>
                <span className="font-semibold">{import.meta.env.VITE_EMAIL_PROVIDER || 'Not configured'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API Key:</span>
                <span className="font-semibold">
                  {import.meta.env.VITE_EMAIL_API_KEY ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>From Address:</span>
                <span className="font-semibold">hello@afrikoni.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

