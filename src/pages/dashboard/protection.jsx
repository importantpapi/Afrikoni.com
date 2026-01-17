import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Lock, FileText, DollarSign, Eye, Truck, Package, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DataTable, StatusChip } from '@/components/shared/ui/data-table';
import EmptyState from '@/components/shared/ui/EmptyState';
import RequireCapability from '@/guards/RequireCapability';

function DashboardProtectionInner() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [currentRole, setCurrentRole] = useState(role || 'buyer');
  const [protectionData, setProtectionData] = useState(null);
  const [protectedOrders, setProtectedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardProtection] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login');
      return;
    }

    // Use role from context
    const normalizedRole = role || 'buyer';
    setCurrentRole(normalizedRole === 'logistics_partner' ? 'logistics' : normalizedRole);

    // Now safe to load data
    loadProtection();
  }, [authReady, authLoading, user, profile, role, navigate]);

  const loadProtection = async () => {
    try {

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);

      // Load protection data for buyers and sellers
      if (companyId) {
        const [ordersRes, disputesRes, walletRes] = await Promise.all([
          // Load orders where user is buyer or seller
          supabase.from('orders')
            .select('*, products(title), buyer_company:buyer_company_id(company_name), seller_company:seller_company_id(company_name)')
            .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`),
          supabase.from('disputes')
            .select('*')
            .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId},raised_by_company_id.eq.${companyId},against_company_id.eq.${companyId}`),
          supabase.from('wallet_transactions')
            .select('*')
            .eq('company_id', companyId)
            .in('type', ['escrow_hold', 'escrow_release'])
        ]);

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const walletTransactions = Array.isArray(walletRes.data) ? walletRes.data : [];

        // Find protected orders
        const protectedOrdersList = (orders || []).filter(o => {
          // Check if order has escrow protection
          const hasEscrowHold = walletTransactions.some(tx => 
            tx.order_id === o.id && tx.type === 'escrow_hold' && tx.status === 'completed'
          );
          
          if (!hasEscrowHold) return false;
          
          // Check if it's been released
          const hasRelease = walletTransactions.some(tx => 
            tx.order_id === o.id && tx.type === 'escrow_release' && tx.status === 'completed'
          );
          
          // Protected if has hold and not released, or if payment_status indicates protection
          return !hasRelease && o.status !== 'cancelled';
        }).map(order => {
          // Determine protection status
          const escrowHold = walletTransactions.find(tx => 
            tx.order_id === order.id && tx.type === 'escrow_hold' && tx.status === 'completed'
          );
          const escrowRelease = walletTransactions.find(tx => 
            tx.order_id === order.id && tx.type === 'escrow_release' && tx.status === 'completed'
          );
          
          let protectionStatus = 'protected';
          if (escrowRelease) {
            protectionStatus = 'released';
          } else if (order.dispute_status === 'open' || order.dispute_status === 'under_review') {
            protectionStatus = 'under_review';
          } else if (order.payment_status === 'under_review') {
            protectionStatus = 'under_review';
          }

          return {
            ...order,
            protectionStatus,
            escrowAmount: escrowHold ? parseFloat(escrowHold.amount || 0) : parseFloat(order.total_amount || 0),
            lastUpdated: escrowRelease?.updated_at || escrowHold?.updated_at || order.updated_at
          };
        });

        // Calculate summary
        const totalValueInProtection = protectedOrdersList
          .filter(o => o.protectionStatus === 'protected')
          .reduce((sum, o) => sum + o.escrowAmount, 0);

        const releasedThisMonth = protectedOrdersList
          .filter(o => {
            if (o.protectionStatus !== 'released') return false;
            const releaseDate = new Date(o.lastUpdated);
            const now = new Date();
            return releaseDate.getMonth() === now.getMonth() && releaseDate.getFullYear() === now.getFullYear();
          }).length;

        setProtectedOrders(protectedOrdersList);
        setProtectionData({
          ordersUnderProtection: protectedOrdersList.filter(o => o.protectionStatus === 'protected').length,
          totalValueInProtection,
          releasedThisMonth,
          disputes: disputesRes.data?.filter(d => d.status !== 'resolved').length || 0,
          totalDisputes: disputesRes.data?.length || 0
        });
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load protection data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">Trade Shield / Protection</h1>
          <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">Your orders are protected by Afrikoni's secure escrow system</p>
        </motion.div>

        {/* v2.5: Premium Protection Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="border-afrikoni-gold/30 bg-afrikoni-gold/10 hover:bg-afrikoni-gold/15 transition-all rounded-afrikoni-lg">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-afrikoni-text-dark">Escrow Protection</h3>
                </div>
                <p className="text-sm text-afrikoni-text-dark/80">
                  Your payment is held securely until order is delivered and confirmed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-afrikoni-gold/30 bg-afrikoni-gold/10 hover:bg-afrikoni-gold/15 transition-all rounded-afrikoni-lg">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-afrikoni-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-afrikoni-text-dark">Quality Guarantee</h3>
                </div>
                <p className="text-sm text-afrikoni-text-dark/80">
                  Money-back guarantee if product doesn't match description
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-afrikoni-gold/30 bg-afrikoni-gold/10 hover:bg-afrikoni-gold/15 transition-all rounded-afrikoni-lg">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-afrikoni-text-dark">Dispute Resolution</h3>
                </div>
                <p className="text-sm text-afrikoni-text-dark/80">
                  Fair and fast dispute resolution process
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Stats */}
        {protectionData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* v2.5: Premium Protection KPI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">{protectionData.ordersUnderProtection}</div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Orders Under Protection</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">${protectionData.totalValueInProtection.toLocaleString()}</div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Total Value in Protection</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">{protectionData.releasedThisMonth}</div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Released This Month</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-afrikoni-red" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">{protectionData.disputes}</div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Active Disputes</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Loading...</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">0</p>
                    </div>
                    <Shield className="w-8 h-8 text-afrikoni-deep/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Timeline Visualization */}
        {protectedOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-afrikoni-chestnut flex items-center gap-2">
                  <Truck className="w-5 h-5 text-afrikoni-gold" />
                  Order Timeline
                </CardTitle>
                <p className="text-sm text-afrikoni-deep/70 mt-2">
                  Track your order progress from quote to delivery
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 relative">
                  {[
                    { step: 'Quote', icon: FileText, status: 'completed', description: 'Quote submitted and accepted' },
                    { step: 'Paid in Escrow', icon: CreditCard, status: 'completed', description: 'Payment secured in escrow' },
                    { step: 'In Transit', icon: Truck, status: 'active', description: 'Order shipped and in transit' },
                    { step: 'Delivered', icon: Package, status: 'pending', description: 'Awaiting delivery confirmation' },
                    { step: 'Released', icon: CheckCircle, status: 'pending', description: 'Funds released after confirmation' }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-4 relative">
                        {idx < 4 && (
                          <div className={`absolute left-5 top-10 w-0.5 h-12 ${
                            item.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          item.status === 'completed' ? 'bg-green-500 text-white' :
                          item.status === 'active' ? 'bg-afrikoni-gold text-white animate-pulse' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 pt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-semibold ${
                              item.status === 'completed' ? 'text-green-700' :
                              item.status === 'active' ? 'text-afrikoni-gold' :
                              'text-gray-500'
                            }`}>
                              {item.step}
                            </p>
                            {item.status === 'active' && (
                              <Badge className="bg-afrikoni-gold text-white text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-xs text-afrikoni-deep/70">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-lg">
                  <p className="text-sm text-afrikoni-chestnut font-semibold mb-1">
                    🛡️ Buyers trust you when Trade Shield is active
                  </p>
                  <p className="text-xs text-afrikoni-deep/70">
                    Activate verification to accept Protected Orders and increase buyer confidence.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* v2.5: Premium Protected Orders Table */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">Protected Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {protectedOrders.length === 0 ? (
              <EmptyState 
                type="orders"
                title="No protected orders yet"
                description="Orders with escrow protection will appear here. Your funds are held securely until order completion."
                cta="View Orders"
                ctaLink="/dashboard/orders"
              />
            ) : (
              <DataTable
                data={protectedOrders}
                columns={[
                  {
                    header: 'Order ID',
                    accessor: 'id',
                    render: (value) => `#${value?.slice(0, 8).toUpperCase()}`
                  },
                  {
                    header: 'Product',
                    accessor: 'products.title',
                    render: (value) => value || 'N/A'
                  },
                  {
                    header: currentRole === 'buyer' ? 'Seller' : 'Buyer',
                    accessor: currentRole === 'buyer' ? 'seller_company.company_name' : 'buyer_company.company_name',
                    render: (value) => value || 'N/A'
                  },
                  {
                    header: 'Amount',
                    accessor: 'escrowAmount',
                    render: (value, row) => `${row.currency || 'USD'} ${value.toLocaleString()}`
                  },
                  {
                    header: 'Protection Status',
                    accessor: 'protectionStatus',
                    render: (value) => {
                      const statusMap = {
                        protected: { label: 'Protected', variant: 'success' },
                        under_review: { label: 'Under Review', variant: 'warning' },
                        released: { label: 'Released', variant: 'default' }
                      };
                      const status = statusMap[value] || { label: value, variant: 'outline' };
                      return <StatusChip status={status.label} variant={status.variant} />;
                    }
                  },
                  {
                    header: 'Last Updated',
                    accessor: 'lastUpdated',
                    render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'N/A'
                  },
                  {
                    header: 'Actions',
                    accessor: 'id',
                    render: (value) => (
                      <Link to={`/dashboard/orders/${value}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Order
                        </Button>
                      </Link>
                    )
                  }
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* v2.5: Premium Explanation Box */}
        <Card className="border-afrikoni-gold/20 bg-afrikoni-ivory shadow-premium rounded-afrikoni-lg">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block">
              <Shield className="w-5 h-5 text-afrikoni-gold" />
              How Afrikoni Protection Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-afrikoni-gold text-white flex items-center justify-center font-bold flex-shrink-0 shadow-afrikoni">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-afrikoni-text-dark mb-1">Payment Held in Escrow</h4>
                  <p className="text-sm text-afrikoni-text-dark/80">Your payment is securely held in escrow until order completion. Funds are protected and cannot be released without your confirmation.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-afrikoni-gold text-white flex items-center justify-center font-bold flex-shrink-0 shadow-afrikoni">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-afrikoni-text-dark mb-1">Order Verification</h4>
                  <p className="text-sm text-afrikoni-text-dark/80">Verify order quality and completeness before release. If there are any issues, you can raise a dispute for fair resolution.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-afrikoni-gold text-white flex items-center justify-center font-bold flex-shrink-0 shadow-afrikoni">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-afrikoni-text-dark mb-1">Secure Release</h4>
                  <p className="text-sm text-afrikoni-text-dark/80">Payment is released only after you confirm receipt and satisfaction. Your funds are always protected throughout the transaction.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-afrikoni">
              <p className="text-sm text-afrikoni-text-dark">
                <strong>Note:</strong> All orders processed through Afrikoni are automatically protected by our escrow system. 
                You can track the protection status of each order and raise disputes if needed. 
                Our team is here to ensure fair and secure transactions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardProtection() {
  return (
    <>
      {/* PHASE 5B: Protection requires buy capability */}
      <RequireCapability canBuy={true}>
        <DashboardProtectionInner />
      </RequireCapability>
    </>
  );
}

