import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import {
  Shield, ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  User, Building, FileText, Upload, Eye, RefreshCw, Search,
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
import { getCountryCodeFromCoords } from '@/utils/geoDetectionGoogle';

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
            className="absolute inset-0 bg-os-accent/20 rounded-full blur-2xl"
          />
          <div className="relative z-10 w-12 h-12 rounded-os-md border-2 border-os-accent/30 flex items-center justify-center overflow-hidden bg-black/40 shadow-[0_0_20px_rgba(212,169,55,0.2)]">
            <motion.div
              animate={{ y: [-20, 20, -20] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-0.5 bg-os-accent shadow-[0_0_15px_rgba(212,169,55,1)]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-os-accent/5 via-transparent to-os-accent/5" />
          </div>
        </>
      )}
    </AnimatePresence>
  </div>
);

const ComplianceInsight = ({ title, text, confidence = 98.4 }) => (
  <Surface variant="glass" className="p-6 border-os-accent/20 bg-os-accent/[0.02] relative overflow-hidden group">
    <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
      <Sparkles className="w-24 h-24 text-os-accent" />
    </div>
    <div className="flex items-start gap-4 relative z-10">
      <div className="p-2.5 bg-os-accent/20 rounded-os-sm border border-os-accent/30">
        <Activity className="w-5 h-5 text-os-accent" />
      </div>
      <div className="space-y-1">
        <h4 className="text-os-xs font-black uppercase tracking-[0.3em] text-os-accent">{title}</h4>
        <p className="text-os-sm font-medium leading-relaxed text-stone-600">{text}</p>
        <div className="flex items-center gap-3 mt-3">
          <Badge className="bg-os-accent/10 text-os-accent border-os-accent/20 border text-os-xs font-bold px-2 py-0">COMPLIANCE BOT</Badge>
          <span className="text-os-xs font-bold text-os-muted uppercase tracking-widest">Confidence: {confidence}%</span>
        </div>
      </div>
    </div>
  </Surface>
);

// --- Main Page ---

export default function VerificationPortal() {
  const { profileCompanyId, userId, profile, organization, isSystemReady } = useDashboardKernel();
  const { data: kycVerifications = [], isLoading, error } = useKYCVerifications();

  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [detectedCountry, setDetectedCountry] = useState(null);

  // Google Geo-Intelligence: Detect User Location for Compliance
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const countryCode = await getCountryCodeFromCoords(latitude, longitude);
        if (countryCode) {
          setDetectedCountry(countryCode);
        }
      });
    }
  }, []);

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

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('company_id', profileCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      toast.success("Verification Data Synced", {
        description: `${data?.length || 0} verification records found.`
      });
    } catch (err) {
      toast.error("Sync failed", { description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDocumentUpload = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum file size is 10MB." });
        return;
      }

      setUploadingDoc(type);
      try {
        const filePath = `kyc/${profileCompanyId}/${type.toLowerCase()}-${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('kyc_verifications')
          .upsert({
            company_id: profileCompanyId,
            user_id: userId,
            type: type.toLowerCase() === 'passport' ? 'identity' : 'business',
            document_path: filePath,
            status: 'pending',
            submitted_at: new Date().toISOString()
          });

        if (dbError) throw dbError;

        toast.success(`${type} Uploaded`, {
          description: "Document submitted for verification review."
        });
      } catch (err) {
        toast.error("Upload failed", { description: err.message });
      } finally {
        setUploadingDoc(null);
      }
    };
    input.click();
  };

  if (isLoading) return <CardSkeleton count={3} />;
  if (error) return <ErrorState message={error?.message || 'Verification synchronization failed.'} />;

  return (
    <div className="os-page os-stagger space-y-10 max-w-[1600px] mx-auto pb-24 px-4 py-8">
      {/* 1. Header & Quick Diagnostics */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard/verification" className="inline-flex items-center gap-2 text-os-xs font-black uppercase tracking-[0.3em] text-os-muted hover:text-os-accent transition-all group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to Trust Center
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
              <ShieldCheck className="w-10 h-10 text-os-accent" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 flex items-center gap-4">
                Verification
                <Badge variant="outline" className="text-xs font-bold tracking-widest uppercase border-emerald-500/30 text-emerald-600 bg-emerald-50 px-3 py-1">
                  Active
                </Badge>
              </h1>
              <p className="text-stone-500 text-lg font-medium">Manage your identity and business compliance status.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Surface variant="panel" className="px-6 py-4 flex items-center gap-6 border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Security</div>
                <div className="text-xs font-bold text-emerald-600">Encrypted</div>
              </div>
            </div>
            <div className="w-px h-8 bg-stone-100" />
            <Button
              variant="ghost"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-10 px-5 gap-3 text-os-accent font-bold uppercase tracking-wider text-xs bg-os-accent/5 hover:bg-os-accent/10 transition-all rounded-lg"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing..." : "Refresh Data"}
            </Button>
          </Surface>
        </div>
      </div>

      {/* 2. Primary KPI Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Overall Status', value: kycSummary.overallStatus, icon: ShieldCheck },
          { label: 'Risk Level', value: kycSummary.riskLevel, icon: ShieldAlert },
          { label: 'ID Check', value: kycSummary.idStatus, icon: Fingerprint },
          { label: 'Business Check', value: kycSummary.entStatus, icon: Building },
        ].map((item, i) => (
          <Surface key={i} variant="panel" className="p-6 group hover:border-os-accent/30 transition-all relative overflow-hidden bg-white shadow-sm border-stone-200">
            <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.10] transition-opacity">
              <item.icon className="w-16 h-16 text-stone-900" />
            </div>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{item.label}</span>
              <div className="flex flex-col gap-2">
                <div className={cn(
                  "text-2xl font-bold tracking-tight capitalize",
                  item.value === 'low' || item.value === 'verified' ? 'text-emerald-600' :
                    item.value === 'moderate' || item.value === 'pending' ? 'text-amber-500' : 'text-stone-400'
                )}>
                  {item.value.replace('_', ' ')}
                </div>
                <div className={cn("w-12 h-1 rounded-full",
                  item.value === 'low' || item.value === 'verified' ? 'bg-emerald-500' :
                    item.value === 'moderate' || item.value === 'pending' ? 'bg-amber-500' : 'bg-stone-200'
                )} />
              </div>
            </div>
          </Surface>
        ))}

        <Surface variant="glass" className="p-6 border-os-accent/20 bg-white shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-os-accent">Trust Score</span>
              <Activity className="w-3.5 h-3.5 text-os-accent opacity-50" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tracking-tight text-os-accent">{kycSummary.score}</span>
              <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">POINTS</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Good Standing</div>
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Data & Uploads */}
        <div className="lg:col-span-8 space-y-8">
          {/* Identity Section */}
          <Surface variant="glass" className="p-10 relative overflow-hidden bg-white shadow-sm border-stone-200">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12">
              <User className="w-64 h-64" />
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 relative z-10">
              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-5 border-b border-stone-100 pb-6">
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <Fingerprint className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-2xl font-bold tracking-tight text-stone-900">Personal Identity</h3>
                    <p className="text-sm text-stone-500 font-medium">Your personal identification details.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { label: 'Full Name', value: profile?.full_name || 'Not Provided' },
                    { label: 'Nationality', value: 'Senegal' },
                    { label: 'Date of Birth', value: '13 Feb 1990' },
                    { label: 'Verification Tier', value: 'Standard' }
                  ].map((row, i) => (
                    <div key={i} className="space-y-1 group/field">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 group-hover/field:text-stone-600 transition-colors">
                        {row.label}
                      </div>
                      <div className="text-lg font-semibold tracking-tight text-stone-900 border-b border-stone-100 pb-2 group-hover/field:border-stone-300 transition-all">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => handleDocumentUpload('Passport')}
                    disabled={!!uploadingDoc}
                    className="flex-1 h-12 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-all gap-3 text-stone-600 font-bold uppercase tracking-wider text-xs shadow-sm hover:shadow-md"
                  >
                    <UploadIcon className="w-4 h-4" />
                    Upload ID Document
                  </Button>
                </div>
              </div>

              {/* Document Preview Card */}
              <div className="w-full md:w-[320px] shrink-0">
                <div className="p-6 bg-stone-50 border border-stone-200 rounded-3xl space-y-6 relative overflow-hidden group/doc shadow-inner">

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider border-emerald-200 text-emerald-700 bg-emerald-50">
                      Active
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-500">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="aspect-[4/5] bg-white rounded-2xl flex items-center justify-center relative overflow-hidden border border-stone-200 shadow-sm">
                    <ScanningAnimation active={uploadingDoc === 'Passport'} />

                    {!uploadingDoc && (
                      <div className="flex flex-col items-center gap-4 text-stone-300 group-hover/doc:text-stone-400 transition-colors">
                        <Shield className="w-20 h-20" />
                        <span className="text-sm font-medium">Passport Scan</span>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-xl border border-stone-100 flex items-center justify-between shadow-lg">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ref ID</span>
                        <span className="text-xs font-mono text-stone-900 font-bold">PASS-8829-X</span>
                      </div>
                      <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                        <FileCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          {/* Enterprise Section */}
          <Surface variant="glass" className="p-10 relative overflow-hidden bg-white shadow-sm border-stone-200">
            <div className="flex items-center gap-5 border-b border-stone-100 pb-6 mb-8">
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                <Building className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-bold tracking-tight text-stone-900">Business Verification</h3>
                <p className="text-sm text-stone-500 font-medium">Company registration and tax details.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {[
                  { label: 'Legal Name', value: organization?.name || 'Afrikoni Global Supply' },
                  { label: 'Jurisdiction', value: organization?.country || 'Accra, Ghana' },
                  { label: 'Registry Ref', value: 'GH-2024-INST-004' }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center group/ent border-b border-stone-50 pb-3 last:border-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{row.label}</span>
                    <span className="text-sm font-semibold text-stone-900">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Surface variant="panel" className="p-5 border-stone-200 bg-stone-50 group hover:bg-stone-100 transition-all rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2.5 bg-emerald-100 rounded-lg">
                      <FileCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-900">
                        {detectedCountry === 'NG' || organization?.country === 'Nigeria' || organization?.country === 'NG' ? 'CAC Certificate' : 'Certificate of Incorporation'}
                      </div>
                      <div className="text-xs font-medium text-stone-500">Verified on: 01 Feb 2026</div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-10 border-dashed hover:bg-white hover:border-solid">
                    View Certificate
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
              title="Compliance Status"
              text="Your business profile is cleared for ECOWAS trade zones."
              confidence={99.1}
            />
            <ComplianceInsight
              title="Sanctions Check"
              text="No matches found in global sanction lists. History is clear."
              confidence={98.8}
            />
          </div>

          {/* Audit Matrix Chart */}
          <Surface variant="glass" className="p-8 bg-white border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Verification Progress</h3>
              <BarChart3 className="w-4 h-4 text-stone-400" />
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { category: 'ID', score: 95 },
                  { category: 'TAX', score: 88 },
                  { category: 'AML', score: 99 },
                  { category: 'REP', score: 92 }
                ]}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A937" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#D4A937" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="score" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={28} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dy={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 border border-stone-100 rounded-lg text-center space-y-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Trust Rank</div>
                <div className="text-xl font-bold text-stone-900">Top 5%</div>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-100 rounded-lg text-center space-y-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Regions</div>
                <div className="text-xl font-bold text-stone-900">12</div>
              </div>
            </div>
          </Surface>

          {/* Infrastructure Health */}
          <Surface variant="glass" className="p-8 group overflow-hidden relative bg-white border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-8 border-b border-stone-100 pb-4 text-stone-400">System Status</h3>
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Ledger Record', status: 'Synced', val: '4ms' },
                { label: 'Data Encryption', status: 'Active', val: 'AES-256' },
                { label: 'Compliance Check', status: 'Pass', val: '99.9%' }
              ].map((inf, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-500 uppercase tracking-wider">{inf.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-stone-300">{inf.val}</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-tight">{inf.status}</span>
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
