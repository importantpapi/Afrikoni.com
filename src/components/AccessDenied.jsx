/**
 * Afrikoni Shield™ - Access Denied Component
 * Simple page for unauthorized access attempts
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function AccessDenied({ message }) {
  return (
    <div className="min-h-screen bg-afrikoni-ivory flex items-center justify-center p-4">
      <Card className="border-os-accent/20 bg-white rounded-afrikoni-lg shadow-os-md-lg max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-os-2xl md:text-3xl font-bold text-afrikoni-text-dark mb-3">
            Access Denied
          </h1>

          <p className="text-afrikoni-text-dark/70 mb-6 leading-relaxed">
            {message || "You do not have permission to view this page."}
          </p>

          <Link to="/dashboard">
            <Button className="w-full bg-os-accent hover:bg-os-accent/90 text-afrikoni-charcoal rounded-afrikoni">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
