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
    Send, ChevronRight, Zap, FileText, MapPin, Package, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
    const { data: allRFQs = [], isLoading, error } = useRFQs();
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
                filtered = filtered.filter(rfq => rfq.status === 'rfq_open' || rfq.status === 'sent');
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

    // ✅ REACT QUERY MIGRATION: No useEffect needed - React Query handles loading
    // All data fetching is automatic via useRFQs() hook
    // Filtering is done in the useMemo above

    // RENDER
    if (!isSystemReady) return <CardSkeleton count={3} />;

    if (error) {
        return <ErrorState message={error} onRetry={() => markFresh()} />;
    }

    return (
        <div className="os-page os-stagger space-y-6">
            <Surface variant="glass" className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="os-label">{viewMode === 'buyer' ? 'Trade Intake' : 'Opportunity Feed'}</div>
                        <h1 className="os-title mt-2">{viewMode === 'buyer' ? 'RFQs & Inquiries' : 'Matched RFQs'}</h1>
                        <p className="text-sm text-os-muted">
                            {filteredRFQs.length} {viewMode === 'buyer' ? 'active requests' : 'matches found'}
                        </p>
                    </div>
                    {viewMode === 'buyer' ? (
                        <Button className="bg-[var(--os-text-primary)] text-[var(--os-bg)] hover:opacity-90 font-semibold"
                            onClick={() => { setShowQuickRFQ(!showQuickRFQ); setAiResult(null); }}>
                            <Sparkles className="h-4 w-4 mr-2" /> AI Quick RFQ
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => { refresh(); lastLoadTimeRef.current = null; }} className="gap-2">
                                <RefreshCw className="w-4 h-4" /> Refresh
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-os-muted" />
                        <Input
                            placeholder="Search RFQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {viewMode === 'buyer' && (
                        <div className="flex bg-os-surface-1 rounded-lg p-1 border border-os-stroke">
                            {['all', 'sent', 'quoted', 'accepted'].map(key => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                        statusFilter === key ? 'bg-os-surface-0 text-[var(--os-text-primary)]' : 'text-os-muted hover:text-[var(--os-text-primary)]'
                                    )}
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                    {viewMode === 'supplier' && (
                        <div className="w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="matched">Matched</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </Surface>

            {/* QUICK RFQ (Buyer Only) */}
            {viewMode === 'buyer' && showQuickRFQ && (
                <Surface variant="panel" className="p-6 animate-in slide-in-from-top-4">
                    {/* AI Generate Logic UI - Duplicated from rfqs.jsx */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-os-surface-1 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-os-muted" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[var(--os-text-primary)]">AI-Powered Quick RFQ</h3>
                            <p className="text-xs text-os-muted">Describe what you need in plain language — the kernel structures it.</p>
                        </div>
                    </div>
                    <Textarea
                        placeholder='e.g. "I need 20 tons of organic shea butter..."'
                        value={quickRFQText}
                        onChange={(e) => setQuickRFQText(e.target.value)}
                        className="min-h-[90px] mb-3"
                    />

                    {aiResult && (
                        <div className="mb-4 p-4 rounded-lg bg-os-surface-1 border border-os-stroke animate-fade-in">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="h-4 w-4 text-os-muted" />
                                <span className="text-sm font-medium">AI Structured RFQ Preview</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div><p className="text-[10px] uppercase text-os-muted">Product</p>{aiResult.product}</div>
                                <div><p className="text-[10px] uppercase text-os-muted">Qty</p>{aiResult.qty}</div>
                                <div><p className="text-[10px] uppercase text-os-muted">HS Code</p>{aiResult.hsCode}</div>
                                <div><p className="text-[10px] uppercase text-os-muted">Matches</p>{aiResult.suppliers} found</div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowQuickRFQ(false); setAiResult(null); }}>Cancel</Button>
                        {!aiResult ? (
                            <Button size="sm" onClick={handleGenerateRFQ} disabled={aiProcessing || !quickRFQText}>
                                {aiProcessing ? "Processing..." : <><Sparkles className="h-3 w-3 mr-2" /> Generate RFQ</>}
                            </Button>
                        ) : (
                            <Button size="sm" className="gap-2"><Send className="h-3 w-3" /> Send to {aiResult.suppliers} Suppliers</Button>
                        )}
                    </div>
                </Surface>
            )}

            {/* LIST */}
            {isLoading ? (
                <CardSkeleton count={3} />
            ) : rfqs.length === 0 ? (
                <Surface className="p-12 text-center">
                    <EmptyState
                        icon={FileText}
                        title={viewMode === 'buyer' ? "No RFQs found" : "No matches found"}
                        description={viewMode === 'buyer' ? "Create a new RFQ to get started." : "Matched RFQs will appear here."}
                    />
                    {viewMode === 'buyer' && <Button variant="link" onClick={() => setShowQuickRFQ(true)}>Create RFQ</Button>}
                </Surface>
            ) : (
                <div className="space-y-4">
                    {rfqs.map((rfq) => {
                        const config = statusConfig[rfq.status] || statusConfig.draft;
                        // const deadline = ... (skipping format logic for brevity, keeping simple)

                        return (
                            <Surface
                                key={rfq.id}
                                variant="panel"
                                className="p-5 hover:bg-os-surface-2 transition-all cursor-pointer group"
                                onClick={() => navigate(viewMode === 'supplier' ? `/dashboard/one-flow/${rfq.id}` : `/dashboard/trade/${rfq.id}`)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-base font-semibold text-[var(--os-text-primary)]">{rfq.title}</h3>
                                            <StatusBadge label={config.label} tone={config.tone} />
                                            {viewMode === 'supplier' && <SignalChip tone="emerald">Match</SignalChip>}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-os-muted mb-2">
                                            <span className="font-mono text-xs opacity-70">#{rfq.id.slice(0, 8)}</span>
                                            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {rfq.quantity} {rfq.unit}</span>
                                            {rfq.target_price && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {rfq.target_price}</span>}
                                            {rfq.delivery_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {rfq.delivery_location}</span>}
                                        </div>

                                        {rfq.description && <p className="text-xs text-os-muted line-clamp-1">{rfq.description}</p>}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {/* Date or Action */}
                                        <span className="text-xs text-os-muted"><Clock className="h-3 w-3 inline mr-1" /> {format(new Date(rfq.created_at), 'MMM d')}</span>
                                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            {viewMode === 'supplier' ? "Provide Quote" : "View Details"} <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
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
