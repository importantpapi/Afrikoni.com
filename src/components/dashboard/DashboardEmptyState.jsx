import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import {
    Plus, Search, ShieldCheck, ArrowRight,
    LayoutDashboard, Globe, Package, MessageCircle
} from 'lucide-react';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';

export default function DashboardEmptyState() {
    const navigate = useNavigate();

    return (
        <Surface variant="panel" className="p-8 md:p-12 border border-os-accent/20 relative overflow-hidden text-center">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-os-accent/5 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-os-accent/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-os-blue/10 rounded-full blur-[80px]" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-os-md bg-gradient-to-br from-os-accent to-os-accent-dark flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(212,169,55,0.3)]">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-os-2xl md:text-3xl font-light text-[var(--os-text-primary)] mb-3">
                    Welcome to Afrikoni
                </h2>
                <p className="text-os-muted mb-10 max-w-md mx-auto leading-relaxed">
                    Your dashboard is ready. Start trading by creating a request, listing a product, or exploring trade routes across Africa.
                </p>

                <div className="grid md:grid-cols-3 gap-4 w-full text-left">
                    {/* Action 1: Buyer Flow */}
                    <button
                        onClick={() => navigate('/dashboard/quick-trade')}
                        className="group p-5 rounded-os-sm border border-os-stroke bg-white hover:bg-os-bg hover:border-os-accent/30 transition-all hover:scale-[1.02] hover:shadow-os-md text-left relative overflow-hidden"
                    >
                        <div className="w-10 h-10 rounded-lg bg-os-accent/10 flex items-center justify-center mb-4 text-os-accent group-hover:bg-os-accent group-hover:text-black transition-colors">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-[var(--os-text-primary)] mb-1">New Trade</h3>
                        <p className="text-os-xs text-os-text-secondary">Draft a specialized RFQ for cocoa, coffee, or minerals.</p>
                    </button>

                    {/* Action 2: Seller Flow */}
                    <button
                        onClick={() => navigate('/dashboard/products/new')}
                        className="group p-5 rounded-os-sm border border-os-stroke bg-white hover:bg-os-bg hover:border-blue-200 transition-all hover:scale-[1.02] hover:shadow-os-md text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Package className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-[var(--os-text-primary)] mb-1">Add Product</h3>
                        <p className="text-os-xs text-os-text-secondary">List your inventory to global buyers.</p>
                    </button>

                    {/* Action 3: Exploration */}
                    <button
                        onClick={() => navigate('/dashboard/corridors')}
                        className="group p-5 rounded-os-sm border border-os-stroke bg-white hover:bg-os-bg hover:border-emerald-200 transition-all hover:scale-[1.02] hover:shadow-os-md text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-[var(--os-text-primary)] mb-1">Explore Routes</h3>
                        <p className="text-os-xs text-os-text-secondary">Analyze live corridor data and tariffs.</p>
                    </button>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-os-xs text-os-muted">
                        <ShieldCheck className="w-4 h-4 text-os-accent" />
                        <span>Protected by Afrikoni Trade Assurance</span>
                    </div>
                    <button
                        onClick={() => openWhatsAppCommunity('dashboard_empty_state')}
                        className="flex items-center gap-2 text-os-xs font-semibold text-green-500 hover:text-green-400 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Need help? Chat with us on WhatsApp</span>
                    </button>
                </div>
            </div>
        </Surface>
    );
}
