import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, MessageSquare, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sendRFQNotification } from '@/utils/rfqNotifications';
import { logRFQAdminAction } from '@/utils/rfqAuditLog';

export default function AdminRFQReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [confidenceScore, setConfidenceScore] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pastRFQs, setPastRFQs] = useState([]);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    loadAdminUser();
    loadRFQs();
    if (id) {
      loadRFQDetail(id);
    }
  }, [id, filterStatus]);

  const loadAdminUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setAdminUser(user);
    } catch (error) {
      console.error('Failed to load admin user:', error);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadRFQs = async () => {
    try {
      let query = supabase
        .from('rfqs')
        .select('*, buyer_company:companies!rfqs_buyer_company_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRfqs(data || []);
    } catch (error) {
      toast.error('Failed to load RFQs');
    }
  };

  const loadRFQDetail = async (rfqId) => {
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*, buyer_company:companies!rfqs_buyer_company_id_fkey(*), category:categories(*)')
        .eq('id', rfqId)
        .single();
      
      // Ensure buyer_user_id is available (fallback to company lookup if missing)
      if (!data.buyer_user_id && data.buyer_company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('user_id')
          .eq('id', data.buyer_company_id)
          .single();
        if (company?.user_id) {
          data.buyer_user_id = company.user_id;
        }
      }

      if (error) throw error;
      setSelectedRFQ(data);
      setInternalNotes(data.internal_notes || '');
      setConfidenceScore(data.confidence_score || '');
      setSelectedSuppliers(data.matched_supplier_ids || []);

      // Load past RFQs for this buyer
      if (data.buyer_company_id) {
        const { data: pastRFQsData } = await supabase
          .from('rfqs')
          .select('id, title, status, created_at')
          .eq('buyer_company_id', data.buyer_company_id)
          .neq('id', rfqId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setPastRFQs(pastRFQsData || []);
      }
    } catch (error) {
      toast.error('Failed to load RFQ details');
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, verification_status')
        .in('role', ['seller', 'hybrid'])
        .eq('verification_status', 'verified')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      toast.error('Failed to load suppliers');
    }
  };

  const handleApproveAndMatch = async () => {
    if (!selectedRFQ) return;
    if (selectedSuppliers.length === 0) {
      toast.error('Please select at least one supplier');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({
          status: 'matched',
          internal_notes: internalNotes,
          confidence_score: confidenceScore,
          matched_supplier_ids: selectedSuppliers,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRFQ.id);

      if (error) throw error;

      // Log admin action
      await logRFQAdminAction({
        rfqId: selectedRFQ.id,
        action: 'approve',
        adminUserId: adminUser?.id,
        statusBefore: selectedRFQ.status,
        statusAfter: 'matched',
        metadata: {
          supplier_ids: selectedSuppliers,
          confidence_score: confidenceScore,
          internal_notes: internalNotes
        }
      });

      // Send notification to buyer
      await sendRFQNotification({
        type: 'rfq_matched',
        rfqId: selectedRFQ.id,
        buyerUserId: selectedRFQ.buyer_user_id,
        companyId: selectedRFQ.buyer_company_id
      });

      toast.success('RFQ approved and suppliers matched');
      navigate('/dashboard/admin/rfq-review');
      loadRFQs();
    } catch (error) {
      toast.error('Failed to approve RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!selectedRFQ) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({
          status: 'clarification_requested',
          internal_notes: internalNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRFQ.id);

      if (error) throw error;

      // Log admin action
      await logRFQAdminAction({
        rfqId: selectedRFQ.id,
        action: 'request_clarification',
        adminUserId: adminUser?.id,
        statusBefore: selectedRFQ.status,
        statusAfter: 'clarification_requested',
        metadata: {
          internal_notes: internalNotes
        }
      });

      // Send notification to buyer
      await sendRFQNotification({
        type: 'rfq_clarification',
        rfqId: selectedRFQ.id,
        buyerUserId: selectedRFQ.buyer_user_id,
        companyId: selectedRFQ.buyer_company_id
      });

      toast.success('Clarification requested');
      navigate('/dashboard/admin/rfq-review');
      loadRFQs();
    } catch (error) {
      toast.error('Failed to request clarification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRFQ) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({
          status: 'rejected',
          internal_notes: internalNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRFQ.id);

      if (error) throw error;

      // Log admin action
      await logRFQAdminAction({
        rfqId: selectedRFQ.id,
        action: 'reject',
        adminUserId: adminUser?.id,
        statusBefore: selectedRFQ.status,
        statusAfter: 'rejected',
        metadata: {
          internal_notes: internalNotes
        }
      });

      // Send notification to buyer
      await sendRFQNotification({
        type: 'rfq_rejected',
        rfqId: selectedRFQ.id,
        buyerUserId: selectedRFQ.buyer_user_id,
        companyId: selectedRFQ.buyer_company_id
      });

      toast.success('RFQ rejected');
      navigate('/dashboard/admin/rfq-review');
      loadRFQs();
    } catch (error) {
      toast.error('Failed to reject RFQ');
    } finally {
      setIsLoading(false);
    }
  };


  const getStatusBadge = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      clarification_requested: 'bg-blue-100 text-blue-800',
      matched: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (id && selectedRFQ) {
    return (
      <div className="min-h-screen bg-afrikoni-offwhite p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/admin/rfq-review')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-afrikoni-deep/70">Product Name</Label>
                    <p className="font-semibold text-afrikoni-chestnut">{selectedRFQ.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-afrikoni-deep/70">Category</Label>
                    <p className="font-semibold">{selectedRFQ.category?.name || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-afrikoni-deep/70">Quantity</Label>
                      <p className="font-semibold">{selectedRFQ.quantity} {selectedRFQ.unit}</p>
                    </div>
                  <div>
                    <Label className="text-sm text-afrikoni-deep/70">Delivery Country</Label>
                    <p className="font-semibold">{selectedRFQ.delivery_location}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-afrikoni-deep/70">Timeline</Label>
                    <p className="font-semibold">{selectedRFQ.urgency?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                </div>
                  {selectedRFQ.description && (
                    <div>
                      <Label className="text-sm text-afrikoni-deep/70">Specifications</Label>
                      <p className="text-sm">{selectedRFQ.description}</p>
                    </div>
                  )}
                  {selectedRFQ.metadata && (
                    <>
                      {selectedRFQ.metadata.budget_min && (
                        <div>
                          <Label className="text-sm text-afrikoni-deep/70">Budget Range</Label>
                          <p className="font-semibold">
                            €{selectedRFQ.metadata.budget_min}
                            {selectedRFQ.metadata.budget_max && ` - €${selectedRFQ.metadata.budget_max}`}
                          </p>
                        </div>
                      )}
                      {selectedRFQ.metadata.certifications && Array.isArray(selectedRFQ.metadata.certifications) && selectedRFQ.metadata.certifications.length > 0 && (
                        <div>
                          <Label className="text-sm text-afrikoni-deep/70">Certifications</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedRFQ.metadata.certifications.map(cert => (
                              <Badge key={cert} variant="outline">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedRFQ.metadata.incoterms && (
                        <div>
                          <Label className="text-sm text-afrikoni-deep/70">Incoterms</Label>
                          <p className="font-semibold">{selectedRFQ.metadata.incoterms}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <Label className="text-sm text-afrikoni-deep/70">RFQ ID</Label>
                    <p className="font-mono text-sm">{selectedRFQ.id}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Buyer Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-afrikoni-deep/70">Company Name</Label>
                    <p className="font-semibold">{selectedRFQ.metadata?.company_name || selectedRFQ.buyer_company?.name || 'N/A'}</p>
                  </div>
                  {selectedRFQ.metadata && (
                    <>
                      <div>
                        <Label className="text-sm text-afrikoni-deep/70">Buyer Role</Label>
                        <p className="font-semibold">{selectedRFQ.metadata.buyer_role || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-afrikoni-deep/70">Purchase Type</Label>
                        <p className="font-semibold">{selectedRFQ.metadata.purchase_type || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-afrikoni-deep/70">Estimated Order Value</Label>
                        <p className="font-semibold">{selectedRFQ.metadata.order_value_range || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {pastRFQs.length > 0 && (
                    <div>
                      <Label className="text-sm text-afrikoni-deep/70 mb-2 block">Past RFQs</Label>
                      <div className="space-y-2">
                        {pastRFQs.map(rfq => (
                          <div key={rfq.id} className="flex items-center justify-between text-sm p-2 bg-afrikoni-cream/30 rounded">
                            <span className="font-medium">{rfq.title}</span>
                            <Badge className={getStatusBadge(rfq.status)}>
                              {rfq.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Internal Matching</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="internal_notes">Internal Notes</Label>
                    <Textarea
                      id="internal_notes"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Why this RFQ is approved or risky..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div>
                    <Label className="mb-3 block">Supplier Shortlist</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border border-afrikoni-gold/20 rounded-lg p-3">
                      {suppliers.map(supplier => (
                        <div key={supplier.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`supplier-${supplier.id}`}
                            checked={selectedSuppliers.includes(supplier.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                              } else {
                                setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                              }
                            }}
                            className="w-4 h-4 text-afrikoni-gold border-afrikoni-gold/30 rounded"
                          />
                          <Label htmlFor={`supplier-${supplier.id}`} className="text-sm cursor-pointer flex-1">
                            {supplier.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-afrikoni-deep/70 mt-2">
                      {selectedSuppliers.length} supplier(s) selected
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence Score</Label>
                    <Select value={confidenceScore} onValueChange={setConfidenceScore}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleApproveAndMatch}
                    disabled={isLoading || selectedSuppliers.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Match Suppliers
                  </Button>
                  <Button
                    onClick={handleRequestClarification}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Clarification
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-red-500 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject RFQ
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut">RFQ Review</h1>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-afrikoni-deep/50 w-4 h-4" />
              <Input
                placeholder="Search RFQs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadRFQs();
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="clarification_requested">Clarification</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-afrikoni-cream/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">RFQ ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Buyer Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Delivery Country</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Est. Order Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-afrikoni-chestnut">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqs.map(rfq => (
                    <tr key={rfq.id} className="border-t border-afrikoni-gold/20 hover:bg-afrikoni-cream/30">
                      <td className="px-4 py-3 text-sm font-mono">{rfq.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm">{rfq.title}</td>
                      <td className="px-4 py-3 text-sm">{rfq.buyer_company?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{rfq.delivery_location}</td>
                      <td className="px-4 py-3 text-sm">
                        {rfq.metadata?.order_value_range || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadge(rfq.status)}>
                          {rfq.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-afrikoni-deep/70">
                        {format(new Date(rfq.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/dashboard/admin/rfq-review/${rfq.id}`)}
                          variant="outline"
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

