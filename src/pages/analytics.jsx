import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCompanies: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);

      const [ordersRes, productsRes, companiesRes, categoriesRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('categories').select('*')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const companies = Array.isArray(companiesRes.data) ? companiesRes.data : [];

      const totalRevenue =
        orders
          .filter((o) => o?.payment_status === 'paid')
          .reduce((sum, o) => sum + parseFloat(o?.total_amount || 0), 0) || 0;

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCompanies: companies.length
      });
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-amber-600' },
    { label: 'Total Companies', value: stats.totalCompanies, icon: TrendingUp, color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Analytics</h1>
          <p className="text-lg text-afrikoni-deep">Track your business performance</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {Array.isArray(statCards) && statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="border-afrikoni-gold/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-afrikoni-deep">More detailed analytics coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

