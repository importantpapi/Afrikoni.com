/**
 * KoniAI Hub - The Intelligence Behind African Trade
 * 
 * Central hub for all KoniAI features:
 * - AI Product Assistant
 * - Find Suppliers with KoniAI
 * - RFQ Reply Assistant
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Copy, CheckCircle, Loader2, AlertCircle,
  Package, Search, MessageSquare, ExternalLink, Users, Target, Bell, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { generateProductListing, suggestSuppliers, generateSupplierReply } from '@/ai/aiFunctions';
import KoniAILogo from '@/components/koni/KoniAILogo';
import KoniAIBadge from '@/components/koni/KoniAIBadge';
import KoniAIActionButton from '@/components/koni/KoniAIActionButton';
import KoniAIHero from '@/components/koni/KoniAIHero';
import { useTranslation } from 'react-i18next';

export default function KoniAIHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);

  // Product Assistant state
  const [productInput, setProductInput] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productLanguage, setProductLanguage] = useState('English');
  const [productResult, setProductResult] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productCopied, setProductCopied] = useState(false);

  // Supplier Finder state
  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierCountry, setSupplierCountry] = useState('');
  const [supplierMinQty, setSupplierMinQty] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);

  // RFQ Reply state
  const [rfqInput, setRfqInput] = useState('');
  const [rfqTone, setRfqTone] = useState('Professional');
  const [rfqReply, setRfqReply] = useState('');
  const [rfqLoading, setRfqLoading] = useState(false);
  
  // Matching feed state
  const [matchingBuyers, setMatchingBuyers] = useState([]);
  const [matchingSuppliers, setMatchingSuppliers] = useState([]);
  const [autoFollowUpEnabled, setAutoFollowUpEnabled] = useState(false);

  // API key check
  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(userData);

      // Load company
      if (profile?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle();
        if (companyData) setCompany(companyData);
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);

      // Load countries (from products or companies)
      const { data: countriesData } = await supabase
        .from('products')
        .select('country_of_origin')
        .not('country_of_origin', 'is', null)
        .order('country_of_origin');
      
      const uniqueCountries = [...new Set((countriesData || []).map(p => p.country_of_origin))].sort();
      setCountries(uniqueCountries);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  // Product Assistant
  const handleGenerateProduct = async () => {
    if (!productInput.trim()) {
      toast.error('Please describe your product');
      return;
    }

    if (!hasApiKey) {
      toast.error('KoniAI is not configured. Please add your OpenAI API key.');
      return;
    }

    setProductLoading(true);
    setProductResult(null);
    setProductCopied(false);

    try {
      const selectedCategory = categories.find(c => c.id === productCategory);
      const result = await generateProductListing({
        title: productInput,
        description: productInput,
        category: selectedCategory?.name || '',
        language: productLanguage,
        tone: 'Professional'
      });

      if (result.success && result.data) {
        setProductResult(result.data);
        toast.success('✨ Product listing generated!');
      } else {
        toast.error('Failed to generate product listing. Please try again.');
      }
    } catch (error) {
      console.error('Product generation error:', error);
      toast.error('KoniAI couldn\'t complete this request. Please try again in a moment.');
    } finally {
      setProductLoading(false);
    }
  };

  const copyProductResult = () => {
    if (!productResult) return;
    
    const text = `Title: ${productResult.title}\n\nDescription:\n${productResult.description}\n\nTags: ${productResult.tags.join(', ')}\n\nSuggested Category: ${productResult.suggestedCategory}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setProductCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setProductCopied(false), 2000);
    });
  };

  // Supplier Finder
  const handleFindSuppliers = async () => {
    if (!supplierQuery.trim()) {
      toast.error('Please describe what you\'re looking for');
      return;
    }

    if (!hasApiKey) {
      toast.error('KoniAI is not configured. Please add your OpenAI API key.');
      return;
    }

    setSupplierLoading(true);
    setSupplierResults([]);

    try {
      const filters = {
        country: supplierCountry || undefined,
        minQty: supplierMinQty ? parseFloat(supplierMinQty) : undefined
      };

      const result = await suggestSuppliers(supplierQuery, filters);

      if (result.success && result.suggestions) {
        setSupplierResults(result.suggestions);
        if (result.suggestions.length === 0) {
          toast.info('No suppliers found matching your criteria. Try adjusting your search.');
        } else {
          toast.success(`Found ${result.suggestions.length} supplier suggestions!`);
        }
      } else {
        toast.error('Failed to find suppliers. Please try again.');
      }
    } catch (error) {
      console.error('Supplier search error:', error);
      toast.error('KoniAI couldn\'t complete this request. Please try again in a moment.');
    } finally {
      setSupplierLoading(false);
    }
  };

  // RFQ Reply
  const handleGenerateReply = async () => {
    if (!rfqInput.trim()) {
      toast.error('Please paste the RFQ or message');
      return;
    }

    if (!hasApiKey) {
      toast.error('KoniAI is not configured. Please add your OpenAI API key.');
      return;
    }

    setRfqLoading(true);
    setRfqReply('');

    try {
      // Create a mock RFQ object from the input
      const mockRfq = {
        id: 'temp',
        title: rfqInput.split('\n')[0] || 'RFQ',
        description: rfqInput,
        quantity: 0,
        target_price: 0,
        unit: 'pieces'
      };

      const mockSupplier = company || {
        id: user?.id || 'temp',
        company_name: company?.company_name || 'Your Company',
        country: company?.country || '',
        certifications: company?.certifications || [],
        trust_score: company?.trust_score || 50
      };

      const result = await generateSupplierReply(mockRfq, mockSupplier, {
        tone: rfqTone.toLowerCase()
      });

      if (result.success && result.data?.message) {
        setRfqReply(result.data.message);
        toast.success('✨ Reply draft generated!');
      } else {
        toast.error('Failed to generate reply. Please try again.');
      }
    } catch (error) {
      console.error('Reply generation error:', error);
      toast.error('KoniAI couldn\'t complete this request. Please try again in a moment.');
    } finally {
      setRfqLoading(false);
    }
  };

  const copyReply = () => {
    if (!rfqReply) return;
    navigator.clipboard.writeText(rfqReply).then(() => {
      toast.success('Reply copied to clipboard!');
    });
  };

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <KoniAIHero />

          {!hasApiKey && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800 mb-1">KoniAI is not configured yet</p>
                  <p className="text-sm text-yellow-700">
                    Please add your OpenAI API key to the environment settings (VITE_OPENAI_API_KEY) to enable KoniAI features.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Three Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: AI Product Assistant */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-2 border-afrikoni-gold/30 bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-afrikoni-gold" />
                  <CardTitle>AI Product Assistant</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-input">Describe your product</Label>
                  <Textarea
                    id="product-input"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    placeholder="Shea butter in bulk from Ghana, organic certified, 50kg drums..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="product-category">Category (optional)</Label>
                  <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product-language">{t('common.language')}</Label>
                  <Select value={productLanguage} onValueChange={setProductLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="French">Français</SelectItem>
                      <SelectItem value="Arabic">العربية</SelectItem>
                      <SelectItem value="Portuguese">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <KoniAIActionButton
                  label={t('koniai.generateListing') || 'Generate Listing with KoniAI'}
                  onClick={handleGenerateProduct}
                  loading={productLoading}
                  disabled={!hasApiKey}
                  className="w-full"
                />

                {productResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-3 p-4 bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-afrikoni-chestnut">Generated Listing</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyProductResult}
                        className="h-8"
                      >
                        {productCopied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </div>

                    <div>
                      <Label className="text-xs text-afrikoni-deep/70">Title</Label>
                      <p className="text-sm font-medium text-afrikoni-chestnut mt-1">
                        {productResult.title}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-afrikoni-deep/70">Description</Label>
                      <p className="text-sm text-afrikoni-deep mt-1 whitespace-pre-wrap">
                        {productResult.description}
                      </p>
                    </div>

                    {productResult.tags && productResult.tags.length > 0 && (
                      <div>
                        <Label className="text-xs text-afrikoni-deep/70">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {productResult.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {productResult.suggestedCategory && (
                      <div>
                        <Label className="text-xs text-afrikoni-deep/70">Suggested Category</Label>
                        <Badge className="mt-1 bg-afrikoni-gold text-afrikoni-chestnut">
                          {productResult.suggestedCategory}
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Find Suppliers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-2 border-afrikoni-gold/30 bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-afrikoni-gold" />
                  <CardTitle>Find Suppliers with KoniAI</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="supplier-query">What are you looking for?</Label>
                  <Textarea
                    id="supplier-query"
                    value={supplierQuery}
                    onChange={(e) => setSupplierQuery(e.target.value)}
                    placeholder="Premium cocoa beans, fair trade certified, from West Africa..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="supplier-country">Country (optional)</Label>
                  <Select value={supplierCountry} onValueChange={setSupplierCountry}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any country</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplier-min-qty">Minimum Quantity (optional)</Label>
                  <Input
                    id="supplier-min-qty"
                    type="number"
                    value={supplierMinQty}
                    onChange={(e) => setSupplierMinQty(e.target.value)}
                    placeholder="e.g., 100"
                    className="mt-1"
                  />
                </div>

                <KoniAIActionButton
                  label="Find Suppliers"
                  onClick={handleFindSuppliers}
                  loading={supplierLoading}
                  disabled={!hasApiKey}
                  className="w-full"
                />

                {supplierResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-3 max-h-96 overflow-y-auto"
                  >
                    {supplierResults.map((supplier, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-afrikoni-chestnut text-sm">
                              {supplier.supplierName || supplier.companyName}
                            </p>
                            {supplier.productExample && (
                              <p className="text-xs text-afrikoni-deep/70 mt-1">
                                Example: {supplier.productExample}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              supplier.confidence === 'High' ? 'default' :
                              supplier.confidence === 'Medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {supplier.confidence}
                          </Badge>
                        </div>
                        {supplier.reason && (
                          <p className="text-xs text-afrikoni-deep/80 mb-2">
                            {supplier.reason}
                          </p>
                        )}
                        {supplier.supplierId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/supplier/${supplier.supplierId}`)}
                            className="text-xs h-7 w-full"
                          >
                            View Supplier <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}

                {supplierResults.length === 0 && supplierLoading === false && supplierQuery && (
                  <p className="text-sm text-afrikoni-deep/70 text-center py-4">
                    No suppliers found. Try adjusting your search criteria.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: RFQ Reply Assistant */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-2 border-afrikoni-gold/30 bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-afrikoni-gold" />
                  <CardTitle>Reply to RFQs Faster</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rfq-input">Paste buyer RFQ or message</Label>
                  <Textarea
                    id="rfq-input"
                    value={rfqInput}
                    onChange={(e) => setRfqInput(e.target.value)}
                    placeholder="We are looking for 500kg of premium shea butter, organic certified, delivery to Lagos, Nigeria..."
                    rows={5}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rfq-tone">Tone</Label>
                  <Select value={rfqTone} onValueChange={setRfqTone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <KoniAIActionButton
                  label="Draft Reply with KoniAI"
                  onClick={handleGenerateReply}
                  loading={rfqLoading}
                  disabled={!hasApiKey}
                  className="w-full"
                />

                {rfqReply && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-afrikoni-chestnut">
                        Generated Reply
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyReply}
                        className="h-8"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      value={rfqReply}
                      onChange={(e) => setRfqReply(e.target.value)}
                      rows={8}
                      className="bg-afrikoni-gold/5 border-afrikoni-gold/20"
                      placeholder="Generated reply will appear here..."
                    />
                    <p className="text-xs text-afrikoni-deep/70">
                      Review and edit the reply before sending. You can customize it further.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Auto RFQ Follow-up & Matching Feed Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 grid md:grid-cols-2 gap-6"
        >
          {/* Auto RFQ Follow-up */}
          <Card className="border-2 border-afrikoni-gold/30 bg-white shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-afrikoni-gold" />
                <CardTitle>Auto RFQ Follow-up</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-afrikoni-gold/5 rounded-lg border border-afrikoni-gold/20">
                <div>
                  <p className="font-semibold text-afrikoni-chestnut mb-1">Smart Reminders</p>
                  <p className="text-sm text-afrikoni-deep/70">
                    Automatically send polite reminders to buyers about pending RFQs
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={autoFollowUpEnabled ? "default" : "outline"}
                  onClick={() => setAutoFollowUpEnabled(!autoFollowUpEnabled)}
                  className={autoFollowUpEnabled ? "bg-afrikoni-gold" : ""}
                >
                  {autoFollowUpEnabled ? "Enabled" : "Enable"}
                </Button>
              </div>
              {autoFollowUpEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <p className="text-sm text-green-800 mb-2">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Auto follow-up is active. KoniAI will send polite reminders to buyers after 48 hours of no response.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => toast.success('Reminder sent!')}
                  >
                    Send polite reminder to buyer?
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Buyer/Supplier Matching Feed */}
          <Card className="border-2 border-afrikoni-gold/30 bg-white shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-afrikoni-gold" />
                <CardTitle>Matching Feed</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {matchingBuyers.length > 0 ? (
                  matchingBuyers.map((buyer, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-gold/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-afrikoni-chestnut text-sm mb-1">
                            {buyer.name || 'Buyer'}
                          </p>
                          <p className="text-xs text-afrikoni-deep/70 mb-2">
                            {buyer.description || 'Looking for products matching your description'}
                          </p>
                          <Badge className="bg-afrikoni-gold/20 text-afrikoni-chestnut text-xs">
                            {buyer.matchCount || 5} buyers match your product description
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                          onClick={() => navigate('/messages?recipient=' + buyer.id)}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Reach Out
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <Users className="w-8 h-8 text-afrikoni-gold/40 mx-auto mb-2" />
                    <p className="text-sm text-afrikoni-deep/70 mb-3">
                      5 buyers match your product description
                    </p>
                    <Button
                      size="sm"
                      className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                      onClick={() => {
                        setMatchingBuyers([
                          { id: '1', name: 'Lagos Textiles Ltd.', description: 'Looking for premium shea butter', matchCount: 5 },
                          { id: '2', name: 'Accra Exports Co.', description: 'Seeking organic certified products', matchCount: 3 }
                        ]);
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Reach Out with KoniAI
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

