import React, { useEffect, useState } from 'react';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { Button } from '@/components/shared/ui/button';
import { Package, Truck, AlertCircle, ExternalLink, MapPin, Calendar, Boxes } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { cn } from '@/lib/utils';

const shipmentStatusTone = {
    pending: 'pending',
    in_transit: 'amber',
    delivered: 'verified',
    cancelled: 'rejected'
};

export default function FulfillmentPage() {
    const { profileCompanyId, isSystemReady, canLoadData } = useDashboardKernel();
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!isSystemReady || !canLoadData || !profileCompanyId) return;
            try {
                const { data, error: shipError } = await supabase
                    .from('shipments')
                    .select('*')
                    .eq('company_id', profileCompanyId)
                    .order('created_at', { ascending: false });

                if (!active) return;
                if (shipError) throw shipError;
                setShipments(data || []);
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [profileCompanyId, isSystemReady, canLoadData]);

    if (isLoading) {
        return (
            <div className="os-page-layout space-y-6">
                <div className="os-header-group">
                    <h1>Fulfillment Center</h1>
                    <p>Loading your logistics data...</p>
                </div>
                <Surface className="p-12 text-center">Initialising Logistics Kernel...</Surface>
            </div>
        );
    }

    return (
        <div className="os-page-layout os-stagger space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="os-header-group">
                    <div className="flex items-center gap-2 mb-1">
                        <Boxes className="w-4 h-4 text-emerald-500" />
                        <span className="os-label !mb-0">Logistics Control</span>
                    </div>
                    <h1>Fulfillment Center</h1>
                    <p>Track global movements, customs status, and final mile delivery.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-xs h-9">Export Manifest</Button>
                    <Button className="text-xs h-9 bg-os-accent text-black font-bold">New Shipment</Button>
                </div>
            </div>

            {error && (
                <Surface variant="panel" className="p-4 border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                </Surface>
            )}

            {shipments.length === 0 ? (
                <Surface variant="panel" className="p-20 flex flex-col items-center justify-center text-center gap-6 border-dashed border-os-stroke">
                    <div className="p-6 rounded-full bg-os-surface-2 ring-8 ring-os-surface-1">
                        <Truck className="w-12 h-12 text-os-muted/40" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-os-xl font-bold mb-2">No active shipments</h3>
                        <p className="text-os-muted mb-6">Your logistics queue is currently empty. Once you receive orders or initiate exports, they will appear here for tracking.</p>
                        <Button variant="outline" className="rounded-full px-8">Browse Logistics Partners</Button>
                    </div>
                </Surface>
            ) : (
                <div className="grid gap-4">
                    {shipments.map((ship) => (
                        <Surface key={ship.id} variant="panel" className="p-6 group hover:border-os-accent/30 transition-all">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <StatusBadge
                                            label={ship.status?.toUpperCase().replace('_', ' ')}
                                            tone={shipmentStatusTone[ship.status] || 'neutral'}
                                        />
                                        <span className="text-os-xs font-mono text-os-muted uppercase tracking-tighter">
                                            #{ship.tracking_number || ship.id.slice(0, 8)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded bg-os-surface-2 mt-1">
                                                <MapPin className="w-4 h-4 text-os-muted" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-os-muted tracking-widest">Route</p>
                                                <p className="text-os-sm font-bold">
                                                    {ship.origin_country || '—'} → {ship.destination_country || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded bg-os-surface-2 mt-1">
                                                <Calendar className="w-4 h-4 text-os-muted" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-os-muted tracking-widest">Created</p>
                                                <p className="text-os-sm font-bold">
                                                    {new Date(ship.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center lg:items-end gap-3 min-w-[160px]">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] uppercase font-black text-os-muted tracking-widest mb-1">Carrier</p>
                                        <p className="text-os-sm font-mono">{ship.carrier || 'Handled by Afrikoni'}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="w-full lg:w-fit gap-2 group-hover:bg-os-accent/10">
                                        View Details <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </Surface>
                    ))}
                </div>
            )}
        </div>
    );
}
