import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, Package, ShoppingBag } from 'lucide-react';

export default function SellerAnalytics({ data, onBack }) {
  const { products = [], orders = [] } = data;

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
  const avgProductPrice = products.length > 0
    ? products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / products.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut">Analytics</h1>
          <p className="text-afrikoni-deep">Track your business performance</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-afrikoni-deep mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-afrikoni-chestnut">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-afrikoni-deep mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-afrikoni-chestnut">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-afrikoni-deep mb-1">Product Views</p>
                <p className="text-2xl font-bold text-afrikoni-chestnut">{totalViews}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-afrikoni-deep mb-1">Avg Product Price</p>
                <p className="text-2xl font-bold text-afrikoni-chestnut">${avgProductPrice.toFixed(2)}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-afrikoni-gold/20">
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['pending', 'processing', 'shipped', 'delivered', 'completed'].map(status => {
              const count = orders.filter(o => o.status === status).length;
              const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{status}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-afrikoni-cream rounded-full h-2">
                    <div
                      className="bg-afrikoni-gold h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

