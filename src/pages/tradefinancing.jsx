import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { DollarSign, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function TradeFinancing() {
  // ✅ KERNEL COMPLIANCE: Use unified Dashboard Kernel
  const { user, profile, isAdmin } = useDashboardKernel();
  const { authReady, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requested_amount: '',
    purpose: '',
    order_id: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[TradeFinancing] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect (optional - can be public)
    if (!user) {
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Use auth from context (no duplicate call)

      const { data, error } = await supabase
        .from('trade_financing')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Filter based on role
      const userCompanyId = profile?.company_id || null;
      const myApplications = (role === 'admin' || profile?.is_admin)
        ? data || []
        : (data || []).filter(app => app.company_id === userCompanyId);

      setApplications(myApplications);
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load financing applications');
    }
  };

  const handleSubmit = async () => {
    if (!formData.requested_amount || !formData.purpose) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const companyId = profile?.company_id || null;
      if (!companyId) {
        toast.error('Please complete your company profile first');
        return;
      }

      const { error } = await supabase.from('trade_financing').insert({
        company_id: companyId,
        requested_amount: parseFloat(formData.requested_amount),
        purpose: formData.purpose,
        order_id: formData.order_id,
        status: 'pending'
      });

      if (error) throw error;

      // Send email notification (if email service is configured)
      if (user?.email) {
        // Email sending logic would go here if implemented
        console.log('Trade financing application submitted for:', user.email);
        const emailPayload = {
          subject: 'Trade Financing Application Submitted',
          body: `Your trade financing application for $${formData.requested_amount} has been submitted.`
        };
        // emailPayload would be used here when email service is implemented
      }

      toast.success('Application submitted successfully!');
      setFormData({ requested_amount: '', purpose: '', order_id: null });
      setShowForm(false);
      loadData();
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to submit application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id, amount) => {
    try {
      const { error } = await supabase
        .from('trade_financing')
        .update({
          status: 'approved',
          approved_amount: amount,
          disbursement_date: format(new Date(), 'yyyy-MM-dd')
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Application approved!');
      loadData();
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to approve application');
    }
  };

  // ✅ KERNEL COMPLIANCE: isAdmin already available from useDashboardKernel()

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Trade Financing</h1>
            <p className="text-lg text-afrikoni-deep">Apply for trade financing to support your business</p>
          </div>
          {!isAdmin && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-afrikoni-gold hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" /> New Application
            </Button>
          )}
        </div>

        {showForm && !isAdmin && (
          <Card className="border-afrikoni-gold/20 mb-6">
            <CardHeader>
              <CardTitle>New Financing Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="requested_amount">Requested Amount (USD) *</Label>
                <Input
                  id="requested_amount"
                  type="number"
                  step="0.01"
                  value={formData.requested_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, requested_amount: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Describe what you need the financing for..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={isLoading} className="bg-afrikoni-gold hover:bg-amber-700">
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="border-afrikoni-gold/20">
              <CardContent className="p-12 text-center">
                <DollarSign className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">No applications yet</h3>
                <p className="text-afrikoni-deep">Your financing applications will appear here</p>
              </CardContent>
            </Card>
          ) : (
            Array.isArray(applications) && applications.map(application => (
              <Card key={application.id} className="border-afrikoni-gold/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-afrikoni-chestnut">
                          Application #{application.id.slice(0, 8)}
                        </h3>
                        <Badge className={
                          application.status === 'approved' ? 'bg-green-100 text-green-700' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {application.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-afrikoni-deep mb-1">Requested Amount</div>
                          <div className="font-semibold text-afrikoni-chestnut">${application.requested_amount}</div>
                        </div>
                        {application.approved_amount && (
                          <div>
                            <div className="text-afrikoni-deep mb-1">Approved Amount</div>
                            <div className="font-semibold text-green-600">${application.approved_amount}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-afrikoni-deep mb-1">Status</div>
                          <div className="font-semibold text-afrikoni-chestnut capitalize">{application.status}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-afrikoni-deep mb-1">Purpose</div>
                        <p className="text-afrikoni-deep">{application.purpose}</p>
                      </div>
                    </div>
                    {isAdmin && application.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(application.id, application.requested_amount)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

