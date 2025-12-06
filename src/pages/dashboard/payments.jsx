/**
 * Payments & Escrow Dashboard
 * Shows wallet balance, transactions, and escrow payments
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownLeft, Shield, Clock, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase } from '@/api/supabaseClient';
import { 
  getWalletAccount, 
  getWalletTransactions, 
  getEscrowPaymentsByCompany,
  getEscrowEvents
} from '@/lib/supabaseQueries/payments';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';

export default function PaymentsDashboard() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wallet');
  const [companyId, setCompanyId] = useState(null);
  const [userRole, setUserRole] = useState('buyer');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user, profile, role, companyId: userCompanyId } = await getCurrentUserAndRole(supabase);
      
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }

      setCompanyId(userCompanyId);
      setUserRole(role);

      // Load wallet account
      let walletAccount = await getWalletAccount(userCompanyId);
      if (!walletAccount) {
        // Create wallet if it doesn't exist
        const { createWalletAccount } = await import('@/lib/supabaseQueries/payments');
        walletAccount = await createWalletAccount(userCompanyId);
      }
      setWallet(walletAccount);

      // Load transactions
      const txs = await getWalletTransactions(userCompanyId, { limit: 50 });
      setTransactions(txs);

      // Load escrow payments
      const escrows = await getEscrowPaymentsByCompany(userCompanyId, role);
      setEscrowPayments(escrows);
    } catch (error) {
      console.error('Error loading payments data:', error);
      toast.error('Failed to load payments data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'pending': 'outline',
      'failed': 'destructive',
      'held': 'outline',
      'released': 'success',
      'refunded': 'destructive'
    };
    return variants[status] || 'outline';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed' || status === 'released') return <CheckCircle className="w-4 h-4" />;
    if (status === 'pending' || status === 'held') return <Clock className="w-4 h-4" />;
    if (status === 'failed' || status === 'refunded') return <XCircle className="w-4 h-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Payments & Escrow</h1>
            <p className="text-afrikoni-text-dark/70">Manage your wallet, transactions, and escrow payments</p>
          </div>
        </motion.div>

        {/* Wallet Balance Card */}
        {wallet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-cream border-afrikoni-gold/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-text-dark/70 mb-1">Available Balance</p>
                    <h2 className="text-4xl font-bold text-afrikoni-text-dark">
                      {wallet.currency} {parseFloat(wallet.available_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    {wallet.pending_balance > 0 && (
                      <p className="text-sm text-afrikoni-text-dark/60 mt-2">
                        Pending: {wallet.currency} {parseFloat(wallet.pending_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-afrikoni-gold/20 rounded-full">
                    <Wallet className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="wallet">Wallet Transactions</TabsTrigger>
            <TabsTrigger value="escrow">Escrow Payments</TabsTrigger>
          </TabsList>

          {/* Wallet Transactions Tab */}
          <TabsContent value="wallet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="No transactions yet"
                    description="Your transaction history will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-afrikoni-cream/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            tx.type === 'deposit' || tx.type === 'refund' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'refund' ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{tx.description || tx.type}</p>
                            <p className="text-sm text-afrikoni-text-dark/60">
                              {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            tx.type === 'deposit' || tx.type === 'refund' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                            {tx.currency} {Math.abs(parseFloat(tx.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <Badge variant={getStatusBadge(tx.status)} className="mt-1">
                            {getStatusIcon(tx.status)}
                            <span className="ml-1 capitalize">{tx.status}</span>
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Escrow Payments Tab */}
          <TabsContent value="escrow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Escrow Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {escrowPayments.length === 0 ? (
                  <EmptyState
                    icon={Shield}
                    title="No escrow payments"
                    description="Escrow payments for your orders will appear here"
                  />
                ) : (
                  <div className="space-y-4">
                    {escrowPayments.map((escrow) => (
                      <motion.div
                        key={escrow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">
                              Order #{escrow.orders?.order_number || escrow.order_id?.slice(0, 8)}
                            </p>
                            <p className="text-sm text-afrikoni-text-dark/60">
                              {format(new Date(escrow.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Badge variant={getStatusBadge(escrow.status)}>
                            {getStatusIcon(escrow.status)}
                            <span className="ml-1 capitalize">{escrow.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-afrikoni-text-dark/70">Escrow Amount</p>
                            <p className="text-xl font-bold text-afrikoni-gold">
                              {escrow.currency} {parseFloat(escrow.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Link to={`/dashboard/escrow/${escrow.order_id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
