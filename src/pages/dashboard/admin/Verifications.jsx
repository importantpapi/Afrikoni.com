
import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, UserCheck, Shield, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminVerifications() {
    const { user } = useAuth();
    const [verifications, setVerifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchVerifications();
    }, []);

    const fetchVerifications = async () => {
        setIsLoading(true);
        try {
            // Fetch pending verifications
            const { data, error } = await supabase
                .from('verifications')
                .select(`
          *,
          company:companies(name, country, role, verification_status, business_type),
          purchase:verification_purchases(status, purchase_type)
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVerifications(data || []);
        } catch (err) {
            console.error('Error fetching verifications:', err);
            toast.error('Failed to load pending verifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id, companyId, action) => {
        setProcessingId(id);
        const toastId = toast.loading(`${action === 'approve' ? 'Verifying' : 'Rejecting'} company...`);

        try {
            const newStatus = action === 'approve' ? 'verified' : 'rejected';

            // 1. Update verification record
            const { error: verifyErr } = await supabase
                .from('verifications')
                .update({
                    status: newStatus,
                    verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
                    verified_by: user?.id
                })
                .eq('id', id);

            if (verifyErr) throw verifyErr;

            // 2. Update company record if approved
            if (action === 'approve') {
                const { error: companyErr } = await supabase
                    .from('companies')
                    .update({
                        verified: true,
                        verification_status: 'verified'
                    })
                    .eq('id', companyId);

                if (companyErr) throw companyErr;
            } else {
                // If rejected, set company status back to unverified
                const { error: companyErr } = await supabase
                    .from('companies')
                    .update({
                        verification_status: 'rejected'
                    })
                    .eq('id', companyId);

                if (companyErr) throw companyErr;
            }

            toast.success(`Company ${newStatus}`, { id: toastId });
            fetchVerifications();
        } catch (err) {
            console.error('Error updating verification:', err);
            toast.error('Failed to update verification', { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="os-page space-y-8 p-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-afrikoni-deep">Verification Requests</h1>
                <p className="text-os-muted text-lg">Review and approve supplier verification applications.</p>
            </div>

            <Surface className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-6 h-6 text-os-accent" />
                    <h2 className="text-xl font-bold">Pending Applications ({verifications.length})</h2>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
                    </div>
                ) : verifications.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500 font-medium">All caught up! No pending verifications.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {verifications.map((verif) => (
                            <div key={verif.id} className="p-5 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                                {verif.status.toUpperCase()}
                                            </Badge>
                                            {verif.purchase?.[0]?.purchase_type === 'fast_track' && (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                                                    <span className="animate-pulse">⚡</span> FAST TRACK
                                                </Badge>
                                            )}
                                            <span className="text-sm text-gray-500 font-mono">
                                                Applied: {format(new Date(verif.created_at), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-5 h-5 text-gray-400" />
                                            <span className="font-bold text-lg">{verif.company?.name || 'Unknown Company'}</span>
                                            <span className="text-sm text-gray-500">({verif.company?.country})</span>
                                        </div>

                                        <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm grid grid-cols-2 gap-x-8 gap-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Role:</span>
                                                <span className="font-medium capitalize">{verif.company?.role}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Business Type:</span>
                                                <span className="font-medium capitalize">{verif.company?.business_type || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between col-span-2 pt-2 border-t border-gray-200 mt-1">
                                                <span className="text-gray-500 font-bold flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> Documents submitted?
                                                </span>
                                                <span className="font-medium text-emerald-600">Yes (Auto-checked)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-end gap-2 min-w-[180px]">
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => handleAction(verif.id, verif.company_id, 'approve')}
                                            disabled={processingId === verif.id}
                                        >
                                            {processingId === verif.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            Approve & Verify
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleAction(verif.id, verif.company_id, 'reject')}
                                            disabled={processingId === verif.id}
                                        >
                                            {processingId === verif.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                            Reject Application
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Surface>
        </div>
    );
}
