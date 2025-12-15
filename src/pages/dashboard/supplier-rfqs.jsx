import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole, canViewSellerFeatures } from '@/utils/roleHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, Search, MapPin, Package, DollarSign, 
  Calendar, ArrowRight, Filter, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RFQ_STATUS, RFQ_STATUS_LABELS } from '@/constants/status';
import EmptyState from '@/components/ui/EmptyState';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function SupplierRFQsInner() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('matched');
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    loadRFQs();
  }, [statusFilter]);

  const loadRFQs = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user) {
        navigate('/login');
        return;
      }

      const normalizedRole = getUserRole(profile || user);
      if (!canViewSellerFeatures(normalizedRole)) {
        toast.error('Supplier access required');
        navigate('/dashboard');
        return;
      }

      setCompanyId(userCompanyId);

      // Load RFQs that are matched (visible to suppliers)
      // Note: Buyer identity is NOT shown - only RFQ details
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfqs')
        .select(`
          *,
          categories(*)
        `)
        .eq('status', statusFilter === 'all' ? RFQ_STATUS.MATCHED : statusFilter)
        .order('created_at', { ascending: false });

      if (rfqsError) throw rfqsError;
      setRfqs(rfqsData || []);
    } catch (error) {
      console.error('Error loading RFQs:', error);
      toast.error('Failed to load RFQs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = !searchQuery || 
      rfq.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.delivery_location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-chestnut">Matched RFQs</h1>
            <p className="text-afrikoni-deep mt-1">
              RFQs matched with your company. Submit offers to buyers.
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/rfqs')}
            variant="outline"
          >
            View All RFQs
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-afrikoni-deep/50 w-4 h-4" />
                  <Input
                    placeholder="Search RFQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-afrikoni-gold/30 rounded-lg bg-white text-afrikoni-chestnut"
                >
                  <option value="matched">Matched</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Expectations Explanation */}
        <Card className="border-afrikoni-gold/30 bg-afrikoni-cream/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-afrikoni-gold" />
              How RFQ Matching Works
            </h3>
            <div className="space-y-2 text-sm text-afrikoni-deep/80">
              <p>
                <strong className="text-afrikoni-chestnut">RFQs are matched based on relevance and capacity.</strong>
              </p>
              <p>
                Afrikoni manually reviews each RFQ and matches it with verified suppliers who:
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Operate in relevant product categories</li>
                <li>Have capacity for the requested quantity</li>
                <li>Can deliver to the specified destination</li>
                <li>Meet quality and verification standards</li>
              </ul>
              <p className="mt-3 text-xs text-afrikoni-deep/70">
                This ensures you only see RFQs that are a good fit for your business, reducing wasted time and improving conversion rates.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* RFQ List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold mx-auto" />
            </div>
          ) : filteredRFQs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No matched RFQs"
              description="You'll see RFQs here once Afrikoni matches them with your company based on relevance and capacity."
            />
          ) : (
            filteredRFQs.map((rfq) => (
              <Card 
                key={rfq.id} 
                className="hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-afrikoni-chestnut">
                          {rfq.title}
                        </h3>
                        <Badge variant="success">
                          {RFQ_STATUS_LABELS[rfq.status] || 'Matched'}
                        </Badge>
                      </div>
                      
                      {rfq.description && (
                        <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2">
                          {rfq.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-afrikoni-gold" />
                          <span className="text-afrikoni-deep">
                            {rfq.quantity} {rfq.unit || 'units'}
                          </span>
                        </div>
                        {rfq.delivery_location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-afrikoni-gold" />
                            <span className="text-afrikoni-deep">{rfq.delivery_location}</span>
                          </div>
                        )}
                        {rfq.categories && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-afrikoni-gold" />
                            <span className="text-afrikoni-deep">{rfq.categories.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-afrikoni-gold" />
                          <span className="text-afrikoni-deep">
                            {format(new Date(rfq.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Privacy Note */}
                      <div className="bg-afrikoni-cream/30 border border-afrikoni-gold/20 rounded-lg p-3 mb-4">
                        <p className="text-xs text-afrikoni-deep/70">
                          <strong className="text-afrikoni-chestnut">Privacy:</strong> Buyer identity is hidden until you submit an offer and they accept.
                        </p>
                      </div>

                      {/* Action */}
                      <Link to={`/dashboard/rfqs/${rfq.id}`}>
                        <Button className="w-full sm:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark">
                          Submit Offer
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SupplierRFQs() {
  return (
    <RequireDashboardRole allow={['seller', 'hybrid']}>
      <SupplierRFQsInner />
    </RequireDashboardRole>
  );
}

