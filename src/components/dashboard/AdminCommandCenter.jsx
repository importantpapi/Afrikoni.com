import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Users, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

export default function AdminCommandCenter({ data }) {
  // ✅ FINAL SYNC: Use Kernel to derive role labels instead of user.user_role
  const { isAdmin, capabilities, isHybrid } = useDashboardKernel();
  const { companies = [], orders = [], users = [] } = data;

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600' },
    { label: 'Total Companies', value: companies.length, icon: Package, color: 'text-amber-600' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-green-600' },
    { label: 'Revenue', value: `$${orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="">Manage the platform</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.slice(0, 5).map(user => {
                // ✅ FINAL SYNC: Derive role label from capabilities (fallback to email-based check if user object has is_admin)
                const userIsAdmin = user.is_admin || user.user_metadata?.is_admin || false;
                const roleLabel = userIsAdmin ? 'Admin' : 'User';
                return (
                  <div key={user.id} className="p-3 border rounded-lg">
                    <div className="font-semibold">{user.email}</div>
                    <div className="text-sm">{roleLabel}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.slice(0, 5).map(company => (
                <div key={company.id} className="p-3 border rounded-lg">
                  <div className="font-semibold">{company.company_name}</div>
                  <div className="text-sm">{company.country}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="p-3 border rounded-lg">
                  <div className="font-semibold">Order #{order.id.slice(0, 8)}</div>
                  <div className="text-sm">${order.total_amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

