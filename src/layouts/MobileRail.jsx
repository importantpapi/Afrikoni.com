import React from 'react';
import { Surface } from '@/components/ui/Surface';
import { ChevronRight, Shield, Clock, MapPin, DollarSign } from 'lucide-react';

export default function MobileRail({ trade }) {
    const status = trade?.status || 'RFQ_OPEN';

    return (
        <div className="flex flex-col gap-4 p-4 pb-24 bg-black text-[#E8E8E8] font-sans antialiased">
            {/* Header: High Contrast & Simple */}
            <div className="border-b border-[#222] pb-4 mb-2">
                <p className="text-[#888] text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Trade ID: {trade?.id?.slice(0, 8)}</p>
                <h1 className="text-2xl font-black text-white">{trade?.title || 'ONE FLOW ENTRY'}</h1>
            </div>

            {/* Status Indicator */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111] border border-[#333] p-4 rounded-xl">
                    <p className="text-[10px] text-[#888] uppercase font-black mb-1">Status</p>
                    <p className="text-afrikoni-gold font-bold text-sm tracking-tight">{status.toUpperCase()}</p>
                </div>
                <div className="bg-[#111] border border-[#333] p-4 rounded-xl">
                    <p className="text-[10px] text-[#888] uppercase font-black mb-1">Verify DNA</p>
                    <p className="text-emerald-500 font-bold text-sm">SECURE</p>
                </div>
            </div>

            {/* Action Items: Large targets for field use */}
            <div className="space-y-3">
                <MobileActionItem
                    icon={<Shield className="w-5 h-5" />}
                    title="Confirm Goods Quality"
                    desc="Agent Verification Link"
                    color="text-afrikoni-gold"
                />
                <MobileActionItem
                    icon={<MapPin className="w-5 h-5" />}
                    title="Set Location DNA"
                    desc="Captures GPS Fingerprint"
                    color="text-blue-400"
                />
                <MobileActionItem
                    icon={<DollarSign className="w-5 h-5" />}
                    title="Settlement Request"
                    desc="Instant PAPSS Payout"
                    color="text-emerald-400"
                />
            </div>

            {/* High-Impact Info: No heavy tables */}
            <Surface variant="glass" className="p-6 border-[#222] bg-[#050505]">
                <h3 className="text-xs font-black text-[#555] uppercase tracking-widest mb-4">Trade Summary</h3>
                <div className="space-y-4">
                    <dl className="flex justify-between items-center text-sm">
                        <dt className="text-[#888]">Commodity</dt>
                        <dd className="font-bold">Cacao (Grade A)</dd>
                    </dl>
                    <dl className="flex justify-between items-center text-sm">
                        <dt className="text-[#888]">Weight</dt>
                        <dd className="font-bold">2.5 Tons</dd>
                    </dl>
                    <dl className="flex justify-between items-center text-sm">
                        <dt className="text-[#888]">Destination</dt>
                        <dd className="font-bold">Tema Port, Ghana</dd>
                    </dl>
                </div>
            </Surface>
        </div>
    );
}

function MobileActionItem({ icon, title, desc, color }) {
    return (
        <button className="w-full flex items-center justify-between p-5 bg-[#111] hover:bg-[#161616] border border-[#222] rounded-2xl active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
                <div className={`${color}`}>
                    {icon}
                </div>
                <div className="text-left">
                    <p className="font-black text-sm text-white tracking-tight">{title}</p>
                    <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider">{desc}</p>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#444]" />
        </button>
    );
}
