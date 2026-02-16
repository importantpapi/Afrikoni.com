import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import {
    Plus, Search, ShieldCheck, ArrowRight,
    LayoutDashboard, Globe, Package
} from 'lucide-react';

export default function DashboardEmptyState() {
    const navigate = useNavigate();

    return (
        <Surface variant="glass" className="p-8 md:p-12 border border-os-accent/20 relative overflow-hidden text-center">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-os-accent/5 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4A937]/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-os-blue/10 rounded-full blur-[80px]" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-os-md bg-gradient-to-br from-[#D4A937] to-[#B08920] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(212,169,55,0.3)]">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-os-2xl md:text-3xl font-light text-[var(--os-text-primary)] mb-3">
                    Initialize Your Trade Mission
                </h2>
                <p className="text-os-muted mb-10 max-w-md mx-auto leading-relaxed">
                    Your Command Center is ready. The Afrikoni OS is standing by to secure, fund, and move your cargo across the continent.
                </p>

                <div className="grid md:grid-cols-3 gap-4 w-full text-left">
                    {/* Action 1: Buyer Flow */}
                    <button
                        onClick={() => navigate('/dashboard/quick-trade')}
                        className="group p-5 rounded-os-sm border border-os-accent/20 bg-white/5 hover:bg-os-accent/10 transition-all hover:scale-[1.02] hover:shadow-os-md"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#D4A937]/20 flex items-center justify-center mb-4 text-[#D4A937] group-hover:bg-[#D4A937] group-hover:text-black transition-colors">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-[var(--os-text-primary)] mb-1">New Trade</h3>
                        <p className="text-os-xs text-os-muted">Draft a specialized RFQ for cocoa, coffee, or minerals.</p>
                    </button>

                    {/* Action 2: Seller Flow */}
                    <button
                        onClick={() => navigate('/dashboard/products/new')}
                        className="group p-5 rounded-os-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02]"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Package className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-[var(--os-text-primary)] mb-1">Add Product</h3>
                        <p className="text-os-xs text-os-muted">List your inventory to global buyers.</p>
                    </button>

                    {/* Action 3: Exploration */}
                    <button
                        onClick={() => navigate('/dashboard/corridors')}
                        className="group p-5 rounded-os-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02]"
                    >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-[var(--os-text-primary)] mb-1">Explore Routes</h3>
                        <p className="text-os-xs text-os-muted">Analyze live corridor data and tariffs.</p>
                    </button>
                </div>

                <div className="mt-10 flex items-center gap-2 text-os-xs text-os-muted">
                    <ShieldCheck className="w-4 h-4 text-[#D4A937]" />
                    <span>Protected by Afrikoni Trade Assurance &bull; Escrow Secured</span>
                </div>
            </div>
        </Surface>
    );
}
