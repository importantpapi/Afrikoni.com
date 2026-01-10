/**
 * Comprehensive Admin Verification Review Page
 * Complete workflow for reviewing supplier verification documents with AI results
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, CheckCircle, XCircle, Clock, Building2, FileText, Eye, Download,
  AlertTriangle, Shield, User, Mail, Phone, Globe, Hash, Calendar, MessageSquare,
  ExternalLink, RefreshCw, Filter, Search, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Textarea } from '@/components/shared/ui/textarea';
import { Input } from '@/components/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/shared/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { isAdmin } from '@/utils/permissions';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import AccessDenied from '@/components/AccessDenied';

export default function AdminVerificationReview() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, verified, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[AdminVerificationReview] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → set no access
    if (!user) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    // Check admin access
    const admin = isAdmin(user);
    setHasAccess(admin);
    setIsLoading(false);
    
    if (admin) {
      loadVerifications();
    }
  }, [authReady, authLoading, user, profile, role]);

  useEffect(() => {
    if (filterStatus || searchQuery) {
      if (hasAccess && authReady) {
        loadVerifications();
      }
    }
  }, [filterStatus, searchQuery, hasAccess, authReady]);

  const loadVerifications = async () => {
    try {
      setIsLoading(true);
      
      // Load verifications with company and profile data
      let query = supabase
        .from('verifications')
        .select(`
          *,
          companies (
            id,
            company_name,
            country,
            business_type,
            email,
            phone,
            website,
            verification_status,
            business_license,
            tax_number,
            address_country,
            certificate_uploads,
            created_at
          ),
          profiles (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending') {
          query = query.eq('status', 'pending');
        } else if (filterStatus === 'verified') {
          query = query.eq('status', 'verified');
        } else if (filterStatus === 'rejected') {
          query = query.eq('status', 'rejected');
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];

      // Apply search filter
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
          v.companies?.company_name?.toLowerCase().includes(queryLower) ||
          v.companies?.country?.toLowerCase().includes(queryLower) ||
          v.companies?.email?.toLowerCase().includes(queryLower) ||
          v.business_id_number?.toLowerCase().includes(queryLower)
        );
      }

      setVerifications(filtered);
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVerification = async (verificationId, companyId) => {
    if (!reviewNotes.trim() && !confirm('Approve without review notes?')) {
      return;
    }

    try {
      // Use auth from context (no duplicate call)
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      // Update verification status
      const { error: verifError } = await supabase
        .from('verifications')
        .update({
          status: 'verified',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: reviewNotes || null
        })
        .eq('id', verificationId);

      if (verifError) throw verifError;

      // Update company verification status
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          verification_status: 'verified',
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (companyError) throw companyError;

      // ✅ Log admin action to audit trail
      try {
        const { logAdminEvent } = await import('@/utils/auditLogger');
        // Use auth from context (no duplicate call)
        await logAdminEvent({
          action: 'approve_verification',
          entity_type: 'verification',
          entity_id: verificationId,
          user: user,
          profile: profile,
          metadata: {
            company_id: companyId,
            review_notes: reviewNotes || null,
            status: 'verified'
          }
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
        // Don't block the approval if audit logging fails
      }

      toast.success('Verification approved successfully');
      setSelectedVerification(null);
      setReviewNotes('');
      await loadVerifications();

      // Send notification to supplier
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(companyId, 'approved', reviewNotes || null);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't block the approval if notification fails
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    }
  };

  const handleRejectVerification = async (verificationId, companyId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      // Use auth from context (no duplicate call)
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      // Update verification status
      const { error: verifError } = await supabase
        .from('verifications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: rejectionReason
        })
        .eq('id', verificationId);

      if (verifError) throw verifError;

      // Update company verification status
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          verification_status: 'rejected',
          verified: false
        })
        .eq('id', companyId);

      if (companyError) throw companyError;

      // ✅ Log admin action to audit trail
      try {
        const { logAdminEvent } = await import('@/utils/auditLogger');
        // Use auth from context (no duplicate call)
        await logAdminEvent({
          action: 'reject_verification',
          entity_type: 'verification',
          entity_id: verificationId,
          user: user,
          profile: profile,
          metadata: {
            company_id: companyId,
            rejection_reason: rejectionReason,
            status: 'rejected'
          }
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
        // Don't block the rejection if audit logging fails
      }

      toast.success('Verification rejected');
      setSelectedVerification(null);
      setRejectionReason('');
      await loadVerifications();

      // Send notification to supplier
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(companyId, 'rejected', rejectionReason);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't block the rejection if notification fails
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Pending</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole="admin">
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const verification = selectedVerification;
  const company = verification?.companies;
  const verificationProfile = verification?.profiles;

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                Verification Review Center
              </h1>
              <p className="text-afrikoni-deep/70">
                Review and approve supplier verification documents with AI assistance
              </p>
            </div>
            <Button
              onClick={loadVerifications}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Total</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{verifications.length}</p>
                </div>
                <FileSearch className="w-8 h-8 text-afrikoni-gold/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {verifications.filter(v => v.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Verified</p>
                  <p className="text-2xl font-bold text-green-600">
                    {verifications.filter(v => v.status === 'verified').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {verifications.filter(v => v.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-afrikoni-deep/50" />
                  <Input
                    placeholder="Search by company name, country, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Verifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="No verifications found"
                description={searchQuery || filterStatus !== 'all' 
                  ? "Try adjusting your filters" 
                  : "All verification requests have been processed"}
              />
            ) : (
              <div className="space-y-4">
                {verifications.map((verif) => (
                  <motion.div
                    key={verif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-5 h-5 text-afrikoni-gold" />
                          <h3 className="font-semibold text-lg text-afrikoni-chestnut">
                            {verif.companies?.company_name || 'Unknown Company'}
                          </h3>
                          {getStatusBadge(verif.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-afrikoni-deep/70">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>{verif.companies?.country || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{verif.companies?.email || 'N/A'}</span>
                          </div>
                          {verif.business_id_number && (
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4" />
                              <span>ID: {verif.business_id_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted: {format(new Date(verif.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        {verif.review_notes && (
                          <div className="mt-2 p-2 bg-afrikoni-gold/10 rounded text-xs text-afrikoni-deep/80">
                            <strong>Review Notes:</strong> {verif.review_notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVerification(verif)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {verif.companies?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/business/${verif.companies.id}`)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        )}
                      </div>
                      {verif.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedVerification({ ...verif, action: 'reject' });
                              setRejectionReason('');
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                            onClick={() => {
                              setSelectedVerification({ ...verif, action: 'approve' });
                              setReviewNotes('');
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Modal */}
        <AnimatePresence>
          {selectedVerification && (
            <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-afrikoni-chestnut">
                    Review Verification: {company?.company_name}
                  </DialogTitle>
                  <DialogClose onClose={() => setSelectedVerification(null)} />
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Company Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Company Name</p>
                          <p className="text-afrikoni-chestnut">{company?.company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Country</p>
                          <p className="text-afrikoni-chestnut">{company?.country || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Business Type</p>
                          <p className="text-afrikoni-chestnut">{company?.business_type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Email</p>
                          <p className="text-afrikoni-chestnut">{company?.email || 'N/A'}</p>
                        </div>
                        {company?.phone && (
                          <div>
                            <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Phone</p>
                            <p className="text-afrikoni-chestnut">{company.phone}</p>
                          </div>
                        )}
                        {company?.website && (
                          <div>
                            <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Website</p>
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-afrikoni-gold hover:underline">
                              {company.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Verification Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Verification Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {verification?.documents && typeof verification.documents === 'object' ? (
                        Object.entries(verification.documents).map(([docType, docUrl]) => (
                          <div key={docType} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-afrikoni-gold" />
                                <span className="font-semibold capitalize">{docType.replace('_', ' ')}</span>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-afrikoni-gold hover:underline text-sm flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </a>
                                <a
                                  href={docUrl}
                                  download
                                  className="text-afrikoni-gold hover:underline text-sm flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            </div>
                            {typeof docUrl === 'string' && (
                              <div className="mt-2">
                                <img
                                  src={docUrl}
                                  alt={docType}
                                  className="max-w-full h-auto rounded border"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-afrikoni-deep/70">No documents uploaded</p>
                      )}
                      
                      {/* Additional company documents */}
                      {company?.business_license && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-afrikoni-gold" />
                              <span className="font-semibold">Business License</span>
                            </div>
                            <a
                              href={company.business_license}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-afrikoni-gold hover:underline text-sm flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {company?.certificate_uploads && Array.isArray(company.certificate_uploads) && company.certificate_uploads.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-afrikoni-gold" />
                            <span className="font-semibold">Additional Certificates</span>
                          </div>
                          <div className="space-y-2">
                            {company.certificate_uploads.map((certUrl, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-afrikoni-deep/70">Certificate {idx + 1}</span>
                                <a
                                  href={certUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-afrikoni-gold hover:underline text-sm"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Verification Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Verification Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Business ID Number</p>
                          <p className="text-afrikoni-chestnut">{verification.business_id_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Country of Registration</p>
                          <p className="text-afrikoni-chestnut">{verification.country_of_registration || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Status</p>
                          {getStatusBadge(verification.status)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Submitted</p>
                          <p className="text-afrikoni-chestnut">
                            {format(new Date(verification.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      {/* ✅ Bank Account Information - Show if available */}
                      {verification.documents && typeof verification.documents === 'object' && verification.documents.bank_account_info && (
                        <div className="mt-4 pt-4 border-t border-afrikoni-gold/20">
                          <h4 className="text-base font-semibold text-afrikoni-chestnut mb-3 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Bank Account Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {verification.documents.bank_account_info.account_number && (
                              <div>
                                <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Account Number</p>
                                <p className="text-afrikoni-chestnut font-mono">{verification.documents.bank_account_info.account_number}</p>
                              </div>
                            )}
                            {verification.documents.bank_account_info.bank_name && (
                              <div>
                                <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Bank Name</p>
                                <p className="text-afrikoni-chestnut">{verification.documents.bank_account_info.bank_name}</p>
                              </div>
                            )}
                            {verification.documents.bank_account_info.account_holder_name && (
                              <div>
                                <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Account Holder Name</p>
                                <p className="text-afrikoni-chestnut">{verification.documents.bank_account_info.account_holder_name}</p>
                              </div>
                            )}
                            {verification.documents.bank_account_info.swift_code && (
                              <div>
                                <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">SWIFT/BIC Code</p>
                                <p className="text-afrikoni-chestnut font-mono">{verification.documents.bank_account_info.swift_code}</p>
                              </div>
                            )}
                            {verification.documents.bank_account_info.bank_country && (
                              <div>
                                <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Bank Country</p>
                                <p className="text-afrikoni-chestnut">{verification.documents.bank_account_info.bank_country}</p>
                              </div>
                            )}
                            {verification.documents.bank_account_info.bank_address && (
                              <div className="md:col-span-2">
                                <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Bank Address</p>
                                <p className="text-afrikoni-chestnut">{verification.documents.bank_account_info.bank_address}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {verification.reviewed_at && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold text-afrikoni-deep/70 mb-1">Reviewed</p>
                          <p className="text-afrikoni-chestnut">
                            {format(new Date(verification.reviewed_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                          {verification.review_notes && (
                            <div className="mt-2 p-2 bg-afrikoni-gold/10 rounded">
                              <p className="text-sm text-afrikoni-deep/80">{verification.review_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Review Actions */}
                  {verification.status === 'pending' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Review & Decision
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedVerification.action === 'approve' ? (
                          <>
                            <div>
                              <label className="text-sm font-semibold text-afrikoni-deep/70 mb-2 block">
                                Review Notes (Optional)
                              </label>
                              <Textarea
                                placeholder="Add any notes about this verification..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedVerification(null)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                                onClick={() => handleApproveVerification(verification.id, company?.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Verification
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="text-sm font-semibold text-afrikoni-deep/70 mb-2 block">
                                Rejection Reason <span className="text-red-600">*</span>
                              </label>
                              <Textarea
                                placeholder="Please provide a clear reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                required
                              />
                              <p className="text-xs text-afrikoni-deep/60 mt-1">
                                This reason will be shared with the supplier
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedVerification(null)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleRejectVerification(verification.id, company?.id)}
                                disabled={!rejectionReason.trim()}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Verification
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

