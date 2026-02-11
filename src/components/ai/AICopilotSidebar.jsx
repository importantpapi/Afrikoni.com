import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Zap, Shield, TrendingUp, Send } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const RecommendationCard = ({ recommendation, onAction }) => {
    const { title, description, score, tags, actionLabel, priority } = recommendation;

    // Tag styles
    const tagStyles = {
        velocity: 'bg-blue-100 text-blue-700 border-blue-200',
        trust: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        efficiency: 'bg-amber-100 text-amber-700 border-amber-200',
    };

    // Priority borders
    const borderClass = priority === 'critical' ? 'border-l-4 border-l-red-500' :
        priority === 'high' ? 'border-l-4 border-l-amber-500' :
            'border-l-4 border-l-blue-500';

    return (
        <Surface
            variant="panel"
            className={cn("p-4 border-white/5 mb-3 group hover:border-blue-500/30 transition-all cursor-pointer", borderClass)}
            onClick={onAction}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                    {tags.map(tag => (
                        <span key={tag} className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", tagStyles[tag])}>
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="text-xs font-bold text-gray-400">
                    Score: {score}
                </div>
            </div>

            <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
            <p className="text-xs text-os-muted mb-3 leading-relaxed">{description}</p>

            <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between group hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 border border-blue-500/10 transition-colors"
                onClick={onAction}
            >
                {actionLabel}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Button>
        </Surface>
    );
};

export const AICopilotSidebar = ({ isOpen, onClose, recommendations = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="w-full h-full bg-white/95 dark:bg-[#08090A]/95 backdrop-blur-2xl border-l border-gray-200 dark:border-white/10 shadow-2xl z-[100] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gradient-to-r from-gray-50 dark:from-white/5 to-transparent">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-afrikoni-deep">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white tracking-tight">Trade Copilot</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="text-[10px] text-gray-500 pl-8">
                    AI Analysis • Live System State
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Top Picks Section */}
                <div className="mb-6">
                    <h3 className="text-[10px] font-black text-os-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-amber-500" /> Top 3 Recommendations
                    </h3>

                    {recommendations.length > 0 ? (
                        <div className="space-y-4">
                            {recommendations.slice(0, 3).map(rec => (
                                <RecommendationCard
                                    key={rec.id}
                                    recommendation={rec}
                                    onAction={() => {
                                        navigate(rec.actionPath);
                                        onClose();
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-os-muted text-xs font-medium border border-dashed border-white/5 rounded-2xl">
                            System state is optimal.<br />
                            <span className="text-[10px] opacity-60">No high-velocity tasks detected.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Input (Prototype) */}
            <div className="p-4 bg-white/40 dark:bg-black/40 border-t border-gray-200 dark:border-white/5 backdrop-blur-lg">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask Copilot..."
                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 text-[10px] text-center text-os-muted/60 font-medium uppercase tracking-widest">
                    Phase 3.2 • Neural Engine Live
                </div>
            </div>
        </div>
    );
};
