/**
 * Logistics Dashboard - Comprehensive dashboard for logistics partners and 3PL providers
 * 
 * Features:
 * - Overview with KPIs and metrics
 * - Active shipments management
 * - Route optimization
 * - Partner management
 * - Analytics and reporting
 * - Documentation management
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, MapPin, Calendar, DollarSign, Package, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Globe, Users, FileText,
  BarChart3, Route, Zap, Shield, Search, Filter, Download,
  Plus, Eye, Edit, ArrowRight, Activity
} from 'lucide-react';
import RealTimeTracking from '@/components/logistics/RealTimeTracking';
import { toast } from 'sonner';
import { format, subDays, startOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/ui/EmptyState';

export default function LogisticsDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Overview KPIs
  const [kpis, setKpis] = useState({
    activeShipments: 0,
    inTransit: 0,
    delivered: 0,
    pendingPickup: 0,
    totalRevenue: 0,
    onTimeDelivery: 0,
    avgDeliveryTime: 0,
    activePartners: 0
  });

  // Shipments data
  const [shipments, setShipments] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');

  // Partners data
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [shipmentStatusFilter]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const { user: userData, profile, companyId: cid } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(userData);
      setCompanyId(cid);

      if (cid) {
        // Load company
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', cid)
          .single();
        setCompany(companyData);

        // Load KPIs
        await loadKPIs(cid);

        // Load recent shipments
        await loadRecentShipments(cid);

        // Load partners
        await loadPartners(cid);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadKPIs = async (logisticsCompanyId) => {
    try {
      // Get all shipments for this logistics company
      const { data: allShipments } = await supabase
        .from('shipments')
        .select('*, orders(*)')
        .eq('logistics_partner_id', logisticsCompanyId);

      if (!allShipments) return;

      const total = allShipments.length;
      const active = allShipments.filter(s => 
        ['pending_pickup', 'picked_up', 'in_transit', 'customs', 'out_for_delivery'].includes(s.status)
      ).length;
      const inTransit = allShipments.filter(s => s.status === 'in_transit').length;
      const delivered = allShipments.filter(s => s.status === 'delivered').length;
      const pendingPickup = allShipments.filter(s => s.status === 'pending_pickup').length;

      // Calculate revenue (from orders)
      const totalRevenue = allShipments.reduce((sum, s) => {
        return sum + (parseFloat(s.orders?.total_amount) || 0);
      }, 0);

      // Calculate on-time delivery rate
      const deliveredShipments = allShipments.filter(s => s.status === 'delivered');
      const onTime = deliveredShipments.filter(s => {
        if (!s.estimated_delivery || !s.updated_at) return false;
        const estimated = new Date(s.estimated_delivery);
        const actual = new Date(s.updated_at);
        return actual <= estimated;
      }).length;
      const onTimeRate = deliveredShipments.length > 0 ? (onTime / deliveredShipments.length) * 100 : 0;

      // Calculate average delivery time (days)
      const avgDeliveryTime = deliveredShipments.length > 0
        ? deliveredShipments.reduce((sum, s) => {
            if (!s.created_at || !s.updated_at) return sum;
            const days = (new Date(s.updated_at) - new Date(s.created_at)) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / deliveredShipments.length
        : 0;

      // Count unique partners (buyers + sellers from orders)
      const uniquePartners = new Set();
      allShipments.forEach(s => {
        if (s.orders?.buyer_company_id) uniquePartners.add(s.orders.buyer_company_id);
        if (s.orders?.seller_company_id) uniquePartners.add(s.orders.seller_company_id);
      });

      setKpis({
        activeShipments: active,
        inTransit,
        delivered,
        pendingPickup,
        totalRevenue,
        onTimeDelivery: Math.round(onTimeRate),
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        activePartners: uniquePartners.size
      });
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
  };

  const loadRecentShipments = async (logisticsCompanyId) => {
    try {
      let query = supabase
        .from('shipments')
        .select(`
          *,
          orders(
            id,
            total_amount,
            quantity,
            products(title)
          )
        `)
        .eq('logistics_partner_id', logisticsCompanyId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (shipmentStatusFilter !== 'all') {
        query = query.eq('status', shipmentStatusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecentShipments(data || []);
      setShipments(data || []);
    } catch (error) {
      console.error('Error loading shipments:', error);
      setRecentShipments([]);
    }
  };

  const loadPartners = async (logisticsCompanyId) => {
    try {
      // Get unique companies from orders
      const { data: orders } = await supabase
        .from('orders')
        .select('buyer_company_id, seller_company_id')
        .or(`buyer_company_id.eq.${logisticsCompanyId},seller_company_id.eq.${logisticsCompanyId}`);

      if (!orders) {
        setPartners([]);
        return;
      }

      const companyIds = new Set();
      orders.forEach(o => {
        if (o.buyer_company_id) companyIds.add(o.buyer_company_id);
        if (o.seller_company_id) companyIds.add(o.seller_company_id);
      });

      // Load company details
      const { data: companies } = await supabase
        .from('companies')
        .select('id, company_name, country, city, verified')
        .in('id', Array.from(companyIds));

      setPartners(companies || []);
    } catch (error) {
      console.error('Error loading partners:', error);
      setPartners([]);
    }
  };

  const handleAcceptShipment = async (shipmentId) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: 'picked_up',
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) throw error;
      toast.success('Shipment accepted and marked as picked up');
      loadDashboardData();
    } catch (error) {
      console.error('Error accepting shipment:', error);
      toast.error('Failed to accept shipment');
    }
  };

  const handleUpdateStatus = async (shipmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) throw error;
      toast.success('Shipment status updated');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_pickup: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      picked_up: 'bg-blue-100 text-blue-800 border-blue-300',
      in_transit: 'bg-purple-100 text-purple-800 border-purple-300',
      customs: 'bg-orange-100 text-orange-800 border-orange-300',
      out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending_pickup: 'Pending Pickup',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      customs: 'In Customs',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole="logistics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="logistics">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-2">
              Logistics Dashboard
            </h1>
            <p className="text-afrikoni-deep/70">
              Manage shipments, routes, and partnerships
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/shipments')}
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Shipments
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('quotes')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Request Shipping Quote
            </Button>
            <Button
              className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
              onClick={() => navigate('/dashboard/shipments/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Shipment
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-afrikoni-gold/20 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-afrikoni-chestnut mb-1">
                  {kpis.activeShipments}
                </div>
                <div className="text-sm text-afrikoni-deep/70">Active Shipments</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-afrikoni-gold/20 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {kpis.onTimeDelivery}%
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-afrikoni-chestnut mb-1">
                  {kpis.delivered}
                </div>
                <div className="text-sm text-afrikoni-deep/70">Delivered</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-afrikoni-chestnut mb-1">
                  ${kpis.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-afrikoni-deep/70">Total Revenue</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-afrikoni-gold/20 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-afrikoni-chestnut mb-1">
                  {kpis.activePartners}
                </div>
                <div className="text-sm text-afrikoni-deep/70">Active Partners</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-afrikoni-gold" />
                <div>
                  <div className="text-2xl font-bold text-afrikoni-chestnut">
                    {kpis.avgDeliveryTime} days
                  </div>
                  <div className="text-sm text-afrikoni-deep/70">Avg. Delivery Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-afrikoni-chestnut">
                    {kpis.inTransit}
                  </div>
                  <div className="text-sm text-afrikoni-deep/70">In Transit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-afrikoni-chestnut">
                    {kpis.pendingPickup}
                  </div>
                  <div className="text-sm text-afrikoni-deep/70">Pending Pickup</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="quotes">Shipping Quotes</TabsTrigger>
            <TabsTrigger value="tracking">Real-Time Tracking</TabsTrigger>
            <TabsTrigger value="customs">Customs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Recent Shipments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Latest shipment activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentShipments.length === 0 ? (
                    <EmptyState
                      type="default"
                      title="No shipments yet"
                      description="Shipments will appear here once orders are assigned"
                    />
                  ) : (
                    <div className="space-y-3">
                      {recentShipments.slice(0, 5).map((shipment) => (
                        <div
                          key={shipment.id}
                          className="flex items-center justify-between p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-gold/5 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                #{shipment.tracking_number || shipment.id.slice(0, 8).toUpperCase()}
                              </span>
                              <Badge className={`text-xs ${getStatusColor(shipment.status)}`}>
                                {getStatusLabel(shipment.status)}
                              </Badge>
                            </div>
                            <div className="text-xs text-afrikoni-deep/70">
                              {shipment.orders?.products?.title || 'Product'}
                            </div>
                            <div className="text-xs text-afrikoni-deep/70 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {shipment.origin_address || 'Origin'} → {shipment.destination_address || 'Destination'}
                            </div>
                          </div>
                          <Link to={`/dashboard/shipments/${shipment.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                      <Link to="/dashboard/shipments">
                        <Button variant="outline" className="w-full">
                          View All Shipments <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Partners */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Partners</CardTitle>
                  <CardDescription>Companies you work with</CardDescription>
                </CardHeader>
                <CardContent>
                  {partners.length === 0 ? (
                    <EmptyState
                      type="default"
                      title="No partners yet"
                      description="Partners will appear here once you handle their shipments"
                    />
                  ) : (
                    <div className="space-y-3">
                      {partners.slice(0, 5).map((partner) => (
                        <div
                          key={partner.id}
                          className="flex items-center justify-between p-3 border border-afrikoni-gold/20 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-afrikoni-gold" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{partner.company_name}</div>
                              <div className="text-xs text-afrikoni-deep/70">
                                {partner.city}, {partner.country}
                              </div>
                            </div>
                          </div>
                          {partner.verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                              Verified
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shipment Management</CardTitle>
                    <CardDescription>Manage and track all shipments</CardDescription>
                  </div>
                  <Select value={shipmentStatusFilter} onValueChange={setShipmentStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending_pickup">Pending Pickup</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="customs">In Customs</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {shipments.length === 0 ? (
                  <EmptyState
                    type="default"
                    title="No shipments found"
                    description="Shipments will appear here once orders are assigned to you"
                  />
                ) : (
                  <div className="space-y-4">
                    {shipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        className="border border-afrikoni-gold/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-lg">
                                #{shipment.tracking_number || shipment.id.slice(0, 8).toUpperCase()}
                              </span>
                              <Badge className={getStatusColor(shipment.status)}>
                                {getStatusLabel(shipment.status)}
                              </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-afrikoni-deep/70 mb-1">Product</div>
                                <div className="font-medium">{shipment.orders?.products?.title || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-afrikoni-deep/70 mb-1">Route</div>
                                <div className="font-medium flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {shipment.origin_address || 'Origin'} → {shipment.destination_address || 'Destination'}
                                </div>
                              </div>
                              <div>
                                <div className="text-afrikoni-deep/70 mb-1">Order Value</div>
                                <div className="font-medium">
                                  ${parseFloat(shipment.orders?.total_amount || 0).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-afrikoni-deep/70 mb-1">Created</div>
                                <div className="font-medium">
                                  {format(new Date(shipment.created_at), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-afrikoni-gold/10">
                          {shipment.status === 'pending_pickup' && (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptShipment(shipment.id)}
                              className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                            >
                              Accept & Pick Up
                            </Button>
                          )}
                          {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
                            <Select
                              value={shipment.status}
                              onValueChange={(value) => handleUpdateStatus(shipment.id, value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="picked_up">Picked Up</SelectItem>
                                <SelectItem value="in_transit">In Transit</SelectItem>
                                <SelectItem value="customs">In Customs</SelectItem>
                                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Link to={`/dashboard/shipments/${shipment.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Request Shipping Quote</CardTitle>
                    <CardDescription>Get quotes for shipping services</CardDescription>
                  </div>
                  <Button
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                    onClick={() => {
                      // Open quote request form
                      const form = document.getElementById('shipping-quote-form');
                      if (form) {
                        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Quote Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div id="shipping-quote-form" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="origin">Origin Address</Label>
                      <Input
                        id="origin"
                        placeholder="City, Country"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="destination">Destination Address</Label>
                      <Input
                        id="destination"
                        placeholder="City, Country"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions (L x W x H cm)</Label>
                      <Input
                        id="dimensions"
                        placeholder="e.g., 100 x 50 x 30"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cargo-type">Cargo Type</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select cargo type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Cargo</SelectItem>
                          <SelectItem value="fragile">Fragile</SelectItem>
                          <SelectItem value="perishable">Perishable</SelectItem>
                          <SelectItem value="hazardous">Hazardous</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (7-14 days)</SelectItem>
                          <SelectItem value="express">Express (3-7 days)</SelectItem>
                          <SelectItem value="urgent">Urgent (1-3 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requirements or instructions..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                    onClick={async () => {
                      // Save quote request to database
                      try {
                        const origin = document.getElementById('origin')?.value;
                        const destination = document.getElementById('destination')?.value;
                        const weight = document.getElementById('weight')?.value;
                        const dimensions = document.getElementById('dimensions')?.value;
                        const notes = document.getElementById('notes')?.value;

                        if (!origin || !destination || !weight) {
                          toast.error('Please fill in required fields (Origin, Destination, Weight)');
                          return;
                        }

                        // Save to contact_submissions table
                        const { error } = await supabase
                          .from('contact_submissions')
                          .insert({
                            name: user?.email || 'Logistics Quote Request',
                            email: user?.email || 'quote@request.com',
                            category: 'logistics_quote',
                            subject: `Shipping Quote: ${origin} → ${destination}`,
                            message: `Weight: ${weight}kg\nDimensions: ${dimensions || 'N/A'}\n\n${notes || 'No additional notes'}`,
                            created_at: new Date().toISOString()
                          });

                        if (error) throw error;

                        // Send email notification
                        try {
                          const { sendEmail } = await import('@/services/emailService');
                          await sendEmail({
                            to: 'hello@afrikoni.com',
                            subject: `New Shipping Quote Request: ${origin} → ${destination}`,
                            template: 'default',
                            data: {
                              title: 'New Shipping Quote Request',
                              message: `
                                <p><strong>From:</strong> ${user?.email || 'Guest'}</p>
                                <p><strong>Origin:</strong> ${origin}</p>
                                <p><strong>Destination:</strong> ${destination}</p>
                                <p><strong>Weight:</strong> ${weight}kg</p>
                                <p><strong>Dimensions:</strong> ${dimensions || 'N/A'}</p>
                                <p><strong>Notes:</strong> ${notes || 'None'}</p>
                              `
                            }
                          });
                        } catch (emailError) {
                          console.error('Email error:', emailError);
                        }

                        toast.success('Quote request submitted! Our team will contact you soon.');
                        
                        // Clear form
                        document.getElementById('origin').value = '';
                        document.getElementById('destination').value = '';
                        document.getElementById('weight').value = '';
                        document.getElementById('dimensions').value = '';
                        document.getElementById('notes').value = '';
                      } catch (error) {
                        console.error('Error submitting quote:', error);
                        toast.error('Failed to submit quote request. Please try again.');
                      }
                    }}
                  >
                    Request Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Optimization</CardTitle>
                <CardDescription>Plan and optimize delivery routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Route className="w-16 h-16 text-afrikoni-gold/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Route Optimization Coming Soon</h3>
                  <p className="text-afrikoni-deep/70 text-sm mb-4">
                    Advanced route planning and optimization tools will be available here
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Partner Management</CardTitle>
                <CardDescription>Manage relationships with buyers and sellers</CardDescription>
              </CardHeader>
              <CardContent>
                {partners.length === 0 ? (
                  <EmptyState
                    type="default"
                    title="No partners yet"
                    description="Partners will appear here once you handle their shipments"
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {partners.map((partner) => (
                      <div
                        key={partner.id}
                        className="border border-afrikoni-gold/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-afrikoni-gold" />
                            </div>
                            <div>
                              <div className="font-semibold">{partner.company_name}</div>
                              <div className="text-sm text-afrikoni-deep/70">
                                {partner.city}, {partner.country}
                              </div>
                            </div>
                          </div>
                          {partner.verified && (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-afrikoni-gold/10">
                          <Link to={`/business/${partner.id}`}>
                            <Button variant="outline" size="sm" className="flex-1">
                              View Business Profile
                            </Button>
                          </Link>
                          <Link to="/messages">
                            <Button variant="outline" size="sm" className="flex-1">
                              Message
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-afrikoni-gold/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                  <p className="text-afrikoni-deep/70 text-sm mb-4">
                    Detailed analytics and reporting features will be available here
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="p-4 border border-afrikoni-gold/20 rounded-lg">
                      <div className="text-2xl font-bold text-afrikoni-gold">{kpis.onTimeDelivery}%</div>
                      <div className="text-sm text-afrikoni-deep/70">On-Time Delivery</div>
                    </div>
                    <div className="p-4 border border-afrikoni-gold/20 rounded-lg">
                      <div className="text-2xl font-bold text-afrikoni-gold">{kpis.avgDeliveryTime}</div>
                      <div className="text-sm text-afrikoni-deep/70">Avg. Days</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

