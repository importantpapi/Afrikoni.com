/**
 * ============================================================================
 * TRADE READINESS BAR - Top-Level System Status
 * ============================================================================
 * 
 * This component displays the Trade Readiness Score at the top of every page.
 * It's the single most important metric in the Trade OS.
 * 
 * Always visible, always actionable.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Wallet, Truck, TrendingUp, AlertTriangle, Sparkles, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const SystemIndicator = ({ icon: Icon, label, status, value, onClick }) => {
    const statusColors = {
        good: 'text-emerald-600 bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400',
        warning: 'text-amber-600 bg-amber-50/50 border-amber-200/50 dark:bg-amber-500/5 dark:border-amber-500/20 dark:text-amber-400',
        error: 'text-red-600 bg-red-50/50 border-red-200/50 dark:bg-red-500/5 dark:border-red-500/20 dark:text-red-400',
        compliant: 'text-emerald-600 bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400',
        pending: 'text-amber-600 bg-amber-50/50 border-amber-200/50 dark:bg-amber-500/5 dark:border-amber-500/20 dark:text-amber-400',
        at_risk: 'text-red-600 bg-red-50/50 border-red-200/50 dark:bg-red-500/5 dark:border-red-500/20 dark:text-red-400',
        funded: 'text-emerald-600 bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400',
        required: 'text-amber-600 bg-amber-50/50 border-amber-200/50 dark:bg-amber-500/5 dark:border-amber-500/20 dark:text-amber-400',
        low: 'text-emerald-600 bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400',
        medium: 'text-amber-600 bg-amber-50/50 border-amber-200/50 dark:bg-amber-500/5 dark:border-amber-500/20 dark:text-amber-400',
        high: 'text-red-600 bg-red-50/50 border-red-200/50 dark:bg-red-500/5 dark:border-red-500/20 dark:text-red-400',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05, translateY: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all backdrop-blur-sm",
                statusColors[status] || 'text-gray-600 bg-gray-50/50 border-gray-200/50'
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            <div className="text-left">
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {label}
                </div>
                <div className="text-[10px] font-bold">
                    {value}
                </div>
            </div>
        </motion.button>
    );
};

export const TradeReadinessBar = ({ systemState }) => {
    const navigate = useNavigate();

    if (!systemState) return null;

    const { tradeReadiness, trust, financial, logistics, intelligence } = systemState;
    const { score, status, blockers } = tradeReadiness;

    const scoreColor = score >= 80 ? 'text-emerald-500' :
        score >= 60 ? 'text-amber-500' :
            'text-red-500';

    const statusText = status === 'ready' ? 'All Systems Go' :
        status === 'warning' ? `${blockers.length} Items Need Attention` :
            'Action Required';

    return (
        <div className="w-full h-14 flex items-center px-3 md:px-6 gap-3 md:gap-6 sticky top-0 z-[60] bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-afrikoni-gold/10">
            {/* Trade Readiness Score */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <div className="relative w-8 h-8 md:w-10 md:h-10">
                    {/* Circular progress */}
                    <svg className="w-8 h-8 md:w-10 md:h-10 transform -rotate-90">
                        <circle
                            cx="16" cy="16" r="13"
                            className="md:hidden text-gray-200"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            fill="none"
                        />
                        <circle
                            cx="20" cy="20" r="16"
                            className="hidden md:block text-gray-200"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                        />
                        <circle
                            cx="16" cy="16" r="13"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            fill="none"
                            strokeDasharray={`${score * 0.81} 81`}
                            className={cn("md:hidden", scoreColor)}
                        />
                        <circle
                            cx="20" cy="20" r="16"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${score * 1.005} 100.5`}
                            className={cn("hidden md:block", scoreColor)}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] md:text-xs font-bold text-afrikoni-deep">
                            {score}
                        </span>
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="text-[10px] md:text-xs font-bold text-afrikoni-deep">
                        Readiness
                    </div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 whitespace-nowrap">
                        {statusText}
                    </div>
                </div>
            </div>

            {/* System Health Indicators - Scrollable on mobile */}
            <div className="flex-1 overflow-x-auto no-scrollbar py-1 min-w-0 mx-2">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <SystemIndicator
                        icon={Shield}
                        label="Compliance"
                        status={trust.complianceStatus}
                        value={trust.complianceStatus === 'compliant' ? 'Verified' :
                            trust.complianceStatus === 'pending' ? 'Setup ⚠️' : 'Action ❌'}
                        onClick={() => navigate('/dashboard/compliance')}
                    />
                    <SystemIndicator
                        icon={Wallet}
                        label="Escrow"
                        status={financial.escrowStatus === 'required' ? 'pending' : financial.escrowStatus}
                        value={financial.escrowStatus === 'funded' ? 'Funded' :
                            financial.escrowStatus === 'pending' ? 'Processing' :
                                financial.escrowStatus === 'required' ? 'Setup ⚠️' : 'Action ❌'}
                        onClick={() => navigate('/dashboard/payments')}
                    />
                    <SystemIndicator
                        icon={Truck}
                        label="Logistics"
                        status={logistics.shipmentRisk}
                        value={logistics.activeShipments.total > 0
                            ? `${logistics.activeShipments.total} Active`
                            : 'Network Ready'}
                        onClick={() => navigate('/dashboard/shipments')}
                    />
                    <SystemIndicator
                        icon={Map}
                        label="Corridors"
                        status={logistics.shipmentRisk === 'low' ? 'good' : logistics.shipmentRisk === 'medium' ? 'warning' : 'error'}
                        value={`${logistics.avgCorridorHealth}/100`}
                        onClick={() => navigate('/dashboard/corridors')}
                    />
                    <SystemIndicator
                        icon={TrendingUp}
                        label="FX Risk"
                        status={(financial.fxExposure?.ratio || 0) > 5 ? 'high' : 'low'}
                        value={`${(financial.fxExposure?.ratio || 0).toFixed(1)}%`}
                        onClick={() => navigate('/dashboard/fx')}
                    />
                </div>
            </div>

            {/* Alerts - Condensed on mobile */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {blockers.length > 0 && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => navigate('/dashboard/control-plane')}
                        className="flex items-center gap-1 px-2 md:px-4 py-1.5 md:py-2 rounded-full
                         bg-gradient-to-r from-amber-500 to-amber-600 text-white
                         shadow-lg hover:shadow-xl transition-all text-[9px] md:text-xs font-bold"
                    >
                        <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">{blockers.length} {blockers.length > 1 ? 'Blockers' : 'Blocker'}</span>
                        <span className="xs:hidden">{blockers.length}</span>
                    </motion.button>
                )}

                {intelligence.recommendations.length > 0 && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => navigate('/dashboard/ai-copilot')}
                        className={cn(
                            "flex items-center gap-1 px-2 md:px-4 py-1.5 md:py-2 rounded-full text-white shadow-lg hover:shadow-xl transition-all text-[9px] md:text-xs font-bold",
                            "bg-gradient-to-r from-blue-500 to-blue-600"
                        )}
                    >
                        <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">{intelligence.recommendations.length} {intelligence.recommendations.length > 1 ? 'Insights' : 'Insight'}</span>
                        <span className="xs:hidden">{intelligence.recommendations.length}</span>
                    </motion.button>
                )}
            </div>
        </div>
    );
};
