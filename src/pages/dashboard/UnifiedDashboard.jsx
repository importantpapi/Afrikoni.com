import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, FileText, Package, Users, TrendingUp, Search,
  Plus, Eye, MessageSquare, DollarSign, Wallet, Truck, AlertCircle,
  BarChart3, Shield, CheckCircle
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { mockBuyerStats, mockSellerStats, mockOrders, mockRFQs, mockProducts } from '@/data/mockData';

export default function UnifiedDashboard({ currentRole = 'buyer' }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Combined stats for all roles
  const allStats = {
    buyer: [
      { icon: ShoppingCart, label: 'Orders in Progress', value: '12', color: 'orange' },
      { icon: FileText, label: 'RFQs Waiting', value: '5', color: 'blue' },
      { icon: TrendingUp, label: 'RFQs with Quotes', value: '8', color: 'green' },
      { icon: Package, label: 'Delivered (30d)', value: '24', color: 'purple' },
      { icon: Users, label: 'Saved Suppliers', value: '18', color: 'blue' },
      { icon: Package, label: 'Saved Products', value: '42', color: 'orange' }
    ],
    seller: [
      { icon: DollarSign, label: 'Revenue This Month', value: '$45,230', color: 'green', trend: 'up', trendValue: '12%' },
      { icon: ShoppingCart, label: 'Orders to Fulfill', value: '18', color: 'orange' },
      { icon: Wallet, label: 'Awaiting Payment', value: '$12,500', color: 'blue' },
      { icon: AlertCircle, label: 'Low Stock Items', value: '7', color: 'red' },
      { icon: Eye, label: 'Product Views (7d)', value: '1,234', color: 'purple' },
      { icon: MessageSquare, label: 'Unread Messages', value: '23', color: 'blue' }
    ],
    hybrid: [
      { icon: DollarSign, label: 'Sales This Month', value: '$32,100', color: 'green' },
      { icon: ShoppingCart, label: 'Purchases This Month', value: '$18,500', color: 'blue' },
      { icon: Package, label: 'Orders as Seller', value: '15', color: 'orange' },
      { icon: ShoppingCart, label: 'Orders as Buyer', value: '9', color: 'purple' },
      { icon: FileText, label: 'RFQs Sent', value: '6', color: 'blue' },
      { icon: FileText, label: 'RFQs Received', value: '12', color: 'green' }
    ],
    logistics: [
      { icon: Truck, label: 'Active Shipments', value: '28', color: 'orange' },
      { icon: CheckCircle, label: 'Deliveries This Week', value: '45', color: 'green' },
      { icon: AlertCircle, label: 'Delayed Shipments', value: '3', color: 'red' },
      { icon: Truck, label: 'Pickups Today', value: '12', color: 'blue' },
      { icon: DollarSign, label: 'Revenue This Month', value: '$28,900', color: 'green' },
      { icon: FileText, label: 'Pending RFQs', value: '8', color: 'purple' }
    ]
  };

  const quickActions = {
    buyer: [
      { icon: Search, label: 'Search Products', link: '/products', color: 'blue' },
      { icon: Plus, label: 'Post RFQ', link: '/rfq/create', color: 'orange' },
      { icon: Eye, label: 'View Orders', link: '/dashboard/orders', color: 'green' },
      { icon: Users, label: 'View Suppliers', link: '/suppliers', color: 'purple' },
      { icon: MessageSquare, label: 'Open Messages', link: '/messages', color: 'blue' }
    ],
    seller: [
      { icon: Plus, label: 'Add Product', link: '/products/add', color: 'orange' },
      { icon: ShoppingCart, label: 'Manage Orders', link: '/dashboard/sales', color: 'blue' },
      { icon: Package, label: 'Update Inventory', link: '/dashboard/products', color: 'green' },
      { icon: MessageSquare, label: 'Respond to Buyers', link: '/messages', color: 'purple' },
      { icon: TrendingUp, label: 'Complete Verification', link: '/dashboard/verification', color: 'orange' }
    ],
    hybrid: [
      { icon: Search, label: 'Search Products', link: '/products', color: 'blue' },
      { icon: Plus, label: 'Add Product', link: '/products/add', color: 'orange' },
      { icon: FileText, label: 'Post RFQ', link: '/rfq/create', color: 'green' },
      { icon: ShoppingCart, label: 'View Orders', link: '/dashboard/orders', color: 'purple' },
      { icon: MessageSquare, label: 'Messages', link: '/messages', color: 'blue' }
    ],
    logistics: [
      { icon: Truck, label: 'View Shipments', link: '/dashboard/shipments', color: 'orange' },
      { icon: Plus, label: 'Create Shipping Offer', link: '/dashboard/shipments/new', color: 'blue' },
      { icon: FileText, label: 'View RFQs', link: '/dashboard/rfqs', color: 'green' },
      { icon: BarChart3, label: 'Track Fleet', link: '/dashboard/fleet', color: 'purple' },
      { icon: MessageSquare, label: 'Messages', link: '/messages', color: 'blue' }
    ]
  };

  const stats = allStats[currentRole] || allStats.buyer;
  const actions = quickActions[currentRole] || quickActions.buyer;

  const orderColumns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Product', accessor: 'product' },
    { header: currentRole === 'buyer' ? 'Supplier' : 'Buyer', accessor: currentRole === 'buyer' ? 'supplier' : 'buyer' },
    { header: 'Quantity', accessor: 'quantity' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value} />
    },
    { header: 'Amount', accessor: 'amount', render: (value) => `$${value.toLocaleString()}` }
  ];

  return (
    <div className="space-y-3">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut capitalize">
            {currentRole === 'hybrid' ? 'Hybrid' : currentRole} Dashboard
          </h1>
          <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
            {currentRole === 'buyer' && 'Source products and connect with verified suppliers'}
            {currentRole === 'seller' && 'Manage your products, orders, and grow your business'}
            {currentRole === 'hybrid' && 'Manage both buying and selling activities'}
            {currentRole === 'logistics' && 'Track shipments and manage logistics operations'}
          </p>
        </div>
        <Badge variant="outline" className="capitalize text-sm px-4 py-2">
          {currentRole}
        </Badge>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const colorMap = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            orange: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' },
            green: { bg: 'bg-green-100', text: 'text-green-600' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
            red: { bg: 'bg-red-100', text: 'text-red-600' }
          };
          const colors = colorMap[action.color] || colorMap.orange;
          return (
            <Link key={idx} to={action.link}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <span className="text-sm font-medium text-afrikoni-deep">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={mockOrders.slice(0, 5)}
                  columns={orderColumns}
                  compact
                />
                <div className="mt-4">
                  <Link to="/dashboard/orders">
                    <Button variant="outline" className="w-full">
                      View All Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* RFQ Center */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  RFQ Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRFQs.slice(0, 3).map((rfq, idx) => (
                    <div key={idx} className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{rfq.product}</span>
                        <Badge variant="outline" className="text-xs">
                          {rfq.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-afrikoni-deep">
                        {rfq.responses} responses • {rfq.date}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link to="/dashboard/rfqs">
                    <Button variant="outline" className="w-full">
                      View All RFQs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={mockOrders}
                columns={orderColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rfqs">
          <Card>
            <CardHeader>
              <CardTitle>Request for Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRFQs.map((rfq, idx) => (
                  <div key={idx} className="p-4 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{rfq.product}</span>
                      <Badge variant={rfq.status === 'active' ? 'success' : 'outline'}>
                        {rfq.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-afrikoni-deep mb-2">{rfq.description}</p>
                    <div className="flex items-center gap-4 text-xs text-afrikoni-deep/70">
                      <span>{rfq.responses} responses</span>
                      <span>•</span>
                      <span>{rfq.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-afrikoni-deep/70">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Analytics charts coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockProducts.slice(0, 5).map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-afrikoni-offwhite">
                      <span className="text-sm">{product.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {product.views} views
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

