import React from 'react';
import { ShieldCheck, QrCode, FileText } from 'lucide-react';

export default function TradeDocument({
    type = "Commercial Invoice",
    id = "INV-2026-001",
    status = "draft",
    data = {},
    onAutoFill
}) {
    const isVerified = status === 'verified';

    return (
        <div className="relative group w-full bg-white text-black p-8 rounded-sm shadow-2xl overflow-hidden font-serif min-h-[600px] border border-gray-200">

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <ShieldCheck className="w-96 h-96" />
            </div>

            {/* Official Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-full">
                            <span className="font-bold font-sans">A</span>
                        </div>
                        <span className="text-xl font-bold tracking-widest uppercase">Afrikoni Trade OS</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mt-4">{type}</h1>
                    <p className="text-sm text-gray-500 font-sans mt-1">Official Trade Record • ISO 20022 Compliant</p>
                </div>
                <div className="text-right">
                    <div className="border-2 border-black p-2 inline-block">
                        <QrCode className="w-16 h-16" />
                    </div>
                    <div className="text-xs font-mono mt-2">{id}</div>
                </div>
            </div>

            {/* Document Body (Simulated Form) */}
            <div className="grid grid-cols-2 gap-8 font-sans text-sm relative z-10">
                <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Exporter / Consignor</label>
                        <div className="font-medium text-lg min-h-[1.5em]">{data.exporter || '—'}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Consignee</label>
                        <div className="font-medium text-lg min-h-[1.5em]">{data.consignee || '—'}</div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Origin Country</label>
                        <div className="font-medium text-lg min-h-[1.5em]">{data.origin || '—'}</div>
                    </div>
                    <div className="border-b border-gray-200 pb-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Terms of Trade (Incoterms)</label>
                        <div className="font-medium text-lg min-h-[1.5em]">{data.incoterms || '—'}</div>
                    </div>
                </div>
            </div>

            {/* Line Items Area */}
            <div className="mt-12 border border-black min-h-[200px] relative z-10">
                <div className="bg-black text-white p-2 text-xs font-bold uppercase grid grid-cols-12 gap-4">
                    <div className="col-span-1">No.</div>
                    <div className="col-span-5">Description of Goods</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="p-4">
                    {data.items?.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 text-sm py-2 border-b border-gray-100 font-mono">
                            <div className="col-span-1 text-gray-500">{i + 1}</div>
                            <div className="col-span-5 font-bold">{item.desc}</div>
                            <div className="col-span-2 text-right">{item.qty}</div>
                            <div className="col-span-2 text-right">{item.price}</div>
                            <div className="col-span-2 text-right">{item.total}</div>
                        </div>
                    )) || <div className="text-center text-gray-300 py-10 italic">No line items added</div>}
                </div>
            </div>

            {/* AI Auto-Fill Action */}
            {!data.exporter && onAutoFill && (
                <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                    <button
                        onClick={onAutoFill}
                        className="group relative px-8 py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-koni-gold hover:text-black transition-colors shadow-2xl flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-koni-gold group-hover:bg-black animate-pulse" />
                        Auto-Generate Document
                    </button>
                </div>
            )}

            {/* Verification Stamp */}
            {isVerified && (
                <div className="absolute bottom-10 right-10 rotate-[-15deg] border-4 border-emerald-600 text-emerald-600 px-6 py-2 font-black uppercase text-2xl tracking-widest opacity-80 mix-blend-multiply z-20">
                    Digitally Verified
                    <div className="text-[10px] font-mono font-normal tracking-normal text-center mt-1">Afrikoni Trust Kernel</div>
                </div>
            )}
        </div>
    );
}
