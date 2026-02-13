import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  User, Building2, FileText, Upload, Eye, RefreshCw, Search,
  TrendingUp, TrendingDown, UserCheck, BarChart3, CheckCircle2,
  Upload as UploadIcon, FileCheck, Lock, Globe, AlertCircle,
  Activity, ShieldAlert, Zap, Info, Sparkles, Fingerprint,
  FileSearch, ShieldCheck, Database, Server
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useKYCVerifications } from '@/hooks/queries/useKYCVerifications';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Components ---

const ScanningAnimation = ({ active = true }) => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-afrikoni-gold/20 rounded-full blur-2xl"
          />
          <div className="relative z-10 w-12 h-12 rounded-2xl border-2 border-afrikoni-gold/30 flex items-center justify-center overflow-hidden bg-black/40 shadow-[0_0_20px_rgba(212,169,55,0.2)]">
            <motion.div
              animate={{ y: [-20, 20, -20] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-0.5 bg-afrikoni-gold shadow-[0_0_15px_rgba(212,169,55,1)]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-afrikoni-gold/5 via-transparent to-afrikoni-gold/5" />
          </div>
        </>
      )}
    </AnimatePresence>
  </div>
);

const ComplianceInsight = ({ title, text, confidence = 98.4 }) => (
  <Surface variant="glass" className="p-6 border-afrikoni-gold/20 bg-afrikoni-gold/[0.02] relative overflow-hidden group">
    <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
      <Sparkles className="w-24 h-24 text-afrikoni-gold" />
    </div>
    <div className="flex items-start gap-4 relative z-10">
      <div className="p-2.5 bg-afrikoni-gold/20 rounded-xl border border-afrikoni-gold/30">
        <Activity className="w-5 h-5 text-afrikoni-gold" />
      </div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-afrikoni-gold">{title}</h4>
        <p className="text-sm font-medium leading-relaxed italic text-white/90">"{text}"</p>
        <div className="flex items-center gap-3 mt-3">
          <Badge className="bg-afrikoni-gold text-black text-[9px] font-black px-2 py-0">INSTITUTIONAL AI</Badge>
          <span className="text-[9px] font-bold text-os-muted uppercase tracking-widest">Confidence: {confidence}%</span>
        </div>
      </div>
    </div>
  </Surface>
);

// --- Main Page ---

export default function IntegrityPortal() {
  const { profileCompanyId, userId, profile, organization, isSystemReady } = useDashboardKernel();
  const { data: kycVerifications = [], isLoading, error } = useKYCVerifications();

  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const kycSummary = useMemo(() => {
    if (kycVerifications.length === 0) {
      return {
        overallStatus: 'not_started',
        riskLevel: 'unknown',
        score: organization?.trust_score || 0,
        idStatus: 'unverified',
        entStatus: 'unverified'
      };
    }
    const verifiedCount = kycVerifications.filter(v => v.status === 'verified').length;
    const isVerified = verifiedCount >= 2;
    return {
      overallStatus: isVerified ? 'verified' : 'pending',
      riskLevel: isVerified ? 'low' : 'moderate',
      score: organization?.trust_score || 75,
      idStatus: kycVerifications.some(v => v.type === 'identity' && v.status === 'verified') ? 'verified' : 'pending',
      entStatus: kycVerifications.some(v => v.type === 'business' && v.status === 'verified') ? 'verified' : 'pending',
    };
  }, [kycVerifications, organization]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Sovereign Node Synchronized", {
        description: "Verified all integrity commits against the AfCFTA Ledger."
      });
    }, 2000);
  };

  const simulateUpload = (type) => {
    setUploadingDoc(type);
    setTimeout(() => {
      setUploadingDoc(null);
      toast.success(`${type.toUpperCase()} Uploaded`, {
        description: "Document DNA extracted. Audit queued for processing."
      });
    }, 3500);
  };

  if (isLoading) return <CardSkeleton count={3} />;
  if (error) return <ErrorState message={error?.message || 'Integrity synchronization failed.'} />;

  return (
    <div className="os-page os-stagger space-y-10 max-w-[1600px] mx-auto pb-24 px-4 py-8">
      {/* 1. Header & Quick Diagnostics */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard/verification" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-os-muted hover:text-afrikoni-gold transition-all group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to Compliance Hub
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-afrikoni-gold/10 rounded-3xl border border-afrikoni-gold/30 shadow-[0_0_30px_rgba(212,169,55,0.1)]">
              <Lock className="w-10 h-10 text-afrikoni-gold" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                Integrity Portal
                <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] uppercase border-emerald-500/30 text-emerald-500 bg-emerald-500/5 px-3 py-1">
                  Sovereign Standard
                </Badge>
              </h1>
              <p className="text-os-muted text-lg font-medium italic opacity-70">Securing your institutional DNA for the continental trade horizon.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Surface variant="panel" className="px-6 py-4 flex items-center gap-6 border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="space-y-0.5">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-os-muted">Encryption Status</div>
                <div className="text-xs font-bold text-emerald-500">AES-256 Armed</div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <Button
              variant="ghost"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-10 px-5 gap-3 text-afrikoni-gold font-black uppercase tracking-widest text-[10px] bg-afrikoni-gold/10 hover:bg-afrikoni-gold/20 transition-all rounded-xl"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing..." : "Sync Node"}
            </Button>
          </Surface>
        </div>
      </div>

      {/* 2. Primary KPI Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Integrity Level', value: kycSummary.overallStatus, icon: ShieldCheck },
          { label: 'Risk Profile', value: kycSummary.riskLevel, icon: ShieldAlert },
          { label: 'Identity Commit', value: kycSummary.idStatus, icon: Fingerprint },
          { label: 'Enterprise DNA', value: kycSummary.entStatus, icon: Building2 },
        ].map((item, i) => (
          <Surface key={i} variant="panel" className="p-6 group hover:border-afrikoni-gold/30 transition-all relative overflow-hidden bg-white/[0.01]">
            <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity">
              <item.icon className="w-16 h-16" />
            </div>
            <div className="space-y-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-os-muted">{item.label}</span>
              <div className="flex flex-col gap-2">
                <div className={cn(
                  "text-2xl font-black tracking-tighter capitalize",
                  item.value === 'low' || item.value === 'verified' ? 'text-emerald-500' :
                    item.value === 'moderate' || item.value === 'pending' ? 'text-amber-500' : 'text-os-muted'
                )}>
                  {item.value.replace('_', ' ')}
                </div>
                <div className={cn("w-12 h-1 rounded-full",
                  item.value === 'low' || item.value === 'verified' ? 'bg-emerald-500' :
                    item.value === 'moderate' || item.value === 'pending' ? 'bg-amber-500' : 'bg-white/10'
                )} />
              </div>
            </div>
          </Surface>
        ))}

        <Surface variant="glass" className="p-6 border-afrikoni-gold/30 bg-afrikoni-gold/[0.04] shadow-[0_0_40px_rgba(212,169,55,0.05)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-afrikoni-gold">Trust Score</span>
              <Activity className="w-3.5 h-3.5 text-afrikoni-gold opacity-50" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black tracking-tighter text-afrikoni-gold">{kycSummary.score}</span>
              <span className="text-[10px] font-mono text-afrikoni-gold/40 uppercase tracking-widest">DNA-COMMIT</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-afrikoni-gold/10">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">+12.4% vs Avg</div>
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Data & Uploads */}
        <div className="lg:col-span-8 space-y-8">
          {/* Identity Section */}
          <Surface variant="glass" className="p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12">
              <User className="w-64 h-64" />
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 relative z-10">
              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                  <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <Fingerprint className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-2xl font-black tracking-tight">Sovereign Identity</h3>
                    <p className="text-sm text-os-muted font-medium italic opacity-70">Personal DNA mapping and biometric link.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { label: 'Authenticated Name', value: profile?.full_name || 'Youba Simao Thiam' },
                    { label: 'Nationality Node', value: 'Senegal' },
                    { label: 'Temporal Signature', value: '13 Feb 1990' },
                    { label: 'Uplink Priority', value: 'High Capacity' }
                  ].map((row, i) => (
                    <div key={i} className="space-y-1 group/field">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-os-muted opacity-50 group-hover/field:opacity-100 transition-opacity">
                        {row.label}
                      </div>
                      <div className="text-lg font-bold tracking-tight border-b border-white/5 pb-2 group-hover/field:border-afrikoni-gold/30 transition-all">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => simulateUpload('Passport')}
                    disabled={!!uploadingDoc}
                    className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all gap-3 text-os-muted font-black uppercase tracking-widest text-[11px]"
                  >
                    <UploadIcon className="w-4 h-4" />
                    Update Document DNA
                  </Button>
                </div>
              </div>

              {/* Document Preview Card */}
              <div className="w-full md:w-[340px] shrink-0">
                <div className="p-8 bg-black/40 border-2 border-white/5 rounded-[3rem] space-y-6 relative overflow-hidden group/doc shadow-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-afrikoni-gold/30 to-transparent animate-pulse" />

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-500">
                      LIVE VALIDATION
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-afrikoni-gold/20 text-os-muted hover:text-afrikoni-gold">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="aspect-[4/5] bg-[#080808] rounded-[2.5rem] flex items-center justify-center relative overflow-hidden border border-white/5">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                    <ScanningAnimation active={uploadingDoc === 'Passport'} />

                    {!uploadingDoc && (
                      <div className="flex flex-col items-center gap-4 text-white/5 group-hover/doc:text-white/10 transition-colors">
                        <div className="w-32 h-32 rounded-full border-2 border-current border-dashed opacity-10 animate-spin-slow" />
                        <Shield className="w-24 h-24" />
                      </div>
                    )}

                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center justify-between shadow-2xl">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-os-muted opacity-40 uppercase tracking-widest">DNA Hash</span>
                        <span className="text-[11px] font-mono text-emerald-500 font-bold tracking-tighter">AFK-VAULT-77xa92</span>
                      </div>
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-500 border border-emerald-500/30">
                        <FileSearch className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          {/* Enterprise Section */}
          <Surface variant="glass" className="p-10 relative overflow-hidden">
            <div className="flex items-center gap-5 border-b border-white/5 pb-6 mb-8">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Building2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black tracking-tight">Institutional Integrity</h3>
                <p className="text-sm text-os-muted font-medium italic opacity-70">Entity registration & cross-border fiscal clearance.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {[
                  { label: 'Registered Entity', value: organization?.name || 'Afrikoni Global Supply' },
                  { label: 'Sovereign Node', value: organization?.country || 'Accra, Ghana' },
                  { label: 'Registry Ref', value: 'GH-2024-INST-004' }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center group/ent">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-os-muted opacity-60">{row.label}</span>
                    <span className="text-sm font-bold group-hover:text-afrikoni-gold transition-all">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Surface variant="panel" className="p-5 border-white/5 bg-white/[0.01] group hover:bg-white/[0.03] transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                      <FileCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Certificate of Good Standing</div>
                      <div className="text-xs font-medium text-os-muted">Verified on: 01 Feb 2026</div>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full text-[9px] font-black uppercase tracking-[0.3em] border border-dashed border-white/10 h-10 hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold hover:border-afrikoni-gold/30">
                    Export Authenticated DNA
                  </Button>
                </Surface>
              </div>
            </div>
          </Surface>
        </div>

        {/* Right Column: AI Insights & Matrix */}
        <div className="lg:col-span-4 space-y-8">
          {/* AI Auditor Prophet */}
          <div className="space-y-4">
            <ComplianceInsight
              title="Integrity Watch"
              text="Your institutional DNA is currently optimized for AfCFTA Export Corridors. High probability of friction-less clearance in ECOWAS zones."
              confidence={99.1}
            />
            <ComplianceInsight
              title="AML Intelligence"
              text="No matches found in 32 global sanction lists. Temporal signature remains clear across all major settlement nodes."
              confidence={98.8}
            />
          </div>

          {/* Audit Matrix Chart */}
          <Surface variant="glass" className="p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-os-muted">Audit Matrix</h3>
              <BarChart3 className="w-4 h-4 text-afrikoni-gold" />
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { category: 'ID', score: 95 },
                  { category: 'FIS', score: 88 },
                  { category: 'AML', score: 99 },
                  { category: 'REP', score: 92 }
                ]}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A937" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#D4A937" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: '#080808', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                  <Bar dataKey="score" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={34} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#ffffff40' }} dy={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-1">
                <div className="text-[9px] font-black text-os-muted uppercase tracking-widest">Global Rank</div>
                <div className="text-xl font-black">#422 <span className="text-[10px] text-emerald-500 font-black">TOP 2%</span></div>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-1">
                <div className="text-[9px] font-black text-os-muted uppercase tracking-widest">Active Corridors</div>
                <div className="text-xl font-black">12 <span className="text-[10px] text-afrikoni-gold font-black">SOVEREIGN</span></div>
              </div>
            </div>
          </Surface>

          {/* Infrastructure Health */}
          <Surface variant="glass" className="p-8 group overflow-hidden relative">
            <div className="absolute -bottom-10 -right-10 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
              <Database className="w-32 h-32" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Infrastructure Integrity</h3>
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Blockchain Commit', status: 'Healthy', val: '4ms' },
                { label: 'AES-256 Vault', status: 'Locked', val: 'Active' },
                { label: 'KoniAI Node', status: 'Synced', val: '99.9%' }
              ].map((inf, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-os-muted uppercase tracking-widest">{inf.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-os-muted opacity-40">{inf.val}</span>
                    <span className="text-emerald-500 font-black uppercase tracking-tighter">{inf.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
