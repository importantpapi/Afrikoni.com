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
import { FileText, Search, Plus, MessageSquare, Calendar, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndRFQs();
  }, [activeTab]);

  const loadUserAndRFQs = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role, companyId } = await getCurrentUserAndRole();
      if (!user) {
        navigate('/login');
        return;
      }

      const userData = profile || user;
      const normalizedRole = getUserRole(userData);
      setCurrentRole(normalizedRole);

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
      const rfqIds = result.data.map(rfq => rfq.id);
      let quotesCountMap = {};
      
      if (rfqIds.length > 0) {
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('rfq_id')
          .in('rfq_id', rfqIds);
        
        // Count quotes per RFQ
        quotesCountMap = (quotesData || []).reduce((acc, quote) => {
          acc[quote.rfq_id] = (acc[quote.rfq_id] || 0) + 1;
          return acc;
        }, {});
      }
      
      const rfqsWithQuotes = result.data.map(rfq => ({
        ...rfq,
        quotesCount: quotesCountMap[rfq.id] || 0
      }));
      
      setRfqs(rfqsWithQuotes);
      setPagination(prev => ({
        ...prev,
        ...result,
        isLoading: false
      }));

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
      // Error logged (removed for production)
      toast.error('Failed to load RFQs');
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
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">
              {currentRole === 'buyer' ? 'My RFQs' : currentRole === 'seller' ? 'RFQs Received' : 'RFQs'}
            </h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
              {currentRole === 'buyer' && 'Manage your requests for quotations'}
              {currentRole === 'seller' && 'Respond to buyer requests'}
              {currentRole === 'hybrid' && 'View all RFQs'}
              {currentRole === 'logistics' && 'View logistics RFQs'}
            </p>
          </div>
          {(currentRole === 'buyer' || currentRole === 'hybrid') && (
            <Link to="/dashboard/rfqs/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create RFQ
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  placeholder="Search RFQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
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
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {(currentRole === 'buyer' || currentRole === 'hybrid') && (
              <TabsTrigger value="sent">Sent RFQs</TabsTrigger>
            )}
            {canViewSellerFeatures(currentRole) && (
              <TabsTrigger value="received">Received RFQs</TabsTrigger>
            )}
            {canViewSellerFeatures(currentRole) && (
              <TabsTrigger value="quotes">My Quotes</TabsTrigger>
            )}
            {currentRole === 'logistics' && (
              <TabsTrigger value="all">All RFQs</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab === 'sent' ? 'sent' : activeTab === 'received' ? 'received' : activeTab === 'quotes' ? 'quotes' : 'all'} className="space-y-4">
            {activeTab === 'sent' || activeTab === 'all' ? (
              <div className="grid gap-4">
                {filteredRFQs.length === 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <EmptyState type="rfqs" />
                    </CardContent>
                  </Card>
                ) : (
                  filteredRFQs.map((rfq) => (
                    <Card key={rfq.id} className="hover:shadow-afrikoni-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-afrikoni-chestnut">{rfq.title}</h3>
                              <Badge variant={rfq.status === 'open' ? 'success' : 'outline'}>
                                {rfq.status}
                              </Badge>
                            </div>
                            <p className="text-afrikoni-deep mb-4">{rfq.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-afrikoni-deep/70">
                              <span className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                Qty: {rfq.quantity} {rfq.unit}
                              </span>
                              {rfq.target_price && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  Target: ${rfq.target_price}
                                </span>
                              )}
                              {rfq.delivery_deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Deadline: {new Date(rfq.delivery_deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link to={`/dashboard/rfqs/${rfq.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                            {currentRole === 'seller' && (
                              <Link to={`/dashboard/rfqs/${rfq.id}`}>
                                <Button variant="primary" size="sm">Quote</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : activeTab === 'quotes' ? (
              <div className="grid gap-4">
                {quotes.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-afrikoni-deep/50 mx-auto mb-4" />
                      <p className="text-afrikoni-deep">No quotes submitted yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  quotes.map((quote) => (
                    <Card key={quote.id} className="hover:shadow-afrikoni-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-afrikoni-chestnut mb-2">
                              Quote for: {quote.rfqs?.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-afrikoni-deep/70 mb-4">
                              <span>Price: ${quote.total_price}</span>
                              <span>Status: {quote.status}</span>
                            </div>
                          </div>
                          <Link to={`/dashboard/rfqs/${quote.rfq_id}`}>
                            <Button variant="outline" size="sm">View RFQ</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
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

