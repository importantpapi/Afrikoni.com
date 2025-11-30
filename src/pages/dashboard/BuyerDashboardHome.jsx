import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, FileText, Package, Users, TrendingUp, Search,
  Plus, Eye, MessageSquare
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { Avatar } from '@/components/ui/avatar';
import EmptyState from '@/components/ui/EmptyState';
import { mockBuyerStats, mockOrders, mockRFQs, mockProducts, mockSuppliers } from '@/data/mockData';

export default function BuyerDashboardHome() {
  const quickActions = [
    { icon: Search, label: 'Search Products', link: '/products', color: 'blue' },
    { icon: Plus, label: 'Post RFQ', link: '/rfq/create', color: 'orange' },
    { icon: Eye, label: 'View Orders', link: '/dashboard/orders', color: 'green' },
    { icon: Users, label: 'View Suppliers', link: '/suppliers', color: 'purple' },
    { icon: MessageSquare, label: 'Open Messages', link: '/messages', color: 'blue' }
  ];

  const orderColumns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Product', accessor: 'product' },
    { header: 'Supplier', accessor: 'supplier' },
    { header: 'Quantity', accessor: 'quantity' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value} />
    },
    { header: 'Amount', accessor: 'amount', render: (value) => `$${value.toLocaleString()}` }
  ];

  const hasData = mockBuyerStats.ordersInProgress > 0 || mockBuyerStats.rfqsWaitingReply > 0;

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
              icon={ShoppingCart}
              label="Orders in Progress"
              value={mockBuyerStats.ordersInProgress.toString()}
              color="orange"
              tooltip="Orders currently being processed or shipped"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.1 }}
          >
            <StatCard
              icon={FileText}
              label="RFQs Waiting Reply"
              value={mockBuyerStats.rfqsWaitingReply.toString()}
              color="blue"
              tooltip="Request for Quotations awaiting supplier responses"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.15 }}
          >
            <StatCard
              icon={TrendingUp}
              label="RFQs with Quotes"
              value={mockBuyerStats.rfqsWithQuotes.toString()}
              color="green"
              tooltip="RFQs that have received quotes from suppliers"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.2 }}
          >
            <StatCard
              icon={Package}
              label="Delivered (30d)"
              value={mockBuyerStats.deliveredOrders30d.toString()}
              color="purple"
              tooltip="Orders delivered in the last 30 days"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.25 }}
          >
            <StatCard
              icon={Users}
              label="Saved Suppliers"
              value={mockBuyerStats.savedSuppliers.toString()}
              color="blue"
              tooltip="Number of suppliers you've saved"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: 0.3 }}
          >
            <StatCard
              icon={Package}
              label="Saved Products"
              value={mockBuyerStats.savedProducts.toString()}
              color="orange"
              tooltip="Number of products you've saved"
            />
          </motion.div>
        </motion.div>
      ) : (
        <EmptyState
          type="orders"
          title="No activity yet"
          description="Start browsing products or create an RFQ to see your buyer dashboard stats."
          cta="Browse Products"
          ctaLink="/marketplace"
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
          {/* Order Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Link to="/dashboard/orders">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {mockOrders.length > 0 ? (
                  <DataTable
                    columns={orderColumns}
                    data={mockOrders}
                    onRowClick={(row) => {
                      // Navigate to order detail page
                    }}
                  />
                ) : (
                  <EmptyState
                    type="orders"
                    title="No orders yet"
                    description="Your orders will appear here once you make a purchase."
                    cta="Browse Suppliers"
                    ctaLink="/suppliers"
                  />
                )}
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
            {/* Buyer Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buyer Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-afrikoni-deep">Escrow Protection</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-afrikoni-deep">Refund Available</span>
                  <Badge variant="info">$12,500</Badge>
                </div>
                <Button variant="secondary" className="w-full" size="sm">
                  View Protection Details
                </Button>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-afrikoni-deep mb-4">
                  Suppliers you may like based on your recent searches
                </p>
                {mockSuppliers.length > 0 ? (
                  <div className="space-y-2">
                    {mockSuppliers.slice(0, 2).map((supplier, idx) => (
                      <motion.div
                        key={supplier.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: 0.2 + idx * 0.05 }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-afrikoni-offwhite transition-colors"
                      >
                        <Avatar name={supplier.name} size="md" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{supplier.name}</div>
                          <div className="text-xs text-afrikoni-deep/70">{supplier.country}</div>
                        </div>
                        {supplier.verified && <Badge variant="verified" className="text-xs">✓</Badge>}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-afrikoni-deep/70 text-center py-4">No suggestions yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* RFQ Center Preview */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>RFQ Center</CardTitle>
                <Link to="/dashboard/rfqs">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {mockRFQs.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {mockRFQs.map((rfq, idx) => (
                    <motion.div
                      key={rfq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: 0.25 + idx * 0.05 }}
                    >
                      <Card hover className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-afrikoni-chestnut">{rfq.title}</h4>
                          <StatusChip status={rfq.status} />
                        </div>
                        <p className="text-sm text-afrikoni-deep mb-3">{rfq.category} • {rfq.quantity}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="info">{rfq.responses} responses</Badge>
                          <span className="text-xs text-afrikoni-deep/70">Deadline: {rfq.deadline}</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="rfqs"
                  title="No RFQs yet"
                  description="Create a Request for Quotation to get competitive pricing."
                  cta="Create RFQ"
                  ctaLink="/rfq/create"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
