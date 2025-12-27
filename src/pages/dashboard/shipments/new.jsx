/**
 * New Shipment Page
 * Create a new shipment for an order
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, Calendar, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';

export default function NewShipmentPage() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isCreating, setIsCreating] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [companyId, setCompanyId] = useState(null);
  
  // Shipment form fields
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Afrikoni Logistics');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [status, setStatus] = useState('in_transit');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const cid = profile?.company_id || null;
      if (!cid) {
        toast.error('Company ID not found');
        setTimeout(() => navigate('/dashboard/shipments'), 100);
        return;
      }
      setCompanyId(cid);

      // Load orders that don't have shipments yet
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          currency,
          status,
          created_at,
          buyer_company:buyer_company_id(company_name, country, city, address),
          seller_company:seller_company_id(company_name, country, city, address)
        `)
        .in('status', ['confirmed', 'processing', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by role
      const userRole = role || 'buyer';
      if (userRole === 'seller' || userRole === 'hybrid') {
        query = query.eq('seller_company_id', cid);
      } else if (userRole === 'buyer') {
        query = query.eq('buyer_company_id', cid);
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      // Filter out orders that already have shipments
      const { data: existingShipments } = await supabase
        .from('shipments')
        .select('order_id');

      const existingOrderIds = new Set(existingShipments?.map(s => s.order_id) || []);
      const availableOrders = ordersData?.filter(o => !existingOrderIds.has(o.id)) || [];

      setOrders(availableOrders);

      // Pre-fill form if orderId is provided
      if (orderId && availableOrders.find(o => o.id === orderId)) {
        const order = availableOrders.find(o => o.id === orderId);
        setSelectedOrderId(orderId);
        prefillFromOrder(order);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load orders');
      setIsLoading(false);
      // Don't navigate on error to avoid loops - just show error
    }
  }, [navigate, orderId, profile, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prefillFromOrder = (order) => {
    if (!order) return;
    
    const seller = order.seller_company;
    const buyer = order.buyer_company;
    
    if (seller) {
      setOriginAddress(
        seller.address || 
        [seller.city, seller.country].filter(Boolean).join(', ') || 
        ''
      );
    }
    
    if (buyer) {
      setDestinationAddress(
        buyer.address || 
        [buyer.city, buyer.country].filter(Boolean).join(', ') || 
        ''
      );
    }

    // Generate tracking number
    if (order.id) {
      setTrackingNumber(`AFK-${order.id.slice(0, 8).toUpperCase()}`);
    }

    // Set estimated delivery (7 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    setEstimatedDelivery(deliveryDate.toISOString().split('T')[0]);
  };

  const handleOrderSelect = (orderId) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      prefillFromOrder(order);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedOrderId) {
      toast.error('Please select an order');
      return;
    }

    if (!trackingNumber || !carrier || !originAddress || !destinationAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('seller_company_id')
        .eq('id', selectedOrderId)
        .single();

      // Determine if cross-border and extract countries
      const originCountry = originAddress.split(',').pop()?.trim() || '';
      const destCountry = destinationAddress.split(',').pop()?.trim() || '';
      const isCrossBorder = originCountry && destCountry && originCountry !== destCountry;

      const { data, error } = await supabase
        .from('shipments')
        .insert({
          order_id: selectedOrderId,
          logistics_partner_id: orderData?.seller_company_id || companyId,
          tracking_number: trackingNumber,
          status: status,
          origin_address: originAddress,
          destination_address: destinationAddress,
          origin_country: originCountry,
          destination_country: destCountry,
          is_cross_border: isCrossBorder,
          carrier: carrier,
          estimated_delivery: estimatedDelivery || null,
          currency: 'USD',
          current_location: originAddress
        })
        .select('*')
        .single();

      if (error) throw error;

      toast.success('Shipment created successfully!');
      navigate(`/dashboard/shipments/${data.id}`);
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error(`Failed to create shipment: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/shipments')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
              Create New Shipment
            </h1>
            <p className="text-afrikoni-text-dark/70">
              Create a shipment for an order
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-afrikoni-gold" />
              Shipment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Selection */}
            <div>
              <Label htmlFor="orderId">Select Order *</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderSelect}>
                <SelectTrigger id="orderId">
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available orders
                    </SelectItem>
                  ) : (
                    orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number || `Order #${order.id.slice(0, 8)}`} - 
                        ${parseFloat(order.total_amount || 0).toLocaleString()} {order.currency}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {orders.length === 0 && (
                <p className="text-sm text-afrikoni-text-dark/70 mt-1">
                  All orders already have shipments. Create an order first.
                </p>
              )}
            </div>

            {/* Tracking Number */}
            <div>
              <Label htmlFor="trackingNumber">Tracking Number *</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., AFK-12345678"
              />
            </div>

            {/* Carrier */}
            <div>
              <Label htmlFor="carrier">Carrier *</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g., DHL, FedEx, Afrikoni Logistics"
              />
            </div>

            {/* Origin Address */}
            <div>
              <Label htmlFor="originAddress">Origin Address *</Label>
              <Input
                id="originAddress"
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                placeholder="e.g., Lagos, Nigeria"
              />
            </div>

            {/* Destination Address */}
            <div>
              <Label htmlFor="destinationAddress">Destination Address *</Label>
              <Input
                id="destinationAddress"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="e.g., Accra, Ghana"
              />
            </div>

            {/* Estimated Delivery */}
            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/shipments')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateShipment}
                disabled={isCreating || !selectedOrderId || orders.length === 0}
                className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
              >
                {isCreating ? 'Creating...' : 'Create Shipment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

