import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { ShoppingBag, Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function OrdersInner() {
  // ✅ FINAL SYNC: Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[Orders] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect (optional - can be public page)
    // For now, allow loading but show empty state if no user

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Use auth from context (no duplicate call)

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const enrichedUser = { ...user, company_id: profile?.company_id };
      const companyId = profile?.company_id || (user ? await getOrCreateCompany(supabase, enrichedUser) : null);

      const [ordersRes, companiesRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('companies').select('*')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (companiesRes.error) throw companiesRes.error;

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const myOrders = companyId ? orders.filter(
        o => o?.buyer_company_id === companyId || o?.seller_company_id === companyId
      ) : [];

      setOrders(myOrders);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      // Only show error if it's a real error, not just empty results
      console.error('Error loading orders:', error);
      // Don't show error toast for empty results - just set empty array
      setOrders([]);
      setCompanies([]);
      // Only show error if it's a network/database error, not just no orders
      if (error?.message && !error.message.includes('No rows')) {
        toast.error('Failed to load orders. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-afrikoni-cream text-afrikoni-deep';
  };

  if (isLoading || !authReady || authLoading) {
    return (
      <SpinnerWithTimeout message="Loading orders..." />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-afrikoni-chestnut mb-2">My Orders</h1>
          <p className="text-os-lg text-afrikoni-deep">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-os-accent/20">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-afrikoni-deep/70 mx-auto mb-4" />
              <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-2">No orders yet</h3>
              <p className="text-afrikoni-deep">Your orders will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Array.isArray(orders) && orders.map(order => {
              const otherCompany = companies.find(
                c => c.id === (user.company_id === order.buyer_company_id ? order.seller_company_id : order.buyer_company_id)
              );
              const isBuyer = user.company_id === order.buyer_company_id;

              return (
                <Link key={order.id} to={createPageUrl('OrderDetail') + '?id=' + order.id}>
                  <Card className="border-os-accent/20 hover:border-os-accent transition">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-bold text-afrikoni-chestnut">Order #{order.id.slice(0, 8)}</h3>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            <Badge variant="outline" className={order.payment_status === 'paid' ? 'bg-green-50 text-green-700' : ''}>
                              {order.payment_status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-os-sm text-afrikoni-deep">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              <span>{order.quantity} units</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span>${order.total_amount}</span>
                            </div>
                            {otherCompany && (
                              <div>
                                {isBuyer ? 'Seller: ' : 'Buyer: '}
                                <span className="font-semibold text-afrikoni-chestnut">{otherCompany.company_name}</span>
                              </div>
                            )}
                            <div>
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ FINAL SYNC: Wrap with ProtectedRoute since this is a private page
export default function Orders() {
  return (
    <ProtectedRoute requireCompanyId>
      <OrdersInner />
    </ProtectedRoute>
  );
}

