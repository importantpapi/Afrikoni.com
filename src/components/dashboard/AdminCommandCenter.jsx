import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingBag, TrendingUp } from 'lucide-react';

export default function AdminCommandCenter({ data }) {
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
        <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Admin Dashboard</h1>
        <p className="text-afrikoni-deep">Manage the platform</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
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

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="p-3 border border-afrikoni-gold/20 rounded-lg">
                  <div className="font-semibold text-afrikoni-chestnut">{user.email}</div>
                  <div className="text-sm text-afrikoni-deep">{user.user_role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.slice(0, 5).map(company => (
                <div key={company.id} className="p-3 border border-afrikoni-gold/20 rounded-lg">
                  <div className="font-semibold text-afrikoni-chestnut">{company.company_name}</div>
                  <div className="text-sm text-afrikoni-deep">{company.country}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="p-3 border border-afrikoni-gold/20 rounded-lg">
                  <div className="font-semibold text-afrikoni-chestnut">Order #{order.id.slice(0, 8)}</div>
                  <div className="text-sm text-afrikoni-deep">${order.total_amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

