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

    // ✅ MOBILE GUARD: Prevent crash if capabilities null on slow connection
    if (!capabilities) {
        return (
            <Surface variant="glass" className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/10 rounded w-1/3" />
                    <div className="h-16 bg-white/10 rounded" />
                </div>
            </Surface>
        );
    }

    const canSell = capabilities?.can_sell === true;
    const canBuy = capabilities?.can_buy === true;

    return (
        <Surface variant="glass" className="p-6">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--os-text-primary)] mb-1">
                        Command Center
                    </h3>
                    <p className="text-sm text-os-muted mb-4">
                        Quickly access common actions and trading tools.
                    </p>

                    {/* AI Quick RFQ */}
                    {canBuy && (
                        <div className="mb-6">
                            <label className="text-xs font-medium text-os-muted mb-2 block uppercase tracking-wider">
                                AI Quick Request
                            </label>
                            <QuickRFQBar />
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs font-medium text-os-muted mb-3 block uppercase tracking-wider">
                        Shortcuts
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {canBuy && (
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-2 hover:bg-os-surface-2 border-dashed border-os-stroke"
                                onClick={() => navigate('/dashboard/rfqs/new')}
                            >
                                <div className="p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium">New RFQ</span>
                            </Button>
                        )}

                        {canSell && (
                            <Button
                                variant="outline"
                                className="h-auto py-3 flex flex-col gap-2 hover:bg-os-surface-2 border-dashed border-os-stroke"
                                onClick={() => navigate('/dashboard/products/new')}
                            >
                                <div className="p-2 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium">Add Product</span>
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            className="h-auto py-3 flex flex-col gap-2 hover:bg-os-surface-2 border-dashed border-os-stroke"
                            onClick={() => navigate('/dashboard/verification')}
                        >
                            <div className="p-2 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">Verify</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-3 flex flex-col gap-2 hover:bg-os-surface-2 border-dashed border-os-stroke"
                            onClick={() => navigate('/dashboard/network')}
                        >
                            <div className="p-2 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">Network</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Surface>
    );
}

export default memo(QuickActionsWidget);
