import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Activity } from 'lucide-react';

export const TradeFlowTimeline = ({ trades = [] }) => {
    const navigate = useNavigate();
    
    // ✅ MOBILE GUARD: Ensure trades is always an array
    const safeTrades = Array.isArray(trades) ? trades : [];
    
    // Mock stages if no real trades yet
    const stages = [
        { label: 'RFQ', count: safeTrades.filter(t => t && ['draft', 'rfq_open'].includes(t?.status || '')).length },
        { label: 'Quote', count: safeTrades.filter(t => t && ['quoted'].includes(t?.status || '')).length },
        { label: 'Contract', count: safeTrades.filter(t => t && ['contracted'].includes(t?.status || '')).length },
        { label: 'Escrow', count: safeTrades.filter(t => t && ['escrow_required', 'escrow_funded'].includes(t?.status || '')).length },
        { label: 'Shipment', count: safeTrades.filter(t => t && ['pickup_scheduled', 'in_transit'].includes(t?.status || '')).length },
        { label: 'Delivery', count: safeTrades.filter(t => t && ['delivered', 'accepted'].includes(t?.status || '')).length },
        { label: 'Settlement', count: safeTrades.filter(t => t && ['settled', 'closed'].includes(t?.status || '')).length },
    ];

    return (
        <Surface variant="panel" className="p-6 border border-os-accent/10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-os-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-os-accent" />
                    Active Trade Pipeline
                </h3>
                <button className="text-os-xs uppercase font-bold text-os-accent hover:underline" onClick={() => navigate('/dashboard/trade-pipeline')}>
                    View Full Map
                </button>
            </div>

            <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-os-accent/20 z-0" />

                <div className="grid grid-cols-7 gap-2 relative z-10">
                    {stages.map((stage, i) => {
                        const isActive = stage.count > 0;
                        return (
                            <div key={stage.label} className="flex flex-col items-center gap-3 group cursor-pointer hover:bg-afrikoni-cream/20 rounded-lg py-2 transition-colors">
                                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all
                  ${isActive
                                        ? 'bg-white dark:bg-os-accent/10 border-os-accent text-os-accent shadow-[0_0_15px_rgba(212,169,55,0.3)] scale-110'
                                        : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-400'}
                `}>
                                    <span className="text-os-xs font-bold">{stage.count}</span>
                                </div>
                                <div className="text-center">
                                    <div className={`text-os-xs font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-afrikoni-deep' : 'text-gray-400'}`}>
                                        {stage.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Surface>
    );
};
