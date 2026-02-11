/**
 * ============================================================================
 * LITE MODE DASHBOARD - Simplified SME Interface
 * ============================================================================
 * 
 * A beginner-friendly 5-tab interface that progressively unlocks features
 * as users complete trades and build trust.
 * 
 * Tabs: Products | Messages | Trades | Payments | Performance
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { ProgressiveUnlock } from '@/components/system/ProgressiveUnlock';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import {
    Package, MessageSquare, TrendingUp, CreditCard, BarChart3,
    Sparkles, ArrowRight, Plus, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LITE_TABS = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'trades', label: 'Trades', icon: TrendingUp },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
];

export default function LiteModeDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useDashboardKernel();
    const [activeTab, setActiveTab] = useState('trades');

    return (
        <div className="min-h-screen bg-[#0A0E13] text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-gradient-to-r from-[#0E1016] to-[#141B24]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#D4A937] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Afrikoni Lite</h1>
                                <p className="text-xs text-white/60">Simple, powerful trading</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/dashboard/settings')}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                            <Button
                                onClick={() => navigate('/dashboard/quick-trade')}
                                className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Trade
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-white/10 bg-[#0E1016]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto">
                        {LITE_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap",
                                        isActive
                                            ? "border-[#D4A937] text-white"
                                            : "border-transparent text-white/60 hover:text-white/80"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'products' && <ProductsTab />}
                        {activeTab === 'messages' && <MessagesTab />}
                        {activeTab === 'trades' && <TradesTab />}
                        {activeTab === 'payments' && <PaymentsTab />}
                        {activeTab === 'performance' && <PerformanceTab />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progressive Unlock Notifications */}
            <ProgressiveUnlock />
        </div>
    );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function ProductsTab() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Your Products</h2>
                    <p className="text-sm text-white/60 mt-1">Manage what you're selling</p>
                </div>
                <Button
                    onClick={() => navigate('/dashboard/products')}
                    className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <Surface variant="glass" className="p-8 text-center border border-white/10">
                <Package className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
                    Add your first product to start receiving trade requests from verified buyers across Africa.
                </p>
                <Button
                    onClick={() => navigate('/dashboard/products')}
                    className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                >
                    Add Your First Product
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Surface>
        </div>
    );
}

function MessagesTab() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Messages</h2>
                    <p className="text-sm text-white/60 mt-1">Chat with buyers and suppliers</p>
                </div>
            </div>

            <Surface variant="glass" className="p-8 text-center border border-white/10">
                <MessageSquare className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
                    Start a trade to begin chatting with verified partners.
                </p>
                <Button
                    onClick={() => navigate('/dashboard/quick-trade')}
                    className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                >
                    Start Your First Trade
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Surface>
        </div>
    );
}

function TradesTab() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Your Trades</h2>
                    <p className="text-sm text-white/60 mt-1">Track all your active deals</p>
                </div>
                <Button
                    onClick={() => navigate('/dashboard/quick-trade')}
                    className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Trade
                </Button>
            </div>

            {/* Quick Start Guide */}
            <Surface variant="glass" className="p-6 border border-[#D4A937]/20 bg-[#D4A937]/5">
                <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-[#D4A937] mt-1 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Ready to start trading?</h3>
                        <p className="text-sm text-white/70 mb-4">
                            Our Quick Trade wizard will guide you through creating your first trade in under 2 minutes.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => navigate('/dashboard/quick-trade')}
                                className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                            >
                                Start Quick Trade
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/corridors')}
                                className="border-white/20 hover:bg-white/5"
                            >
                                Explore Trade Corridors
                            </Button>
                        </div>
                    </div>
                </div>
            </Surface>

            {/* Empty State */}
            <Surface variant="glass" className="p-8 text-center border border-white/10">
                <TrendingUp className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active trades</h3>
                <p className="text-sm text-white/60 max-w-md mx-auto">
                    Your trades will appear here once you create your first one.
                </p>
            </Surface>
        </div>
    );
}

function PaymentsTab() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Payments</h2>
                    <p className="text-sm text-white/60 mt-1">Track money in and out</p>
                </div>
            </div>

            <Surface variant="glass" className="p-8 text-center border border-white/10">
                <CreditCard className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
                <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
                    Complete your first trade to see payment history and escrow details.
                </p>
                <Button
                    onClick={() => navigate('/dashboard/quick-trade')}
                    className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                >
                    Start Trading
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Surface>
        </div>
    );
}

function PerformanceTab() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Performance</h2>
                    <p className="text-sm text-white/60 mt-1">See how you're doing</p>
                </div>
            </div>

            {/* Unlock Notice */}
            <Surface variant="glass" className="p-6 border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Unlock Performance Insights</h3>
                        <p className="text-sm text-white/70 mb-4">
                            Complete your first trade to unlock detailed performance metrics, trust score tracking, and market insights.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                <span>0/1 trades completed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Surface>

            <Surface variant="glass" className="p-8 text-center border border-white/10">
                <BarChart3 className="w-16 h-16 mx-auto text-white/40 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                <p className="text-sm text-white/60 max-w-md mx-auto">
                    Your performance metrics will appear here after your first trade.
                </p>
            </Surface>
        </div>
    );
}
