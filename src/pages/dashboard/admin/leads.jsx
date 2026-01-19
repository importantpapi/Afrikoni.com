/**
 * Marketing Leads CRM Dashboard
 * Admin page for managing marketing leads
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Mail, Building2, Globe, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Input } from '@/components/shared/ui/input';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { 
  getMarketingLeads, 
  updateMarketingLead,
  getChannelStats
} from '@/lib/supabaseQueries/admin';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
// NOTE: Admin check done at route level - removed isAdmin import

export default function AdminLeads() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  const [leads, setLeads] = useState([]);
  const [channelStats, setChannelStats] = useState({});
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading leads management..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/dashboard');
    return null;
  }
  
  // ✅ KERNEL MIGRATION: Check admin access
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  useEffect(() => {
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }
    
    loadData();
  }, [canLoadData, statusFilter, sourceFilter]);

  const loadData = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (sourceFilter !== 'all') filters.source = sourceFilter;

      const leadsList = await getMarketingLeads(filters);
      setLeads(leadsList);

      const stats = await getChannelStats();
      setChannelStats(stats);
    } catch (error) {
      console.error('Error loading leads:', error);
      setError(error?.message || 'Failed to load leads');
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId, status) => {
    try {
      await updateMarketingLead(leadId, { status });
      toast.success('Lead status updated');
      loadData();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'new': 'outline',
      'contacted': 'default',
      'qualified': 'default',
      'converted': 'success',
      'lost': 'destructive'
    };
    return variants[status] || 'outline';
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.email?.toLowerCase().includes(query) ||
      lead.name?.toLowerCase().includes(query) ||
      lead.company_name?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <>
        <CardSkeleton count={3} />
      </>
    );
  }
  
  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          loadData();
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Marketing Leads</h1>
          <p className="text-afrikoni-text-dark/70">Manage and track marketing leads</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Total Leads</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">New</p>
              <p className="text-2xl font-bold text-blue-600">
                {leads.filter(l => l.status === 'new').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Contacted</p>
              <p className="text-2xl font-bold text-amber-600">
                {leads.filter(l => l.status === 'contacted').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Converted</p>
              <p className="text-2xl font-bold text-green-600">
                {leads.filter(l => l.status === 'converted').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-afrikoni-gold">
                {leads.length > 0 
                  ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Channel Stats */}
        {Object.keys(channelStats).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Channel Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(channelStats).map(([channel, count]) => (
                  <div key={channel} className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-afrikoni-text-dark/70 mb-1">{channel}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="landing_page">Landing Page</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Leads List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No leads found"
                description="Marketing leads will appear here"
              />
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-5 h-5 text-afrikoni-gold" />
                          <p className="font-semibold">{lead.name || 'Unknown'}</p>
                          <Badge variant={getStatusBadge(lead.status)}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                          {lead.source && (
                            <Badge variant="outline">{lead.source}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          {lead.email}
                        </p>
                        {lead.company_name && (
                          <p className="text-sm text-afrikoni-text-dark/60">
                            {lead.company_name}
                          </p>
                        )}
                        {lead.country && (
                          <p className="text-sm text-afrikoni-text-dark/60">
                            {lead.country}
                          </p>
                        )}
                        <p className="text-xs text-afrikoni-text-dark/50 mt-1">
                          Created: {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      {lead.notes && (
                        <p className="text-sm text-afrikoni-text-dark/70 flex-1 ml-4">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

