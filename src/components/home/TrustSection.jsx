import React from 'react';
import { Lock, Shield, CheckCircle, Award } from 'lucide-react';

export default function TrustSection() {
  return (
    <div className="py-16 bg-afrikoni-offwhite">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-afrikoni-gold mb-4">Trusted & Secure Platform</h2>
        <p className="text-lg text-afrikoni-deep mb-8">
          Your data and transactions are protected with enterprise-grade security.
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-afrikoni-deep">SSL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-afrikoni-deep">256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-afrikoni-deep">ISO Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-afrikoni-deep">Verified Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
