
import React from 'react';
import { Surface } from '@/components/system/Surface';
import { Package, Truck, AlertCircle } from 'lucide-react';

export default function FulfillmentPage() {
    return (
        <div className="os-page-layout">
            <div className="os-header-group">
                <h1>Fulfillment Center</h1>
                <p>Manage shipment logistics and tracking.</p>
            </div>

            <Surface variant="glass" className="p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-os-stroke">
                <div className="p-4 rounded-full bg-os-surface-2">
                    <Truck className="w-8 h-8 text-os-muted" />
                </div>
                <div>
                    <h3 className="text-os-lg font-bold">No active shipments</h3>
                    <p className="text-os-muted">Your fulfillment queue is currently empty.</p>
                </div>
            </Surface>
        </div>
    );
}
