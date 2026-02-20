
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Building, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPayouts() {
    const { user, profile } = useAuth();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // 🔒 SECURITY: Only admins may access this page
    if (!profile?.is_admin) {
        return <Navigate to="/en/dashboard" replace />;
    }

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            // Fetch withdrawals
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select('*, companies(company_name, country, verification_status)')
                .eq('type', 'withdrawal_request')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error fetching payouts:', err);
            toast.error('Failed to load payout requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        setProcessingId(id);
        const toastId = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} request...`);

        try {
            const newStatus = action === 'approve' ? 'processing' : 'failed';
            // In a real automated system, we might trigger a transfer here.
            // For MVP Admin, we just mark it as processing (manual transfer initiated) or failed.

            const { error } = await supabase
                .from('wallet_transactions')
                .update({
                    status: newStatus,
                    processed_at: new Date().toISOString(),
                    processed_by: user?.id
                })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Request ${newStatus}`, { id: toastId });
            fetchRequests();
        } catch (err) {
            console.error('Error updating payout:', err);
            toast.error('Failed to update request', { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const historyRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="os-page space-y-8 p-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-afrikoni-deep">Admin Payout Control</h1>
                <p className="text-os-muted text-lg">Manage and approve seller withdrawal requests.</p>
            </div>

            <Surface className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-bold">Pending Requests ({pendingRequests.length})</h2>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500 font-medium">All caught up! No pending payouts.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="p-5 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
                                                {req.status.toUpperCase()}
                                            </Badge>
                                            <span className="text-sm text-gray-500 font-mono">{format(new Date(req.created_at), 'MMM dd, HH:mm')}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-400" />
                                            <span className="font-bold text-lg">{req.companies?.company_name || 'Unknown Company'}</span>
                                            {req.companies?.verification_status === 'verified' && (
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </div>

                                        <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm font-mono space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Bank:</span>
                                                <span className="font-bold">{req.metadata?.bank_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Account:</span>
                                                <span className="select-all">{req.metadata?.account_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Holder:</span>
                                                <span>{req.metadata?.account_holder}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">SWIFT:</span>
                                                <span>{req.metadata?.swift_code}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-4 min-w-[200px]">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500 uppercase tracking-wider font-bold">Amount</div>
                                            <div className="text-3xl font-black text-afrikoni-deep">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: req.currency }).format(req.amount)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full mt-auto">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleAction(req.id, 'reject')}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                Reject
                                            </Button>
                                            <Button
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handleAction(req.id, 'approve')}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                                                Approve Transfer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Surface>

            <div className="mt-12">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Past Transactions</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Company</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Processed By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {historyRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-gray-500">
                                        {format(new Date(req.created_at), 'yyyy-MM-dd HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 font-medium">{req.companies?.company_name}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: req.currency }).format(req.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={req.status === 'completed' ? 'success' : req.status === 'processing' ? 'secondary' : 'destructive'}>
                                            {req.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs truncate max-w-[150px]">
                                        {req.processed_by || '-'}
                                    </td>
                                </tr>
                            ))}
                            {historyRequests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No history found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
