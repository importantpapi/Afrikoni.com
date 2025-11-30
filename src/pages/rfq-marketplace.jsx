import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { paginateQuery, createPaginationState } from '@/utils/pagination';
import { getTimeRemaining } from '@/utils/marketplaceHelpers';
import SaveButton from '@/components/ui/SaveButton';
import { FileText, Search, Filter, MapPin, Calendar, Package, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/api/supabaseClient';
import SEO from '@/components/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import EmptyState from '@/components/ui/EmptyState';

export default function RFQMarketplace() {
  const { trackPageView } = useAnalytics();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-created_at');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(createPaginationState());

  useEffect(() => {
    trackPageView('RFQ Marketplace');
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [sortBy]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Apply sorting
      const sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
      const ascending = !sortBy.startsWith('-');
      
      const [rfqsResult, catsRes] = await Promise.all([
        paginateQuery(
          supabase
            .from('rfqs')
            .select('*, categories(*), companies(*)')
            .eq('status', 'open')
            .order(sortField, { ascending }),
          { 
            page: pagination.page, 
            pageSize: 20,
            orderBy: sortField,
            ascending
          }
        ),
        supabase.from('categories').select('*')
      ]);
      
      const rfqsRes = { data: rfqsResult.data, error: rfqsResult.error };
      
      setPagination(prev => ({
        ...prev,
        ...rfqsResult,
        isLoading: false
      }));

      if (rfqsRes.error) throw rfqsRes.error;
      if (catsRes.error) throw catsRes.error;

      // Enrich RFQs with quote counts, average quote price, and time remaining
      const rfqIds = (rfqsRes.data || []).map(rfq => rfq.id);
      let quotesCountMap = {};
      let avgPriceMap = {};
      
      if (rfqIds.length > 0) {
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('rfq_id')
          .in('rfq_id', rfqIds);
        
        quotesCountMap = (quotesData || []).reduce((acc, quote) => {
          acc[quote.rfq_id] = (acc[quote.rfq_id] || 0) + 1;
          return acc;
        }, {});
        
        // Get average quote price
        const { data: quotesWithPrice } = await supabase
          .from('quotes')
          .select('rfq_id, price')
          .in('rfq_id', rfqIds)
          .not('price', 'is', null);
        
        const priceSumMap = {};
        const priceCountMap = {};
        
        quotesWithPrice?.forEach(quote => {
          if (!priceSumMap[quote.rfq_id]) {
            priceSumMap[quote.rfq_id] = 0;
            priceCountMap[quote.rfq_id] = 0;
          }
          priceSumMap[quote.rfq_id] += parseFloat(quote.price || 0);
          priceCountMap[quote.rfq_id] += 1;
        });
        
        Object.keys(priceSumMap).forEach(rfqId => {
          if (priceCountMap[rfqId] > 0) {
            avgPriceMap[rfqId] = priceSumMap[rfqId] / priceCountMap[rfqId];
          }
        });
      }
      
      const enrichedRfqs = (rfqsRes.data || []).map(rfq => {
        const quoteCount = quotesCountMap[rfq.id] || 0;
        return {
          ...rfq,
          quote_count: quoteCount,
          avg_quote_price: avgPriceMap[rfq.id] || null,
          competition_level: quoteCount < 3 ? 'Low' : quoteCount < 10 ? 'Medium' : 'High',
          timeRemaining: getTimeRemaining(rfq.delivery_deadline || rfq.expires_at)
        };
      });
      
      setRfqs(enrichedRfqs);
      setCategories(catsRes.data || []);
    } catch (error) {
      // Error logged (removed for production)
      setRfqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    if (searchQuery && !rfq.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !rfq.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'all' && rfq.category_id !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && rfq.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const variants = {
      open: 'bg-green-100 text-green-700',
      closed: 'bg-afrikoni-cream text-afrikoni-deep',
      awarded: 'bg-blue-100 text-blue-700'
    };
    return variants[status] || variants.open;
  };

  return (
    <>
      <SEO
        title="RFQ Marketplace - Request for Quotation | Afrikoni"
        description="Browse active RFQs from buyers across Africa. Respond to requests and win new business opportunities."
        url="/rfq"
      />

      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Header */}
        <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">
                  RFQ Marketplace
                </h1>
                <p className="text-afrikoni-deep">
                  Browse active requests for quotations from buyers across Africa
                </p>
              </div>
              <Link to="/rfq/create">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                  <FileText className="w-4 h-4 mr-2" />
                  Post an RFQ
                </Button>
              </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-afrikoni-deep/70 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search RFQs by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_at">Newest First</SelectItem>
                  <SelectItem value="created_at">Oldest First</SelectItem>
                  <SelectItem value="delivery_deadline">Closing Soon</SelectItem>
                  <SelectItem value="-target_price">Budget: High to Low</SelectItem>
                  <SelectItem value="target_price">Budget: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-afrikoni-cream rounded w-3/4" />
                    <div className="h-4 bg-afrikoni-cream rounded w-full" />
                    <div className="h-4 bg-afrikoni-cream rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRFQs.length === 0 ? (
            <EmptyState
              type="rfqs"
              title="No RFQs found"
              description="Try adjusting your search or filters"
              cta="Post an RFQ"
              ctaLink="/rfq/create"
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredRFQs.map((rfq, idx) => (
                <motion.div
                  key={rfq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl">{rfq.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadge(rfq.status)}>
                            {rfq.status}
                          </Badge>
                          <SaveButton itemId={rfq.id} itemType="rfq" />
                        </div>
                      </div>
                      {/* Buyer Info */}
                      {rfq.companies && (
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-afrikoni-deep/70" />
                          <span className="text-sm text-afrikoni-deep">{rfq.companies.country}</span>
                          {rfq.companies.verified && (
                            <Badge variant="verified" className="text-xs">Verified Buyer</Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-afrikoni-deep">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{rfq.categories?.name || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{rfq.delivery_location || 'N/A'}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-afrikoni-deep line-clamp-3">{rfq.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-afrikoni-gold/20">
                        <div>
                          <p className="text-xs text-afrikoni-deep/70 mb-1">Quantity</p>
                          <p className="font-semibold text-afrikoni-chestnut">
                            {rfq.quantity} {rfq.unit || 'pieces'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-afrikoni-deep/70 mb-1">Target Price</p>
                          <p className="font-semibold text-afrikoni-chestnut">
                            {rfq.target_price ? `$${rfq.target_price}` : 'Negotiable'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-afrikoni-deep/70 mb-1">Deadline</p>
                          <p className="font-semibold text-afrikoni-chestnut">
                            {rfq.timeRemaining ? (
                              <span className={rfq.timeRemaining.urgent ? 'text-red-600' : ''}>
                                {rfq.timeRemaining.text}
                              </span>
                            ) : (
                              rfq.delivery_deadline ? new Date(rfq.delivery_deadline).toLocaleDateString() : 'Flexible'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-afrikoni-deep/70 mb-1">Responses</p>
                          <p className="font-semibold text-afrikoni-chestnut">
                            {rfq.quote_count || 0} quotes
                            {rfq.avg_quote_price && (
                              <span className="text-xs text-afrikoni-deep/70 block mt-1">
                                Avg: ${rfq.avg_quote_price.toFixed(2)}
                              </span>
                            )}
                          </p>
                          {rfq.competition_level && (
                            <Badge 
                              variant={rfq.competition_level === 'Low' ? 'default' : rfq.competition_level === 'Medium' ? 'secondary' : 'destructive'} 
                              className="text-xs mt-1"
                            >
                              {rfq.competition_level} Competition
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/rfq/detail?id=${rfq.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream"
                          onClick={() => navigate(`/rfq/detail?id=${rfq.id}&action=quote`)}
                        >
                          Send Quote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

