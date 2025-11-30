import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Clock, CheckCircle } from 'lucide-react';

export default function LogisticsCommandCenter({ data }) {
  const { orders = [] } = data;

  const stats = [
    { label: 'Pending Shipments', value: orders.filter(o => o.status === 'processing').length, icon: Clock, color: 'text-amber-600' },
    { label: 'In Transit', value: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'text-blue-600' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-afrikoni-deep' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Logistics Dashboard</h1>
        <p className="text-afrikoni-deep">Manage shipments and deliveries</p>
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

      <Card className="border-afrikoni-gold/20">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-afrikoni-deep/70">
              <Truck className="w-12 h-12 mx-auto mb-4 text-afrikoni-deep/50" />
              <p>No orders assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map(order => (
                <Link
                  key={order.id}
                  to={createPageUrl('OrderDetail') + '?id=' + order.id}
                  className="block p-3 border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-afrikoni-chestnut">Order #{order.id.slice(0, 8)}</h4>
                      <p className="text-sm text-afrikoni-deep">{order.shipping_address}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      'bg-afrikoni-cream text-afrikoni-deep'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

