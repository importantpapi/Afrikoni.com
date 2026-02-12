import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Activity } from 'lucide-react';

export const TradeFlowTimeline = ({ trades = [] }) => {
    const navigate = useNavigate();
    // Mock stages if no real trades yet
    const stages = [
        { label: 'RFQ', count: (trades || []).filter(t => ['draft', 'rfq_open'].includes(t.status || '')).length },
        { label: 'Quote', count: (trades || []).filter(t => ['quoted'].includes(t.status || '')).length },
        { label: 'Contract', count: (trades || []).filter(t => ['contracted'].includes(t.status || '')).length },
        { label: 'Escrow', count: (trades || []).filter(t => ['escrow_required', 'escrow_funded'].includes(t.status || '')).length },
        { label: 'Shipment', count: (trades || []).filter(t => ['pickup_scheduled', 'in_transit'].includes(t.status || '')).length },
        { label: 'Delivery', count: (trades || []).filter(t => ['delivered', 'accepted'].includes(t.status || '')).length },
        { label: 'Settlement', count: (trades || []).filter(t => ['settled', 'closed'].includes(t.status || '')).length },
    ];

    return (
        <Surface variant="glass" className="p-6 border border-afrikoni-gold/10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#D4A937]" />
                    Active Trade Pipeline
                </h3>
                <button className="text-[10px] uppercase font-bold text-[#D4A937] hover:underline" onClick={() => navigate('/dashboard/trade-pipeline')}>
                    View Full Map
                </button>
            </div>

            <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-afrikoni-gold/20 z-0" />

                <div className="grid grid-cols-7 gap-2 relative z-10">
                    {stages.map((stage, i) => {
                        const isActive = stage.count > 0;
                        return (
                            <div key={stage.label} className="flex flex-col items-center gap-3 group cursor-pointer hover:bg-afrikoni-cream/20 rounded-lg py-2 transition-colors">
                                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all
                  ${isActive
                                        ? 'bg-white dark:bg-[#D4A937]/10 border-[#D4A937] text-[#D4A937] shadow-[0_0_15px_rgba(212,169,55,0.3)] scale-110'
                                        : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-400'}
                `}>
                                    <span className="text-[10px] font-bold">{stage.count}</span>
                                </div>
                                <div className="text-center">
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-afrikoni-deep' : 'text-gray-400'}`}>
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
