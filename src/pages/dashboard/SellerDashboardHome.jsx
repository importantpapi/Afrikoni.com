import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Wallet, Package, Eye, MessageSquare,
  Plus, TrendingUp, AlertCircle
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SimpleChart } from '@/components/ui/simple-chart';
import EmptyState from '@/components/ui/EmptyState';
import { mockSellerStats } from '@/data/mockData';

// Mock revenue data for chart
const revenueData = [12000, 13500, 11800, 14200, 13800, 15200, 16500, 14800, 16200, 17500, 16800, 18000];
const revenueLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SellerDashboardHome() {
  const quickActions = [
    { icon: Plus, label: 'Add Product', link: '/products/add', color: 'orange' },
    { icon: ShoppingCart, label: 'Manage Orders', link: '/dashboard/sales', color: 'blue' },
    { icon: Package, label: 'Update Inventory', link: '/dashboard/products', color: 'green' },
    { icon: MessageSquare, label: 'Respond to Buyers', link: '/messages', color: 'purple' },
    { icon: TrendingUp, label: 'Complete Verification', link: '/dashboard/verification', color: 'orange' }
  ];

  const verificationSteps = [
    { label: 'Email', completed: true },
    { label: 'Phone', completed: true },
    { label: 'Business Registration', completed: true },
    { label: 'ID / KYC', completed: false },
    { label: 'Bank Account', completed: false }
  ];

  const completedCount = verificationSteps.filter(s => s.completed).length;
  const progressPercentage = (completedCount / verificationSteps.length) * 100;

  const hasData = mockSellerStats.revenueThisMonth > 0 || mockSellerStats.ordersToFulfill > 0;

  return (
    <div className="space-y-3">
      {/* Stats Row */}
      {hasData ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.05 }}
          >
            <StatCard
              icon={DollarSign}
              label="Revenue This Month"
              value={`$${mockSellerStats.revenueThisMonth.toLocaleString()}`}
              color="green"
              trend="up"
              trendValue="12%"
              tooltip="Total revenue generated from sales this month"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
          >
            <StatCard
              icon={ShoppingCart}
              label="Orders to Fulfill"
              value={mockSellerStats.ordersToFulfill.toString()}
              color="orange"
              tooltip="Orders that need to be processed and shipped"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.15 }}
          >
            <StatCard
              icon={Wallet}
              label="Awaiting Payment"
              value={`$${mockSellerStats.awaitingPayment.toLocaleString()}`}
              color="blue"
              tooltip="Total amount pending payment from buyers"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.2 }}
          >
            <StatCard
              icon={AlertCircle}
              label="Low Stock Items"
              value={mockSellerStats.lowStockItems.toString()}
              color="orange"
              tooltip="Products with low inventory that need restocking"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.25 }}
          >
            <StatCard
              icon={Eye}
              label="Product Views (7d)"
              value={mockSellerStats.productViews7d.toString()}
              color="purple"
              tooltip="Total product page views in the last 7 days"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.3 }}
          >
            <StatCard
              icon={MessageSquare}
              label="Unread Messages"
              value={mockSellerStats.unreadMessages.toString()}
              color="blue"
              tooltip="Messages from buyers awaiting your response"
            />
          </motion.div>
        </motion.div>
      ) : (
        <EmptyState
          type="products"
          title="No activity yet"
          description="Add products and start selling to see your seller dashboard stats."
          cta="Add Product"
          ctaLink="/products/add"
        />
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, delay: 0.15 + idx * 0.05 }}
            >
              <Link to={action.link}>
                <Card hover className="text-center">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`w-6 h-6 text-${action.color}-600`} />
                    </div>
                    <div className="text-sm font-semibold text-afrikoni-chestnut">{action.label}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      {hasData && (
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Charts Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="lg:col-span-2 space-y-3"
          >
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart 
                  data={revenueData} 
                  labels={revenueLabels}
                  height={200}
                  color="green"
                />
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i, idx) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: 0.2 + idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-afrikoni-offwhite transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-afrikoni-cream rounded-lg"></div>
                        <div>
                          <div className="font-semibold text-sm">Product {i}</div>
                          <div className="text-xs text-afrikoni-deep/70">24 orders • $12,500</div>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="space-y-3"
          >
            {/* Verification Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Verification & Trust</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Profile Completeness</span>
                    <span className="text-sm font-bold text-afrikoni-gold">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                <div className="space-y-2">
                  {verificationSteps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: 0.2 + idx * 0.03 }}
                      className="flex items-center gap-2"
                    >
                      {step.completed ? (
                        <Badge variant="success" className="w-5 h-5 p-0 flex items-center justify-center">✓</Badge>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-afrikoni-gold/30"></div>
                      )}
                      <span className={`text-sm ${step.completed ? 'text-afrikoni-chestnut' : 'text-afrikoni-deep/70'}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <Button variant="primary" className="w-full" size="sm">
                  Complete Verification
                </Button>
              </CardContent>
            </Card>

            {/* AI Seller Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Seller Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: 0.25 }}
                    className="p-3 bg-blue-50 rounded-lg"
                  >
                    <p className="text-sm text-blue-900 font-semibold mb-1">Pricing Tip</p>
                    <p className="text-xs text-blue-700">
                      Your cocoa beans are priced 15% below market average. Consider increasing by 10% for better margins.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: 0.3 }}
                    className="p-3 bg-green-50 rounded-lg"
                  >
                    <p className="text-sm text-green-900 font-semibold mb-1">Product Suggestion</p>
                    <p className="text-xs text-green-700">
                      Buyers searching for "cocoa beans" also view "cocoa powder". Consider adding this product.
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
