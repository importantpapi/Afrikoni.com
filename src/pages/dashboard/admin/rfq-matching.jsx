import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Search, CheckCircle, Clock, Users, MapPin, 
  Package, DollarSign, Calendar, ArrowRight, Filter, Shield, Award, TrendingUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RFQ_STATUS, RFQ_STATUS_LABELS } from '@/constants/status';
import { useRFQMatching } from '@/hooks/useRFQMatching';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RFQMatching() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('in_review');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [matchingNotes, setMatchingNotes] = useState(''); // Internal notes: why these suppliers were matched
  const [isMatching, setIsMatching] = useState(false);
  const [showTrustScores, setShowTrustScores] = useState(true); // Toggle AI suggestions

  // 🧊 PHASE B: Trust-based matching (DORMANT - Admin-only)
  const { matches, isLoading: isMatchingLoading, refresh: refreshMatches } = useRFQMatching(
    selectedRFQ?.id || null,
    suppliers
  );

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user, role } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user || role !== 'admin') {
        toast.error('Admin access required');
        navigate('/dashboard');
        return;
      }

      // Load RFQs pending review or open
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfqs')
        .select(`
          *,
          categories(*),
          companies!rfqs_buyer_company_id_fkey(
            company_name,
            country,
            city
          )
        `)
        .in('status', statusFilter === 'all' ? ['open', 'in_review', 'pending'] : [statusFilter])
        .order('created_at', { ascending: false });

      if (rfqsError) throw rfqsError;
      setRfqs(rfqsData || []);

      // 🧊 PHASE B: Load verified suppliers with trust scores and reliability scores for matching
      // First get companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name, country, city, verified, verification_status, trust_score, average_rating, approved_reviews_count')
        .eq('verified', true);

      if (companiesError) throw companiesError;

      // Then get reliability scores from supplier_intelligence view
      const { data: reliabilityData, error: reliabilityError } = await supabase
        .from('supplier_intelligence')
        .select('company_id, reliability_score, avg_response_hours, completion_rate, dispute_rate, slow_response_flag, high_dispute_flag')
        .in('company_id', companiesData?.map(c => c.id) || []);

      if (reliabilityError) {
        console.warn('Error loading reliability scores:', reliabilityError);
      }

      // Merge reliability data with company data
      const suppliersData = companiesData?.map(company => {
        const reliability = reliabilityData?.find(r => r.company_id === company.id);
        return {
          ...company,
          reliability_score: reliability?.reliability_score || company.trust_score || 50,
          avg_response_hours: reliability?.avg_response_hours,
          completion_rate: reliability?.completion_rate,
          dispute_rate: reliability?.dispute_rate,
          slow_response_flag: reliability?.slow_response_flag,
          high_dispute_flag: reliability?.high_dispute_flag
        };
      }) || [];

      // Sort by reliability score (higher is better)
      suppliersData.sort((a, b) => (b.reliability_score || 0) - (a.reliability_score || 0));

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load RFQs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchSuppliers = async () => {
    if (!selectedRFQ || selectedSuppliers.length === 0) {
      toast.error('Please select an RFQ and at least one supplier');
      return;
    }

    setIsMatching(true);
    try {
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      // Store matching notes (internal - for training data and quality control)
      // This becomes institutional memory and helps with future automation decisions
      if (matchingNotes.trim()) {
        try {
          // Store notes in RFQ metadata or a separate matching_notes table
          // For now, we'll store in a JSON field or add to audit log metadata
          await supabase
            .from('rfqs')
            .update({
              matching_notes: matchingNotes.trim(),
              matching_notes_updated_at: new Date().toISOString()
            })
            .eq('id', selectedRFQ.id);
        } catch (notesError) {
          console.error('Error saving matching notes:', notesError);
          // Don't fail the match if notes fail
        }
      }

      // Use safe status transition with validation and logging
      const { transitionRFQStatus } = await import('@/utils/rfqStatusTransitions');
      const result = await transitionRFQStatus(
        selectedRFQ.id,
        RFQ_STATUS.MATCHED,
        user.id,
        `Matched with ${selectedSuppliers.length} supplier(s)${matchingNotes ? '. Notes: ' + matchingNotes.substring(0, 50) : ''}`,
        { 
          supplier_ids: selectedSuppliers,
          matching_notes: matchingNotes.trim() || null
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update RFQ status');
      }

      // Create notifications for matched suppliers
      for (const supplierId of selectedSuppliers) {
        try {
          const { createNotification } = await import('@/services/notificationService');
          await createNotification({
            company_id: supplierId,
            title: 'New RFQ Match',
            message: `You've been matched with RFQ: "${selectedRFQ.title}"`,
            type: 'rfq',
            link: `/dashboard/rfqs/${selectedRFQ.id}`,
            related_id: selectedRFQ.id
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }
      }

      toast.success(`RFQ matched with ${selectedSuppliers.length} supplier(s)`);
      setSelectedRFQ(null);
      setSelectedSuppliers([]);
      setMatchingNotes(''); // Clear notes for next match
      loadData();
    } catch (error) {
      console.error('Error matching RFQ:', error);
      toast.error('Failed to match RFQ');
    } finally {
      setIsMatching(false);
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = !searchQuery || 
      rfq.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-chestnut">RFQ Manual Matching</h1>
            <p className="text-afrikoni-deep mt-1">
              Review and manually match RFQs with verified suppliers
            </p>
          </div>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="all">All Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-afrikoni-deep/30 mx-auto mb-4" />
                <p className="text-afrikoni-deep">No RFQs found</p>
              </CardContent>
            </Card>
          ) : (
            filteredRFQs.map((rfq) => (
              <Card 
                key={rfq.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedRFQ?.id === rfq.id ? 'ring-2 ring-afrikoni-gold' : ''
                }`}
                onClick={() => setSelectedRFQ(rfq)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-afrikoni-chestnut">
                          {rfq.title}
                        </h3>
                        <Badge variant={rfq.status === 'in_review' ? 'warning' : 'info'}>
                          {RFQ_STATUS_LABELS[rfq.status] || rfq.status}
                        </Badge>
                      </div>
                      
                      {rfq.description && (
                        <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2">
                          {rfq.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                        {rfq.buyer_company_id && rfq.companies && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-afrikoni-gold" />
                            <span className="text-afrikoni-deep">
                              {rfq.companies.company_name || 'Buyer'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-afrikoni-gold" />
                          <span className="text-afrikoni-deep">
                            {format(new Date(rfq.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-afrikoni-deep/50 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Matching Modal */}
        {selectedRFQ && (
          <Card className="border-afrikoni-gold/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Match RFQ: {selectedRFQ.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRFQ(null);
                    setSelectedSuppliers([]);
                    setMatchingNotes('');
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RFQ Details */}
              <div className="bg-afrikoni-cream/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-afrikoni-chestnut">RFQ Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-afrikoni-deep/70">Quantity:</span>{' '}
                    <span className="font-medium">{selectedRFQ.quantity} {selectedRFQ.unit}</span>
                  </div>
                  {selectedRFQ.delivery_location && (
                    <div>
                      <span className="text-afrikoni-deep/70">Destination:</span>{' '}
                      <span className="font-medium">{selectedRFQ.delivery_location}</span>
                    </div>
                  )}
                  {selectedRFQ.categories && (
                    <div>
                      <span className="text-afrikoni-deep/70">Category:</span>{' '}
                      <span className="font-medium">{selectedRFQ.categories.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Matching Notes (Admin Only) */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Internal Matching Notes <span className="text-xs text-afrikoni-deep/70 font-normal">(Why these suppliers?)</span>
                </Label>
                <Textarea
                  value={matchingNotes}
                  onChange={(e) => setMatchingNotes(e.target.value)}
                  placeholder="e.g., Supplier A has capacity for 500kg, Supplier B has better pricing, Supplier C is closer to destination..."
                  rows={3}
                  className="mb-2"
                />
                <p className="text-xs text-afrikoni-deep/70">
                  These notes are internal only. They help with quality control, training data, and future matching decisions.
                </p>
              </div>

              {/* Supplier Selection with Trust Tiers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">
                    Select Verified Suppliers to Match
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTrustScores(!showTrustScores)}
                      className="text-xs"
                    >
                      {showTrustScores ? '🧊 Hide AI Suggestions' : '🤖 Show AI Suggestions'}
                    </Button>
                  </div>
                </div>

                {/* 🧊 PHASE B: Trust-based match suggestions (Admin-only) */}
                {showTrustScores && matches.length > 0 && !isMatchingLoading && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-900">
                          🧊 AI-Suggested Matches (Phase B - Admin Review Required)
                        </p>
                        <p className="text-xs text-purple-700 mt-1">
                          These are trust-based suggestions. Human judgment always wins.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {matches.slice(0, 5).map((match, idx) => (
                        <div key={match.id} className="flex items-center gap-2 text-sm bg-white rounded p-2 border border-purple-100">
                          <span className="font-bold text-purple-600">#{idx + 1}</span>
                          <span className="flex-1 font-medium">{match.company_name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className={
                                  match.match_tier === 'A' ? 'bg-green-100 text-green-800 border-green-300' :
                                  match.match_tier === 'B' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  'bg-orange-100 text-orange-800 border-orange-300'
                                }>
                                  Tier {match.match_tier}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="text-xs space-y-1">
                                  <p><strong>Match Score:</strong> {match.match_score}/100</p>
                                  <p><strong>Confidence:</strong> {match.match_confidence}</p>
                                  <p><strong>Reasons:</strong></p>
                                  <ul className="list-disc pl-4">
                                    {match.match_reasons?.map((reason, i) => (
                                      <li key={i}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-xs text-purple-600">{match.match_score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto border border-afrikoni-gold/20 rounded-lg p-3">
                  {suppliers.length === 0 ? (
                    <p className="text-sm text-afrikoni-deep/70 text-center py-4">
                      No verified suppliers found
                    </p>
                  ) : (
                    // Display matches first if trust scores enabled, otherwise regular list
                    (showTrustScores && matches.length > 0 ? matches : suppliers).map((supplier) => {
                      // Find match data if showing trust scores
                      const matchData = showTrustScores ? supplier : matches.find(m => m.id === supplier.id);
                      
                      return (
                        <div
                          key={supplier.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedSuppliers.includes(supplier.id)
                              ? 'bg-afrikoni-gold/10 border-afrikoni-gold'
                              : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40'
                          }`}
                          onClick={() => {
                            if (selectedSuppliers.includes(supplier.id)) {
                              setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                            } else {
                              setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSuppliers.includes(supplier.id)}
                            onChange={() => {}}
                            className="w-4 h-4 text-afrikoni-gold border-afrikoni-gold/30 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-afrikoni-chestnut">{supplier.company_name}</p>
                              {/* 🧊 PHASE B: Show trust tier badge (admin-only) */}
                              {showTrustScores && matchData && matchData.match_tier && (
                                <Badge variant="outline" className={`text-xs ${
                                  matchData.match_tier === 'A' ? 'bg-green-50 text-green-700 border-green-300' :
                                  matchData.match_tier === 'B' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                  'bg-orange-50 text-orange-700 border-orange-300'
                                }`}>
                                  {matchData.match_tier}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-afrikoni-deep/70">
                              {supplier.city && `${supplier.city}, `}{supplier.country}
                              {showTrustScores && supplier.trust_score !== undefined && (
                                <span className="ml-2 text-afrikoni-gold">
                                  • Trust: {supplier.trust_score || 0}/100
                                </span>
                              )}
                            </p>
                          </div>
                          {supplier.verified && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-afrikoni-gold/20">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRFQ(null);
                    setSelectedSuppliers([]);
                    setMatchingNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMatchSuppliers}
                  disabled={isMatching || selectedSuppliers.length === 0}
                  className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                >
                  {isMatching ? 'Matching...' : `Match with ${selectedSuppliers.length} Supplier(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

