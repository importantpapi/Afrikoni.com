/**
 * KYB Verification Dashboard
 * Admin page for reviewing KYB documents
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSearch, CheckCircle, XCircle, Clock, Building2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { 
  getAllPendingKYBDocuments,
  updateKYBDocumentStatus
} from '@/lib/supabaseQueries/admin';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';
import { isAdmin } from '@/utils/permissions';

export default function AdminKYB() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!user || !isAdmin(user)) {
        navigate('/dashboard');
        return;
      }

      const docs = await getAllPendingKYBDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading KYB documents:', error);
      toast.error('Failed to load KYB documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewDocument = async (documentId, status) => {
    try {
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      await updateKYBDocumentStatus(documentId, status, user.id, reviewNotes);
      toast.success(`Document ${status} successfully`);
      setSelectedDoc(null);
      setReviewNotes('');
      loadDocuments();
    } catch (error) {
      console.error('Error reviewing document:', error);
      toast.error('Failed to review document');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">KYB Verification</h1>
          <p className="text-afrikoni-text-dark/70">Review and verify business documents</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600">{documents.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="No pending documents"
                description="All KYB documents have been reviewed"
              />
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-afrikoni-gold" />
                          <p className="font-semibold capitalize">
                            {doc.document_type.replace('_', ' ')}
                          </p>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60 mb-1">
                          Company: {doc.company?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-afrikoni-text-dark/50">
                          Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-afrikoni-gold hover:underline text-sm"
                      >
                        View Document
                      </a>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedDoc({ ...doc, action: 'reject' });
                            setReviewNotes('');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                          onClick={() => {
                            setSelectedDoc({ ...doc, action: 'approve' });
                            setReviewNotes('');
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Modal */}
        {selectedDoc && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => {
              setSelectedDoc(null);
              setReviewNotes('');
            }}
          >
            <Card 
              className="bg-white p-6 rounded-lg max-w-md w-full m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-0">
                <h3 className="text-xl font-bold mb-4">
                  Review {selectedDoc.document_type.replace('_', ' ')}
                </h3>
                <Textarea
                  placeholder="Review notes (optional)"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDoc(null);
                      setReviewNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                    onClick={() => {
                      const status = selectedDoc.action === 'reject' ? 'rejected' : 'approved';
                      handleReviewDocument(selectedDoc.id, status);
                    }}
                  >
                    {selectedDoc.action === 'reject' ? 'Reject' : 'Approve'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

