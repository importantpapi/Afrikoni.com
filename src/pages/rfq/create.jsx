import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { CheckCircle, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AFRICAN_COUNTRIES } from '@/constants/countries';
import SEO from '@/components/SEO';

const CERTIFICATIONS = [
  'ISO 9001',
  'ISO 14001',
  'HACCP',
  'Organic Certified',
  'Fair Trade',
  'CE Marking',
  'FDA Approved',
  'Other'
];

const INCOTERMS = ['EXW', 'FOB', 'CIF', 'DDP', 'Unsure'];
const TIMELINES = ['ASAP', '30 days', '60 days', '90 days', 'Flexible'];
const PURCHASE_TYPES = ['One-time purchase', 'Ongoing sourcing'];
const ORDER_VALUE_RANGES = [
  'Under €1,000',
  '€1,000 - €10,000',
  '€10,000 - €50,000',
  '€50,000 - €100,000',
  'Over €100,000'
];
const BUYER_ROLES = ['Procurement', 'Founder', 'Buyer', 'Other'];

export default function CreateRFQ() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rfqId, setRfqId] = useState(null);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [rfqCount, setRfqCount] = useState(0);
  
  const [formData, setFormData] = useState({
    // Step 1: Basics
    productName: searchParams.get('product') || '',
    category_id: '',
    quantity: searchParams.get('quantity') || '',
    unit: 'pieces',
    target_country: '',
    delivery_country: searchParams.get('country') || '',
    timeline: 'Flexible',
    
    // Step 2: Requirements
    specifications: '',
    budget_min: '',
    budget_max: '',
    certifications: [],
    incoterms: 'Unsure',
    
    // Step 3: Trust & Intent
    purchase_type: '',
    order_value_range: '',
    company_name: '',
    buyer_role: ''
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[CreateRFQ] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/signup?redirect=/rfq/create');
      return;
    }

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Use auth from context (no duplicate call)
      const companyId = profile?.company_id || null;
      
      if (companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
      if (companyData) {
        setCompany(companyData);
        setFormData(prev => ({ ...prev, company_name: companyData.name }));
      }

      // Check RFQ count for pricing
      if (companyId) {
        const { count } = await supabase
          .from('rfqs')
          .select('*', { count: 'exact', head: true })
          .eq('buyer_company_id', companyId);
        
        setRfqCount(count || 0);
        setRequiresPayment((count || 0) > 0);
      }
    }

    const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      setCategories(categoriesData || []);
    } catch (error) {
      toast.error('Failed to load form data');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCertificationToggle = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.productName.trim()) {
        toast.error('Product name is required');
        return false;
      }
      if (!formData.category_id) {
        toast.error('Category is required');
        return false;
      }
      if (!formData.quantity) {
        toast.error('Quantity is required');
        return false;
      }
      if (!formData.delivery_country) {
        toast.error('Delivery country is required');
        return false;
      }
    }
    if (step === 2) {
      // Step 2 is mostly optional
    }
    if (step === 3) {
      if (!formData.purchase_type) {
        toast.error('Please select purchase type');
        return false;
      }
      if (!formData.order_value_range) {
        toast.error('Please select estimated order value');
        return false;
      }
      if (!formData.company_name.trim()) {
        toast.error('Company name is required');
        return false;
      }
      if (!formData.buyer_role) {
        toast.error('Please select your role');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    // Check if payment is required (first RFQ is free)
    if (requiresPayment) {
      // Block submission if payment required (Phase 2 activation)
      toast.error('To keep supplier matching high-quality, additional RFQs require a small review fee. Please contact support or wait for payment integration.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const companyId = profile?.company_id || null;
      if (!companyId) {
        navigate('/onboarding/company', { replace: true });
        return;
      }

      const rfqData = {
        title: formData.productName.trim(),
        description: formData.specifications || '',
        category_id: formData.category_id || null,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit || 'pieces',
        target_price: formData.budget_min ? parseFloat(formData.budget_min) : null,
        target_price_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        delivery_location: formData.delivery_country,
        target_country: formData.target_country || null,
        urgency: formData.timeline.toLowerCase().replace(' ', '_'),
        status: 'pending_review',
        buyer_company_id: companyId,
        buyer_user_id: user.id,
        metadata: {
          certifications: formData.certifications,
          incoterms: formData.incoterms,
          purchase_type: formData.purchase_type,
          order_value_range: formData.order_value_range,
          buyer_role: formData.buyer_role,
          company_name: formData.company_name,
          budget_min: formData.budget_min,
          budget_max: formData.budget_max
        }
      };

      const { data: newRFQ, error } = await supabase
        .from('rfqs')
        .insert(rfqData)
        .select()
        .single();

      if (error) throw error;

      setRfqId(newRFQ.id);
      setCurrentStep(4);

      // Send notification
      const { sendRFQNotification } = await import('@/utils/rfqNotifications');
      await sendRFQNotification({
        type: 'rfq_submitted',
        rfqId: newRFQ.id,
        buyerUserId: user.id,
        companyId: companyId
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to submit RFQ');
    } finally {
      setIsLoading(false);
    }
  };


  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="productName" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Product name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="productName"
          value={formData.productName}
          onChange={(e) => handleChange('productName', e.target.value)}
          placeholder="e.g., Cocoa beans, Shea butter..."
          className="text-base min-h-[48px]"
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="category" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.category_id} onValueChange={(v) => handleChange('category_id', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
            Quantity <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="1000"
            className="text-base min-h-[48px]"
          />
        </div>
        <div>
          <Label htmlFor="unit" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
            Unit
          </Label>
          <Select value={formData.unit} onValueChange={(v) => handleChange('unit', v)}>
            <SelectTrigger className="text-base min-h-[48px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pieces">Pieces</SelectItem>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="tons">Tons</SelectItem>
              <SelectItem value="containers">Containers</SelectItem>
              <SelectItem value="liters">Liters</SelectItem>
              <SelectItem value="meters">Meters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="target_country" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Target country of supplier <span className="text-sm font-normal text-afrikoni-deep/70">(optional)</span>
        </Label>
        <Select value={formData.target_country} onValueChange={(v) => handleChange('target_country', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue placeholder="Any African country" />
          </SelectTrigger>
          <SelectContent>
            {AFRICAN_COUNTRIES.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="delivery_country" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Delivery country <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.delivery_country} onValueChange={(v) => handleChange('delivery_country', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue placeholder="Select delivery country" />
          </SelectTrigger>
          <SelectContent>
            {AFRICAN_COUNTRIES.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="timeline" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Required timeline <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.timeline} onValueChange={(v) => handleChange('timeline', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMELINES.map(timeline => (
              <SelectItem key={timeline} value={timeline}>{timeline}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="specifications" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Specifications
        </Label>
        <Textarea
          id="specifications"
          value={formData.specifications}
          onChange={(e) => handleChange('specifications', e.target.value)}
          placeholder="Detailed product specifications, quality requirements, packaging needs..."
          className="min-h-[120px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budget_min" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
            Budget range (min) <span className="text-sm font-normal text-afrikoni-deep/70">(optional)</span>
          </Label>
          <Input
            id="budget_min"
            type="number"
            value={formData.budget_min}
            onChange={(e) => handleChange('budget_min', e.target.value)}
            placeholder="0"
            className="text-base min-h-[48px]"
          />
        </div>
        <div>
          <Label htmlFor="budget_max" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
            Budget range (max) <span className="text-sm font-normal text-afrikoni-deep/70">(optional)</span>
          </Label>
          <Input
            id="budget_max"
            type="number"
            value={formData.budget_max}
            onChange={(e) => handleChange('budget_max', e.target.value)}
            placeholder="0"
            className="text-base min-h-[48px]"
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold text-afrikoni-chestnut mb-3 block">
          Certifications required <span className="text-sm font-normal text-afrikoni-deep/70">(optional)</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {CERTIFICATIONS.map(cert => (
            <div key={cert} className="flex items-center space-x-2">
              <Checkbox
                id={cert}
                checked={formData.certifications.includes(cert)}
                onCheckedChange={() => handleCertificationToggle(cert)}
              />
              <Label htmlFor={cert} className="text-sm cursor-pointer">{cert}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="incoterms" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Incoterms
        </Label>
        <Select value={formData.incoterms} onValueChange={(v) => handleChange('incoterms', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INCOTERMS.map(term => (
              <SelectItem key={term} value={term}>{term}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="purchase_type" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Is this for <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.purchase_type} onValueChange={(v) => handleChange('purchase_type', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue placeholder="Select purchase type" />
          </SelectTrigger>
          <SelectContent>
            {PURCHASE_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="order_value_range" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Estimated order value <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.order_value_range} onValueChange={(v) => handleChange('order_value_range', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_VALUE_RANGES.map(range => (
              <SelectItem key={range} value={range}>{range}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="company_name" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Company name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => handleChange('company_name', e.target.value)}
          placeholder="Your company name"
          className="text-base min-h-[48px]"
        />
      </div>

      <div>
        <Label htmlFor="buyer_role" className="text-base font-semibold text-afrikoni-chestnut mb-2 block">
          Role <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.buyer_role} onValueChange={(v) => handleChange('buyer_role', v)}>
          <SelectTrigger className="text-base min-h-[48px]">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            {BUYER_ROLES.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg p-4 mt-6">
        <p className="text-sm text-afrikoni-deep/80 text-center">
          RFQs are reviewed to ensure quality matches.
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-3">RFQ Submitted</h2>
        <p className="text-lg text-afrikoni-deep/80 mb-4">
          Our team will review your request and match you with verified African suppliers within 24–48 hours.
        </p>
        {rfqId && (
          <div className="bg-afrikoni-cream/50 border border-afrikoni-gold/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-afrikoni-deep/70 mb-1">RFQ ID</p>
            <p className="text-lg font-mono font-bold text-afrikoni-chestnut">{rfqId}</p>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-afrikoni-chestnut">What happens next:</h3>
        <div className="text-left max-w-md mx-auto space-y-2 text-sm text-afrikoni-deep/80">
          <div className="flex items-start gap-2">
            <span className="font-bold text-afrikoni-gold">1.</span>
            <span>Our team reviews your RFQ for quality and feasibility</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-afrikoni-gold">2.</span>
            <span>We match you with verified African suppliers</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-afrikoni-gold">3.</span>
            <span>You receive quotes and can proceed securely</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button
          onClick={() => navigate(`/dashboard/rfqs/${rfqId}`)}
          className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
        >
          Track RFQ
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/marketplace')}
          className="border-afrikoni-gold text-afrikoni-chestnut"
        >
          Explore Marketplace
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <SEO title="Post a Trade Request - Afrikoni" description="Submit a trade request to get matched with verified African suppliers" />
      <div className="min-h-screen bg-afrikoni-offwhite py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {currentStep < 4 && (
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-afrikoni-chestnut mb-2">Post a Trade Request</h1>
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3].map(step => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step === currentStep
                        ? 'bg-afrikoni-gold border-afrikoni-gold text-afrikoni-chestnut font-bold'
                        : step < currentStep
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-white border-afrikoni-gold/30 text-afrikoni-deep/50'
                    }`}>
                      {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`flex-1 h-1 ${
                        step < currentStep ? 'bg-green-500' : 'bg-afrikoni-gold/30'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-sm text-afrikoni-deep/70 mt-2 text-center">
                Step {currentStep} of 3
              </p>
            </div>
          )}

          <Card className="border-afrikoni-gold/30 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                </motion.div>
              </AnimatePresence>

              {currentStep < 4 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-afrikoni-gold/20">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="border-afrikoni-gold text-afrikoni-chestnut"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={currentStep === 3 ? handleSubmit : handleNext}
                    disabled={isLoading}
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                  >
                    {currentStep === 3 ? 'Submit RFQ' : 'Continue'}
                    {currentStep < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

