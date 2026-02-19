import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { Badge } from '@/components/shared/ui/badge';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useRFQs } from '@/hooks/queries/useRFQs';
import { TableSkeleton } from '@/components/shared/ui/skeletons';

function RecentRFQsWidget() {
    const navigate = useNavigate();
    const { profileCompanyId } = useDashboardKernel();

    // ✅ REACT QUERY: Auto-refresh RFQs
    const { data: allRfqs = [], isLoading: loading } = useRFQs();

    // Filter and limit to recent open RFQs
    const rfqs = useMemo(() => {
        return allRfqs
            .filter(rfq => rfq.status === 'open')
            .slice(0, 5);
    }, [allRfqs]);

    if (loading) {
        return (
            <Surface variant="panel" className="p-8 h-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-6 w-40 bg-os-stroke rounded opacity-50" />
                </div>
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-os-stroke rounded-os-md opacity-50" />
                    ))}
                </div>
            </Surface>
        );
    }

    return (
        <Surface variant="panel" className="p-0 overflow-hidden h-full flex flex-col border-none">
            <div className="p-6 border-b border-os-stroke flex items-center justify-between bg-os-surface-solid/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-os-accent/10 rounded-lg">
                        <FileText className="h-5 w-5 text-os-accent" />
                    </div>
                    <div>
                        <h3 className="text-os-sm font-bold uppercase tracking-[0.2em] text-os-text-primary">
                            Corridor Intent
                        </h3>
                        <p className="text-os-xs font-bold text-os-text-secondary/60 uppercase tracking-widest mt-0.5">Global Market Match</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-os-accent hover:bg-os-accent/5 font-bold"
                    onClick={() => navigate('/dashboard/rfqs')}
                >
                    View Flow
                    <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {rfqs.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 rounded-os-md bg-os-bg border border-os-stroke flex items-center justify-center mx-auto mb-4 opacity-50">
                            <FileText className="h-8 w-8 text-os-text-secondary" />
                        </div>
                        <p className="text-os-sm text-os-text-secondary font-medium">No active intent detected</p>
                    </div>
                ) : (
                    rfqs.map((rfq) => {
                        if (!rfq || !rfq.id) return null;

                        return (
                            <div
                                key={rfq.id}
                                className="group p-4 bg-os-surface-solid/50 hover:bg-os-surface-solid border border-os-stroke hover:border-os-accent/30 rounded-os-md transition-all duration-300 cursor-pointer shadow-subtle hover:shadow-os-md flex items-center justify-between"
                                onClick={() => navigate(`/dashboard/rfqs/${rfq.id}`)}
                            >
                                <div className="min-w-0 flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-os-sm font-bold text-os-text-primary truncate transition-colors group-hover:text-os-accent">
                                            {rfq?.title || 'Untitled Request'}
                                        </h4>
                                        <Badge variant="outline" className="text-os-xs font-black h-4 px-1.5 bg-os-accent/10 text-os-accent border-os-accent/20">
                                            LIVE
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-os-xs font-bold text-os-text-secondary/60 uppercase tracking-widest">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {rfq?.created_at ? new Date(rfq.created_at).toLocaleDateString() : 'Now'}
                                        </span>
                                        {rfq?.target_price && (
                                            <span className="text-os-text-primary">
                                                ${Number(rfq.target_price).toLocaleString()}
                                                {rfq?.unit ? `/${rfq.unit}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-1.5 rounded-full bg-os-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                    <ArrowUpRight className="h-4 w-4 text-os-accent" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 bg-os-surface-solid/50 border-t border-os-stroke">
                <Button
                    variant="outline"
                    className="w-full justify-between border-os-stroke bg-transparent hover:bg-os-accent hover:text-white hover:border-os-accent transition-all duration-300 rounded-os-sm h-12 px-6 group/btn"
                    onClick={() => navigate('/dashboard/rfqs/new')}
                >
                    <span className="text-os-xs font-bold uppercase tracking-widest">Define New Intent</span>
                    <PlusIcon className="h-4 w-4 transition-transform group-hover/btn:rotate-90" />
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

