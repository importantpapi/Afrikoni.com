import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { Badge } from '@/components/shared/ui/badge';
import { supabase, withRetry } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { TableSkeleton } from '@/components/shared/ui/skeletons';

function RecentRFQsWidget() {
    const navigate = useNavigate();
    const { profileCompanyId } = useDashboardKernel();
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRecentRFQs() {
            // ✅ GUARD: Prevent infinite loading if no company ID
            if (!profileCompanyId) {
                setLoading(false);
                return;
            }

            try {
                if (rfqs.length === 0) setLoading(true);

                const fetchRFQs = async () => {
                    const { data, error } = await supabase
                        .from('rfqs')
                        .select('id, title, created_at, status, target_price, unit')
                        .eq('status', 'open')
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (error) throw error;
                    return data;
                };

                // Use retry wrapper for network resilience
                const data = await withRetry(fetchRFQs);
                setRfqs(data || []);
            } catch (err) {
                // Silently handle error to prevent log bloat on mobile
            } finally {
                setLoading(false);
            }
        }

        loadRecentRFQs();
    }, [profileCompanyId, rfqs.length]); // ✅ FIX: This will re-run when profileCompanyId becomes available

    if (loading) {
        return (
            <Surface variant="panel" className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-32 bg-os-surface-2 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-os-surface-1 rounded-lg animate-pulse" />
                    ))}
                </div>
            </Surface>
        );
    }

    return (
        <Surface variant="panel" className="p-0 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-os-stroke flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-os-muted" />
                    <h3 className="text-lg font-semibold text-[var(--os-text-primary)]">
                        Market Opportunities
                    </h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-os-muted hover:text-[var(--os-text-primary)]"
                    onClick={() => navigate('/dashboard/rfqs')}
                >
                    View All
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {rfqs.length === 0 ? (
                    <div className="p-8 text-center text-os-muted">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No active RFQs found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-os-stroke">
                        {(rfqs || []).map((rfq) => (
                            <div
                                key={rfq.id}
                                className="p-4 hover:bg-os-surface-1 transition-colors cursor-pointer group flex items-center justify-between"
                                onClick={() => navigate(`/rfq/detail?id=${rfq.id}`)}
                            >
                                <div className="min-w-0 flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-[var(--os-text-primary)] truncate">
                                            {rfq.title}
                                        </h4>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-600 border-green-500/20">
                                            OPEN
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-os-muted">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(rfq.created_at).toLocaleDateString()}
                                        </span>
                                        {rfq.target_price && (
                                            <span className="font-medium text-[var(--os-text-primary)]">
                                                ${rfq.target_price.toLocaleString()}
                                                {rfq.unit ? `/${rfq.unit}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-os-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-os-surface-1 border-t border-os-stroke">
                <Button
                    variant="outline"
                    className="w-full justify-between text-os-muted hover:text-[var(--os-text-primary)]"
                    onClick={() => navigate('/dashboard/rfqs/new')}
                >
                    <span>Post a Request</span>
                    <PlusIcon className="h-4 w-4" />
                </Button>
            </div>
        </Surface>
    );
}

function PlusIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}

export default memo(RecentRFQsWidget);

