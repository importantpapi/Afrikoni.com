import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { validateNumeric, sanitizeString } from '@/utils/security';
import { validateRFQForm } from '@/utils/validation';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import ShippingCalculator from '@/components/shipping/ShippingCalculator';
import { useLanguage } from '@/i18n/LanguageContext';

export default function CreateRFQ() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    quantity: '',
    unit: 'pieces',
    target_price: '',
    delivery_location: '',
    delivery_deadline: null,
    attachments: [],
    status: 'open'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const [userResult, catsRes] = await Promise.all([
        getCurrentUserAndRole(supabase, supabaseHelpers),
        supabase.from('categories').select('*')
      ]);
      const { user: userData } = userResult;

      if (catsRes.error) throw catsRes.error;

      setUser(userData);
      setCategories(catsRes.data || []);

      // Company is optional - continue even without it
      // RFQs can be created without company
    } catch (error) {
      // Error logged (removed for production)
      supabaseHelpers.auth.redirectToLogin();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files');
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, file_url] }));
      toast.success('File uploaded successfully');
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to upload file');
    }
  };

  const handleGenerateRFQ = async () => {
    if (!formData.title && !formData.description) {
      toast.error(t('rfq.startWriting'));
      return;
    }
    setIsGenerating(true);
    try {
      const brief = {
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        delivery_location: formData.delivery_location,
      };
      const result = await AIDescriptionService.generateRFQFromBrief(brief);
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        quantity: result.quantity || prev.quantity,
        unit: result.unit || prev.unit,
        delivery_location: result.delivery_location || prev.delivery_location,
      }));
      toast.success(t('rfq.aiStructured'));
    } catch (error) {
      toast.error(t('rfq.aiError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    // Use centralized validation
    const validationErrors = validateRFQForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(t('rfq.fixErrors'));
      return;
    }
    
    setErrors({});
    
    setIsLoading(true);
    try {
      // Get or create company (always from authenticated user)
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      // Company is optional - create RFQ even without it
      // Security: Sanitize all text inputs, validate UUIDs
      const quantity = parseFloat(formData.quantity) || 0;
      const targetPrice = parseFloat(formData.target_price) || null;
      
      const rfqData = {
        title: sanitizeString(formData.title),
        description: sanitizeString(formData.description),
        category_id: formData.category_id || null, // UUID validated by RLS
        quantity: quantity,
        unit: sanitizeString(formData.unit || 'pieces'),
        target_price: targetPrice,
        delivery_location: sanitizeString(formData.delivery_location || ''),
        delivery_deadline: formData.delivery_deadline ? format(formData.delivery_deadline, 'yyyy-MM-dd') : null,
        expires_at: formData.delivery_deadline ? format(formData.delivery_deadline, 'yyyy-MM-dd') : null,
        attachments: formData.attachments || [],
        status: 'open',
        buyer_company_id: companyId || null // Optional - can be null
      };

      const { data: newRFQ, error } = await supabase.from('rfqs').insert(rfqData).select().single();
      if (error) throw error;

      // Send email notification (placeholder)
      await supabaseHelpers.email.send({
        to: user.email,
        subject: 'RFQ Created - AFRIKONI',
        body: `Your RFQ "${rfqData.title}" has been created successfully. Suppliers will start sending quotes soon.`
      });

      // Create notification for buyer
      if (companyId) {
        await supabase.from('notifications').insert({
          user_email: user.email,
          company_id: companyId,
          title: 'RFQ Created',
          message: `Your RFQ "${rfqData.title}" is now live`,
          type: 'rfq',
          link: `/dashboard/rfqs/${newRFQ.id}`,
          related_id: newRFQ.id
        }).catch(() => {
          // Silently fail if notification creation fails
        });
      }

      // Notify all sellers about new RFQ
      try {
        const { notifyRFQCreated } = await import('@/services/notificationService');
        await notifyRFQCreated(newRFQ.id, companyId);
      } catch (err) {
        // Notification failed, but RFQ was created
      }

      toast.success(t('rfq.success'));
      setTimeout(() => {
        navigate(`/dashboard/rfqs/${newRFQ.id}`);
      }, 1000);
    } catch (error) {
      // Surface error details temporarily to help debug RFQ creation issues
      // eslint-disable-next-line no-console
      console.error('RFQ create error:', error);
      toast.error(error?.message || t('rfq.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">{t('rfq.createTitle')}</h1>
          <p className="text-base sm:text-lg text-afrikoni-deep">
            {t('rfq.createSubtitle')}
          </p>
        </div>

        {/* Simple explanation of the RFQ journey */}
        <Card className="border-afrikoni-gold/30 bg-white/80 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs md:text-sm font-semibold text-afrikoni-chestnut uppercase tracking-wide">
              Trade journey with Afrikoni Shield™
            </p>
            <div className="grid md:grid-cols-4 gap-4 text-sm text-afrikoni-deep">
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">1. Share your need</p>
                <p>Explain the product, quantity and delivery city in simple language. You don’t need to be perfect.</p>
              </div>
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">2. Receive quotes</p>
                <p>Verified suppliers respond inside Afrikoni. You can compare prices and terms in one place.</p>
              </div>
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">3. Confirm supplier</p>
                <p>Chat, ask questions, then choose the supplier you trust based on price, lead time and verification.</p>
              </div>
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">4. Pay securely</p>
                <p>
                  You pay through Afrikoni Trade Shield™. We hold the funds in escrow until delivery is confirmed.
                  <span className="block mt-1 font-semibold text-red-700 text-xs">
                    For your safety, do not send money outside Afrikoni.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm sm:text-base">What are you looking for? *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. 1000 units of printed packaging boxes"
                className="text-sm sm:text-base min-h-[44px] mt-1"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Detailed Requirements *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleGenerateRFQ}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-xs sm:text-sm border-afrikoni-gold/50 text-afrikoni-gold hover:bg-afrikoni-gold/10 min-h-[36px] sm:min-h-0"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  {isGenerating ? 'Generating…' : 'Afrikoni AI help'}
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what you need in simple words. Afrikoni AI can turn it into a clear RFQ for suppliers."
                rows={6}
                className={`text-sm sm:text-base min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">Category</Label>
                <Select value={formData.category_id} onValueChange={(v) => handleChange('category_id', v)}>
                  <SelectTrigger className="min-h-[44px] sm:min-h-0 text-sm sm:text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity Needed *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="1000"
                  className={`text-sm sm:text-base min-h-[44px] sm:min-h-0 ${errors.quantity ? 'border-red-500' : ''}`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(v) => handleChange('unit', v)}>
                  <SelectTrigger>
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
              <div>
                <Label htmlFor="target_price">Target Price per Unit (USD)</Label>
                <Input
                  id="target_price"
                  type="number"
                  step="0.01"
                  value={formData.target_price}
                  onChange={(e) => handleChange('target_price', e.target.value)}
                  placeholder="Optional"
                  className={errors.target_price ? 'border-red-500' : ''}
                />
                {errors.target_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.target_price}</p>
                )}
              </div>
              <div>
                <Label htmlFor="delivery_location">Delivery Location *</Label>
                <Input
                  id="delivery_location"
                  value={formData.delivery_location}
                  onChange={(e) => handleChange('delivery_location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label>Delivery Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.delivery_deadline ? format(formData.delivery_deadline, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.delivery_deadline}
                      onSelect={(date) => handleChange('delivery_deadline', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Shipping Calculator */}
              <div className="pt-4 border-t border-afrikoni-gold/20">
                <ShippingCalculator
                  compact={true}
                  defaultWeight={formData.quantity || ''}
                  onCalculate={(result) => {
                    // Store shipping estimate in form data if needed
                    if (result?.results?.[0]) {
                      toast.success(`Estimated shipping: $${result.results[0].cost} via ${result.results[0].name}`);
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Attachments</Label>
              <div className="border-2 border-dashed border-afrikoni-gold/30 rounded-lg p-6 text-center hover:border-afrikoni-gold transition">
                <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-afrikoni-deep/70 mx-auto mb-2" />
                  <div className="text-sm text-afrikoni-deep">Upload specifications, drawings, or reference files</div>
                </label>
              </div>
              {formData.attachments.length > 0 && (
                <div className="mt-2 text-sm text-afrikoni-deep">{formData.attachments.length} file(s) uploaded</div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('BuyerDashboard'))}
                className="flex-1 min-h-[44px] sm:min-h-0 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="flex-1 bg-afrikoni-gold hover:bg-amber-700 min-h-[44px] sm:min-h-0 text-sm sm:text-base touch-manipulation"
              >
                {isLoading ? 'Creating...' : 'Publish RFQ'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

