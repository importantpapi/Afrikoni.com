import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { FileText, ShoppingBag, TrendingUp, Plus } from 'lucide-react';

export default function BuyerCommandCenter({ data }) {
  const { rfqs = [], orders = [] } = data;

  const stats = [
    { label: 'Active RFQs', value: rfqs.filter(r => r.status === 'open').length, icon: FileText, color: 'text-blue-600' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending' || o.status === 'processing').length, icon: ShoppingBag, color: 'text-amber-600' },
    { label: 'Completed Orders', value: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-afrikoni-deep' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Buyer Dashboard</h1>
        <p className="">Manage your RFQs and orders</p>
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent RFQs</CardTitle>
            <Link to={createPageUrl('CreateRFQ')}>
              <Button size="sm" className="hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" /> New RFQ
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {rfqs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>No RFQs yet</p>
                <Link to={createPageUrl('CreateRFQ')}>
                  <Button variant="outline" className="mt-4">Create Your First RFQ</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rfqs.slice(0, 5).map(rfq => (
                  <Link
                    key={rfq.id}
                    to={`/rfq/detail?id=${rfq.id}`}
                    className="block p-3 border rounded-lg hover:border-afrikoni-gold transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{rfq.title}</h4>
                        <p className="text-sm">{rfq.quantity} {rfq.unit}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        rfq.status === 'open' ? 'bg-green-100 text-green-700' :
                        rfq.status === 'awarded' ? 'bg-blue-100 text-blue-700' :
                        'bg-afrikoni-cream text-afrikoni-deep'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <Link
                    key={order.id}
                    to={createPageUrl('OrderDetail') + '?id=' + order.id}
                    className="block p-3 border rounded-lg hover:border-afrikoni-gold transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Order #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm">${order.total_amount}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
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
    </div>
  );
}

