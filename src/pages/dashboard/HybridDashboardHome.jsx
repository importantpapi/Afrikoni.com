import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, TrendingUp, FileText, Package, Users
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { SimpleChart } from '@/components/ui/simple-chart';
import EmptyState from '@/components/ui/EmptyState';
import { mockHybridStats } from '@/data/mockData';

// Mock data for buyers and suppliers
const mockBuyers = [
  { id: 1, name: 'Textile Traders Ltd', country: 'Nigeria', orders: 5, amount: 12500 },
  { id: 2, name: 'Ghana Import Co', country: 'Ghana', orders: 3, amount: 8500 },
  { id: 3, name: 'Kenya Wholesale', country: 'Kenya', orders: 7, amount: 15200 }
];

const mockSuppliers = [
  { id: 1, name: 'Cocoa Producers Inc', country: 'Ghana', orders: 8, amount: 24800 },
  { id: 2, name: 'Textile Manufacturing', country: 'Nigeria', orders: 6, amount: 18900 },
  { id: 3, name: 'Shea Butter Co', country: 'Burkina Faso', orders: 4, amount: 11200 }
];

// Chart data - last 7 days
const chartData = {
  purchases: [8500, 9200, 7800, 10500, 9800, 11200, 12500],
  sales: [12000, 13500, 11800, 14200, 13800, 15200, 16500],
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};

export default function HybridDashboardHome() {
  const [viewMode, setViewMode] = useState('everything');

  const hasData = mockHybridStats.salesThisMonth > 0 || mockHybridStats.purchasesThisMonth > 0;

  return (
    <div className="space-y-3">
      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Hybrid Dashboard</h1>
          <p className="text-xs md:text-sm text-afrikoni-deep">Manage both buying and selling activities</p>
        </div>
        <div className="flex items-center gap-2 bg-afrikoni-cream rounded-lg p-1">
          {['everything', 'buyer', 'seller'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-afrikoni-offwhite text-afrikoni-gold shadow-sm'
                  : 'text-afrikoni-deep hover:text-afrikoni-chestnut'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

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
              label="Sales This Month"
              value={`$${mockHybridStats.salesThisMonth.toLocaleString()}`}
              color="green"
              tooltip="Total revenue from sales this month"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
          >
            <StatCard
              icon={ShoppingCart}
              label="Purchases This Month"
              value={`$${mockHybridStats.purchasesThisMonth.toLocaleString()}`}
              color="blue"
              tooltip="Total amount spent on purchases this month"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.15 }}
          >
            <StatCard
              icon={TrendingUp}
              label="Orders as Seller"
              value={mockHybridStats.ordersAsSeller.toString()}
              color="green"
              tooltip="Number of orders received as a seller"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.2 }}
          >
            <StatCard
              icon={ShoppingCart}
              label="Orders as Buyer"
              value={mockHybridStats.ordersAsBuyer.toString()}
              color="blue"
              tooltip="Number of orders placed as a buyer"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.25 }}
          >
            <StatCard
              icon={FileText}
              label="RFQs Sent"
              value={mockHybridStats.rfqsSent.toString()}
              color="orange"
              tooltip="Request for Quotations you've sent to suppliers"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.3 }}
          >
            <StatCard
              icon={FileText}
              label="RFQs Received"
              value={mockHybridStats.rfqsReceived.toString()}
              color="purple"
              tooltip="Request for Quotations received from buyers"
            />
          </motion.div>
        </motion.div>
      ) : (
        <EmptyState
          type="analytics"
          title="No activity yet"
          description="Start buying or selling to see your hybrid dashboard stats."
          cta="Browse Marketplace"
          ctaLink="/marketplace"
        />
      )}

      {/* Main Content */}
      {hasData && (
        <div className="grid lg:grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="lg:col-span-2 space-y-3"
          >
            {/* Combined Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Purchases vs Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-afrikoni-deep">Purchases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-afrikoni-deep">Sales</span>
                    </div>
                  </div>
                  <SimpleChart 
                    data={chartData.purchases} 
                    labels={chartData.labels}
                    height={200}
                    color="blue"
                    secondaryData={chartData.sales}
                    secondaryColor="green"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Buyers & Suppliers */}
            <Tabs defaultValue="buyers">
              <TabsList className="w-full">
                <TabsTrigger value="buyers" className="flex-1">Top Buyers</TabsTrigger>
                <TabsTrigger value="suppliers" className="flex-1">Top Suppliers</TabsTrigger>
              </TabsList>
              <TabsContent value="buyers" className="mt-3">
                <Card>
                  <CardContent className="p-4">
                    {mockBuyers.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        {mockBuyers.map((buyer, idx) => (
                          <motion.div
                            key={buyer.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: idx * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-afrikoni-offwhite transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={buyer.name} size="md" />
                              <div>
                                <div className="font-semibold text-sm">{buyer.name}</div>
                                <div className="text-xs text-afrikoni-deep/70">{buyer.country} • {buyer.orders} orders</div>
                              </div>
                            </div>
                            <Badge variant="info">${buyer.amount.toLocaleString()}</Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <EmptyState
                        type="orders"
                        title="No buyers yet"
                        description="Your top buyers will appear here once you start selling."
                        cta="Add Products"
                        ctaLink="/products/add"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="suppliers" className="mt-3">
                <Card>
                  <CardContent className="p-4">
                    {mockSuppliers.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        {mockSuppliers.map((supplier, idx) => (
                          <motion.div
                            key={supplier.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: idx * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-afrikoni-offwhite transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={supplier.name} size="md" />
                              <div>
                                <div className="font-semibold text-sm">{supplier.name}</div>
                                <div className="text-xs text-afrikoni-deep/70">{supplier.country} • {supplier.orders} orders</div>
                              </div>
                            </div>
                            <Badge variant="success">${supplier.amount.toLocaleString()}</Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <EmptyState
                        type="orders"
                        title="No suppliers yet"
                        description="Your top suppliers will appear here once you start buying."
                        cta="Browse Suppliers"
                        ctaLink="/suppliers"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="space-y-3"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hybrid Trade Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-semibold text-green-900 mb-1">Net Profit This Month</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(mockHybridStats.salesThisMonth - mockHybridStats.purchasesThisMonth).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-afrikoni-deep">Total Sales</span>
                    <span className="font-semibold">${mockHybridStats.salesThisMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-afrikoni-deep">Total Purchases</span>
                    <span className="font-semibold">${mockHybridStats.purchasesThisMonth.toLocaleString()}</span>
                  </div>
                </div>
                <Button variant="primary" className="w-full" size="sm">
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
