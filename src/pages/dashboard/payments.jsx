/**
 * Payments & Escrow Dashboard
 * Shows wallet balance, transactions, and escrow payments
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownLeft, Shield, Clock, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import {
  getWalletAccount,
  getWalletTransactions,
  getEscrowPaymentsByCompany,
  getEscrowEvents,
} from '@/lib/supabaseQueries/payments';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import RequireCapability from '@/guards/RequireCapability';

function PaymentsDashboardInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  // Derive role from capabilities for API calls that need it
  const isBuyer = capabilities?.can_buy === true;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const derivedRole = isSeller ? 'seller' : 'buyer'; // Default to buyer if both or neither
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('wallet');
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ ARCHITECTURAL FIX: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  
  // ✅ UNIFIED DASHBOARD KERNEL: Show loading spinner while system is not ready
  if (!canLoadData && capabilities.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading capabilities..." ready={capabilities.ready} />
      </div>
    );
  }

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d7d2d2ee-1c5c-40ad-93f6-c86749150e4f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments.jsx:70',message:'HYPOTHESIS_C: useEffect entry - checking canLoadData',data:{canLoadData,profileCompanyId,userId,capabilitiesReady:capabilities.ready},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData) {
      return;
    }

    // ✅ ARCHITECTURAL FIX: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[PaymentsDashboard] Data is stale or first load - refreshing');
      // Now safe to load data
      loadData();
    } else {
      console.log('[PaymentsDashboard] Data is fresh - skipping reload');
    }
  }, [canLoadData, userId, profileCompanyId, location.pathname, isStale, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d7d2d2ee-1c5c-40ad-93f6-c86749150e4f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payments.jsx:110',message:'HYPOTHESIS_C: loadData entry - using profileCompanyId from kernel',data:{profileCompanyId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // ✅ UNIFIED DASHBOARD KERNEL: Use profileCompanyId from kernel
      if (!userId || !profileCompanyId) {
        navigate('/login');
        return;
      }

      // Try to load payment data - tables may not exist yet
      try {
        // ✅ UNIFIED DASHBOARD KERNEL: Use profileCompanyId from kernel
        // Load wallet account
        let walletAccount = await getWalletAccount(profileCompanyId);
        if (!walletAccount) {
          // Create wallet if it doesn't exist
          const { createWalletAccount } = await import('@/lib/supabaseQueries/payments');
          walletAccount = await createWalletAccount(profileCompanyId);
        }
        setWallet(walletAccount);

        // Load transactions
        const txs = await getWalletTransactions(profileCompanyId, { limit: 50 });
        setTransactions(txs);

        // ✅ UNIFIED DASHBOARD KERNEL: Use profileCompanyId from kernel
        // Load escrow payments - derive role from capabilities
        const escrows = await getEscrowPaymentsByCompany(profileCompanyId, derivedRole);
        setEscrowPayments(escrows);
        
        // ✅ REACTIVE READINESS FIX: Mark data as fresh ONLY after successful 200 OK response
        // Only mark fresh if we got actual data (not an error)
        if (walletAccount || transactions.length > 0 || escrows.length > 0) {
          lastLoadTimeRef.current = Date.now();
          markFresh();
        }
      } catch (dataError) {
        console.log('Payment tables not yet set up:', dataError.message);
        // Set empty data - feature not yet available
        setWallet(null);
        setTransactions([]);
        setEscrowPayments([]);
        // ❌ DO NOT mark fresh on error - let it retry on next navigation
      }
    } catch (error) {
      // ✅ KERNEL MIGRATION: Enhanced error logging and state
      console.error('Error loading payments data:', error);
      setError(error?.message || 'Failed to load payments data');
      // ❌ DO NOT mark fresh on error - let it retry on next navigation
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
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
          if (shouldRefresh) {
            loadData();
          }
        }}
      />
    );
  }

  const totalInflow = transactions
    .filter((tx) => tx.type === 'deposit' || tx.type === 'refund')
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

  const totalOutflow = transactions
    .filter((tx) => tx.type !== 'deposit' && tx.type !== 'refund')
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

  const escrowHeld = escrowPayments
    .filter((e) => e.status === 'held' || e.status === 'pending')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const escrowReleased = escrowPayments
    .filter((e) => e.status === 'released' || e.status === 'completed')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <>
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
            <p className="text-sm text-afrikoni-text-dark/60 mt-1">All transactions are protected through Afrikoni's Trade Shield</p>
          </div>
        </motion.div>

        {/* Wallet & Escrow KPIs - Trust-focused */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {wallet && (
            <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60 font-semibold">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-afrikoni-text-dark mt-1">
                  {wallet.currency}{' '}
                  {parseFloat(wallet.available_balance || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-afrikoni-text-dark/50 mt-1">Ready for trade</p>
              </CardContent>
            </Card>
          )}
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60">
                Escrow Protected
              </p>
              <p className="text-2xl font-bold text-afrikoni-gold mt-1">
                {wallet?.currency || 'USD'}{' '}
                {escrowHeld.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-afrikoni-text-dark/50 mt-1">In secure escrow</p>
            </CardContent>
          </Card>
          <Card className="opacity-80">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60">
                Total Inflows
              </p>
              <p className="text-xl font-semibold text-green-600 mt-1">
                {wallet?.currency || 'USD'}{' '}
                {totalInflow.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
          <Card className="opacity-80">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-afrikoni-text-dark/60">
                Total Outflows
              </p>
              <p className="text-xl font-semibold text-red-600 mt-1">
                {wallet?.currency || 'USD'}{' '}
                {totalOutflow.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

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
    </>
  );
}

export default function PaymentsDashboard() {
    return (
      <>
        {/* PHASE 5B: Payments requires buy or sell capability */}
        <RequireCapability canBuy={true} canSell={true}>
          <PaymentsDashboardInner />
        </RequireCapability>
      </>
    );
}
