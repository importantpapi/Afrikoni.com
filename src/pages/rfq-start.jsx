import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Shield, CheckCircle, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

// Country list for destination
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgium' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  // Add African countries
  { value: 'NG', label: 'Nigeria' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'KE', label: 'Kenya' },
  { value: 'GH', label: 'Ghana' },
  { value: 'EG', label: 'Egypt' },
  { value: 'MA', label: 'Morocco' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'UG', label: 'Uganda' },
  { value: 'SN', label: 'Senegal' },
  { value: 'CI', label: 'Ivory Coast' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'AO', label: 'Angola' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'ZW', label: 'Zimbabwe' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MZ', label: 'Mozambique' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'ML', label: 'Mali' },
  { value: 'NE', label: 'Niger' },
  { value: 'TD', label: 'Chad' },
  { value: 'SD', label: 'Sudan' },
  { value: 'SO', label: 'Somalia' },
  { value: 'LR', label: 'Liberia' },
  { value: 'SL', label: 'Sierra Leone' },
  { value: 'GN', label: 'Guinea' },
  { value: 'GW', label: 'Guinea-Bissau' },
  { value: 'MR', label: 'Mauritania' },
  { value: 'LY', label: 'Libya' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'CF', label: 'Central African Republic' },
  { value: 'CD', label: 'DR Congo' },
  { value: 'CG', label: 'Congo' },
  { value: 'GA', label: 'Gabon' },
  { value: 'GQ', label: 'Equatorial Guinea' },
  { value: 'ST', label: 'São Tomé and Príncipe' },
  { value: 'CV', label: 'Cape Verde' },
  { value: 'GM', label: 'Gambia' },
  { value: 'LS', label: 'Lesotho' },
  { value: 'BW', label: 'Botswana' },
  { value: 'NA', label: 'Namibia' },
  { value: 'SZ', label: 'Eswatini' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'KM', label: 'Comoros' },
  { value: 'BI', label: 'Burundi' },
];

export default function RFQStart() {
  // Use centralized AuthProvider (this is a public page, user can be null)
  const { user, profile, role, authReady } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: searchParams.get('product') || '',
    destinationCountry: searchParams.get('country') || '',
    estimatedQuantity: searchParams.get('quantity') || '',
  });

  // User loaded from AuthProvider context (no separate checkUser needed)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    // Validate required fields
    if (!formData.productName.trim()) {
      toast.error('Please enter a product or service name');
      return;
    }
    if (!formData.destinationCountry) {
      toast.error('Please select a destination country');
      return;
    }

    // Build query params to preserve context
    const params = new URLSearchParams({
      product: formData.productName,
      country: formData.destinationCountry,
    });
    if (formData.estimatedQuantity) {
      params.set('quantity', formData.estimatedQuantity);
    }

    // If user is logged in, go directly to RFQ form
    if (user) {
      navigate(`/rfq/create?${params.toString()}`);
    } else {
      // Redirect to signup with context preserved
      navigate(`/signup?redirect=/rfq/create&${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-afrikoni-chestnut mb-3">
            What are you looking to source?
          </h1>
          <p className="text-os-base sm:text-os-lg text-afrikoni-deep">
            Tell us briefly what you need, and we'll guide you through the rest
          </p>
        </div>

        {/* Intent Check Form */}
        <Card className="border-os-accent/30 shadow-os-md">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Product/Service Name */}
            <div>
              <Label htmlFor="productName" className="text-os-base font-semibold text-afrikoni-chestnut mb-2 block">
                Product / Service name <span className="text-os-red">*</span>
              </Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="e.g., Cocoa beans, Shea butter, Mobile phones..."
                className="text-os-base min-h-[48px]"
                autoFocus
              />
            </div>

            {/* Destination Country */}
            <div>
              <Label htmlFor="destinationCountry" className="text-os-base font-semibold text-afrikoni-chestnut mb-2 block">
                Destination country <span className="text-os-red">*</span>
              </Label>
              <Select 
                value={formData.destinationCountry} 
                onValueChange={(v) => handleChange('destinationCountry', v)}
              >
                <SelectTrigger className="text-os-base min-h-[48px]">
                  <SelectValue placeholder="Select destination country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {COUNTRIES.map(country => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Quantity (Optional) */}
            <div>
              <Label htmlFor="estimatedQuantity" className="text-os-base font-semibold text-afrikoni-chestnut mb-2 block">
                Estimated quantity <span className="text-os-sm font-normal text-afrikoni-deep/70">(optional)</span>
              </Label>
              <Input
                id="estimatedQuantity"
                type="text"
                value={formData.estimatedQuantity}
                onChange={(e) => handleChange('estimatedQuantity', e.target.value)}
                placeholder="e.g., 1000 kg, 500 pieces, 10 containers..."
                className="text-os-base min-h-[48px]"
              />
              <p className="text-os-sm text-afrikoni-deep/70 mt-1">
                This helps us match you with the right suppliers
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={isLoading || !formData.productName.trim() || !formData.destinationCountry}
              className="w-full bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut font-semibold text-os-base min-h-[52px] mt-6"
            >
              Continue
            </Button>
          </CardContent>
        </Card>

        {/* Trust Reassurance (if not logged in) */}
        {!user && (
          <Card className="border-os-accent/20 bg-afrikoni-cream/30 mt-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Shield className="w-6 h-6 text-os-accent" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-afrikoni-chestnut">
                    Create a free account to submit your RFQ
                  </h3>
                  <p className="text-os-sm text-afrikoni-deep">
                    You'll need an account to receive verified offers and manage your requests.
                  </p>
                  <div className="space-y-2 text-os-sm text-afrikoni-deep">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-os-accent flex-shrink-0" />
                      <span>No obligation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-os-accent flex-shrink-0" />
                      <span>No spam</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-os-accent flex-shrink-0" />
                      <span>Verified suppliers only</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

