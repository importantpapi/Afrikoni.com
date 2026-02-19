import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, CheckCircle2, Award, Shield, ArrowRight, UserCheck,
    Sparkles, Loader2, CheckCircle, Clock, Globe, Zap, Fingerprint,
    Lock, Activity, ShieldAlert, BarChart3, TrendingUp, Landmark,
    Scale, BookOpen, Compass, Building
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Progress } from "@/components/shared/ui/progress";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { calculateCreditScore } from '@/services/creditScoreService';
import { generateForensicPDF } from '@/utils/pdfGenerator';

// --- Components ---

const DNACommitPulse = () => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex gap-0.5">
            {[1, 2, 3].map(i => (
                <motion.div
                    key={i}
                    animate={{ height: [4, 12, 4], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 bg-emerald-500 rounded-full"
                />
            ))}
        </div>
        <span className="text-os-xs font-medium text-emerald-600">Verification in Progress</span>
    </div>
);

const VerificationReport = ({ score }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const reportHtml = `
                <html>
                    <body style="font-family: sans-serif; padding: 40px; border: 10px solid #D4A937;">
                        <h1 style="color: #D4A937;">AFRIKONI VERIFICATION REPORT</h1>
                        <p><strong>Trust Score:</strong> ${score}</p>
                        <p><strong>Status:</strong> VERIFIED</p>
                        <hr/>
                        <p>This certificate confirms that the entity has completed the Afrikoni verification process.</p>
                    </body>
                </html>
            `;
            await generateForensicPDF(reportHtml, 'Afrikoni_Verification_Report.pdf');
            toast.success('Report exported successfully');
        } catch (err) {
            toast.error('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Surface variant="panel" className="p-8 border-os-accent/20 bg-os-accent/[0.02] flex flex-col justify-between h-full group overflow-hidden">
            <div className="absolute -right-8 -top-8 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <ShieldCheck className="w-32 h-32 text-os-accent" />
            </div>
            <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-os-accent/20 rounded-os-sm">
                        <ShieldCheck className="w-5 h-5 text-os-accent" />
                    </div>
                    <h4 className="text-os-sm font-black uppercase tracking-[0.3em] text-os-accent">Your Verification Report</h4>
                </div>
                <p className="text-os-sm text-os-muted leading-relaxed font-medium">
                    Download your verification certificate to share with buyers, banks, or logistics partners as proof of your verified status on the Afrikoni network.
                </p>
                <div className="pt-4 border-t border-os-accent/10">
                    <div className="flex items-center justify-between text-os-xs font-black uppercase tracking-widest text-os-muted">
                        <span>Current Trust Score</span>
                        <span className="text-os-accent">{score} pts</span>
                    </div>
                </div>
            </div>
            <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full mt-8 bg-os-accent text-black font-black uppercase tracking-widest py-6 rounded-os-md hover:scale-105 transition-all shadow-os-lg shadow-os-accent/10"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isExporting ? 'Generating...' : 'Download Verification Report'}
            </Button>
        </Surface>
    );
};

// --- Main Page ---

export default function ContinentalTrustHub() {
    const { profile, organization, profileCompanyId } = useDashboardKernel();
    const queryClient = useQueryClient();
    const [isApplying, setIsApplying] = useState(false);

    // ✅ LIVE CREDIT SCORE
    const { data: creditData, isLoading: loadingCredit } = useQuery({
        queryKey: ['credit-score', profileCompanyId],
        queryFn: () => calculateCreditScore(profileCompanyId),
        enabled: !!profileCompanyId
    });

    const verificationStatus = organization?.verification_status || 'unverified';
    const isVerified = verificationStatus === 'verified';
    const isPending = verificationStatus === 'pending';
    const trustScore = organization?.trust_score || 78;

    const trustTiers = [
        {
            level: 1,
            name: 'Verified',
            status: 'verified',
            icon: UserCheck,
            reward: 'Tier-1 Liquidity Access',
            desc: 'Identity & Biometric Lockdown'
        },
        {
            level: 2,
            name: 'Institutional',
            status: 'verified',
            icon: Building,
            reward: 'Priority Corridor Visibility',
            desc: 'Enterprise Registry Sync'
        },
        {
            level: 3,
            name: 'Premier',
            status: isVerified ? 'verified' : 'pending',
            icon: ShieldCheck,
            reward: 'Lowered Escrow Rates (-12%)',
            desc: 'Financial Solvency Audit'
        },
        {
            level: 4,
            name: 'Continental',
            status: 'locked',
            icon: Globe,
            reward: 'Elite AfCFTA Status',
            desc: 'Diplomatic Trade Path'
        },
    ];

    const handleApplyForBadge = async () => {
        if (!profileCompanyId) {
            toast.error('Company profile not initialized.');
            return;
        }

        setIsApplying(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    verification_status: 'pending',
                    metadata: {
                        ...organization?.metadata,
                        badge_request_date: new Date().toISOString(),
                        requested_tier: 3
                    }
                })
                .eq('id', profileCompanyId);

            if (error) throw error;

            toast.success('Verification Request Submitted', {
                description: 'Our team will review your profile within 24 hours.'
            });

            queryClient.invalidateQueries(['company', profileCompanyId]);
        } catch (error) {
            console.error('Audit initialization error:', error);
            toast.error('Failed to submit. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="os-page os-stagger space-y-12 max-w-[1600px] mx-auto px-4 py-8 pb-32">
            {/* 1. Hub Hero */}
            <Surface variant="panel" className="p-10 md:p-14 relative overflow-hidden group">
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-os-accent/10 rounded-full blur-[140px] group-hover:bg-os-accent/15 transition-all duration-1000" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px]" />

                <div className="relative z-10 flex flex-col xl:flex-row gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="p-3.5 bg-os-accent/10 rounded-os-md border border-os-accent/30 shadow-os-lg shadow-os-accent/5">
                                <Landmark className="w-8 h-8 text-os-accent" />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Continental Trust Hub</h1>
                                <div className="flex items-center gap-3">
                                    <span className="text-os-xs font-medium text-os-muted opacity-50">Afrikoni Trade Network</span>
                                    <div className="h-px w-20 bg-white/10" />
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-os-xs font-black uppercase px-2 py-0">v2026.4</Badge>
                                </div>
                            </div>
                        </div>

                        <p className="text-os-muted max-w-3xl text-os-xl leading-relaxed font-medium">
                            Your digital identity is the primary currency of the AfCFTA era.
                            Elevate your <span className="text-white font-black underline decoration-os-accent/40 underline-offset-8 decoration-2">Continental Standing</span> to bypass traditional trade hurdles and unlock global-scale liquidity.
                        </p>

                        <div className="flex flex-wrap gap-5 pt-4">
                            <DNACommitPulse />
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                                <Lock className="w-4 h-4 text-emerald-500" />
                                <span className="text-os-xs font-medium text-os-muted">Data Encrypted</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full xl:w-[400px] shrink-0">
                        <Surface variant="panel" className="p-10 border-os-accent/20 bg-os-accent/[0.03] relative overflow-hidden group/score shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/score:opacity-[0.08] transition-opacity">
                                <BarChart3 className="w-32 h-32 text-os-accent" />
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <span className="text-os-xs font-bold text-os-accent">Trust Score</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <div className="text-7xl font-black tracking-tighter">
                                                {loadingCredit ? '...' : (creditData?.score || trustScore)}
                                            </div>
                                            <div className="text-os-xl font-bold text-os-accent/40">{creditData ? 'PTS' : '%'}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className="bg-emerald-500 text-black text-os-xs font-black px-3 py-1 rounded-lg">
                                            {creditData?.grade || 'INSTITUTIONAL'}
                                        </Badge>
                                        <div className="flex items-center gap-2 text-emerald-500 text-os-xs font-black uppercase tracking-widest">
                                            <TrendingUp className="w-4 h-4" />
                                            Active Growth
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-os-xs font-medium text-os-muted opacity-60">
                                        <span>Verification Progress</span>
                                        <span>Tier {isVerified ? '3' : '2'} / 4</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: isVerified ? '75%' : '50%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-os-accent/20 via-os-accent to-os-accent/20 rounded-full shadow-[0_0_15px_rgba(212,169,55,0.5)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Surface>
                    </div>
                </div>
            </Surface>

            {/* 2. Trust Ladder Selection */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {trustTiers.map((tier, i) => (
                    <Surface key={i} variant="panel" className={cn(
                        "p-8 group hover:border-os-accent/40 transition-all duration-500 relative overflow-hidden bg-white/[0.01]",
                        tier.status === 'locked' && "opacity-40 grayscale"
                    )}>
                        <div className="flex flex-col h-full gap-8">
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    "w-14 h-14 rounded-os-md flex items-center justify-center border-2 transition-all duration-500 group-hover:scale-110",
                                    tier.status === 'verified' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-os-lg shadow-emerald-500/10" :
                                        tier.status === 'pending' ? "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse" :
                                            "bg-white/5 border-white/10 text-os-muted"
                                )}>
                                    <tier.icon className="w-7 h-7" />
                                </div>
                                <div className={cn(
                                    "text-os-xs font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-os-sm border-2",
                                    tier.status === 'verified' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        tier.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                            "bg-white/5 text-os-muted border-white/10"
                                )}>
                                    {tier.status}
                                </div>
                            </div>

                            <div className="space-y-2 flex-1">
                                <h3 className="font-black text-os-2xl tracking-tighter">{tier.name} <span className="text-os-muted opacity-20 ml-1">0{tier.level}</span></h3>
                                <p className="text-os-xs text-os-muted font-bold uppercase tracking-widest opacity-80 leading-relaxed">{tier.desc}</p>
                                <div className="pt-4 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-os-xs font-black text-os-accent/80 uppercase tracking-tighter">
                                        <Zap className="w-3 h-3" />
                                        Reward: {tier.reward}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                {tier.status === 'verified' ? (
                                    <div className="flex items-center gap-2 text-os-xs font-black text-emerald-500 uppercase tracking-[0.3em]">
                                        <CheckCircle className="w-4 h-4" />
                                        Verified
                                    </div>
                                ) : tier.status === 'pending' ? (
                                    <div className="flex items-center gap-2 text-os-xs font-black text-amber-500 uppercase tracking-[0.3em]">
                                        <Activity className="w-4 h-4 animate-pulse" />
                                        In Review
                                    </div>
                                ) : (
                                    <Button
                                        disabled
                                        variant="outline"
                                        className="w-full text-os-xs font-black uppercase tracking-widest h-12 bg-white/5 border-white/10 opacity-30 group-hover:opacity-60 transition-opacity"
                                    >
                                        Unlock at Tier 3
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Surface>
                ))}
            </div>

            {/* 3. Advanced Utilities Section */}
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <Surface variant="panel" className="p-10 relative overflow-hidden flex flex-col justify-between h-full">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12">
                            <Compass className="w-80 h-80" />
                        </div>

                        <div className="space-y-10 relative z-10">
                            <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                                <div className="p-3.5 bg-os-accent/10 rounded-os-md border border-os-accent/30 shadow-os-md shadow-os-accent/5">
                                    <Scale className="w-8 h-8 text-os-accent" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight">Verification Records</h3>
                                    <p className="text-os-sm text-os-muted font-medium opacity-70">Your verification history and compliance status.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: 'Identity Verification', ref: 'UID-8201-AX', status: 'Complete', date: 'Feb 12' },
                                    { label: 'Business Registration', ref: 'REG-SN-D93', status: 'Confirmed', date: 'Feb 11' },
                                    { label: 'AML Screening', ref: 'AML-SCAN-48', status: 'Active', date: 'Real-time' }
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-os-md group/row hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center gap-10">
                                            <div className="text-os-xs font-black text-os-muted uppercase tracking-[0.3em] w-56">{row.label}</div>
                                            <div className="hidden md:block font-mono text-os-xs text-white/20 uppercase tracking-widest">{row.ref}</div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-os-xs font-bold text-os-muted opacity-40 uppercase tracking-widest">{row.date}</div>
                                            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-os-xs font-black uppercase px-2.5 shadow-sm">
                                                {row.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-os-muted opacity-40" />
                                <span className="text-os-xs font-bold uppercase tracking-widest text-os-muted opacity-40">AfCFTA Compliance Manual v4.0</span>
                            </div>
                            <Button variant="ghost" className="text-os-accent font-medium text-os-xs hover:bg-os-accent/10">
                                View All Records <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Surface>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <VerificationReport score={trustScore} />

                    <Surface variant="panel" className="p-10 border-emerald-500/20 bg-emerald-500/[0.02] text-center flex flex-col items-center justify-center relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative z-10 space-y-6">
                            <div className="relative">
                                <Award className="w-20 h-20 text-emerald-500 mx-auto opacity-80" />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl -z-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-os-2xl tracking-tighter">Continental Badge</h4>
                                <p className="text-os-sm text-os-muted font-medium italic">Enabling institutional-scale trade above $10M USD.</p>
                            </div>

                            <Button
                                disabled={isApplying || isVerified || isPending}
                                onClick={handleApplyForBadge}
                                className={cn(
                                    "w-full h-16 rounded-os-md font-black uppercase tracking-widest text-os-xs transition-all duration-500 active:scale-95 shadow-2xl",
                                    isVerified ? "bg-emerald-500 text-black shadow-emerald-500/20" :
                                        isPending ? "bg-amber-500 text-black shadow-amber-500/20" :
                                            "bg-os-accent text-black shadow-os-accent/20 hover:scale-105"
                                )}
                            >
                                {isApplying ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Auditing...
                                    </div>
                                ) : isVerified ? (
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5" />
                                        Badge Verified
                                    </div>
                                ) : isPending ? (
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 animate-pulse" />
                                        Audit in Progress
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-5 h-5" />
                                        Apply for Tier 3
                                    </div>
                                )}
                            </Button>
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    );
}
