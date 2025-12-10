import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole, canViewBuyerFeatures, canViewSellerFeatures, isHybrid, isLogistics } from '@/utils/roleHelpers';
import { RFQ_STATUS, getStatusLabel } from '@/constants/status';
import { buildRFQQuery } from '@/utils/queryBuilders';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { CardSkeleton } from '@/components/ui/skeletons';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Search, Plus, MessageSquare, Calendar, DollarSign, Package, TrendingUp, Sparkles, Clock, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import SubscriptionUpsell from '@/components/upsell/SubscriptionUpsell';
import VerificationUpsell from '@/components/upsell/VerificationUpsell';
import { getCompanySubscription } from '@/services/subscriptionService';

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
  'Central African Republic', 'Chad', 'Comoros', 'Congo', 'DR Congo', "Côte d'Ivoire", 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
  'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

export default function DashboardRFQs() {
  const { t } = useLanguage();
  const [rfqs, setRfqs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('buyer');
  const [activeTab, setActiveTab] = useState('sent');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndRFQs();
  }, [activeTab]);

  const loadUserAndRFQs = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      const userData = profile || user;
      const normalizedRole = getUserRole(userData);
      setCurrentRole(normalizedRole);
      
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

      // Build query based on role and tab
      const query = buildRFQQuery({
        buyerCompanyId: (activeTab === 'sent' || activeTab === 'all') && canViewBuyerFeatures(normalizedRole) ? companyId : null,
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
      
      setRfqs(rfqsWithQuotes);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));

      // Calculate match count for suppliers (RFQs matching their products)
      if (canViewSellerFeatures(normalizedRole)) {
        const { count } = await supabase
          .from('rfqs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')
          .gte('deadline', new Date().toISOString());
        setMatchCount(count || 0);
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(categoriesData || []);

      // Load quotes
      if ((normalizedRole === 'seller' || normalizedRole === 'hybrid') && companyId) {
        const { data: myQuotes } = await supabase
          .from('quotes')
          .select('*, rfqs(*)')
          .eq('supplier_company_id', companyId)
          .order('created_at', { ascending: false });
        setQuotes(myQuotes || []);
      }
    } catch (error) {
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

  const filteredRFQs = rfqs.filter(rfq => {
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
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">
              {currentRole === 'buyer' ? t('rfq.myRFQs') || 'My RFQs' : 
               currentRole === 'seller' ? t('rfq.receivedRFQs') || 'RFQs Received' : 
               t('dashboard.rfqs')}
            </h1>
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
              {currentRole === 'buyer' && (t('rfq.manageRFQs') || 'Manage your requests for quotations')}
              {currentRole === 'seller' && (t('rfq.respondRFQs') || 'Respond to buyer requests')}
              {currentRole === 'hybrid' && (t('rfq.viewAllRFQs') || 'View all RFQs')}
              {currentRole === 'logistics' && (t('rfq.viewLogisticsRFQs') || 'View logistics RFQs')}
            </p>
          </div>
          {(currentRole === 'buyer' || currentRole === 'hybrid') && (
            <Link to="/dashboard/rfqs/new">
              <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni px-6">
                <Plus className="w-4 h-4 mr-2" />
                {t('rfq.create')}
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Premium Filters */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-gold" />
                <Input
                  placeholder={t('common.searchRFQs') || 'Search RFQs...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 border-afrikoni-gold/30 rounded-afrikoni">
                  <SelectValue placeholder={t('common.allStatus') || 'All Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')} Status</SelectItem>
                  <SelectItem value="open">{t('rfq.open')}</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="closed">{t('rfq.closed')}</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 border-afrikoni-gold/30 rounded-afrikoni">
                  <SelectValue placeholder={t('categories.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('categories.all')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48 border-afrikoni-gold/30 rounded-afrikoni">
                  <SelectValue placeholder={t('common.allCountries') || 'All Countries'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.allCountries') || 'All Countries'}</SelectItem>
                  {AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Match Notifications for Suppliers */}
        {canViewSellerFeatures(currentRole) && matchCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Card className="border-2 border-afrikoni-gold/40 bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-afrikoni-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-afrikoni-chestnut">
                        Your products match {matchCount} RFQ{matchCount !== 1 ? 's' : ''} — respond now!
                      </p>
                      <p className="text-sm text-afrikoni-deep/70">
                        Respond under 24h to boost your ranking
                      </p>
                    </div>
                  </div>
                  <Link to="/dashboard/rfqs?tab=received">
                    <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                      View Matches
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* v2.5: Premium Tabs with Gold Accents */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-afrikoni-sand/40 border border-afrikoni-gold/20 rounded-full p-1 shadow-premium">
            {(currentRole === 'buyer' || currentRole === 'hybrid') && (
              <TabsTrigger 
                value="sent" 
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200"
              >
                {t('rfq.sentRFQs') || 'Sent RFQs'}
              </TabsTrigger>
            )}
            {canViewSellerFeatures(currentRole) && (
              <TabsTrigger 
                value="received"
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200"
              >
                {t('rfq.receivedRFQs') || 'Received RFQs'}
              </TabsTrigger>
            )}
            {canViewSellerFeatures(currentRole) && (
              <TabsTrigger 
                value="quotes"
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200"
              >
                {t('rfq.myQuotes') || 'My Quotes'}
              </TabsTrigger>
            )}
            {currentRole === 'logistics' && (
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-afrikoni-gold data-[state=active]:text-afrikoni-charcoal data-[state=active]:shadow-afrikoni rounded-full font-semibold transition-all duration-200"
              >
                {t('common.all')} RFQs
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab === 'sent' ? 'sent' : activeTab === 'received' ? 'received' : activeTab === 'quotes' ? 'quotes' : 'all'} className="space-y-4">
            {activeTab === 'sent' || activeTab === 'all' ? (
              <div className="grid gap-4">
                {filteredRFQs.length === 0 ? (
                  <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-afrikoni-text-dark/50 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No RFQs yet</h3>
                      <p className="text-afrikoni-text-dark/70 mb-6 max-w-md mx-auto">
                        {activeTab === 'sent' 
                          ? "Create your first RFQ to find suppliers or contact verified buyers using KoniAI"
                          : "No RFQs match your filters. Try adjusting your search criteria."}
                      </p>
                      <div className="flex gap-3 justify-center">
                        {activeTab === 'sent' && (
                          <>
                            <Link to="/dashboard/rfqs/new">
                              <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                                <Plus className="w-4 h-4 mr-2" />
                                Create RFQ
                              </Button>
                            </Link>
                            <Link to="/dashboard/koniai">
                              <Button variant="outline" className="border-afrikoni-gold text-afrikoni-chestnut">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Use KoniAI
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRFQs.map((rfq, idx) => (
                    <motion.div
                      key={rfq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      {/* v2.5: Premium RFQ Cards */}
                      <Card className="border border-afrikoni-gold/30 hover:border-afrikoni-gold hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg md:text-xl font-bold text-afrikoni-text-dark">{rfq.title}</h3>
                                <Badge 
                                  variant={rfq.status === 'open' ? 'default' : 'outline'}
                                  className={`${
                                    rfq.status === 'open' 
                                      ? 'bg-afrikoni-green/10 text-afrikoni-green border-afrikoni-green/20' 
                                      : 'bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/20'
                                  }`}
                                >
                                  {rfq.status}
                                </Badge>
                                {rfq.quotesCount > 0 && (
                                  <Badge variant="outline" className="bg-afrikoni-purple/10 text-afrikoni-purple border-afrikoni-purple/20">
                                    {rfq.quotesCount} {t('rfq.quotes')}
                                  </Badge>
                                )}
                                {/* Fast Response Badge */}
                                {canViewSellerFeatures(currentRole) && rfq.created_at && (
                                  (() => {
                                    const hoursSinceCreated = (new Date() - new Date(rfq.created_at)) / (1000 * 60 * 60);
                                    if (hoursSinceCreated < 24) {
                                      return (
                                        <Badge className="bg-green-500 text-white border-0">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Respond under 24h
                                        </Badge>
                                      );
                                    }
                                    return null;
                                  })()
                                )}
                              </div>
                              <p className="text-afrikoni-text-dark/70 mb-4 line-clamp-2">{rfq.description}</p>
                              <div className="flex flex-wrap gap-4 text-sm text-afrikoni-text-dark/70">
                                <span className="flex items-center gap-1.5">
                                  <Package className="w-4 h-4 text-afrikoni-gold" />
                                  Qty: {rfq.quantity} {rfq.unit}
                                </span>
                                {rfq.target_price && (
                                  <span className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-afrikoni-gold" />
                                    Target: ${rfq.target_price}
                                  </span>
                                )}
                                {rfq.delivery_deadline && (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-afrikoni-gold" />
                                    Deadline: {new Date(rfq.delivery_deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Link to={`/dashboard/rfqs/${rfq.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10 text-afrikoni-text-dark rounded-afrikoni"
                                >
                                  {t('common.view')}
                                </Button>
                              </Link>
                              {currentRole === 'seller' && (
                                <Link to={`/dashboard/rfqs/${rfq.id}`}>
                                  <Button 
                                    size="sm"
                                    className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal shadow-afrikoni rounded-afrikoni"
                                  >
                                    {t('rfq.quote') || 'Quote'}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            ) : activeTab === 'quotes' ? (
              <div className="grid gap-4">
                {quotes.length === 0 ? (
                  <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-afrikoni-text-dark/50 mx-auto mb-4" />
                      <p className="text-afrikoni-text-dark/70">{t('empty.noQuotes') || 'No quotes submitted yet'}</p>
                    </CardContent>
                  </Card>
                ) : (
                  quotes.map((quote, idx) => (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-afrikoni-text-dark mb-2">
                                {t('rfq.quoteFor') || 'Quote for'}: {quote.rfqs?.title}
                              </h3>
                              <div className="flex flex-wrap gap-4 text-sm text-afrikoni-text-dark/70 mb-4">
                                <span className="font-semibold text-afrikoni-gold">Price: ${quote.total_price}</span>
                                <Badge variant="outline" className="bg-afrikoni-green/10 text-afrikoni-green border-afrikoni-green/20">
                                  {quote.status}
                                </Badge>
                              </div>
                            </div>
                            <Link to={`/dashboard/rfqs/${quote.rfq_id}`}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-afrikoni-gold/30 hover:border-afrikoni-gold hover:bg-afrikoni-gold/10 text-afrikoni-text-dark rounded-afrikoni"
                              >
                                {t('common.view')} RFQ
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
