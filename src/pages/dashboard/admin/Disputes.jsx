
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, AlertTriangle, MessageCircle, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/shared/ui/dialog';
import { Textarea } from '@/components/shared/ui/textarea';

export default function AdminDisputes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { lang } = useParams();
    const language = lang || 'en';
    const [disputes, setDisputes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState('active'); // 'active', 'resolved', 'all'

    // Resolution Modal
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [resolutionAction, setResolutionAction] = useState(null); // 'resolve', 'escalate', 'reject'

    useEffect(() => {
        fetchDisputes();
    }, [filter]);

    const fetchDisputes = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('disputes')
                .select(`
          *,
          raised_by:raised_by_company_id(name, country),
          against:against_company_id(name, country),
          trade:trade_id(title, total_value, currency)
        `)
                .order('opened_at', { ascending: false });

            if (filter === 'active') {
                query = query.in('status', ['in_review', 'escalated']);
            } else if (filter === 'resolved') {
                query = query.eq('status', 'resolved');
            }

            const { data, error } = await query;
            if (error) throw error;
            setDisputes(data || []);
        } catch (err) {
            console.error('Error fetching disputes:', err);
            toast.error('Failed to load disputes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenResolution = (dispute, action) => {
        setSelectedDispute(dispute);
        setResolutionAction(action);
        setResolutionNote('');
    };

    const handleSubmitResolution = async () => {
        if (!resolutionNote.trim()) {
            toast.error('Please provide a resolution note');
            return;
        }

        setProcessingId(selectedDispute.id);
        const toastId = toast.loading('Updating dispute status...');

        try {
            const { data, error } = await supabase.functions.invoke('resolve-dispute-workflow', {
                body: {
                    disputeId: selectedDispute.id,
                    action: resolutionAction,
                    resolutionNote: resolutionNote.trim()
                }
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Dispute workflow failed');

            toast.success(`Dispute ${data.status}`, { id: toastId });
            setSelectedDispute(null);
            fetchDisputes();
        } catch (err) {
            console.error('Error updating dispute:', err);
            toast.error('Failed to update dispute', { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'in_review': return <Badge variant="warning">In Review</Badge>;
            case 'escalated': return <Badge variant="destructive">Escalated</Badge>;
            case 'resolved': return <Badge variant="success">Resolved</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleMessageParties = (dispute) => {
        const search = dispute?.trade_id ? `?trade=${encodeURIComponent(dispute.trade_id)}` : '';
        navigate(
            {
                pathname: `/${language}/dashboard/messages`,
                search,
            },
            {
                state: {
                    from: location.pathname + location.search,
                    context: {
                        disputeId: dispute.id,
                        tradeId: dispute.trade_id || null,
                    },
                },
            }
        );
    };

    return (
        <div className="os-page space-y-8 p-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-afrikoni-deep">Dispute Resolution</h1>
                <p className="text-os-muted text-lg">Arbitrate and resolve trade disputes.</p>
            </div>

            <div className="flex gap-2 mb-4">
                {['active', 'resolved', 'all'].map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        onClick={() => setFilter(f)}
                        className="capitalize"
                    >
                        {f}
                    </Button>
                ))}
            </div>

            <Surface className="p-6">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
                    </div>
                ) : disputes.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500 font-medium">No disputes found matching filter.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((dispute) => (
                            <div key={dispute.id} className="p-5 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(dispute.status)}
                                            <span className="text-sm text-gray-500 font-mono">
                                                {format(new Date(dispute.opened_at), 'MMM dd, HH:mm')}
                                            </span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
                                                {dispute.id.substring(0, 8)}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4" />
                                                {dispute.reason}
                                            </h3>
                                            <p className="text-gray-600 mt-1">{dispute.summary}</p>
                                        </div>

                                        <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm space-y-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Plaintiff (Raised By)</span>
                                                    <span className="font-medium text-afrikoni-deep">{dispute.raised_by?.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({dispute.raised_by?.country})</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Defendant (Against)</span>
                                                    <span className="font-medium text-afrikoni-deep">{dispute.against?.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({dispute.against?.country})</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-200 mt-2">
                                                <span className="text-xs text-gray-400 uppercase font-bold block mb-1">Trade Context</span>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{dispute.trade?.title || 'Unknown Trade'}</span>
                                                    <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: dispute.currency || 'USD' }).format(dispute.amount || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-end gap-2 min-w-[180px]">
                                        {dispute.status !== 'resolved' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleOpenResolution(dispute, 'resolve')}
                                                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleOpenResolution(dispute, 'escalate')}
                                                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                                                    disabled={dispute.status === 'escalated'}
                                                >
                                                    <AlertTriangle className="w-4 h-4 mr-2" /> Escalate
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleMessageParties(dispute)}
                                                    className="w-full text-blue-600"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" /> Message Parties
                                                </Button>
                                            </>
                                        )}
                                        {dispute.status === 'resolved' && (
                                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-500 italic">
                                                Resolved by admin on {dispute.resolved_at ? format(new Date(dispute.resolved_at), 'MMM dd') : '-'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Surface>

            <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {resolutionAction === 'resolve' ? 'Resolve Dispute' : 'Escalate Dispute'}
                        </DialogTitle>
                        <DialogDescription>
                            {resolutionAction === 'resolve'
                                ? 'This will mark the dispute as closed. Ensure all parties have been notified.'
                                : 'Escalating will flag this for senior arbitration review.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resolution / Action Note</label>
                            <Textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Enter details about the resolution or escalation reason..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedDispute(null)}>Cancel</Button>
                        <Button
                            onClick={handleSubmitResolution}
                            disabled={!resolutionNote.trim() || processingId === selectedDispute?.id}
                            className={resolutionAction === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
                        >
                            {processingId === selectedDispute?.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Confirm Action
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
