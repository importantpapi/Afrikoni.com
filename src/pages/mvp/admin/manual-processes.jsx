/**
 * MVP Phase 1: Admin Dashboard for Manual Process Management
 * 
 * Admin can:
 * - Review supplier applications
 * - Manage RFQs (forward to suppliers)
 * - Track transactions and brokering fees (5-10%)
 * - Monitor Phase 1 progress
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, MessageCircle, DollarSign, CheckCircle, XCircle, 
  Clock, Mail, Phone, Globe, MapPin, Loader2, Send, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ManualProcessesAdmin() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [supplierApplications, setSupplierApplications] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingSuppliers: 0,
    approvedSuppliers: 0,
    pendingRFQs: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load supplier applications
      const { data: applications } = await supabase
        .from('supplier_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      setSupplierApplications(applications || []);

      // Load RFQs (MVP phase)
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select('*')
        .eq('mvp_phase', true)
        .order('created_at', { ascending: false });
      
      setRfqs(rfqsData || []);

      // Calculate stats
      const pendingSuppliers = (applications || []).filter(a => a.status === 'pending').length;
      const approvedSuppliers = (applications || []).filter(a => a.status === 'approved' || a.status === 'onboarded').length;
      const pendingRFQs = (rfqsData || []).filter(r => r.status === 'pending_manual_review').length;

      setStats({
        totalApplications: (applications || []).length,
        pendingSuppliers,
        approvedSuppliers,
        pendingRFQs,
        totalRevenue: 0, // Will calculate from transactions
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupplierStatus = async (id, status, notes = '') => {
    try {
      const { error } = await supabase
        .from('supplier_applications')
        .update({
          status,
          admin_notes: notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Supplier application ${status}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateRFQStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success(`RFQ status updated to ${status}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update RFQ status');
    }
  };

  const sendRFQToSupplier = async (rfq, supplierEmail, supplierWhatsapp) => {
    // Generate WhatsApp message
    const whatsappMessage = encodeURIComponent(
      `New RFQ from Afrikoni\n\n` +
      `Buyer: ${rfq.buyer_name} (${rfq.buyer_company})\n` +
      `Product: ${rfq.description}\n` +
      `Quantity: ${rfq.quantity || 'TBD'} ${rfq.unit}\n` +
      `Budget: ${rfq.currency} ${rfq.budget_min || 'TBD'} - ${rfq.budget_max || 'TBD'}\n` +
      `Delivery: ${rfq.delivery_location || 'TBD'}\n` +
      `Timeline: ${rfq.delivery_timeline || 'TBD'}\n\n` +
      `Please send your quote to: ${rfq.buyer_email}\n` +
      `RFQ ID: ${rfq.id}`
    );
    const whatsappLink = supplierWhatsapp 
      ? `https://wa.me/${supplierWhatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
      : null;

    // Generate email
    const emailSubject = encodeURIComponent(`New RFQ: ${rfq.title}`);
    const emailBody = encodeURIComponent(
      `New RFQ from Afrikoni\n\n` +
      `Buyer Details:\n` +
      `- Name: ${rfq.buyer_name}\n` +
      `- Company: ${rfq.buyer_company || 'N/A'}\n` +
      `- Email: ${rfq.buyer_email}\n` +
      `- Phone: ${rfq.buyer_phone || 'N/A'}\n\n` +
      `RFQ Details:\n` +
      `- Product: ${rfq.description}\n` +
      `- Quantity: ${rfq.quantity || 'TBD'} ${rfq.unit}\n` +
      `- Budget: ${rfq.currency} ${rfq.budget_min || 'TBD'} - ${rfq.budget_max || 'TBD'}\n` +
      `- Delivery Location: ${rfq.delivery_location || 'TBD'}\n` +
      `- Timeline: ${rfq.delivery_timeline || 'TBD'}\n\n` +
      `Special Requirements: ${rfq.special_requirements || 'None'}\n\n` +
      `Please send your quote directly to: ${rfq.buyer_email}\n` +
      `RFQ ID: ${rfq.id}\n\n` +
      `Thank you!\n` +
      `Afrikoni Team`
    );
    const emailLink = `mailto:${supplierEmail}?subject=${emailSubject}&body=${emailBody}`;

    // Update RFQ status
    await updateRFQStatus(rfq.id, 'sent_to_suppliers');

    return { whatsappLink, emailLink };
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      onboarded: 'bg-green-100 text-green-800',
      pending_manual_review: 'bg-yellow-100 text-yellow-800',
      sent_to_suppliers: 'bg-blue-100 text-blue-800',
      quotes_received: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
          MVP Phase 1 - Manual Process Management
        </h1>
        <p className="text-afrikoni-deep/70">
          Manage supplier applications, RFQs, and track revenue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-afrikoni-chestnut">
              {stats.totalApplications}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Total Applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingSuppliers}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedSuppliers}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Approved Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pendingRFQs}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Pending RFQs</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="suppliers">Supplier Applications</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Tracking</TabsTrigger>
        </TabsList>

        {/* Supplier Applications Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          {supplierApplications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-afrikoni-chestnut">
                      {app.company_name}
                    </h3>
                    <p className="text-sm text-afrikoni-deep/70">
                      {app.business_type} • {app.country}
                    </p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Contact</p>
                    <p className="text-sm">{app.contact_name}</p>
                    <p className="text-sm text-afrikoni-deep/70">{app.email}</p>
                    <p className="text-sm text-afrikoni-deep/70">{app.phone}</p>
                    {app.whatsapp && (
                      <p className="text-sm text-green-600">WhatsApp: {app.whatsapp}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Products</p>
                    <p className="text-sm">{app.products_categories || 'Not specified'}</p>
                    <p className="text-sm text-afrikoni-deep/70 mt-2">
                      Experience: {app.export_experience || 'N/A'}
                    </p>
                  </div>
                </div>

                {app.company_description && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-1">Description</p>
                    <p className="text-sm text-afrikoni-deep/70">{app.company_description}</p>
                  </div>
                )}

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateSupplierStatus(app.id, 'approved', 'Approved for Phase 1')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSupplierStatus(app.id, 'rejected', 'Not selected for Phase 1')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* RFQs Tab */}
        <TabsContent value="rfqs" className="space-y-4">
          {rfqs.map((rfq) => (
            <Card key={rfq.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-afrikoni-chestnut">
                      {rfq.title}
                    </h3>
                    <p className="text-sm text-afrikoni-deep/70">
                      From: {rfq.buyer_name} ({rfq.buyer_company || 'Individual'})
                    </p>
                  </div>
                  {getStatusBadge(rfq.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Buyer Contact</p>
                    <p className="text-sm">{rfq.buyer_email}</p>
                    <p className="text-sm text-afrikoni-deep/70">{rfq.buyer_phone}</p>
                    {rfq.buyer_whatsapp && (
                      <p className="text-sm text-green-600">WhatsApp: {rfq.buyer_whatsapp}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">RFQ Details</p>
                    <p className="text-sm">Quantity: {rfq.quantity || 'TBD'} {rfq.unit}</p>
                    <p className="text-sm">
                      Budget: {rfq.currency} {rfq.budget_min || 'TBD'} - {rfq.budget_max || 'TBD'}
                    </p>
                    <p className="text-sm">Delivery: {rfq.delivery_location || 'TBD'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold mb-1">Product Description</p>
                  <p className="text-sm text-afrikoni-deep/70">{rfq.description}</p>
                </div>

                {rfq.status === 'pending_manual_review' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        // In real implementation, select supplier from approved list
                        const supplierEmail = prompt('Enter supplier email:');
                        const supplierWhatsapp = prompt('Enter supplier WhatsApp (optional):');
                        if (supplierEmail) {
                          const links = await sendRFQToSupplier(rfq, supplierEmail, supplierWhatsapp);
                          if (links.whatsappLink) {
                            window.open(links.whatsappLink, '_blank');
                          }
                          window.open(links.emailLink, '_blank');
                        }
                      }}
                      className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to Supplier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRFQStatus(rfq.id, 'closed')}
                    >
                      Close RFQ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Revenue Tracking Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-4">
                Transaction & Brokering Fee Tracking
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Brokering Fee:</strong> 5-10% of transaction value (negotiable based on order size)
                </p>
              </div>
              <p className="text-sm text-afrikoni-deep/70">
                Revenue tracking will be implemented once transactions are completed.
                For now, manually track completed deals and calculate fees.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

