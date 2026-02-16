import React from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useOutletContext } from 'react-router-dom';
import { ControlPlaneDashboard } from '@/components/trade-os/ControlPlaneDashboard';
import { PageLoader } from '@/components/shared/ui/skeletons';

export default function ControlPlanePage() {
    const { isSystemReady } = useDashboardKernel();
    const { systemState, isLoading, error, refreshSystemState: refresh } = useOutletContext() || {};

    if (!isSystemReady) {
        return <PageLoader />;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <PageLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-os-red font-medium">{error}</p>
                <button 
                    onClick={refresh}
                    className="mt-4 px-4 py-2 bg-os-gold text-black rounded-lg text-os-sm font-semibold"
                >
                    Retry Handshake
                </button>
            </div>
        );
    }

    return (
        <div className="os-page os-stagger">
            <div className="mb-6">
                <div className="os-label">Infrastructure Monitoring</div>
                <h1 className="os-title mt-2">Trade OS Control Plane</h1>
            </div>

            <ControlPlaneDashboard systemState={systemState} onRefresh={refresh} />
        </div>
    );
}
