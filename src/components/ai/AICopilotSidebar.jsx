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
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3", borderClass)}
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

            <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">{description}</p>

            <Button
                size="sm"
                variant="outline"
                className="w-full justify-between group hover:bg-afrikoni-gold hover:text-black hover:border-afrikoni-gold transition-colors"
                onClick={onAction}
            >
                {actionLabel}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Button>
        </motion.div>
    );
};

export const AICopilotSidebar = ({ isOpen, onClose, recommendations = [] }) => {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-gray-50/95 backdrop-blur-xl border-l border-white/20 shadow-2xl z-[100] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-white/50">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-afrikoni-deep">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-afrikoni-gold to-amber-500 flex items-center justify-center text-white">
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold text-sm">Trade Copilot</span>
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
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Top 3 Recommendations
                                </h3>

                                {recommendations.length > 0 ? (
                                    <div className="space-y-1">
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
                                    <div className="text-center py-8 text-gray-400 text-xs">
                                        System state is optimal.<br />No critical actions needed.
                                    </div>
                                )}
                            </div>

                            {/* Context Awareness Section (Mock) */}
                            {/* <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700 mb-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-xs font-bold">Context: Logistics</span>
                                </div>
                                <p className="text-[10px] text-blue-600/80">
                                    Analysis shows 20% congestion spike in Abidjan. Consider routing via Dakar.
                                </p>
                            </div> */}
                        </div>

                        {/* Chat Input (Prototype) */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ask Copilot..."
                                    className="w-full bg-gray-100 border-none rounded-full py-2 pl-4 pr-10 text-xs focus:ring-1 focus:ring-afrikoni-gold"
                                />
                                <button className="absolute right-1 top-1 p-1 bg-afrikoni-deep text-white rounded-full hover:bg-black transition-colors">
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="mt-2 text-[10px] text-center text-gray-400">
                                Voice input coming in Phase 3.2
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
