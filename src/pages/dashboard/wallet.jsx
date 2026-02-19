import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent } from '@/components/shared/ui/card';
import { toast } from 'sonner';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2,
  DollarSign, Building, Loader2, AlertTriangle
} from 'lucide-react';

const CURRENCIES = ['USD', 'NGN', 'GHS', 'KES', 'ZAR'];

const statusConfig = {
  pending: { label: 'Pending', variant: 'outline', className: 'border-yellow-500/50 text-yellow-400' },
  processing: { label: 'Processing', variant: 'outline', className: 'border-blue-500/50 text-blue-400' },
  completed: { label: 'Completed', variant: 'outline', className: 'border-green-500/50 text-green-400' },
  failed: { label: 'Failed', variant: 'outline', className: 'border-red-500/50 text-red-400' },
};

const typeIcons = {
  deposit: <ArrowDownLeft className="w-4 h-4 text-green-400" />,
  withdrawal_request: <ArrowUpRight className="w-4 h-4 text-orange-400" />,
  withdrawal: <ArrowUpRight className="w-4 h-4 text-red-400" />,
  commission: <DollarSign className="w-4 h-4 text-blue-400" />,
};

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Skeleton Loader ---
function BalanceCardSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10 opacity-50">
      <CardContent className="p-6">
        <div className="h-4 w-24 bg-white/10 rounded mb-3" />
        <div className="h-8 w-32 bg-white/10 rounded mb-2" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded opacity-50" />
      ))}
    </div>
  );
}

// --- Main Page ---
export default function WalletPage() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  // Balance state
  const [availableBalance, setAvailableBalance] = useState(0);
  const [inEscrow, setInEscrow] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState(null);

  // Payout form state
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_holder: '',
    swift_code: '',
    currency: 'USD',
    method: 'bank',
  });

  // Load balance data from escrows
  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;
    loadBalances();
  }, [canLoadData, profileCompanyId]);

  // Load transaction history
  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;
    loadTransactions();
  }, [canLoadData, profileCompanyId]);

  const loadBalances = async () => {
    setBalanceLoading(true);
    try {
      const { data: escrows, error } = await supabase
        .from('escrows')
        .select('status, net_payout_amount, amount')
        .eq('seller_id', profileCompanyId);

      if (error) throw error;

      const rows = escrows || [];
      const released = rows
        .filter(e => e.status === 'released')
        .reduce((sum, e) => sum + Number(e.net_payout_amount || e.amount || 0), 0);
      const funded = rows
        .filter(e => e.status === 'funded')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const settled = rows
        .filter(e => e.status === 'settled')
        .reduce((sum, e) => sum + Number(e.net_payout_amount || e.amount || 0), 0);

      setAvailableBalance(released);
      setInEscrow(funded);
      setTotalEarned(released + settled);
    } catch (err) {
      console.error('Failed to load balances:', err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('company_id', profileCompanyId)
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not exist yet - gracefully handle
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setTransactions([]);
          return;
        }
        throw error;
      }
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setTxError(err.message);
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const handlePayoutChange = (field, value) => {
    setPayoutForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payoutForm.amount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (amount > availableBalance) {
      toast.error('Amount exceeds available balance.');
      return;
    }
    if (!payoutForm.bank_name || !payoutForm.account_number || !payoutForm.account_holder) {
      toast.error('Please fill in all bank details.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('wallet_transactions').insert({
        company_id: profileCompanyId,
        type: 'withdrawal_request',
        amount,
        currency: payoutForm.currency,
        status: 'pending',
        metadata: {
          bank_name: payoutForm.bank_name,
          account_number: payoutForm.account_number,
          account_holder: payoutForm.account_holder,
          swift_code: payoutForm.swift_code,
          method: payoutForm.method,
        },
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted. Processing within 3-5 business days.');
      setPayoutForm({
        amount: '',
        bank_name: '',
        account_number: '',
        account_holder: '',
        swift_code: '',
        currency: 'USD',
      });
      setShowPayoutForm(false);
      loadTransactions();
    } catch (err) {
      console.error('Payout submission failed:', err);
      toast.error('Failed to submit withdrawal request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Not ready states ---
  if (!isSystemReady) {
    return (
      <Surface className="p-6 md:p-10 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-white/10 rounded opacity-50" />
          <div className="h-7 w-48 bg-white/10 rounded opacity-50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BalanceCardSkeleton />
          <BalanceCardSkeleton />
          <BalanceCardSkeleton />
        </div>
        <TableSkeleton />
      </Surface>
    );
  }

  return (
    <Surface className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-os-accent/20 rounded-lg border border-os-accent/30">
            <Wallet className="w-6 h-6 text-os-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Wallet & Payouts</h1>
            <p className="text-sm text-white/50">Manage your earnings, escrow balance, and withdrawal requests</p>
          </div>
        </div>
        <Button
          onClick={() => setShowPayoutForm(!showPayoutForm)}
          className="bg-os-accent text-black font-semibold hover:bg-os-accent/90"
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          {showPayoutForm ? 'Cancel' : 'Request Payout'}
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balanceLoading ? (
          <>
            <BalanceCardSkeleton />
            <BalanceCardSkeleton />
            <BalanceCardSkeleton />
          </>
        ) : (
          <>
            <Card className="bg-white/5 border-white/10 hover:border-green-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Available Balance
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {formatCurrency(availableBalance)}
                </p>
                <p className="text-xs text-white/40 mt-1">Ready for withdrawal</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-yellow-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  In Escrow
                </div>
                <p className="text-3xl font-bold text-yellow-400">
                  {formatCurrency(inEscrow)}
                </p>
                <p className="text-xs text-white/40 mt-1">Held until trade completion</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-blue-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  Total Earned
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {formatCurrency(totalEarned)}
                </p>
                <p className="text-xs text-white/40 mt-1">All-time released earnings</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Payout Form (Collapsible) */}
      {showPayoutForm && (
        <Surface variant="panel" className="p-6 border border-os-accent/20 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-os-accent" />
            <h2 className="text-lg font-semibold text-white">Request Withdrawal</h2>
          </div>

          {availableBalance <= 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No available balance to withdraw. Funds become available when escrow is released.
            </div>
          )}

          <div className="flex gap-4 border-b border-white/10 pb-4 mb-4">
            <button
              onClick={() => handlePayoutChange('method', 'bank')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${payoutForm.method === 'bank' ? 'bg-os-accent text-black font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              Bank Transfer
            </button>
            <button
              onClick={() => handlePayoutChange('method', 'mobile_money')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${payoutForm.method === 'mobile_money' ? 'bg-os-accent text-black font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              Mobile Money
            </button>
          </div>

          <form onSubmit={handlePayoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={availableBalance}
                placeholder={`Max: ${formatCurrency(availableBalance)}`}
                value={payoutForm.amount}
                onChange={(e) => handlePayoutChange('amount', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Currency</label>
              <select
                value={payoutForm.currency}
                onChange={(e) => handlePayoutChange('currency', e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-os-accent/50"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
                ))}
              </select>
            </div>

            {payoutForm.method === 'bank' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">Bank Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. First Bank of Nigeria"
                    value={payoutForm.bank_name}
                    onChange={(e) => handlePayoutChange('bank_name', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">Account Number</label>
                  <Input
                    type="text"
                    placeholder="Account number"
                    value={payoutForm.account_number}
                    onChange={(e) => handlePayoutChange('account_number', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">Account Holder Name</label>
                  <Input
                    type="text"
                    placeholder="Full name on account"
                    value={payoutForm.account_holder}
                    onChange={(e) => handlePayoutChange('account_holder', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">SWIFT / Routing Code</label>
                  <Input
                    type="text"
                    placeholder="SWIFT or routing code"
                    value={payoutForm.swift_code}
                    onChange={(e) => handlePayoutChange('swift_code', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">Provider</label>
                  <select
                    value={payoutForm.bank_name} // Reusing bank_name for provider to keep schema simple
                    onChange={(e) => handlePayoutChange('bank_name', e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-os-accent/50"
                    required
                  >
                    <option value="" className="bg-gray-900">Select Provider</option>
                    <option value="M-Pesa" className="bg-gray-900">M-Pesa (Kenya/Tanzania)</option>
                    <option value="MTN Mobile Money" className="bg-gray-900">MTN Mobile Money</option>
                    <option value="Airtel Money" className="bg-gray-900">Airtel Money</option>
                    <option value="Orange Money" className="bg-gray-900">Orange Money</option>
                    <option value="Vodafone Cash" className="bg-gray-900">Vodafone Cash</option>
                    <option value="Tigo Pesa" className="bg-gray-900">Tigo Pesa</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="e.g. +254 7..."
                    value={payoutForm.account_number} // Reusing account_number for phone
                    onChange={(e) => handlePayoutChange('account_number', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-white/60 font-medium">Account Name</label>
                  <Input
                    type="text"
                    placeholder="Registered name on SIM"
                    value={payoutForm.account_holder}
                    onChange={(e) => handlePayoutChange('account_holder', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex justify-end pt-2">
              <Button
                type="submit"
                disabled={submitting || availableBalance <= 0}
                className="bg-os-accent text-black font-semibold hover:bg-os-accent/90 min-w-[180px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    {payoutForm.method === 'mobile_money' ? 'Send to Mobile Wallet' : 'Submit Bank Withdrawal'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Surface>
      )}

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white/50" />
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
        </div>

        {txLoading ? (
          <TableSkeleton />
        ) : txError ? (
          <Surface variant="panel" className="p-8 text-center border border-white/10">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-white/60 text-sm">Unable to load transaction history.</p>
            <p className="text-white/30 text-xs mt-1">{txError}</p>
          </Surface>
        ) : transactions.length === 0 ? (
          <Surface variant="panel" className="p-10 text-center border border-white/10">
            <Wallet className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 font-medium">No transactions yet</p>
            <p className="text-white/30 text-sm mt-1">
              Your transaction history will appear here once you start trading.
            </p>
          </Surface>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Type</th>
                  <th className="text-right px-4 py-3 text-white/50 font-medium">Amount</th>
                  <th className="text-center px-4 py-3 text-white/50 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-white/50 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const status = statusConfig[tx.status] || statusConfig.pending;
                  const typeLabel = (tx.type || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-white/80">
                          {typeIcons[tx.type] || <DollarSign className="w-4 h-4 text-white/40" />}
                          {typeLabel}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white/90 whitespace-nowrap">
                        {formatCurrency(tx.amount, tx.currency || 'USD')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={status.variant} className={status.className}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs font-mono">
                        {tx.id?.slice(0, 8) || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Surface>
  );
}
