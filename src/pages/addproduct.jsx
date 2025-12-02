import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Sparkles, Lightbulb, Image, FileText, DollarSign, Shield, TrendingUp } from 'lucide-react';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { validateNumeric, sanitizeString } from '@/utils/security';

export default function AddProduct() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    images: [],
    price: '',
    moq: '',
    unit: 'pieces',
    delivery_time: '',
    packaging: '',
    currency: 'USD',
    status: 'active'
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

      if (catsRes.error) throw catsRes.error;

      const { user: userData } = userResult;
      setUser(userData);
      setCategories(catsRes.data || []);

      // Get or create company (non-blocking)
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);
      
      if (companyId) {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle();
        if (!error && companyData) {
          setCompany(companyData);
        }
      }
      // Continue even without company - don't block
    } catch (error) {
      // Error logged (removed for production)
      supabaseHelpers.auth.redirectToLogin();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'files');
        uploadedUrls.push(file_url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success('Images uploaded successfully');
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title) {
      toast.error('Please enter a product title first.');
      return;
    }
    setIsGenerating(true);
    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      const result = await AIDescriptionService.generateProductDescription({
        title: formData.title,
        category: selectedCategory?.name,
        country: company?.country
      });
      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.optimized_title || prev.title,
          description: `${result.full_description}\n\n**Key Selling Points:**\n${result.selling_points.map(p => `- ${p}`).join('\n')}`
        }));
        toast.success('AI description generated!');
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to generate description.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.moq) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Security: Validate and sanitize inputs
    const price = validateNumeric(formData.price, { min: 0 });
    const moq = validateNumeric(formData.moq, { min: 1 });
    
    if (price === null || price <= 0) {
      toast.error('Please enter a valid price (must be greater than 0)');
      return;
    }
    
    if (moq === null || moq < 1) {
      toast.error('Please enter a valid MOQ (must be at least 1)');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get or create company (always from authenticated user)
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);
      
      if (!companyId) {
        toast.error('No company associated with your account. Please complete onboarding.');
        setIsLoading(false);
        return;
      }
      
      // Security: Sanitize text inputs
      const { data: newProduct, error } = await supabase.from('products').insert({
        title: sanitizeString(formData.title),
        description: sanitizeString(formData.description),
        category_id: formData.category_id, // UUID validated by RLS
        images: formData.images || [],
        price: price,
        price_min: price,
        min_order_quantity: moq,
        moq: moq,
        unit: sanitizeString(formData.unit || 'pieces'),
        delivery_time: sanitizeString(formData.delivery_time || ''),
        packaging: sanitizeString(formData.packaging || ''),
        currency: formData.currency || 'USD',
        status: formData.status || 'active',
        company_id: companyId, // Always from authenticated user, never from input
        views: 0,
        inquiries: 0
      }).select('id').single();
      
      if (error) throw error;
      
      // Save images to product_images table
      if (newProduct?.id && formData.images && formData.images.length > 0) {
        const imageRecords = formData.images.map((imgUrl, index) => ({
          product_id: newProduct.id,
          url: typeof imgUrl === 'string' ? imgUrl : imgUrl.url || imgUrl,
          alt_text: formData.title || 'Product image',
          is_primary: index === 0,
          sort_order: index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          // Error logged (removed for production)
          // Don't fail the whole operation, just log it
        }
      }
      
      toast.success('Product created successfully!');
      setTimeout(() => {
        navigate('/dashboard/products');
      }, 1000);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Intro Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-4">List Your Product</h1>
          <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto mb-8">
            Join thousands of successful sellers on Africa's leading B2B marketplace. Create compelling product listings that attract buyers and drive sales.
          </p>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center">
                    <span className="text-afrikoni-creamfont-bold text-xl">+</span>
                  </div>
                </div>
                <h3 className="font-bold text-afrikoni-chestnut mb-2">Reach Million+ Buyers</h3>
                <p className="text-sm text-afrikoni-deep">Connect with verified buyers across Africa</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-afrikoni-cream" />
                  </div>
                </div>
                <h3 className="font-bold text-afrikoni-chestnut mb-2">Secure Transactions</h3>
                <p className="text-sm text-afrikoni-deep">Protected payments and verified orders</p>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-afrikoni-cream" />
                  </div>
                </div>
                <h3 className="font-bold text-afrikoni-chestnut mb-2">Boost Your Sales</h3>
                <p className="text-sm text-afrikoni-deep">AI-powered product optimization</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Product Details</h2>
          <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
            Provide comprehensive information about your product to attract more buyers and increase your chances of making sales.
          </p>
        </div>

        <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Product Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
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
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={company?.country || ''}
                  placeholder="Enter country"
                  disabled
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="Enter price"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="moq">Minimum Order Quantity *</Label>
                  <Input
                    id="moq"
                    type="number"
                    value={formData.moq || '1'}
                    onChange={(e) => handleChange('moq', e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="available">Available Quantity</Label>
                  <Input
                    id="available"
                    type="number"
                    placeholder="Enter available quantity"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="images">Product Images (Max 5)</Label>
                <div className="border-2 border-dashed border-afrikoni-gold/30 rounded-lg p-12 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-afrikoni-deep/70 mx-auto mb-3" />
                    <div className="text-afrikoni-chestnut font-medium mb-1">
                      Click to upload images ({5 - formData.images.length} remaining)
                    </div>
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-4 mt-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-afrikoni-gold/20">
                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-afrikoni-creamrounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-afrikoni-gold/20">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('SellerDashboard'))}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || uploadingImages}
                className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream"
              >
                {isLoading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-afrikoni-chestnut">Success Tips</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Image className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">High-Quality Images</h3>
                <p className="text-sm text-afrikoni-deep">Upload clear, professional photos from multiple angles.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">Detailed Descriptions</h3>
                <p className="text-sm text-afrikoni-deep">Include specifications, materials, and use cases.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-afrikoni-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">Competitive Pricing</h3>
                <p className="text-sm text-afrikoni-deep">Research market prices and offer fair rates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

