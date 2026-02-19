import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    FileText,
    Package,
    ShieldCheck,
    Truck,
    Users
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import QuickRFQBar from '@/components/dashboard/QuickRFQBar';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

function QuickActionsWidget() {
    const navigate = useNavigate();
    const { capabilities } = useDashboardKernel();

    if (!capabilities) {
        return (
            <Surface variant="panel" className="p-8">
                <div className="opacity-50 space-y-6">
                    <div className="h-6 bg-os-stroke rounded w-1/3" />
                    <div className="h-20 bg-os-stroke rounded-os-md" />
                </div>
            </Surface>
        );
    }

    const canSell = capabilities?.can_sell === true;
    const canBuy = capabilities?.can_buy === true;

    return (
        <Surface variant="panel" className="p-8 space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-os-accent/10 rounded-lg">
                        <Zap className="h-5 w-5 text-os-accent" />
                    </div>
                    <h3 className="text-os-sm font-bold uppercase tracking-[0.2em] text-os-text-primary">
                        OS Core
                    </h3>
                </div>
                <p className="text-os-xs font-bold text-os-text-secondary/60 uppercase tracking-widest mt-1">
                    Sub-millisecond access to trade tools
                </p>
            </div>

            {/* AI Quick RFQ */}
            {canBuy && (
                <div className="space-y-3">
                    <label className="text-os-xs font-black text-os-text-secondary uppercase tracking-[0.3em] block mb-2">
                        Neural Input
                    </label>
                    <QuickRFQBar />
                </div>
            )}

            <div className="space-y-4">
                <label className="text-os-xs font-black text-os-text-secondary uppercase tracking-[0.3em] block mb-4">
                    Orchestration
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {canBuy && (
                        <Button
                            variant="outline"
                            className="h-auto py-5 flex flex-col gap-3 hover:bg-os-accent/5 border-os-stroke hover:border-os-accent/30 rounded-os-md transition-all duration-300 group"
                            onClick={() => navigate('/dashboard/rfqs/new')}
                        >
                            <div className="p-3 rounded-os-md bg-os-accent/10 text-os-accent transition-transform group-hover:scale-110">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-os-xs font-bold uppercase tracking-widest text-os-text-primary">Intent</span>
                        </Button>
                    )}

                    {canSell && (
                        <Button
                            variant="outline"
                            className="h-auto py-5 flex flex-col gap-3 hover:bg-os-accent/5 border-os-stroke hover:border-os-accent/30 rounded-os-md transition-all duration-300 group"
                            onClick={() => navigate('/dashboard/products/new')}
                        >
                            <div className="p-3 rounded-os-md bg-amber-500/10 text-amber-500 transition-transform group-hover:scale-110">
                                <Package className="w-5 h-5" />
                            </div>
                            <span className="text-os-xs font-bold uppercase tracking-widest text-os-text-primary">Match</span>
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="h-auto py-5 flex flex-col gap-3 hover:bg-os-accent/5 border-os-stroke hover:border-os-accent/30 rounded-os-md transition-all duration-300 group"
                        onClick={() => navigate('/dashboard/verification')}
                    >
                        <div className="p-3 rounded-os-md bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-os-xs font-bold uppercase tracking-widest text-os-text-primary">Trust</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-auto py-5 flex flex-col gap-3 hover:bg-os-accent/5 border-os-stroke hover:border-os-accent/30 rounded-os-md transition-all duration-300 group"
                        onClick={() => navigate('/dashboard/network')}
                    >
                        <div className="p-3 rounded-os-md bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-os-xs font-bold uppercase tracking-widest text-os-text-primary">Network</span>
                    </Button>
                </div>
            </div>
        </Surface>
    );
}

export default memo(QuickActionsWidget);
