/**
 * MVP Phase 1: Manual Supplier Onboarding Application
 * 
 * Simple form for African suppliers to apply
 * Admin will review and onboard manually (10-20 suppliers)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { CheckCircle, ArrowRight, Building, Mail, Phone, Globe, MapPin, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SupplierApplication() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Company Info
    company_name: '',
    business_type: '',
    country: '',
    city: '',
    website: '',
    
    // Contact Info
    contact_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    
    // Business Details
    products_categories: '',
    years_in_business: '',
    export_experience: '',
    certifications: '',
    
    // Additional Info
    company_description: '',
    why_afrikoni: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to a supplier_applications table (we'll create this)
      const { data, error } = await supabase
        .from('supplier_applications')
        .insert({
          company_name: formData.company_name,
          business_type: formData.business_type,
          country: formData.country,
          city: formData.city,
          website: formData.website,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          products_categories: formData.products_categories,
          years_in_business: formData.years_in_business,
          export_experience: formData.export_experience,
          certifications: formData.certifications,
          company_description: formData.company_description,
          why_afrikoni: formData.why_afrikoni,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email (we'll set this up)
      toast.success('✅ Application submitted successfully!');
      toast.info('We will review your application and contact you within 2-3 business days.');
      
      setCurrentStep(3); // Show success step
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const africanCountries = [
    'Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Tanzania', 'Uganda',
    'Ethiopia', 'Morocco', 'Egypt', 'Senegal', 'Ivory Coast', 'Cameroon',
    'Zimbabwe', 'Mozambique', 'Madagascar', 'Mali', 'Burkina Faso', 'Niger',
    'Malawi', 'Zambia', 'Angola', 'Mauritania', 'Chad', 'Somalia',
    'Guinea', 'Rwanda', 'Benin', 'Burundi', 'Tunisia', 'Togo', 'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-white to-afrikoni-cream py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-3">
            Become an Afrikoni Supplier
          </h1>
          <p className="text-lg text-afrikoni-deep/70">
            Join Africa's premier B2B marketplace. We're onboarding 10-20 verified suppliers for Phase 1.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <Card className="mb-6 border-2 border-afrikoni-gold/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${currentStep === step ? 'bg-afrikoni-gold text-white' : 
                      currentStep > step ? 'bg-green-600 text-white' : 
                      'bg-afrikoni-deep/10 text-afrikoni-deep/40'}
                  `}>
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      flex-1 h-1 mx-2
                      ${currentStep > step ? 'bg-green-600' : 'bg-afrikoni-deep/10'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <p className="text-sm font-medium text-afrikoni-chestnut">
                {currentStep === 1 && 'Company Information'}
                {currentStep === 2 && 'Business Details'}
                {currentStep === 3 && 'Application Submitted'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        {currentStep < 3 && (
          <Card className="border-2 border-afrikoni-gold/30 bg-white shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">
                        Company Information
                      </h2>
                    </div>

                    <div>
                      <Label htmlFor="company_name">
                        Company Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="e.g., Premium African Exports Ltd"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="business_type">Business Type</Label>
                        <Select 
                          value={formData.business_type} 
                          onValueChange={(v) => handleChange('business_type', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="exporter">Exporter</SelectItem>
                            <SelectItem value="trader">Trader</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="country">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.country} 
                          onValueChange={(v) => handleChange('country', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {africanCountries.map(country => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="e.g., Lagos, Nairobi"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                          placeholder="https://..."
                          type="url"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contact_name">
                        Contact Person Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_name"
                        value={formData.contact_name}
                        onChange={(e) => handleChange('contact_name', e.target.value)}
                        placeholder="Your full name"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="your@email.com"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+234 123 456 7890"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value)}
                        placeholder="+234 123 456 7890"
                        className="mt-1"
                      />
                      <p className="text-xs text-afrikoni-deep/60 mt-1">
                        We'll use this for RFQ notifications
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">
                        Business Details
                      </h2>
                    </div>

                    <div>
                      <Label htmlFor="products_categories">
                        Product Categories You Export
                      </Label>
                      <Textarea
                        id="products_categories"
                        value={formData.products_categories}
                        onChange={(e) => handleChange('products_categories', e.target.value)}
                        placeholder="e.g., Coffee, Cocoa, Textiles, Handicrafts, Spices"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="years_in_business">Years in Business</Label>
                        <Input
                          id="years_in_business"
                          type="number"
                          value={formData.years_in_business}
                          onChange={(e) => handleChange('years_in_business', e.target.value)}
                          placeholder="e.g., 5"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="export_experience">Export Experience</Label>
                        <Select 
                          value={formData.export_experience} 
                          onValueChange={(v) => handleChange('export_experience', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New to Export</SelectItem>
                            <SelectItem value="1-2">1-2 years</SelectItem>
                            <SelectItem value="3-5">3-5 years</SelectItem>
                            <SelectItem value="5+">5+ years</SelectItem>
                            <SelectItem value="extensive">Extensive Experience</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="certifications">Certifications & Licenses</Label>
                      <Textarea
                        id="certifications"
                        value={formData.certifications}
                        onChange={(e) => handleChange('certifications', e.target.value)}
                        placeholder="e.g., ISO 9001, Organic Certified, Fair Trade, etc."
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_description">Company Description</Label>
                      <Textarea
                        id="company_description"
                        value={formData.company_description}
                        onChange={(e) => handleChange('company_description', e.target.value)}
                        placeholder="Tell us about your company, products, and expertise..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="why_afrikoni">Why Afrikoni?</Label>
                      <Textarea
                        id="why_afrikoni"
                        value={formData.why_afrikoni}
                        onChange={(e) => handleChange('why_afrikoni', e.target.value)}
                        placeholder="Why do you want to join Afrikoni? What are your goals?"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        ← Previous
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Application
                            <CheckCircle className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-green-500 bg-green-50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-4">
                  Application Submitted!
                </h2>
                <p className="text-lg text-afrikoni-deep/70 mb-6">
                  Thank you for your interest in becoming an Afrikoni supplier.
                </p>
                <div className="bg-white rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold mb-3">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-afrikoni-deep/70">
                    <li>✅ We'll review your application within 2-3 business days</li>
                    <li>✅ Our team will contact you via email or WhatsApp</li>
                    <li>✅ If approved, we'll guide you through onboarding</li>
                    <li>✅ You'll be able to list products and receive RFQs</li>
                  </ul>
                </div>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                >
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Box */}
        <Card className="mt-6 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-afrikoni-chestnut mb-2">
              Phase 1 MVP - Limited Spots Available
            </h3>
            <p className="text-sm text-afrikoni-deep/70">
              We're onboarding 10-20 verified African suppliers for our Phase 1 launch. 
              Selected suppliers will receive priority support, featured listings, and direct access to international buyers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

