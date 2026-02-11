/**
 * ============================================================================
 * CONTROL PLANE PAGE - Trade System Mission Control
 * ============================================================================
 * 
 * This is the dedicated page for the Control Plane dashboard.
 * Users can view complete system state and manage orchestration rules.
 */

import React from 'react';
import { ControlPlaneDashboard } from '@/components/trade-os/ControlPlaneDashboard';
import { useTradeSystemState } from '@/hooks/useTradeSystemState';
import { PageLoader } from '@/components/shared/ui/skeletons';

export default function ControlPlanePage() {
    const { systemState, isLoading, error, refresh } = useTradeSystemState();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <PageLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Failed to load system state</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-afrikoni-gold text-black rounded-lg hover:bg-afrikoni-gold/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <ControlPlaneDashboard systemState={systemState} />
        </div>
    );
}
