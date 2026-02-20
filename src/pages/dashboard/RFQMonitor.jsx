import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useRFQs } from '@/hooks/queries/useRFQs';

// UI
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import EmptyState from '@/components/shared/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

// Icons
import {
    Sparkles, Search, Plus, Clock, Globe, DollarSign, MessageSquare,
    Send, ChevronRight, Zap, FileText, MapPin, Package, Calendar, RefreshCw,
    Settings, Trash2, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/api/supabaseClient';

const statusConfig = {
    draft: { label: 'Draft', tone: 'neutral' },
    sent: { label: 'New', tone: 'info' }, // mapped from rfq_open
    rfq_open: { label: 'New', tone: 'info' },
    viewed: { label: 'Viewed', tone: 'info' },
    quoted: { label: 'Quoted', tone: 'warning' },
    accepted: { label: 'Accepted', tone: 'success' },
    expired: { label: 'Expired', tone: 'critical' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/**
 * RFQ MONITOR (One Flow)
 * 
 * Unified interface for RFQ Intake (Buyer) and Response (Supplier).
 * Replaces: rfqs.jsx and supplier-rfqs.jsx.
 * 
 * Modes:
 * - 'buyer': Manage my RFQs
 * - 'supplier': View matched RFQs
 */
export default function RFQMonitor({ viewMode = 'buyer' }) {
    // ✅ REACT QUERY MIGRATION: Use query hooks for auto-refresh
    const { user, profileCompanyId, isSystemReady } = useDashboardKernel();
    const { data: allRFQs = [], isLoading, isRefetching, error, refetch } = useRFQs();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [statusFilter, setStatusFilter] = useState(viewMode === 'supplier' ? 'matched' : 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // Quick RFQ State (Buyer Only)
    const [showQuickRFQ, setShowQuickRFQ] = useState(false);
    const [quickRFQText, setQuickRFQText] = useState('');
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // Delete RFQ handler (Buyer only)
    const handleDeleteRFQ = async (e, rfqId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this RFQ? This action cannot be undone.")) return;
        
        try {
            const { error: delError } = await supabase
                .from('trades')
                .delete()
                .eq('id', rfqId)
                .eq('buyer_id', profileCompanyId)
                .eq('trade_type', 'rfq');
            
            if (delError) throw delError;
            toast.success("RFQ deleted successfully");
            refetch();
        } catch (err) {
            toast.error(err.message || "Failed to delete RFQ");
        }
    };

    // ✅ REACT QUERY MIGRATION: Filter RFQs based on viewMode, status, and search
    const rfqs = useMemo(() => {
        let filtered = allRFQs;

        // Apply view mode filter
        if (viewMode === 'supplier') {
            filtered = filtered.filter(rfq => {
                if (!rfq.matched_supplier_ids || !Array.isArray(rfq.matched_supplier_ids)) return false;
                return rfq.matched_supplier_ids.includes(profileCompanyId);
            });
        } else {
            // Buyer mode - show RFQs created by this company
            filtered = filtered.filter(rfq => rfq.buyer_company_id === profileCompanyId);
        }

        // Apply status filter
        if (statusFilter !== 'all' && statusFilter !== 'matched') {
            if (statusFilter === 'sent') {
                // Match both kernel status (rfq_open) and legacy status (open, sent)
                filtered = filtered.filter(rfq =>
                    rfq.status === 'rfq_open' ||
                    rfq.status === 'sent' ||
                    rfq.status === 'open'
                );
            } else {
                filtered = filtered.filter(rfq => rfq.status === statusFilter);
            }
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(rfq =>
                rfq.title?.toLowerCase().includes(query) ||
                rfq.id?.toLowerCase().includes(query) ||
                rfq.description?.toLowerCase().includes(query) ||
                rfq.product_name?.toLowerCase().includes(query) ||
                rfq.category?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [allRFQs, viewMode, statusFilter, searchQuery, profileCompanyId]);

    // AI Mock Logic
    const handleGenerateRFQ = () => {
        setAiProcessing(true);
        setTimeout(() => {
            setAiResult({
                product: 'Organic Shea Butter',
                qty: '20 MT',
                specs: ['Food-grade certified', 'Unrefined', 'Cold-pressed', 'Organic certified'],
                hsCode: '1515.90',
                suppliers: 7,
            });
            setAiProcessing(false);
        }, 1200);
    };

    // RENDER
    if (!isSystemReady) return <CardSkeleton count={3} />;

    if (error) {
        return <ErrorState message={error} onRetry={() => refetch()} />;
    }

    return (
        <div className="os-page os-stagger space-y-8">
            <div className="glass-surface p-8 relative overflow-hidden group/header">
                {/* Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-os-accent/5 rounded-full blur-[80px] group-hover/header:bg-os-accent/10 transition-colors duration-700" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="os-title-large">
                                {viewMode === 'buyer' ? 'Trade Intake' : 'Opportunity Feed'}
                            </h1>
                            <div className="health-capsule">
                                <div className="health-dot" />
                                <span>Live</span>
                            </div>
                        </div>
                        <p className="text-os-text-secondary text-os-lg">
                            {viewMode === 'buyer' ? 'Your active trade flow requests' : 'Intelligent trade matches found'}
                        </p>
                    </div>
                    {viewMode === 'buyer' ? (
                        <Button className="bg-os-text-primary text-os-bg rounded-full px-8 py-6 h-auto font-semibold shadow-os-md hover:opacity-90 transition-all"
                            onClick={() => { setShowQuickRFQ(!showQuickRFQ); setAiResult(null); }}>
                            <Sparkles className="h-4 w-4 mr-2" /> Quick RFQ
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => refetch()}
                            className={cn("h-12 px-6 rounded-os-md border border-os-stroke text-os-text-secondary hover:text-os-text-primary gap-2 transition-all", isRefetching && "opacity-70")}
                            disabled={isRefetching}
                        >
                            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
                            {isRefetching ? 'Checking...' : 'Refresh'}
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="relative z-10 mt-8 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-os-text-secondary group-focus-within:text-os-accent transition-colors" />
                        <Input
                            placeholder="Find a request or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-white/5 border-os-stroke rounded-os-md focus:bg-white/10 transition-all text-os-base"
                        />
                    </div>
                    {viewMode === 'buyer' && (
                        <div className="flex bg-os-stroke/10 backdrop-blur-md rounded-os-md p-1 border border-os-stroke">
                            {['all', 'sent', 'quoted', 'accepted'].map(key => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={cn(
                                        'px-6 py-2 rounded-os-sm text-os-sm font-semibold transition-all',
                                        statusFilter === key ? 'bg-os-surface shadow-os-md text-os-text-primary' : 'text-os-text-secondary hover:text-os-text-primary'
                                    )}
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK RFQ (Buyer Only) */}
            {viewMode === 'buyer' && showQuickRFQ && (
                <Surface variant="panel" className="p-6 animate-in slide-in-from-top-4 border-os-accent/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-os-accent/5 blur-3xl -z-10" />
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-os-sm bg-os-accent/10 flex items-center justify-center border border-os-accent/20">
                            <Sparkles className="h-5 w-5 text-os-accent" />
                        </div>
                        <div>
                        <h3 className="text-os-base font-semibold text-[var(--os-text-primary)]">Quick RFQ</h3>
                        <p className="text-os-xs text-os-muted">Describe what you need in plain language — we'll help structure it.</p>
                        </div>
                    </div>
                    <Textarea
                        placeholder='e.g. "I need 20 tons of organic shea butter..."'
                        value={quickRFQText}
                        onChange={(e) => setQuickRFQText(e.target.value)}
                        className="min-h-[90px] mb-3 bg-os-surface-1/50 border-os-stroke"
                    />

                    {aiResult && (
                        <div className="mb-4 p-4 rounded-lg bg-os-surface-1/80 border border-os-stroke animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="h-4 w-4 text-os-accent fill-os-accent/20" />
                                <span className="text-os-sm font-medium">AI Structured RFQ Preview</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-os-sm">
                                <div><p className="text-os-xs uppercase text-os-muted font-bold tracking-wider">Product</p>{aiResult.product}</div>
                                <div><p className="text-os-xs uppercase text-os-muted font-bold tracking-wider">Qty</p>{aiResult.qty}</div>
                                <div><p className="text-os-xs uppercase text-os-muted font-bold tracking-wider">HS Code</p>{aiResult.hsCode}</div>
                                <div><p className="text-os-xs uppercase text-os-muted font-bold tracking-wider">Matches</p>{aiResult.suppliers} found</div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowQuickRFQ(false); setAiResult(null); }}>Cancel</Button>
                        {!aiResult ? (
                            <Button size="sm" onClick={handleGenerateRFQ} disabled={aiProcessing || !quickRFQText} className="min-w-[120px]">
                                {aiProcessing ? "Processing..." : <><Sparkles className="h-3 w-3 mr-2" /> Generate RFQ</>}
                            </Button>
                        ) : (
                            <Button size="sm" className="gap-2 bg-os-accent hover:bg-os-accent/90"><Send className="h-3 w-3" /> Send to {aiResult.suppliers} Suppliers</Button>
                        )}
                    </div>
                </Surface>
            )}

            {/* LIST */}
            {isLoading ? (
                <CardSkeleton count={3} />
            ) : rfqs.length === 0 ? (
                <Surface variant="glass" className="p-12 md:p-20 text-center relative overflow-hidden flex flex-col items-center justify-center">
                    {viewMode === 'supplier' ? (
                        <>
                            {/* RADAR EFFECT */}
                            <div className="relative mb-10">
                                <div className="absolute inset-0 bg-os-accent/20 rounded-full animate-ping opacity-20" />
                                <div className="absolute inset-0 bg-os-accent/10 rounded-full animate-pulse opacity-40 scale-150" />
                                <div className="relative w-24 h-24 rounded-full bg-os-surface-1 border border-os-accent/30 flex items-center justify-center z-10">
                                    <div className="absolute inset-0 rounded-full border border-os-accent/10 animate-[spin_4s_linear_infinite]" />
                                    <Globe className="w-10 h-10 text-os-accent" />
                                </div>
                            </div>

                            <div className="max-w-md mx-auto relative z-10">
<h3 className="text-os-xl font-bold text-[var(--os-text-primary)] mb-3">Monitoring for Opportunities</h3>
                        <p className="text-os-muted mb-8">
                            We're actively monitoring incoming requests. You'll be notified as soon as a new RFQ matches your profile.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                    <div className="p-4 rounded-os-sm bg-os-surface-1 border border-os-stroke">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-lg bg-info/10"><Settings className="w-3.5 h-3.5 text-info" /></div>
                                            <span className="text-os-xs font-bold uppercase tracking-wider text-os-muted">Pro Tip</span>
                                        </div>
                                        <p className="text-os-xs text-os-muted leading-relaxed">
                                            Verify your <strong>HS Codes</strong> and <strong>Categories</strong> in settings to increase matching accuracy.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-os-sm bg-os-surface-1 border border-os-stroke">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-lg bg-emerald-500/10"><MapPin className="w-3.5 h-3.5 text-emerald-500" /></div>
                                            <span className="text-os-xs font-bold uppercase tracking-wider text-os-muted">Reach</span>
                                        </div>
                                        <p className="text-os-xs text-os-muted leading-relaxed">
                                            Expand your <strong>Serviceable Regions</strong> to capture more diverse trade inquiries.
                                        </p>
                                    </div>
                                </div>
                                <Button variant="link" onClick={() => navigate('/dashboard/settings')} className="mt-6 text-os-accent hover:text-os-accent/80 font-semibold ">
                                    Update Supplier Profile <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={FileText}
                            title="No RFQs created"
                            description="You haven't issued any requests for quotation yet. Use the AI tool or standard form to begin."
                            onCtaClick={() => setShowQuickRFQ(true)}
                            cta="Create First RFQ"
                        />
                    )}
                </Surface>
            ) : (
                <div className="space-y-4">
                    {rfqs.map((rfq) => {
                        const config = statusConfig[rfq.status] || statusConfig.draft;

                        return (
                            <Surface
                                key={rfq.id}
                                variant="panel"
                                className="p-5 hover:bg-os-surface-2 transition-all cursor-pointer group relative overflow-hidden"
                                onClick={() => navigate(viewMode === 'supplier' ? `/dashboard/one-flow/${rfq.id}` : `/dashboard/trade/${rfq.id}`)}
                            >
                                {viewMode === 'supplier' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl -z-10" />
                                )}
                                <div className="flex items-start justify-between gap-4 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-os-base font-semibold text-[var(--os-text-primary)] group-hover:text-os-accent transition-colors">{rfq.title}</h3>
                                            <StatusBadge label={config.label} tone={config.tone} />
                                            {viewMode === 'supplier' && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-os-xs font-bold text-emerald-500 uppercase">
                                                    98% Match
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-os-sm text-os-muted mb-3">
                                            <span className="font-mono text-os-xs px-1.5 py-0.5 rounded bg-os-surface-1 text-os-muted border border-os-stroke">#{rfq.id.slice(0, 8)}</span>
                                            <span className="flex items-center gap-1.5"><Package className="h-3.5 h-3.5 opacity-70" /> {rfq.quantity} {rfq.unit}</span>
                                            {rfq.target_price && <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 h-3.5 opacity-70" /> {rfq.target_price}</span>}
                                            {rfq.delivery_location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 h-3.5 opacity-70" /> {rfq.delivery_location}</span>}
                                        </div>

                                        {rfq.description && <p className="text-os-xs text-os-muted line-clamp-1 max-w-2xl">{rfq.description}</p>}
                                    </div>

                                    <div className="flex flex-col items-end justify-between self-stretch gap-2">
                                        <span className="text-os-xs text-os-muted font-medium bg-os-surface-1 px-2 py-1 rounded-md border border-os-stroke"><Clock className="h-3 w-3 inline mr-1 opacity-70" /> {format(new Date(rfq.created_at), 'MMM d')}</span>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-x-1 md:group-hover:translate-x-0 h-8 text-os-xs font-bold text-os-accent" onClick={(e) => { e.stopPropagation(); navigate(viewMode === 'supplier' ? `/dashboard/one-flow/${rfq.id}` : `/dashboard/trade/${rfq.id}`); }}>
                                                {viewMode === 'supplier' ? "Send Quote" : "View Details"} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                            </Button>
                                            {viewMode === 'buyer' && (
                                                <button
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 opacity-0 md:group-hover:opacity-100 transition-all"
                                                    onClick={(e) => handleDeleteRFQ(e, rfq.id)}
                                                    title="Delete RFQ"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Surface>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
