import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, DollarSign, Calendar, CheckCircle, Clock, Edit, Share, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function RFQManagement() {
  const [user, setUser] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      setUser(userData);

      if (!userData) {
        navigate(createPageUrl('Login'));
        return;
      }

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);

      // Company is optional - continue even without it
      // If no company, just show empty state

      let query = supabase
        .from('rfqs')
        .select('*');
      
      // Filter by company if available, otherwise show all user's RFQs
      if (companyId) {
        query = query.eq('buyer_company_id', companyId);
      } else {
        // If no company, try to find RFQs by user email or show empty
        query = query.limit(0); // Show empty until company is set up
      }

      if (activeTab === 'active') {
        query = query.in('status', ['open', 'pending']);
      } else if (activeTab === 'completed') {
        query = query.in('status', ['awarded', 'closed']);
      } else if (activeTab === 'drafts') {
        query = query.eq('status', 'draft');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Fix N+1 query: Use aggregation to get quotes count
      const rfqIds = (data || []).map(rfq => rfq.id);
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
      
      const rfqsWithQuotes = (data || []).map(rfq => ({
        ...rfq,
        quotesCount: quotesCountMap[rfq.id] || 0
      }));

      setRfqs(rfqsWithQuotes);
    } catch (error) {
      // Error logged (removed for production)
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'open' || status === 'awarded') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (status === 'pending') {
      return (
        <Badge className="bg-afrikoni-gold/20 text-orange-700 border-afrikoni-gold300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return (
      <Badge className="bg-afrikoni-cream text-afrikoni-deep border-afrikoni-gold/30">
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-2">RFQ Management</h1>
            <p className="text-lg text-afrikoni-deep">Request quotes from suppliers</p>
          </div>
          <Link to={createPageUrl('CreateRFQ')}>
            <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
              + Create RFQ
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">Active RFQs</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : rfqs.length === 0 ? (
              <Card className="border-afrikoni-gold/20">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-afrikoni-chestnut mb-2">No RFQs found</h3>
                  <p className="text-afrikoni-deep mb-6">Create your first RFQ to get started</p>
                  <Link to={createPageUrl('CreateRFQ')}>
                    <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                      + Create RFQ
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rfqs.map((rfq) => (
                  <Card key={rfq.id} className="border-afrikoni-gold/20 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-xl font-bold text-afrikoni-chestnut">{rfq.title}</h3>
                            {getStatusBadge(rfq.status)}
                          </div>
                          <p className="text-afrikoni-deep mb-4">{rfq.description}</p>
                          
                          <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep">Quantity: <span className="font-semibold">{rfq.quantity} {rfq.unit}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep">Budget: <span className="font-semibold">
                                {rfq.target_price ? `$${rfq.target_price.toLocaleString()}` : 'Not specified'}
                              </span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-afrikoni-deep/70" />
                              <span className="text-afrikoni-deep">Deadline: <span className="font-semibold">
                                {rfq.delivery_deadline ? format(new Date(rfq.delivery_deadline), 'yyyy-MM-dd') : 'Not set'}
                              </span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-afrikoni-deep">Quotes Received: <span className="font-semibold text-green-600">{rfq.quotesCount || 0}</span></span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Link to={`/rfq/detail?id=${rfq.id}`}>
                              <Button variant="default" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-cream">
                                <Eye className="w-4 h-4 mr-2" />
                                View Quotes
                              </Button>
                            </Link>
                            <Button variant="outline" className="border-afrikoni-gold/30">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit RFQ
                            </Button>
                            <Button variant="outline" className="border-afrikoni-gold/30">
                              <Share className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

