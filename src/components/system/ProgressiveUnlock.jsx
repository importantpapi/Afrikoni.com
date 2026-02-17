/**
 * ============================================================================
 * PROGRESSIVE UNLOCK - Feature Unlock System
 * ============================================================================
 * 
 * Shows locked features with unlock criteria and progress.
 * Celebrates when users unlock new features.
 * 
 * Unlock Criteria:
 * - Complete 1 trade → Trust Score
 * - Complete 5 trades → Corridor Intelligence
 * - Reach 90% trust → Treasury features
 * - 10+ trades → Full Power Mode
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Lock, CheckCircle2, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const UNLOCK_CRITERIA = {
    trust_score: {
        id: 'trust_score',
        label: 'Trust Score',
        description: 'Track your reputation and reliability',
        icon: CheckCircle2,
        requirement: 'Complete 1 trade',
        checkUnlocked: (stats) => stats.completedTrades >= 1,
        progress: (stats) => Math.min(stats.completedTrades, 1),
        total: 1,
    },
    corridor_intelligence: {
        id: 'corridor_intelligence',
        label: 'Corridor Intelligence',
        description: 'Market insights and pricing benchmarks',
        icon: TrendingUp,
        requirement: 'Complete 5 trades',
        checkUnlocked: (stats) => stats.completedTrades >= 5,
        progress: (stats) => Math.min(stats.completedTrades, 5),
        total: 5,
    },
    treasury: {
        id: 'treasury',
        label: 'Treasury Features',
        description: 'Advanced financial tools and analytics',
        icon: Sparkles,
        requirement: 'Reach 90% trust score',
        checkUnlocked: (stats) => stats.trustScore >= 90,
        progress: (stats) => Math.min(stats.trustScore, 90),
        total: 90,
    },
    power_mode: {
        id: 'power_mode',
        label: 'Full Power Mode',
        description: 'Unlock all advanced Trade OS features',
        icon: Sparkles,
        requirement: 'Complete 10 trades',
        checkUnlocked: (stats) => stats.completedTrades >= 10,
        progress: (stats) => Math.min(stats.completedTrades, 10),
        total: 10,
    },
};

export function ProgressiveUnlock({ featureId, children, fallback }) {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        completedTrades: 0,
        trustScore: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);

    const feature = UNLOCK_CRITERIA[featureId];
    const isUnlocked = feature ? feature.checkUnlocked(stats) : true;

    useEffect(() => {
        if (user && profile?.company_id) {
            loadStats();
        }
    }, [user, profile?.company_id]);

    const loadStats = async () => {
        setLoading(true);
        try {
            // Fetch user's completed trades
            const { data: trades, error: tradesError } = await supabase
                .from('trades')
                .select('id, status')
                .or(`buyer_id.eq.${profile.company_id},seller_id.eq.${profile.company_id}`)
                .in('status', ['settled', 'closed']);

            // Fetch trust score
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('trust_score')
                .eq('id', profile.company_id)
                .single();

            if (!tradesError && !companyError) {
                const newStats = {
                    completedTrades: trades?.length || 0,
                    trustScore: company?.trust_score || 0,
                };

                // Check if just unlocked
                const wasLocked = !feature.checkUnlocked(stats);
                const nowUnlocked = feature.checkUnlocked(newStats);

                if (wasLocked && nowUnlocked) {
                    celebrate();
                }

                setStats(newStats);
            }
        } catch (err) {
            console.error('Failed to load unlock stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const celebrate = () => {
        setShowCelebration(true);

        // Confetti animation
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4A937', '#FFD700', '#FFA500'],
        });

        setTimeout(() => setShowCelebration(false), 3000);
    };

    if (loading) {
        return fallback || null;
    }

    if (isUnlocked) {
        return children;
    }

    // Show locked state
    return (
        <>
            <LockedFeatureCard feature={feature} stats={stats} />

            {/* Celebration Modal */}
            <AnimatePresence>
                {showCelebration && (
                    <CelebrationModal feature={feature} />
                )}
            </AnimatePresence>
        </>
    );
}

function LockedFeatureCard({ feature, stats }) {
    const Icon = feature.icon;
    const progress = feature.progress(stats);
    const total = feature.total;
    const progressPercent = (progress / total) * 100;

    return (
        <Surface variant="panel" className="p-6 border border-white/10">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-os-sm bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-white/40" />
                </div>

                <div className="flex-1">
                    <h3 className="text-os-lg font-semibold text-white mb-1">
                        {feature.label}
                    </h3>
                    <p className="text-os-sm text-white/60 mb-4">
                        {feature.description}
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-os-sm">
                            <span className="text-white/70">Progress</span>
                            <span className="text-white font-medium">
                                {progress} / {total}
                            </span>
                        </div>

                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-os-accent"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        <p className="text-os-xs text-white/50">
                            {feature.requirement}
                        </p>
                        <Link
                            to="/dashboard/rfqs/new"
                            className="inline-flex items-center gap-1 mt-3 text-os-xs font-semibold text-os-accent hover:text-os-accent/80 transition-colors"
                        >
                            Get started with your first trade <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </Surface>
    );
}

function CelebrationModal({ feature }) {
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="max-w-md mx-4"
            >
                <Surface variant="glass" className="p-8 border border-os-accent/30 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 rounded-full bg-os-accent/20 flex items-center justify-center mx-auto mb-4"
                    >
                        <Icon className="w-10 h-10 text-os-accent" />
                    </motion.div>

                    <h2 className="text-os-2xl font-bold text-white mb-2">
                        Feature Unlocked!
                    </h2>
                    <p className="text-os-lg text-os-accent mb-4">
                        {feature.label}
                    </p>
                    <p className="text-os-sm text-white/70">
                        {feature.description}
                    </p>
                </Surface>
            </motion.div>
        </motion.div>
    );
}

/**
 * Hook to get unlock status for a feature
 */
export function useFeatureUnlock(featureId) {
    const { user, profile } = useAuth();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profile?.company_id) {
            checkUnlock();
        }
    }, [user, profile?.company_id, featureId]);

    const checkUnlock = async () => {
        const feature = UNLOCK_CRITERIA[featureId];
        if (!feature) {
            setIsUnlocked(true);
            setLoading(false);
            return;
        }

        try {
            const { data: trades } = await supabase
                .from('trades')
                .select('id')
                .or(`buyer_id.eq.${profile.company_id},seller_id.eq.${profile.company_id}`)
                .in('status', ['settled', 'closed']);

            const { data: company } = await supabase
                .from('companies')
                .select('trust_score')
                .eq('id', profile.company_id)
                .single();

            const stats = {
                completedTrades: trades?.length || 0,
                trustScore: company?.trust_score || 0,
            };

            setIsUnlocked(feature.checkUnlocked(stats));
        } catch (err) {
            console.error('Failed to check unlock status:', err);
            setIsUnlocked(false);
        } finally {
            setLoading(false);
        }
    };

    return { isUnlocked, loading };
}
