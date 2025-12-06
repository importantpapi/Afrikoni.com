/**
 * MVP Phase 1: RFQ Submission Form
 * 
 * Buyers can submit RFQs which will be sent to suppliers via WhatsApp/Email
 * Manual process - admin will forward to relevant suppliers
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Send, Mail, MessageCircle, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function RFQSubmission() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    // Buyer Info
    buyer_name: '',
    company_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: '',
    
    // RFQ Details
    product_category: '',
    product_description: '',
    quantity: '',
    unit: 'pieces',
    budget_range: '',
    currency: 'USD',
    delivery_location: '',
    delivery_timeline: '',
    
    // Additional
    special_requirements: '',
    preferred_supplier_countries: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.buyer_name || !formData.email || !formData.product_description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save RFQ to database
      const { data, error } = await supabase
        .from('rfqs')
        .insert({
          title: `RFQ: ${formData.product_category || 'Product Request'}`,
          description: formData.product_description,
          quantity: formData.quantity || null,
          unit: formData.unit,
          budget_min: formData.budget_range ? parseFloat(formData.budget_range.split('-')[0]) : null,
          budget_max: formData.budget_range ? parseFloat(formData.budget_range.split('-')[1]) : null,
          currency: formData.currency,
          delivery_location: formData.delivery_location,
          delivery_timeline: formData.delivery_timeline,
          special_requirements: formData.special_requirements,
          buyer_name: formData.buyer_name,
          buyer_company: formData.company_name,
          buyer_email: formData.email,
          buyer_phone: formData.phone,
          buyer_whatsapp: formData.whatsapp,
          buyer_country: formData.country,
          status: 'pending_manual_review',
          mvp_phase: true, // Mark as MVP phase RFQ
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Generate WhatsApp link
      const whatsappMessage = encodeURIComponent(
        `New RFQ from ${formData.buyer_name} (${formData.company_name})\n\n` +
        `Product: ${formData.product_description}\n` +
        `Quantity: ${formData.quantity || 'TBD'} ${formData.unit}\n` +
        `Budget: ${formData.currency} ${formData.budget_range || 'TBD'}\n` +
        `Delivery: ${formData.delivery_location || 'TBD'}\n` +
        `Timeline: ${formData.delivery_timeline || 'TBD'}\n\n` +
        `Contact: ${formData.email} | ${formData.phone}`
      );
      const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

      // Generate email link
      const emailSubject = encodeURIComponent(`New RFQ: ${formData.product_category || 'Product Request'}`);
      const emailBody = encodeURIComponent(
        `New RFQ Submission\n\n` +
        `Buyer: ${formData.buyer_name}\n` +
        `Company: ${formData.company_name}\n` +
        `Email: ${formData.email}\n` +
        `Phone: ${formData.phone}\n` +
        `WhatsApp: ${formData.whatsapp || 'N/A'}\n\n` +
        `Product: ${formData.product_description}\n` +
        `Quantity: ${formData.quantity || 'TBD'} ${formData.unit}\n` +
        `Budget: ${formData.currency} ${formData.budget_range || 'TBD'}\n` +
        `Delivery Location: ${formData.delivery_location || 'TBD'}\n` +
        `Timeline: ${formData.delivery_timeline || 'TBD'}\n\n` +
        `Special Requirements: ${formData.special_requirements || 'None'}\n\n` +
        `RFQ ID: ${data.id}`
      );
      const emailLink = `mailto:?subject=${emailSubject}&body=${emailBody}`;

      toast.success('✅ RFQ submitted successfully!');
      setSubmitted({ ...data, whatsappLink, emailLink });
    } catch (error) {
      console.error('RFQ submission error:', error);
      toast.error(error.message || 'Failed to submit RFQ. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Agriculture & Food',
    'Textiles & Apparel',
    'Handicrafts & Art',
    'Beauty & Personal Care',
    'Electronics',
    'Industrial Machinery',
    'Raw Materials',
    'Other'
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
            Submit a Request for Quotation (RFQ)
          </h1>
          <p className="text-lg text-afrikoni-deep/70">
            Tell us what you need. We'll connect you with verified African suppliers.
          </p>
        </motion.div>

        {!submitted ? (
          <Card className="border-2 border-afrikoni-gold/30 bg-white shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Buyer Information */}
                <div>
                  <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">
                    Your Information
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyer_name">
                        Your Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="buyer_name"
                        value={formData.buyer_name}
                        onChange={(e) => handleChange('buyer_name', e.target.value)}
                        placeholder="John Doe"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="Your Company Ltd"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
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
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
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
                        We'll use this to send you supplier quotes
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="country">Your Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        placeholder="e.g., USA, UK, Germany"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* RFQ Details */}
                <div className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-4">
                    Product Request Details
                  </h2>

                  <div>
                    <Label htmlFor="product_category">Product Category</Label>
                    <Select 
                      value={formData.product_category} 
                      onValueChange={(v) => handleChange('product_category', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="product_description">
                      Product Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="product_description"
                      value={formData.product_description}
                      onChange={(e) => handleChange('product_description', e.target.value)}
                      placeholder="Describe the product you're looking for in detail..."
                      rows={4}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', e.target.value)}
                        placeholder="e.g., 1000"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select 
                        value={formData.unit} 
                        onValueChange={(v) => handleChange('unit', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="meters">Meters</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="budget_range">Budget Range</Label>
                      <Input
                        id="budget_range"
                        value={formData.budget_range}
                        onChange={(e) => handleChange('budget_range', e.target.value)}
                        placeholder="e.g., 10000-50000"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(v) => handleChange('currency', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="delivery_location">Delivery Location</Label>
                      <Input
                        id="delivery_location"
                        value={formData.delivery_location}
                        onChange={(e) => handleChange('delivery_location', e.target.value)}
                        placeholder="e.g., Port of Los Angeles, USA"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="delivery_timeline">Delivery Timeline</Label>
                      <Input
                        id="delivery_timeline"
                        value={formData.delivery_timeline}
                        onChange={(e) => handleChange('delivery_timeline', e.target.value)}
                        placeholder="e.g., 30-45 days"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="special_requirements">Special Requirements</Label>
                    <Textarea
                      id="special_requirements"
                      value={formData.special_requirements}
                      onChange={(e) => handleChange('special_requirements', e.target.value)}
                      placeholder="Any certifications, quality standards, packaging requirements, etc."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
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
                        <Send className="w-4 h-4 mr-2" />
                        Submit RFQ
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-green-500 bg-green-50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-4">
                  RFQ Submitted Successfully!
                </h2>
                <p className="text-lg text-afrikoni-deep/70 mb-6">
                  Your request has been received. We'll connect you with suppliers within 24-48 hours.
                </p>

                <div className="bg-white rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold mb-3">Next Steps:</h3>
                  <ul className="space-y-2 text-sm text-afrikoni-deep/70">
                    <li>✅ Our team will review your RFQ</li>
                    <li>✅ We'll match you with relevant African suppliers</li>
                    <li>✅ Suppliers will send quotes via WhatsApp/Email</li>
                    <li>✅ You'll receive quotes within 24-48 hours</li>
                  </ul>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => window.open(submitted.whatsappLink, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share via WhatsApp
                  </Button>
                  <Button
                    onClick={() => window.open(submitted.emailLink, '_blank')}
                    variant="outline"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </Button>
                </div>

                <Button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-afrikoni-gold hover:bg-afrikoni-goldDark"
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
              💼 MVP Phase 1 - Manual Process
            </h3>
            <p className="text-sm text-afrikoni-deep/70 mb-2">
              During Phase 1, our team manually reviews and forwards RFQs to verified suppliers. 
              This ensures quality matches and personalized service.
            </p>
            <p className="text-sm text-afrikoni-deep/70">
              <strong>Brokering Fee:</strong> 5-10% of transaction value (negotiable based on order size)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

