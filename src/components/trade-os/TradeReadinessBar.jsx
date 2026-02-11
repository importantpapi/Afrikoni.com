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
        good: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        warning: 'text-amber-600 bg-amber-50 border-amber-200',
        error: 'text-red-600 bg-red-50 border-red-200',
        compliant: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        pending: 'text-amber-600 bg-amber-50 border-amber-200',
        at_risk: 'text-red-600 bg-red-50 border-red-200',
        funded: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        required: 'text-amber-600 bg-amber-50 border-amber-200',
        low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        medium: 'text-amber-600 bg-amber-50 border-amber-200',
        high: 'text-red-600 bg-red-50 border-red-200',
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105",
                statusColors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
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
        </button>
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
        <div className="w-full h-14 flex items-center px-6 gap-6">
            {/* Trade Readiness Score */}
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                    {/* Circular progress */}
                    <svg className="w-10 h-10 transform -rotate-90">
                        <circle
                            cx="20" cy="20" r="16"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-gray-200"
                        />
                        <circle
                            cx="20" cy="20" r="16"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${score * 1.005} 100.5`}
                            className={scoreColor}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-afrikoni-deep">
                            {score}
                        </span>
                    </div>
                </div>

                <div>
                    <div className="text-xs font-bold text-afrikoni-deep">
                        Trade Readiness
                    </div>
                    <div className="text-[10px] text-gray-500">
                        {statusText}
                    </div>
                </div>
            </div>

            {/* System Health Indicators */}
            <div className="flex items-center gap-2">
                <SystemIndicator
                    icon={Shield}
                    label="Compliance"
                    status={trust.complianceStatus}
                    value={trust.complianceStatus === 'compliant' ? '✅' :
                        trust.complianceStatus === 'pending' ? '⚠️' : '❌'}
                    onClick={() => navigate('/dashboard/compliance')}
                />
                <SystemIndicator
                    icon={Wallet}
                    label="Escrow"
                    status={financial.escrowStatus}
                    value={financial.escrowStatus === 'funded' ? '✅' :
                        financial.escrowStatus === 'pending' ? '⚠️' : '❌'}
                    onClick={() => navigate('/dashboard/payments')}
                />
                <SystemIndicator
                    icon={Truck}
                    label="Logistics"
                    status={logistics.shipmentRisk}
                    value={`${logistics.activeShipments.total} Active`}
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
                    status={financial.fxExposure > 5 ? 'high' : 'low'}
                    value={`${financial.fxExposure.toFixed(1)}%`}
                    onClick={() => navigate('/dashboard/fx')}
                />
            </div>

            {/* Blockers Alert */}
            {blockers.length > 0 && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => navigate('/dashboard/control-plane')}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full
                     bg-gradient-to-r from-amber-500 to-amber-600 text-white
                     shadow-lg hover:shadow-xl transition-all text-xs font-bold"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {blockers.length} Blocker{blockers.length > 1 ? 's' : ''}
                </motion.button>
            )}

            {/* AI Copilot Alert */}
            {intelligence.recommendations.length > 0 && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => navigate('/dashboard/ai-copilot')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-lg hover:shadow-xl transition-all text-xs font-bold",
                        blockers.length === 0 && "ml-auto",
                        "bg-gradient-to-r from-blue-500 to-blue-600"
                    )}
                >
                    <Sparkles className="w-4 h-4" />
                    {intelligence.recommendations.length} AI Insight{intelligence.recommendations.length > 1 ? 's' : ''}
                </motion.button>
            )}
        </div>
    );
};
