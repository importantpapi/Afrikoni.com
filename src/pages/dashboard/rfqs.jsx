import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { useCapability } from '@/context/CapabilityContext';
import { RFQ_STATUS, RFQ_STATUS_LABELS, getStatusLabel } from '@/constants/status';
import { buildRFQQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { FileText, Search, Plus, MessageSquare, Calendar, DollarSign, Package, TrendingUp, Sparkles, Clock, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/shared/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { useTranslation } from 'react-i18next';
import SubscriptionUpsell from '@/components/upsell/SubscriptionUpsell';
import VerificationUpsell from '@/components/upsell/VerificationUpsell';
import { getCompanySubscription } from '@/services/subscriptionService';
import RequireCapability from '@/guards/RequireCapability';
import { assertRowOwnedByCompany } from '@/utils/securityAssertions';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

function DashboardRFQsInner() {
  const { t } = useTranslation();
  // Use centralized AuthProvider
  const { user, profile, authReady, loading: authLoading } = useAuth();
  // ✅ FOUNDATION FIX: Use capabilities instead of roleHelpers
  const capabilities = useCapability();
  const [rfqs, setRfqs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for data fetching
  // Derive role from capabilities for display purposes
  const isBuyer = capabilities.can_buy === true;
  const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
  const isHybridCapability = isBuyer && isSeller;
  const currentRole = isHybridCapability ? 'hybrid' : isSeller ? 'seller' : 'buyer';
  const [activeTab, setActiveTab] = useState('sent');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isVerified, setIsVerified] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardRFQs] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[DashboardRFQs] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadUserAndRFQs();
  }, [authReady, authLoading, user, profile, capabilities.ready, activeTab, navigate]);

  const loadUserAndRFQs = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      if (!user) {
        navigate('/login');
        return;
      }

      const companyId = profile?.company_id || null;
      
      // Load subscription and verification status
      if (companyId) {
        try {
          const subscription = await getCompanySubscription(companyId);
          setCurrentPlan(subscription?.plan_type || 'free');
          
          const { data: companyData } = await supabase
            .from('companies')
            .select('verified, verification_status')
            .eq('id', companyId)
            .single();
          
          setIsVerified(companyData?.verified || companyData?.verification_status === 'verified');
        } catch (error) {
          console.error('Error loading subscription/verification:', error);
        }
      }

      // ✅ FOUNDATION FIX: Build query based on capabilities instead of role
      const query = buildRFQQuery({
        buyerCompanyId: (activeTab === 'sent' || activeTab === 'all') && isBuyer ? companyId : null,
        status: activeTab === 'received' || activeTab === 'quotes' ? RFQ_STATUS.OPEN : null,
        categoryId: categoryFilter || null,
        country: countryFilter || null
      });
      
      // Use pagination
      const result = await paginateQuery(query, {
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      
      // Fix N+1 query: Load quotes count with aggregation
      const rfqIds = Array.isArray(result.data) ? result.data.map(rfq => rfq.id) : [];
      let quotesCountMap = {};
      
      if (rfqIds.length > 0) {
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('rfq_id')
          .in('rfq_id', rfqIds);
        
        // Count quotes per RFQ
        quotesCountMap = Array.isArray(quotesData) ? quotesData.reduce((acc, quote) => {
          if (quote && quote.rfq_id) {
            acc[quote.rfq_id] = (acc[quote.rfq_id] || 0) + 1;
          }
          return acc;
        }, {}) : {};
      }
      
      const rfqsWithQuotes = Array.isArray(result.data) ? result.data.map(rfq => ({
        ...rfq,
        quotesCount: quotesCountMap[rfq.id] || 0
      })) : [];

      // SAFETY ASSERTION: each RFQ should be associated with the current company when viewing "sent"
      if (companyId && (activeTab === 'sent' || activeTab === 'all')) {
        for (const rfq of rfqsWithQuotes) {
          await assertRowOwnedByCompany(rfq, companyId, 'DashboardRFQs:rfqs');
        }
      }

      setRfqs(rfqsWithQuotes);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));

      // ✅ FOUNDATION FIX: Calculate match count for suppliers using capabilities
      if (isSeller) {
        // ✅ FIX: Proper RFQ query syntax to avoid 400 errors
        const now = new Date().toISOString();
        let rfqQuery = supabase
          .from('rfqs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open');
        
        // ✅ FIX: Use .or() with proper syntax - check if expires_at is null OR >= now
        rfqQuery = rfqQuery.or(`expires_at.is.null,expires_at.gte.${now}`);
        
        const { count, error: rfqCountError } = await rfqQuery;
        
        if (rfqCountError) {
          console.error('Error counting RFQs:', rfqCountError);
          // Don't throw - just log and continue
        } else {
          setMatchCount(count || 0);
        }
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);

      // ✅ FOUNDATION FIX: Load quotes using capabilities
      if (isSeller && companyId) {
        const { data: myQuotes } = await supabase
          .from('quotes')
          .select('*, rfqs(*)')
          .eq('supplier_company_id', companyId)
          .order('created_at', { ascending: false });
        setQuotes(myQuotes || []);
      }
    } catch (error) {
      console.error('Error loading RFQs:', error);
      toast.error(error?.message || 'Failed to load RFQs. Please try again.');
      setRfqs([]);
      setQuotes([]);
      setCategories([]);
      setPagination(prev => ({
        ...prev,
        totalCount: 0,
        totalPages: 1,
        isLoading: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRFQs = (Array.isArray(rfqs) ? rfqs : []).filter(rfq => {
    if (!rfq) return false;
    const matchesSearch = !searchQuery || 
      rfq.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    const matchesCategory = !categoryFilter || rfq.category_id === categoryFilter;
    const matchesCountry = !countryFilter || rfq.delivery_location?.toLowerCase().includes(countryFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesCategory && matchesCountry;
  });

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <CardSkeleton count={6} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-6 pb-8">
        {/* Professional Header with Gradient Background */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-purple/5 to-afrikoni-cream/20 rounded-2xl p-6 md:p-8 mb-8 border border-afrikoni-gold/20"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-afrikoni-gold" />
                </div>
                <div>
                  <h1 className="text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] text-afrikoni-chestnut mb-3">
                    {currentRole === 'buyer' ? 'My RFQs' : 
                     currentRole === 'seller' ? 'RFQs Received' : 
                     currentRole === 'hybrid' ? 'All RFQs' :
                     'RFQs'}
                  </h1>
                  <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70">
                    {currentRole === 'buyer' && 'Manage your requests for quotations and track responses'}
                    {currentRole === 'seller' && 'Browse and respond to buyer requests matching your products'}
                    {currentRole === 'hybrid' && 'View all RFQs across your buyer and seller activities'}
                    {currentRole === 'logistics' && 'View logistics-related RFQs'}
                  </p>
                </div>
              </div>
            </div>
            {(currentRole === 'buyer' || currentRole === 'hybrid') && (
              <Link to="/dashboard/rfqs/new">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all px-6 py-6 h-auto rounded-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New RFQ
                </Button>
              </Link>
            )}
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-afrikoni-gold/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-afrikoni-purple/5 rounded-full blur-3xl -ml-24 -mb-24"></div>
        </motion.div>

        {/* Professional Filters Section */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold/60" />
                <Input
                  placeholder="Search RFQs by title, description, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 md:h-11 min-h-[44px] md:min-h-0 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-xl text-base md:text-sm touch-manipulation"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 md:h-11 min-h-[44px] md:min-h-0 border-afrikoni-gold/30 rounded-xl touch-manipulation">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="awarded">Awarded</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 md:h-11 min-h-[44px] md:min-h-0 border-afrikoni-gold/30 rounded-xl touch-manipulation">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 md:h-11 min-h-[44px] md:min-h-0 border-afrikoni-gold/30 rounded-xl touch-manipulation">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {AFRICAN_COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Match Notification for Suppliers */}
        {isSeller && matchCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-afrikoni-gold/40 bg-gradient-to-r from-afrikoni-gold/10 via-afrikoni-purple/5 to-afrikoni-gold/10 rounded-xl shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-afrikoni-gold/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-afrikoni-gold to-afrikoni-purple rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-afrikoni-chestnut mb-1">
                        🎯 {matchCount} RFQ{matchCount !== 1 ? 's' : ''} Match Your Products!
                      </p>
                      <p className="text-sm text-afrikoni-deep/80">
                        Respond within 24 hours to improve your supplier ranking and win more business
                      </p>
                    </div>
                  </div>
                  <Link to="/dashboard/rfqs?tab=received">
                    <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white shadow-lg hover:shadow-xl transition-all px-6 py-6 h-auto rounded-xl font-semibold whitespace-nowrap">
                      <Zap className="w-5 h-5 mr-2" />
                      View Matches
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Professional Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-afrikoni-gold/20 rounded-xl p-1.5 shadow-md inline-flex h-auto">
            {(currentRole === 'buyer' || currentRole === 'hybrid') && (
              <TabsTrigger 
                value="sent" 
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold px-6 py-2.5 transition-all duration-200"
              >
                Sent RFQs
              </TabsTrigger>
            )}
            {isSeller && (
              <TabsTrigger 
                value="received"
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold px-6 py-2.5 transition-all duration-200"
              >
                Received RFQs
              </TabsTrigger>
            )}
            {isSeller && (
              <TabsTrigger 
                value="quotes"
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold px-6 py-2.5 transition-all duration-200"
              >
                My Quotes
              </TabsTrigger>
            )}
            {currentRole === 'logistics' && (
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg font-semibold px-6 py-2.5 transition-all duration-200"
              >
                All RFQs
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab === 'sent' ? 'sent' : activeTab === 'received' ? 'received' : activeTab === 'quotes' ? 'quotes' : 'all'} className="space-y-4">
            {activeTab === 'sent' || activeTab === 'all' ? (
              <div className="grid gap-4">
                {filteredRFQs.length === 0 ? (
                  <Card className="border-afrikoni-gold/20 bg-gradient-to-br from-white to-afrikoni-cream/30 rounded-2xl shadow-xl overflow-hidden">
                    <CardContent className="p-12 md:p-16 text-center relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-afrikoni-gold/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-afrikoni-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-10 h-10 text-afrikoni-gold" />
                        </div>
                        <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-3">
                          {activeTab === 'sent' ? 'No RFQs Created Yet' : 'No RFQs Found'}
                        </h3>
                        <p className="text-afrikoni-text-dark/70 mb-8 max-w-md mx-auto text-base leading-relaxed">
                          {activeTab === 'sent' 
                            ? "Start connecting with verified suppliers by creating your first Request for Quotation. Use KoniAI for AI-powered RFQ creation."
                            : "No RFQs match your current filters. Try adjusting your search criteria or clear filters to see more results."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {activeTab === 'sent' && (
                            <>
                              <Link to="/dashboard/rfqs/new">
                                <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white shadow-lg hover:shadow-xl transition-all px-6 py-6 h-auto rounded-xl">
                                  <Plus className="w-5 h-5 mr-2" />
                                  Create Your First RFQ
                                </Button>
                              </Link>
                              <Link to="/dashboard/koniai">
                                <Button variant="outline" className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-6 py-6 h-auto rounded-xl">
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  Use KoniAI Assistant
                                </Button>
                              </Link>
                            </>
                          )}
                          {activeTab !== 'sent' && (
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setCategoryFilter('');
                                setCountryFilter('');
                              }}
                              className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-6 py-6 h-auto rounded-xl"
                            >
                              Clear All Filters
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {(Array.isArray(filteredRFQs) ? filteredRFQs : []).map((rfq, idx) => (
                    <motion.div
                      key={rfq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      {/* Professional RFQ Card */}
                      <Card className="group border border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-xl transition-all duration-300 bg-white rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start gap-3 mb-4">
                                <h3 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut leading-tight flex-1 min-w-0 line-clamp-2">
                                  {rfq.title || `RFQ ${rfq.id?.slice(0, 8) || 'Unknown'}`}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  <Badge 
                                    variant={rfq.status === 'open' ? 'default' : 'outline'}
                                    className={`text-xs font-semibold px-3 py-1 ${
                                      rfq.status === 'open' 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : rfq.status === 'awarded'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {RFQ_STATUS_LABELS[rfq.status] || rfq.status}
                                  </Badge>
                                  {rfq.quotesCount > 0 && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-3 py-1">
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      {rfq.quotesCount} Quote{rfq.quotesCount !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {/* Fast Response Badge */}
                                  {isSeller && rfq.created_at && (
                                    (() => {
                                      const hoursSinceCreated = (new Date() - new Date(rfq.created_at)) / (1000 * 60 * 60);
                                      if (hoursSinceCreated < 24) {
                                        return (
                                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs font-semibold px-3 py-1 shadow-md">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Respond Now
                                          </Badge>
                                        );
                                      }
                                      return null;
                                    })()
                                  )}
                                </div>
                              </div>
                              <p className="text-afrikoni-text-dark/80 mb-5 line-clamp-2 text-base leading-relaxed">
                                {rfq.description}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-afrikoni-cream/30 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-afrikoni-gold" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-afrikoni-text-dark/60 font-medium">Quantity</p>
                                    <p className="text-sm font-semibold text-afrikoni-chestnut">
                                      {rfq.quantity} {rfq.unit}
                                    </p>
                                  </div>
                                </div>
                                {rfq.target_price && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center">
                                      <DollarSign className="w-5 h-5 text-afrikoni-gold" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-afrikoni-text-dark/60 font-medium">Budget</p>
                                      <p className="text-sm font-semibold text-afrikoni-chestnut">
                                        ${parseFloat(rfq.target_price).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {rfq.delivery_deadline && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center">
                                      <Calendar className="w-5 h-5 text-afrikoni-gold" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-afrikoni-text-dark/60 font-medium">Deadline</p>
                                      <p className="text-sm font-semibold text-afrikoni-chestnut">
                                        {new Date(rfq.delivery_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 md:ml-4">
                              <Link to={`/dashboard/rfqs/${rfq.id}`} className="flex-1 md:flex-none">
                                <Button 
                                  variant="outline" 
                                  className="w-full md:w-auto border-2 border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10 text-afrikoni-chestnut font-semibold rounded-xl px-6"
                                >
                                  View Details
                                </Button>
                              </Link>
                              {currentRole === 'seller' && (
                                <Link to={`/dashboard/rfqs/${rfq.id}`} className="flex-1 md:flex-none">
                                  <Button 
                                    className="w-full md:w-auto bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white shadow-lg hover:shadow-xl transition-all rounded-xl px-6 font-semibold"
                                  >
                                    Submit Quote
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'quotes' ? (
              <div className="grid gap-4">
                {quotes.length === 0 ? (
                  <Card className="border-afrikoni-gold/20 bg-gradient-to-br from-white to-afrikoni-cream/30 rounded-2xl shadow-xl overflow-hidden">
                    <CardContent className="p-12 md:p-16 text-center relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-afrikoni-gold/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-afrikoni-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <Award className="w-10 h-10 text-afrikoni-gold" />
                        </div>
                        <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-3">No Quotes Submitted Yet</h3>
                        <p className="text-afrikoni-text-dark/70 mb-8 max-w-md mx-auto text-base leading-relaxed">
                          Start responding to RFQs to showcase your products and win new business opportunities.
                        </p>
                        <Link to="/dashboard/rfqs?tab=received">
                          <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white shadow-lg hover:shadow-xl transition-all px-6 py-6 h-auto rounded-xl">
                            Browse RFQs
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {(Array.isArray(quotes) ? quotes : []).map((quote, idx) => (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <Card className="group border border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-xl transition-all duration-300 bg-white rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 bg-afrikoni-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Award className="w-6 h-6 text-afrikoni-purple" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2 leading-tight">
                                    Quote for: {quote.rfqs?.title || 'RFQ'}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-afrikoni-gold/10 rounded-lg">
                                      <DollarSign className="w-5 h-5 text-afrikoni-gold" />
                                      <span className="font-bold text-lg text-afrikoni-chestnut">
                                        ${parseFloat(quote.total_price || 0).toLocaleString()}
                                      </span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs font-semibold px-3 py-1 ${
                                        quote.status === 'pending' 
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : quote.status === 'accepted'
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : 'bg-gray-50 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {quote.status}
                                    </Badge>
                                    {quote.created_at && (
                                      <span className="text-sm text-afrikoni-text-dark/60">
                                        Submitted {new Date(quote.created_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Link to={`/dashboard/rfqs/${quote.rfq_id}`}>
                              <Button 
                                variant="outline" 
                                className="w-full md:w-auto border-2 border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10 text-afrikoni-chestnut font-semibold rounded-xl px-6"
                              >
                                View RFQ
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardRFQs() {
  return (
    <RequireCapability canBuy={true}>
      <DashboardRFQsInner />
    </RequireCapability>
  );
}
