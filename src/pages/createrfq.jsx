import React, { useState, useEffect } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { validateNumeric, sanitizeString } from '@/utils/security';

export default function CreateRFQ() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
      const [userData, catsRes] = await Promise.all([
        supabaseHelpers.auth.me(),
        supabase.from('categories').select('*')
      ]);

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

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Security: Validate and sanitize inputs
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
      // Get or create company (always from authenticated user)
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      // Company is optional - create RFQ even without it
      // Security: Sanitize all text inputs, validate UUIDs
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
        // Silently fail - notifications are non-blocking
        console.log('RFQ notification to sellers failed (non-blocking):', err);
      }

      toast.success('RFQ created successfully!');
      setTimeout(() => {
        navigate(createPageUrl('BuyerDashboard'));
      }, 1000);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to create RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-2">Create Request for Quote</h1>
          <p className="text-lg text-afrikoni-deep">Describe what you need and get competitive quotes from suppliers</p>
        </div>
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="title">What are you looking for? *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. 1000 units of printed packaging boxes"
              />
            </div>
            <div>
              <Label htmlFor="description">Detailed Requirements *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Provide detailed specifications, quality standards, preferred materials, etc."
                rows={6}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(v) => handleChange('category_id', v)}>
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
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="1000"
                />
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
                />
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
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-afrikoni-gold hover:bg-amber-700">
                {isLoading ? 'Creating...' : 'Publish RFQ'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

