/**
 * ADMIN OPERATIONS CENTER - 2026
 * Complete control dashboard for concierge marketplace operations
 * 
 * Purpose: Run platform manually for first 20-50 deals, then automate what works
 * Philosophy: Human intelligence first, AI assistance second
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, Send, Users, TrendingUp,
  MessageSquare, RefreshCw, Filter, Search, MoreVertical, Eye,
  Zap, Target, Flag, Ban, ThumbsUp, X, ExternalLink,
  Activity, Bell, DollarSign, Package, Shield
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Textarea } from '@/components/shared/ui/textarea';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { matchSuppliersToRFQ, notifyMatchedSuppliers } from '@/services/supplierMatchingService';

export default function AdminOperationsCenter() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stuck-rfqs');
  const [rfqs, setRfqs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: null, data: null });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load RFQs needing attention
      const { data: rfqData } = await supabase
        .from('trades')
        .select(`
          *,
          buyer:companies!buyer_company_id(id, company_name, country, verified, trust_score),
          quotes(id, status, created_at, supplier_company_id)
        `)
        .eq('trade_type', 'rfq')
        .in('status', ['rfq_open', 'quoted', 'negotiating'])
        .order('created_at', { ascending: false });

      // Load recent quotes
      const { data: quoteData } = await supabase
        .from('quotes')
        .select(`
          *,
          rfq:trades!trade_id(id, title, buyer_company_id),
          supplier:companies!supplier_company_id(id, company_name, verified, trust_score)
        `)
        .in('status', ['submitted', 'pending'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Load active trades
      const { data: tradeData } = await supabase
        .from('trades')
        .select(`
          *,
          buyer:companies!buyer_company_id(company_name),
          seller:companies!seller_company_id(company_name)
        `)
        .in('trade_type', ['order', 'direct'])
        .in('status', ['pending', 'funded', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(20);

      // Calculate stats
      const stuckRFQs = (rfqData || []).filter(rfq => {
        const age = Date.now() - new Date(rfq.created_at).getTime();
        const daysSinceCreated = age / (1000 * 60 * 60 * 24);
        const quoteCount = rfq.quotes?.length || 0;
        return daysSinceCreated > 2 && quoteCount === 0;
      });

      const ghostBuyers = (rfqData || []).filter(rfq => {
        const quoteCount = rfq.quotes?.length || 0;
        const age = Date.now() - new Date(rfq.created_at).getTime();
        const daysSinceCreated = age / (1000 * 60 * 60 * 24);
        return quoteCount > 3 && daysSinceCreated > 5 && rfq.status === 'quoted';
      });

      const urgentActions = stuckRFQs.length + ghostBuyers.length;

      setRfqs(rfqData || []);
      setQuotes(quoteData || []);
      setTrades(tradeData || []);
      setStats({
        totalRFQs: rfqData?.length || 0,
        stuckRFQs: stuckRFQs.length,
        ghostBuyers: ghostBuyers.length,
        pendingQuotes: quoteData?.length || 0,
        activeTrades: tradeData?.length || 0,
        urgentActions
      });
    } catch (error) {
      console.error('[AdminOps] Load error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ACTIONS: Manual supplier matching
  const handleManualMatch = async (rfq) => {
    try {
      const result = await matchSuppliersToRFQ({
        product: rfq.title || rfq.description,
        country: rfq.metadata?.target_country || '',
        quantity: rfq.quantity || 0,
        budget: rfq.target_price || null
      }, 20); // Get top 20 for manual review

      setActionModal({
        open: true,
        type: 'manual-match',
        data: { rfq, suppliers: result.suppliers || [] }
      });
    } catch (error) {
      console.error('[AdminOps] Manual match error:', error);
      toast.error('Failed to match suppliers');
    }
  };

  // ACTIONS: Notify selected suppliers
  const handleNotifySuppliers = async (rfqId, supplierIds) => {
    try {
      const suppliers = actionModal.data.suppliers.filter(s =>
        supplierIds.includes(s.supplier_id)
      );

      await notifyMatchedSuppliers(rfqId, suppliers);

      // Update RFQ metadata
      await supabase
        .from('trades')
        .update({
          matched_supplier_ids: supplierIds,
          metadata: {
            ...actionModal.data.rfq.metadata,
            manually_matched: true,
            matched_at: new Date().toISOString()
          }
        })
        .eq('id', rfqId);

      toast.success(`Notified ${supplierIds.length} suppliers`);
      setActionModal({ open: false, type: null, data: null });
      loadData();
    } catch (error) {
      console.error('[AdminOps] Notify error:', error);
      toast.error('Failed to notify suppliers');
    }
  };

  // ACTIONS: Nudge buyer
  const handleNudgeBuyer = async (rfq) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          company_id: rfq.buyer_company_id,
          type: 'admin_nudge',
          title: 'Quotes Waiting for Review',
          message: `You have ${rfq.quotes?.length || 0} quotes on "${rfq.title}". Review and accept the best offer!`,
          metadata: { rfq_id: rfq.id }
        });

      toast.success('Buyer nudged successfully');
      loadData();
    } catch (error) {
      console.error('[AdminOps] Nudge error:', error);
      toast.error('Failed to nudge buyer');
    }
  };

  // ACTIONS: Close/extend RFQ
  const handleRFQAction = async (rfqId, action, reason = '') => {
    try {
      const updates = action === 'close'
        ? { status: 'cancelled', metadata: { admin_closed: true, reason } }
        : { expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };

      await supabase
        .from('trades')
        .update(updates)
        .eq('id', rfqId);

      toast.success(action === 'close' ? 'RFQ closed' : 'RFQ deadline extended');
      setActionModal({ open: false, type: null, data: null });
      loadData();
    } catch (error) {
      console.error('[AdminOps] RFQ action error:', error);
      toast.error('Action failed');
    }
  };

  // ACTIONS: Flag suspicious activity
  const handleFlagItem = async (itemType, itemId, reason) => {
    try {
      await supabase
        .from('admin_flags')
        .insert({
          item_type: itemType,
          item_id: itemId,
          reason,
          flagged_by: (await supabase.auth.getUser()).data.user.id,
          status: 'open'
        });

      toast.success('Item flagged for review');
      loadData();
    } catch (error) {
      console.error('[AdminOps] Flag error:', error);
      toast.error('Failed to flag item');
    }
  };

  // Filter RFQs by status
  const filteredRFQs = rfqs.filter(rfq => {
    if (filterStatus !== 'all' && rfq.status !== filterStatus) return false;
    if (searchQuery && !rfq.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Categorize RFQs
  const stuckRFQs = filteredRFQs.filter(rfq => {
    const age = Date.now() - new Date(rfq.created_at).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    const quoteCount = rfq.quotes?.length || 0;
    return daysSinceCreated > 2 && quoteCount === 0;
  });

  const ghostBuyerRFQs = filteredRFQs.filter(rfq => {
    const quoteCount = rfq.quotes?.length || 0;
    const age = Date.now() - new Date(rfq.created_at).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    return quoteCount > 3 && daysSinceCreated > 5 && rfq.status === 'quoted';
  });

  const healthyRFQs = filteredRFQs.filter(rfq =>
    !stuckRFQs.includes(rfq) && !ghostBuyerRFQs.includes(rfq)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-os-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-os-bg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-os-text-primary flex items-center gap-3">
            <Activity className="w-8 h-8 text-os-accent" />
            Operations Center
          </h1>
          <p className="text-os-text-secondary mt-1">
            Real-time marketplace intelligence & control
          </p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total RFQs"
          value={stats.totalRFQs}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Stuck RFQs"
          value={stats.stuckRFQs}
          icon={AlertTriangle}
          color="red"
          alert={stats.stuckRFQs > 0}
        />
        <StatCard
          title="Ghost Buyers"
          value={stats.ghostBuyers}
          icon={Flag}
          color="orange"
          alert={stats.ghostBuyers > 0}
        />
        <StatCard
          title="Pending Quotes"
          value={stats.pendingQuotes}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          title="Active Trades"
          value={stats.activeTrades}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="stuck-rfqs" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Stuck RFQs
            {stats.stuckRFQs > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.stuckRFQs}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ghost-buyers" className="gap-2">
            <Flag className="w-4 h-4" />
            Ghost Buyers
            {stats.ghostBuyers > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.ghostBuyers}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-rfqs" className="gap-2">
            <Package className="w-4 h-4" />
            All RFQs
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Quotes
          </TabsTrigger>
        </TabsList>

        {/* Stuck RFQs Tab */}
        <TabsContent value="stuck-rfqs" className="space-y-4">
          {stuckRFQs.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Stuck RFQs"
              description="All RFQs are receiving quotes. Great job!"
            />
          ) : (
            stuckRFQs.map(rfq => (
              <RFQCard
                key={rfq.id}
                rfq={rfq}
                type="stuck"
                onManualMatch={() => handleManualMatch(rfq)}
                onClose={() => setActionModal({
                  open: true,
                  type: 'close-rfq',
                  data: rfq
                })}
                onFlag={() => handleFlagItem('rfq', rfq.id, 'Stuck RFQ - no quotes')}
              />
            ))
          )}
        </TabsContent>

        {/* Ghost Buyers Tab */}
        <TabsContent value="ghost-buyers" className="space-y-4">
          {ghostBuyerRFQs.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Ghost Buyers"
              description="All buyers are responding to quotes!"
            />
          ) : (
            ghostBuyerRFQs.map(rfq => (
              <RFQCard
                key={rfq.id}
                rfq={rfq}
                type="ghost"
                onNudge={() => handleNudgeBuyer(rfq)}
                onClose={() => setActionModal({
                  open: true,
                  type: 'close-rfq',
                  data: rfq
                })}
                onFlag={() => handleFlagItem('rfq', rfq.id, 'Ghost buyer - not responding')}
              />
            ))
          )}
        </TabsContent>

        {/* All RFQs Tab */}
        <TabsContent value="all-rfqs" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search RFQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="rfq_open">Open</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRFQs.map(rfq => (
            <RFQCard
              key={rfq.id}
              rfq={rfq}
              type="normal"
              onManualMatch={() => handleManualMatch(rfq)}
              onNudge={() => handleNudgeBuyer(rfq)}
              onView={() => window.open(`/dashboard/rfqs/${rfq.id}`, '_blank')}
            />
          ))}
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          {quotes.map(quote => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onFlag={() => handleFlagItem('quote', quote.id, 'Suspicious quote')}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Action Modals */}
      <ManualMatchModal
        open={actionModal.type === 'manual-match'}
        data={actionModal.data}
        onClose={() => setActionModal({ open: false, type: null, data: null })}
        onNotify={handleNotifySuppliers}
      />

      <CloseRFQModal
        open={actionModal.type === 'close-rfq'}
        rfq={actionModal.data}
        onClose={() => setActionModal({ open: false, type: null, data: null })}
        onConfirm={handleRFQAction}
      />
    </div>
  );
}

// Sub-components

function StatCard({ title, value, icon: Icon, color, alert }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50'
  };

  return (
    <Card className={alert ? 'border-red-300 shadow-red-100' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-os-text-secondary">{title}</p>
            <p className="text-3xl font-bold text-os-text-primary mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full ${colors[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RFQCard({ rfq, type, onManualMatch, onNudge, onClose, onFlag, onView }) {
  const age = formatDistanceToNow(new Date(rfq.created_at), { addSuffix: true });
  const quoteCount = rfq.quotes?.length || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg text-os-text-primary">{rfq.title}</h3>
              {type === 'stuck' && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Stuck
                </Badge>
              )}
              {type === 'ghost' && (
                <Badge variant="warning" className="gap-1">
                  <Flag className="w-3 h-3" />
                  Ghost Buyer
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-os-text-secondary mt-3">
              <div>
                <span className="font-medium">Buyer:</span> {rfq.buyer?.company_name || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Created:</span> {age}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {rfq.quantity} {rfq.quantity_unit}
              </div>
              <div>
                <span className="font-medium">Quotes:</span> {quoteCount}
              </div>
            </div>

            {type === 'stuck' && (
              <p className="text-sm text-red-600 mt-3 font-medium">
                ⚠️ No quotes received yet. Manual matching recommended.
              </p>
            )}
            {type === 'ghost' && (
              <p className="text-sm text-orange-600 mt-3 font-medium">
                ⚠️ Buyer has {quoteCount} quotes but hasn't responded. Nudge recommended.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {onManualMatch && (
              <Button
                size="sm"
                variant="default"
                className="gap-2"
                onClick={onManualMatch}
              >
                <Target className="w-4 h-4" />
                Match Suppliers
              </Button>
            )}
            {onNudge && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={onNudge}
              >
                <Bell className="w-4 h-4" />
                Nudge Buyer
              </Button>
            )}
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-2"
                onClick={onView}
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
            )}
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-red-600"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
                Close
              </Button>
            )}
            {onFlag && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-2"
                onClick={onFlag}
              >
                <Flag className="w-4 h-4" />
                Flag
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuoteCard({ quote, onFlag }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-os-text-primary">{quote.rfq?.title}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm text-os-text-secondary mt-3">
              <div>
                <span className="font-medium">Supplier:</span> {quote.supplier?.company_name}
              </div>
              <div>
                <span className="font-medium">Price:</span> {quote.currency} {quote.total_price}
              </div>
              <div>
                <span className="font-medium">Lead Time:</span> {quote.lead_time_days} days
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onFlag}
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon className="w-16 h-16 text-os-accent/30 mb-4" />
      <h3 className="text-xl font-bold text-os-text-primary mb-2">{title}</h3>
      <p className="text-os-text-secondary">{description}</p>
    </div>
  );
}

function ManualMatchModal({ open, data, onClose, onNotify }) {
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  if (!data) return null;

  const toggleSupplier = (supplierId) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Supplier Matching</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-os-surface/50 rounded-lg">
            <h4 className="font-bold text-os-text-primary mb-2">{data.rfq?.title}</h4>
            <p className="text-sm text-os-text-secondary">
              {data.rfq?.quantity} {data.rfq?.quantity_unit} • {data.rfq?.metadata?.target_country || 'Any country'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">Matched Suppliers ({data.suppliers?.length || 0})</h4>
              <p className="text-sm text-os-text-secondary">
                {selectedSuppliers.length} selected
              </p>
            </div>

            {data.suppliers?.map(supplier => (
              <div
                key={supplier.supplier_id}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedSuppliers.includes(supplier.supplier_id)
                    ? 'border-os-accent bg-os-accent/5'
                    : 'border-os-stroke hover:border-os-accent/50'
                  }
                `}
                onClick={() => toggleSupplier(supplier.supplier_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h5 className="font-bold">{supplier.company_name}</h5>
                      {supplier.verified && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Score: {supplier.match_score}/100
                      </Badge>
                    </div>
                    <p className="text-sm text-os-text-secondary mt-1">
                      {supplier.country} • Trust: {supplier.trust_score}/100
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supplier.match_reasons?.map((reason, idx) => (
                        <span key={idx} className="text-xs bg-os-accent/10 text-os-accent px-2 py-1 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(supplier.supplier_id)}
                    onChange={() => { }}
                    className="w-5 h-5 text-os-accent"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => onNotify(data.rfq.id, selectedSuppliers)}
              disabled={selectedSuppliers.length === 0}
              className="flex-1 bg-os-accent hover:bg-os-accentDark"
            >
              <Send className="w-4 h-4 mr-2" />
              Notify {selectedSuppliers.length} Supplier{selectedSuppliers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloseRFQModal({ open, rfq, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  if (!rfq) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close RFQ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-os-text-secondary">
            Are you sure you want to close this RFQ?
          </p>
          <div className="p-4 bg-os-surface/50 rounded-lg">
            <h4 className="font-bold">{rfq.title}</h4>
            <p className="text-sm text-os-text-secondary mt-1">
              Created by {rfq.buyer?.company_name}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Duplicate RFQ, Buyer unresponsive, etc."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(rfq.id, 'close', reason)}
              variant="destructive"
              className="flex-1"
            >
              Close RFQ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
