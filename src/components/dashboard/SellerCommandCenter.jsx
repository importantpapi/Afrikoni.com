import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Package, ShoppingBag, TrendingUp, Plus, DollarSign, BarChart3 } from 'lucide-react';
import SellerAnalytics from './SellerAnalytics';

export default function SellerCommandCenter({ data, company }) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { products = [], orders = [], quotes = [] } = data;

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const stats = [
    { label: 'Active Products', value: products.filter(p => p.status === 'active').length, icon: Package, color: 'text-blue-600' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending' || o.status === 'processing').length, icon: ShoppingBag, color: 'text-amber-600' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Pending Quotes', value: quotes.filter(q => q.status === 'pending').length, icon: TrendingUp, color: 'text-purple-600' }
  ];

  if (showAnalytics) {
    return <SellerAnalytics data={data} onBack={() => setShowAnalytics(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Seller Dashboard</h1>
          <p className="text-afrikoni-deep">Manage your products and orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAnalytics(true)}>
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </Button>
          <Link to={createPageUrl('AddProduct')}>
            <Button className="bg-afrikoni-gold hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {company && !company.verified && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Get Verified</h3>
                <p className="text-sm text-amber-700">Complete verification to increase trust and get more orders</p>
              </div>
              <Button variant="outline" size="sm">Verify Now</Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-afrikoni-gold/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Products</CardTitle>
            <Link to={createPageUrl('AddProduct')}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-afrikoni-deep/70">
                <Package className="w-12 h-12 mx-auto mb-4 text-afrikoni-deep/50" />
                <p className="mb-1">No products yet</p>
                <p className="text-xs text-afrikoni-deep/70 mb-4">
                  Start by adding your first product. Once it’s approved, it will appear in the marketplace for buyers.
                </p>
                <Link to={createPageUrl('AddProduct')}>
                  <Button variant="outline" className="mt-4">Add Your First Product</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 5).map(product => (
                  <Link
                    key={product.id}
                    to={createPageUrl('ProductDetail') + '?id=' + product.id}
                    className="block p-3 border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-afrikoni-chestnut">{product.title}</h4>
                        <p className="text-sm text-afrikoni-deep">${product.price} / {product.unit}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-afrikoni-cream text-afrikoni-deep'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-afrikoni-deep/70">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-afrikoni-deep/50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <Link
                    key={order.id}
                    to={createPageUrl('OrderDetail') + '?id=' + order.id}
                    className="block p-3 border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-afrikoni-chestnut">Order #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-afrikoni-deep">${order.total_amount}</p>
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

