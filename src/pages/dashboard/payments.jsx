import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { Wallet, DollarSign, CreditCard, TrendingUp, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPayments() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('buyer');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndPayments();
  }, [typeFilter, statusFilter]);

  const loadUserAndPayments = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);

      // Load wallet transactions
      let walletQuery = supabase.from('wallet_transactions').select('*, orders(id, products(title))');
      if (companyId) {
        walletQuery = walletQuery.eq('company_id', companyId);
      } else if (userData.id) {
        walletQuery = walletQuery.eq('user_id', userData.id);
      }
      const { data: walletTransactions } = await walletQuery.order('created_at', { ascending: false });

      // Calculate summary
      const allTransactions = walletTransactions || [];
      
      // Wallet balance = sum of completed credits - debits
      const credits = allTransactions.filter(tx => 
        ['deposit', 'escrow_release', 'payout'].includes(tx.type) && tx.status === 'completed'
      );
      const debits = allTransactions.filter(tx => 
        ['escrow_hold', 'fee', 'adjustment'].includes(tx.type) && tx.status === 'completed'
      );
      
      const walletBalance = credits.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0) -
                           debits.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      
      const totalReceived = credits.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      const totalPaid = debits.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      
      // Escrow held = sum of escrow_hold that are completed and not yet released
      const escrowHolds = allTransactions.filter(tx => 
        tx.type === 'escrow_hold' && tx.status === 'completed'
      );
      const escrowReleases = allTransactions.filter(tx => 
        tx.type === 'escrow_release' && tx.status === 'completed'
      );
      
      // Calculate escrow held (holds minus releases for same orders)
      const escrowHeld = escrowHolds.reduce((sum, hold) => {
        const released = escrowReleases.find(r => r.order_id === hold.order_id);
        if (!released) {
          return sum + parseFloat(hold.amount || 0);
        }
        return sum;
      }, 0);

      setSummary({
        walletBalance,
        totalReceived,
        totalPaid,
        escrowHeld
      });

      // Format transactions for display
      const formattedTransactions = allTransactions.map(tx => {
        const typeLabels = {
          deposit: 'Deposit',
          payout: 'Payout',
          escrow_hold: `Escrow Hold for Order #${tx.order_id?.slice(0, 8) || 'N/A'}`,
          escrow_release: `Escrow Release for Order #${tx.order_id?.slice(0, 8) || 'N/A'}`,
          fee: 'Fee',
          adjustment: 'Adjustment'
        };

        return {
          id: tx.id,
          date: tx.created_at,
          type: tx.type,
          typeLabel: typeLabels[tx.type] || tx.type,
          amount: parseFloat(tx.amount || 0),
          currency: tx.currency || 'USD',
          status: tx.status || 'pending',
          order_id: tx.order_id,
          description: tx.description || '',
          order: tx.orders
        };
      });

      // Apply filters
      let filtered = formattedTransactions;
      
      if (typeFilter !== 'all') {
        if (typeFilter === 'escrow') {
          filtered = filtered.filter(tx => ['escrow_hold', 'escrow_release'].includes(tx.type));
        } else {
          filtered = filtered.filter(tx => tx.type === typeFilter);
        }
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(tx => tx.status === statusFilter);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(tx => 
          tx.typeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setTransactions(filtered);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const transactionColumns = [
    { 
      header: 'Date',
      accessor: 'date',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'N/A'
    },
    { 
      header: 'Type',
      accessor: 'typeLabel',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.description && (
            <div className="text-xs text-afrikoni-deep/70">{row.description}</div>
          )}
        </div>
      )
    },
    { 
      header: 'Amount',
      accessor: 'amount',
      render: (value, row) => {
        const isDebit = ['escrow_hold', 'fee', 'adjustment'].includes(row.type);
        return (
          <span className={isDebit ? 'text-red-600' : 'text-green-600'}>
            {isDebit ? '-' : '+'}{row.currency || 'USD'} {Math.abs(value).toLocaleString()}
          </span>
        );
      }
    },
    { 
      header: 'Status',
      accessor: 'status',
      render: (value) => <StatusChip status={value} />
    },
    { 
      header: 'Actions',
      accessor: 'order_id',
      render: (value) => value ? (
        <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/orders/${value}`)}>
          View Order
        </Button>
      ) : null
    }
  ];

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
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Payments</h1>
          <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
            {currentRole === 'buyer' && 'Track your payment history'}
            {currentRole === 'seller' && 'Manage your payment receipts'}
            {currentRole === 'hybrid' && 'View all payments'}
            {currentRole === 'logistics' && 'Track payment transactions'}
          </p>
        </motion.div>

        {/* Summary Cards */}
        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-deep">Wallet Balance</p>
                    <p className="text-2xl font-bold text-afrikoni-chestnut">
                      ${summary.walletBalance.toLocaleString()}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-afrikoni-gold" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-deep">Total Received</p>
                    <p className="text-2xl font-bold text-afrikoni-chestnut">
                      ${summary.totalReceived.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-deep">Total Paid</p>
                    <p className="text-2xl font-bold text-afrikoni-chestnut">
                      ${summary.totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-deep">Escrow Held</p>
                    <p className="text-2xl font-bold text-afrikoni-chestnut">
                      ${summary.escrowHeld.toLocaleString()}
                    </p>
                  </div>
                  <Lock className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Loading...</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">$0</p>
                    </div>
                    <Wallet className="w-8 h-8 text-afrikoni-deep/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                  <SelectItem value="escrow">Escrow</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyState 
                type="payments" 
                title="No transactions yet"
                description="Your wallet transactions will appear here"
              />
            ) : (
              <DataTable
                data={transactions}
                columns={transactionColumns}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

