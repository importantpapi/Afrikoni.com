import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, ArrowLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import { validateNumeric, sanitizeString } from '@/utils/security';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

const UNITS = ['pieces', 'kg', 'tons', 'containers', 'pallets', 'boxes', 'bags', 'units', 'liters', 'meters'];

export default function CreateRFQ() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [currentRole, setCurrentRole] = useState(role || 'buyer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    quantity: '',
    unit: 'pieces',
    target_price: '',
    currency: 'USD',
    delivery_location: '',
    target_country: '',
    closing_date: null,
    attachments: []
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[CreateRFQ] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[CreateRFQ] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, profile, role, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const normalizedRole = role || 'buyer';
      setCurrentRole(normalizedRole === 'logistics_partner' ? 'logistics' : normalizedRole);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(categoriesData || []);
    } catch (error) {
      toast.error('Failed to load form data');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    try {
      // Generate unique filename with proper sanitization
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `rfq-attachments/${timestamp}-${randomStr}-${cleanFileName}`;

      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files', fileName);
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, file_url] }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(`Failed to upload file: ${error.message || 'Please try again'}`);
    } finally {
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const quantity = validateNumeric(formData.quantity, { min: 1 });
    const targetPrice = formData.target_price ? validateNumeric(formData.target_price, { min: 0 }) : null;
    
    if (quantity === null || quantity < 1) {
      toast.error('Please enter a valid quantity (must be at least 1)');
      return;
    }
    
    if (formData.target_price && (targetPrice === null || targetPrice < 0)) {
      toast.error('Please enter a valid target price (must be 0 or greater)');
      return;
    }
    
    setIsLoading(true);
    try {
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      const rfqData = {
        title: sanitizeString(formData.title),
        description: sanitizeString(formData.description),
        category_id: formData.category_id || null,
        quantity: quantity,
        unit: sanitizeString(formData.unit || 'pieces'),
        target_price: targetPrice,
        delivery_location: sanitizeString(formData.delivery_location || ''),
        expires_at: formData.closing_date ? format(formData.closing_date, 'yyyy-MM-dd') : null,
        attachments: formData.attachments || [],
        status: 'open',
        buyer_company_id: companyId || null
      };

      const { data: newRFQ, error } = await supabase.from('rfqs').insert(rfqData).select().single();
      if (error) throw error;

      // Create notification for buyer
      if (companyId) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_email: user.email,
          company_id: companyId,
          title: 'RFQ Created',
          message: `Your RFQ "${rfqData.title}" is now live`,
          type: 'rfq',
          link: `/dashboard/rfqs/${newRFQ.id}`,
          related_id: newRFQ.id
        });
        // Silently ignore notification failures
        if (notifError) {
          // noop
        }
      }

      // Notify all sellers about new RFQ
      try {
        const { notifyRFQCreated } = await import('@/services/notificationService');
        await notifyRFQCreated(newRFQ.id, companyId);
      } catch (err) {
        // Notification failed, but RFQ was created
      }

      toast.success('RFQ created successfully!');
      navigate(`/dashboard/rfqs/${newRFQ.id}`);
    } catch (error) {
      toast.error('Failed to create RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRFQ = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Start with one or two simple sentences about what you need.');
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
        target_country: formData.target_country,
      };
      const result = await AIDescriptionService.generateRFQFromBrief(brief);
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        quantity: result.quantity || prev.quantity,
        unit: result.unit || prev.unit,
        delivery_location: result.delivery_location || prev.delivery_location,
        target_country: result.target_country || prev.target_country,
      }));
      toast.success('Afrikoni AI structured your RFQ. Please review before publishing.');
    } catch (error) {
      toast.error('Afrikoni AI could not generate the RFQ. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading RFQ form..." />;
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/rfqs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Create Request for Quote</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
              Describe what you need and get competitive quotes from trusted African suppliers.
            </p>
          </div>
        </div>

        {/* Simple explanation of how RFQs work */}
        <Card className="border-afrikoni-gold/30 bg-afrikoni-offwhite/60">
          <CardContent className="p-4 md:p-5">
            <p className="text-xs md:text-sm font-semibold text-afrikoni-chestnut mb-2 uppercase tracking-wide">
              How it works on Afrikoni
            </p>
            <div className="grid md:grid-cols-4 gap-3 text-xs md:text-sm text-afrikoni-deep">
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">Step 1 — Tell us what you need</p>
                <p>Fill this form with quantity, quality and delivery details. The clearer you are, the better the quotes.</p>
              </div>
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">Step 2 — Suppliers send quotes</p>
                <p>Verified suppliers across Africa review your RFQ and respond with prices and terms inside Afrikoni.</p>
              </div>
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">Step 3 — Choose and confirm</p>
                <p>You compare offers, chat with suppliers, then confirm the one that fits your budget and timeline.</p>
              </div>
              <div>
                <p className="font-semibold text-afrikoni-chestnut mb-1">Step 4 — Pay safely with Shield™</p>
                <p>
                  Payments are protected by Afrikoni Shield™ escrow. Funds are held until delivery is confirmed.
                  <span className="block mt-1 font-semibold text-red-700">
                    Never pay suppliers outside Afrikoni.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">What are you looking for? *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1000 units of printed packaging boxes"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Detailed Requirements *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleGenerateRFQ}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-xs border-afrikoni-gold/50 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGenerating ? 'Generating…' : 'Afrikoni AI help'}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your need in your own words. Afrikoni AI will help you turn it into a clear RFQ."
                  rows={6}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                    <SelectTrigger>
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
                  <Label htmlFor="quantity">Quantity Needed *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target_price">Target Price per Unit</Label>
                  <Input
                    id="target_price"
                    type="number"
                    step="0.01"
                    value={formData.target_price}
                    onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target_country">Target Country</Label>
                  <Select value={formData.target_country} onValueChange={(v) => setFormData({ ...formData, target_country: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delivery_location">Delivery Location</Label>
                  <Input
                    id="delivery_location"
                    value={formData.delivery_location}
                    onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <Label>Closing Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.closing_date ? format(formData.closing_date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.closing_date}
                        onSelect={(date) => setFormData({ ...formData, closing_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/rfqs')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Publish RFQ'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

