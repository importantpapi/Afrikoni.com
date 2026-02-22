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
import UserAuditTrail from '@/components/dashboard/UserAuditTrail';
import KoniAIService from '@/services/KoniAIService';

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
        <span className="text-os-xs font-black uppercase tracking-widest text-emerald-500">DNA Committing to Ledger</span>
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
            console.error('[VerificationCenter] Export failed:', err);
            toast.error('Forensic Export Failed', {
                description: 'The secure PDF engine encountered a protocol error. Please try again or contact system integrity support.'
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Surface variant="glass" className="p-8 border-os-accent/20 bg-os-accent/[0.02] flex flex-col justify-between h-full group overflow-hidden">
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
    const [isDNAExtracting, setIsDNAExtracting] = useState(false);
    const [extractedDNA, setExtractedDNA] = useState(null);

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

            toast.success('Continental Audit Initialized', {
                description: 'Trust officers will audit your DNA profile within 24 hours.'
            });

            queryClient.invalidateQueries(['company', profileCompanyId]);
        } catch (error) {
            console.error('[VerificationCenter] Audit initialization failure:', error);
            toast.error('Audit Protocol Blocked', {
                description: error.message || 'System integrity check failed. Verify your network link and try again.'
            });
        } finally {
            setIsApplying(false);
        }
    };

    const handleDNAUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!profileCompanyId) {
            toast.error('Initialization error: Missing Company Link');
            return;
        }

        setIsDNAExtracting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const base64Image = e.target.result;
                const result = await KoniAIService.extractDNA({
                    documentType: 'business_registration',
                    imageData: base64Image,
                    context: {
                        companyName: organization?.company_name,
                        companyId: profileCompanyId
                    }
                });

                if (result) {
                    setExtractedDNA(result);
                    toast.success('DNA Extracted Successfully', {
                        description: `Found ${result.exporter || result.company_name || 'Business Entity'} on ledger.`
                    });

                    // Update storage with extracted proof
                    await supabase.from('companies').update({
                        onboarding_data: {
                            ...organization?.onboarding_data,
                            dna_proof: result,
                            dna_extracted_at: new Date().toISOString()
                        }
                    }).eq('id', profileCompanyId);

                    queryClient.invalidateQueries(['company', profileCompanyId]);
                }
            } catch (err) {
                console.error('[VerificationCenter] DNA Extraction Protocol Error:', err);
                toast.error('DNA Extraction Failed', {
                    description: err.message || 'The Vision Sentinel could not resolve document optics. Ensure your scan is clear and non-glare.'
                });
            } finally {
                setIsDNAExtracting(false);
            }
        };

        reader.readAsDataURL(file);
    };

    return (
        <div className="os-page os-stagger space-y-12 max-w-[1600px] mx-auto px-4 py-8 pb-32">
            {/* 1. Hub Hero */}
            <Surface variant="glass" className="p-10 md:p-14 relative overflow-hidden group border-white/10 bg-white/[0.02]">
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
                                    <span className="text-os-xs font-black uppercase tracking-[0.4em] text-os-muted opacity-50">Afrikoni Trade Protocol</span>
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
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                                <Lock className="w-4 h-4 text-emerald-500" />
                                <span className="text-os-xs font-black uppercase tracking-widest text-os-muted">Ledger Sync: Encrypted</span>
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
                                        <span className="text-os-xs font-black uppercase tracking-[0.4em] text-os-accent">Trust DNA Index</span>
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
                                    <div className="flex justify-between text-os-xs font-black uppercase tracking-widest text-os-muted opacity-60">
                                        <span>Continental Evolution</span>
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
                                        Commit Passed
                                    </div>
                                ) : tier.status === 'pending' ? (
                                    <div className="flex items-center gap-2 text-os-xs font-black text-amber-500 uppercase tracking-[0.3em]">
                                        <Activity className="w-4 h-4 animate-pulse" />
                                        Audit Active
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
                    <Surface variant="glass" className="p-10 relative overflow-hidden flex flex-col justify-between h-full bg-white/[0.01]">
                        <div className="space-y-10 relative z-10 font-[Inter]">
                            <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                                <div className="p-3.5 bg-os-accent/10 rounded-os-md border border-os-accent/30 shadow-os-md shadow-os-accent/5">
                                    <Scale className="w-8 h-8 text-os-accent" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight">Institutional DNA Ledger</h3>
                                    <p className="text-os-sm text-os-muted font-medium italic opacity-70">Immutable verification tracking for cross-border settlement.</p>
                                </div>
                            </div>

                            <UserAuditTrail limit={5} compact={true} />
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-os-muted opacity-40" />
                                <span className="text-os-xs font-bold uppercase tracking-widest text-os-muted opacity-40">AfCFTA Compliance Manual v4.0</span>
                            </div>
                            <Button variant="ghost" className="text-os-accent font-black uppercase tracking-widest text-os-xs hover:bg-os-accent/10">
                                View Full Intelligence Ledger <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Surface>

                    {/* NEW: DNA Extractor Section */}
                    <Surface variant="glass" className="p-10 mt-8 relative overflow-hidden bg-emerald-500/[0.01] border-emerald-500/10">
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="w-6 h-6 text-emerald-500" />
                                    <h3 className="text-2xl font-black tracking-tight uppercase">Document DNA Extractor</h3>
                                </div>
                                <p className="text-os-sm text-os-muted font-medium">
                                    Upload your Business Registration or License. Our AI will automatically extract identity markers and commit them to your Trust Profile.
                                </p>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleDNAUpload}
                                        disabled={isDNAExtracting}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    />
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 font-black uppercase tracking-widest"
                                    >
                                        {isDNAExtracting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-3" />
                                                Parsing Optics...
                                            </>
                                        ) : (
                                            <>
                                                <Compass className="w-4 h-4 mr-3" />
                                                Locate Document DNA
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {extractedDNA && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-emerald-500/10 rounded-os-sm border border-emerald-500/20 space-y-3"
                                    >
                                        <div className="flex justify-between items-center text-os-xs font-black uppercase text-emerald-400">
                                            <span>Extracted Metadata</span>
                                            <Badge className="bg-emerald-500 text-black">Verified Match</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-os-xs">
                                            <div>
                                                <div className="text-os-muted mb-1 opacity-50 uppercase tracking-widest">Entity</div>
                                                <div className="font-bold truncate">{extractedDNA.exporter || extractedDNA.company_name || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-os-muted mb-1 opacity-50 uppercase tracking-widest">Reg ID</div>
                                                <div className="font-bold truncate">{extractedDNA.registration_id || extractedDNA.origin || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div className="w-48 h-48 rounded-full border-2 border-emerald-500/20 flex items-center justify-center relative shrink-0">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-2 border-t-2 border-emerald-500/40 rounded-full"
                                />
                                <Fingerprint className={cn(
                                    "w-16 h-16 transition-all duration-700",
                                    isDNAExtracting ? "text-emerald-500 scale-125 animate-pulse" : "text-os-muted opacity-20"
                                )} />
                            </div>
                        </div>
                    </Surface>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <VerificationReport score={trustScore} />

                    <Surface variant="glass" className="p-10 border-emerald-500/20 bg-emerald-500/[0.02] text-center flex flex-col items-center justify-center relative group overflow-hidden">
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
                                        Initialize Tier 3 Audit
                                    </div>
                                )}
                            </Button>
                        </div>
                    </Surface>
                </div>
            </div>
        </div >
    );
}
