import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { SHIPMENT_STATUS, getStatusLabel, getNextStatuses } from '@/constants/status';
import { buildShipmentTimeline } from '@/utils/timeline';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Truck, MapPin, Calendar, Package, User, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import EmptyState from '@/components/shared/ui/EmptyState';
import { TimelineItem } from '@/components/shared/ui/reusable/TimelineItem';
import { StatusBadge } from '@/components/shared/ui/reusable/StatusBadge';
import RealTimeTracking from '@/components/logistics/RealTimeTracking';
import CustomsClearance from '@/components/logistics/CustomsClearance';

export default function ShipmentDetail() {
  // ✅ KERNEL MANIFESTO: Rule 1 - Use Kernel exclusively
  const { profileCompanyId, userId, capabilities, isSystemReady, canLoadData } = useDashboardKernel();
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const abortControllerRef = useRef(null); // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
  // Derive role from capabilities for display purposes
  const isLogisticsApproved = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
  const currentRole = isLogisticsApproved ? 'logistics' : 'buyer';

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading shipment details..." ready={isSystemReady} />
      </div>
    );
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData
    // ✅ KERNEL MANIFESTO: Rule 3 - Logic Gate - First line must check canLoadData
    if (!canLoadData) {
      return;
    }

    // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // ✅ KERNEL MANIFESTO: Rule 4 - Timeout with query cancellation
    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        console.warn('[ShipmentDetail] Loading timeout (15s) - aborting queries');
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    // Now safe to load data
    loadShipmentData(abortSignal).catch(err => {
      if (err.name !== 'AbortError') {
        console.error('[ShipmentDetail] Load error:', err);
      }
    });

    return () => {
      // ✅ KERNEL MANIFESTO: Rule 4 - Cleanup AbortController on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeoutId);
    };
  }, [id, canLoadData, userId, profileCompanyId, navigate, capabilities]);

  const loadShipmentData = async (abortSignal) => {
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData (checked in useEffect)
    
    try {
      setIsLoading(true);
      setError(null); // ✅ KERNEL MANIFESTO: Rule 4 - Clear previous errors

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal before queries
      if (abortSignal?.aborted) return;
      
      // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId for data scoping (RLS will enforce)
      // Load shipment with order and related data
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select(`
          *,
          orders(
            *,
            products(*),
            buyer_company:buyer_company_id(company_name, country, city),
            seller_company:seller_company_id(company_name, country, city)
          ),
          customs_clearance(*)
        `)
        .eq('id', id)
        .single();

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal after queries
      if (abortSignal?.aborted) return;

      if (shipmentError) throw shipmentError;
      if (!shipmentData) {
        toast.error('Shipment not found');
        navigate('/dashboard/shipments');
        return;
      }

      setShipment(shipmentData);
      setOrder(shipmentData.orders);
      setNewStatus(shipmentData.status);
    } catch (error) {
      // ✅ KERNEL MANIFESTO: Rule 4 - Handle abort errors properly
      if (error.name === 'AbortError' || abortSignal?.aborted) return;
      console.error('Error loading shipment:', error);
      setError(error?.message || 'Failed to load shipment details'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
      toast.error('Failed to load shipment details');
      navigate('/dashboard/shipments');
    } finally {
      // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - always clean up
      if (!abortSignal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleStatusUpdate = async () => {
    if (!shipment || !newStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // If delivered, set actual_delivery
      if (newStatus === SHIPMENT_STATUS.DELIVERED && !shipment.actual_delivery) {
        await supabase
          .from('shipments')
          .update({ actual_delivery: new Date().toISOString() })
          .eq('id', id);
      }

      toast.success('Shipment status updated');
      // Trigger reload via useEffect dependency change
      loadShipmentData(abortControllerRef.current?.signal).catch(() => {});
    } catch (error) {
      toast.error('Failed to update shipment status');
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Error state checked BEFORE loading state
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          // useEffect will retry automatically when canLoadData is true
        }}
      />
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <EmptyState 
        type="shipments"
        title="Shipment not found"
        description="The shipment you're looking for doesn't exist"
      />
    );
  }

  const timeline = buildShipmentTimeline(shipment);
  const isLogistics = currentRole === 'logistics';

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard/shipments" className="text-afrikoni-gold hover:text-afrikoni-goldDark text-sm mb-2 inline-block">
              ← Back to Shipments
            </Link>
            <h1 className="text-2xl font-bold text-afrikoni-chestnut">Shipment Details</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
              Tracking: {shipment.tracking_number || 'N/A'}
            </p>
          </div>
          <Badge variant={shipment.status === 'delivered' ? 'success' : 'outline'} className="text-sm px-3 py-1">
            {shipment.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Real-Time Tracking */}
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-afrikoni-gold" />
                  Real-Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeTracking shipmentId={id} />
              </CardContent>
            </Card>

            {/* Customs Clearance (if cross-border) */}
            {shipment.is_cross_border && (
              <CustomsClearance 
                shipmentId={id} 
                orderId={order?.id}
                isLogistics={isLogistics}
              />
            )}

            {/* Legacy Timeline (fallback) */}
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle>Shipment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(timeline) && timeline.length > 0 ? (
                    timeline.map((item, index) => (
                      <TimelineItem
                        key={item.status || index}
                        title={item.label}
                        timestamp={item.date}
                        status={item.completed ? 'completed' : item.current ? 'current' : 'pending'}
                        isLast={index === timeline.length - 1}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-afrikoni-deep/70">No timeline events available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            {order && (
              <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Order ID</span>
                      <p className="font-medium">{order.id?.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Product</span>
                      <p className="font-medium">{order.products?.name || order.products?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Quantity</span>
                      <p className="font-medium">{order.quantity} {order.unit || 'units'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-afrikoni-deep/70">Total Amount</span>
                      <p className="font-medium">{order.currency || 'USD'} {parseFloat(order.total_amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <Link to={`/dashboard/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      View Full Order
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Update Status (for logistics) */}
            {isLogistics && (
              <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-afrikoni-chestnut mb-2 block">Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getNextStatuses(shipment?.status || '', 'shipment').map(status => (
                          <SelectItem key={status} value={status}>
                            {getStatusLabel(status, 'shipment')}
                          </SelectItem>
                        ))}
                        {shipment?.status === SHIPMENT_STATUS.DELIVERED && (
                          <SelectItem value={SHIPMENT_STATUS.CANCELLED}>
                            {getStatusLabel(SHIPMENT_STATUS.CANCELLED, 'shipment')}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleStatusUpdate} 
                    disabled={isUpdating || newStatus === shipment.status}
                    className="bg-afrikoni-gold hover:bg-afrikoni-goldDark"
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Shipment Info */}
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle>Shipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-afrikoni-deep/70">Tracking Number</span>
                  <p className="font-medium">{shipment.tracking_number || 'N/A'}</p>
                </div>
                {shipment.carrier && (
                  <div>
                    <span className="text-afrikoni-deep/70">Carrier</span>
                    <p className="font-medium">{shipment.carrier}</p>
                  </div>
                )}
                {shipment.estimated_delivery && (
                  <div>
                    <span className="text-afrikoni-deep/70">Estimated Delivery</span>
                    <p className="font-medium">{format(new Date(shipment.estimated_delivery), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {shipment.actual_delivery && (
                  <div>
                    <span className="text-afrikoni-deep/70">Delivered On</span>
                    <p className="font-medium">{format(new Date(shipment.actual_delivery), 'MMM d, yyyy')}</p>
                  </div>
                )}
                <div>
                  <span className="text-afrikoni-deep/70">Created</span>
                  <p className="font-medium">{format(new Date(shipment.created_at), 'MMM d, yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Route */}
            <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
              <CardHeader>
                <CardTitle>Route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Origin</span>
                  </div>
                  <p className="font-medium">{shipment.origin_address || 'N/A'}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-afrikoni-gold mx-auto" />
                <div>
                  <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Destination</span>
                  </div>
                  <p className="font-medium">{shipment.destination_address || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Buyer/Seller Info */}
            {order && (
              <>
                {order.buyer_company && (
                  <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
                    <CardHeader>
                      <CardTitle>Buyer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold text-afrikoni-chestnut">{order.buyer_company.company_name}</h4>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">
                        {order.buyer_company.city && `${order.buyer_company.city}, `}
                        {order.buyer_company.country}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {order.seller_company && (
                  <Card className="border-afrikoni-gold/20 shadow-afrikoni bg-afrikoni-offwhite">
                    <CardHeader>
                      <CardTitle>Seller</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold text-afrikoni-chestnut">{order.seller_company.company_name}</h4>
                      <p className="text-sm text-afrikoni-deep/70 mt-1">
                        {order.seller_company.city && `${order.seller_company.city}, `}
                        {order.seller_company.country}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

