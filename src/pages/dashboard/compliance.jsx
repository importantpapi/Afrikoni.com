/**
 * Sovereign Compliance Hub™ - Afrikoni 2026
 * Phase 7: Regulatory Node Management & AI Prophet
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileCheck, ArrowLeft, Upload, Download, Shield, CheckCircle, XCircle,
  Clock, AlertTriangle, FileText, Building, Globe, Calendar, Filter,
  Search, Eye, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
  Fingerprint, Activity, Zap, Database, ShieldAlert, Boxes
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import AccessDenied from '@/components/AccessDenied';
import { CopilotSignal } from '@/components/dashboard/CopilotSignal';
import { cn } from '@/lib/utils';

export default function ComplianceCenter() {
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin, organization } = useDashboardKernel();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [docFilter, setDocFilter] = useState('all');
  const [activeNode, setActiveNode] = useState(null);
  const [documentCompliance, setDocumentCompliance] = useState([]);
  const [countryRegulatoryMatrix, setCountryRegulatoryMatrix] = useState([]);
  const [complianceKPIs, setComplianceKPIs] = useState({
    overallScore: 0,
    activeTasks: 0,
    riskLevel: 'Analyzing...',
    taxProphet: 'Calculating...'
  });

  useEffect(() => {
    if (!canLoadData) return;
    loadComplianceNodeData();
  }, [canLoadData]);

  const loadComplianceNodeData = async () => {
    setLoading(true);
    try {
      // Load foundational company data
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileCompanyId)
        .single();

      // Simulated 2026 Data for Regulatory Matrix
      const matrix = [
        { code: 'SEN', country: 'Senegal', status: 'verified', duties: 'AfCFTA 0%', risk: 'low', logic: 'OHADA Harmony' },
        { code: 'MAR', country: 'Morocco', status: 'verified', duties: '5.2%', risk: 'low', logic: 'ZLECAF Protocol' },
        { code: 'GHA', country: 'Ghana', status: 'pending', duties: 'Processing...', risk: 'medium', logic: 'ECOWAS Sync' },
        { code: 'NGA', country: 'Nigeria', status: 'warning', duties: '12.5%', risk: 'high', logic: 'Single Window' }
      ];

      setCountryRegulatoryMatrix(matrix);
      setComplianceKPIs({
        overallScore: company?.trust_score || 0,
        activeTasks: 3,
        riskLevel: 'Low (Institutional)',
        taxProphet: 'AfCFTA Optimized'
      });

      // Load documents (simulated)
      setDocumentCompliance([
        { id: 1, name: 'Trade License', status: 'verified', date: '2026-02-10' },
        { id: 2, name: 'Tax Clearance', status: 'verified', date: '2026-01-15' },
        { id: 3, name: 'Logistics Bond', status: 'pending', date: '2026-02-12' }
      ]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSystemReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-afrikoni-offwhite">
        <SpinnerWithTimeout message="Initializing Sovereign Nodes..." ready={isSystemReady && !loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite text-afrikoni-deep selection:bg-os-accent/30 font-sans p-8 md:p-12">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">

        {/* Institutional Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10"
        >
          <div className="space-y-4">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-os-xs font-black text-white/40 hover:text-white transition-all uppercase tracking-[0.3em]">
              <ArrowLeft className="w-3 h-3" />
              Return / Dashboard
            </Link>
            <div className="flex items-center gap-6">
              <div className="p-4 bg-os-accent/10 rounded-os-lg border border-os-accent/30 shadow-[0_0_30px_rgba(212,169,55,0.1)]">
                <Shield className="w-8 h-8 text-os-accent" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter">Sovereign Compliance</h1>
                <p className="text-white/40 font-medium italic">AfCFTA Regulatory Hub v2026 • {organization?.company_name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="h-14 px-8 rounded-os-md border-white/5 bg-white/[0.02] font-black uppercase tracking-widest text-os-xs">
              <Download className="w-4 h-4 mr-2" /> Export Audit Trail
            </Button>
            <Button className="h-14 px-8 rounded-os-md bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-os-xs shadow-[0_20px_40px_rgba(255,255,255,0.05)]">
              <Upload className="w-4 h-4 mr-2" /> Commit Document
            </Button>
          </div>
        </motion.div>

        {/* Intelligence Matrix (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Integrity Pulse', value: `${complianceKPIs.overallScore}%`, icon: Activity, color: 'text-emerald-500' },
            { label: 'Regulatory Load', value: complianceKPIs.activeTasks, sub: 'Active Nodes', icon: Boxes, color: 'text-os-accent' },
            { label: 'Risk Factor', value: complianceKPIs.riskLevel, icon: ShieldAlert, color: 'text-os-blue' },
            { label: 'Prophet Signal', value: complianceKPIs.taxProphet, sub: 'AI Estimated', icon: Zap, color: 'text-os-accent' }
          ].map((kpi, i) => (
            <Surface key={i} variant="panel" className="p-6 space-y-4 hover:border-white/10 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <kpi.icon className="w-16 h-16" />
              </div>
              <span className="text-os-xs font-black uppercase tracking-[0.3em] text-white/40">{kpi.label}</span>
              <div className="space-y-1">
                <div className={cn("text-3xl font-black tracking-tighter", kpi.color)}>{kpi.value}</div>
                {kpi.sub && <div className="text-os-xs text-white/30 font-bold uppercase tracking-widest">{kpi.sub}</div>}
              </div>
            </Surface>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Console */}
          <div className="lg:col-span-8 space-y-10">

            {/* Regulatory Node Matrix */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-os-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Globe className="w-5 h-5 text-os-accent" />
                  Regulatory Node Matrix
                </h2>
                <Badge variant="outline" className="text-os-xs border-white/10 text-white/40">AfCFTA Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {countryRegulatoryMatrix.map((node) => (
                  <Surface
                    key={node.code}
                    variant="panel"
                    className={cn(
                      "p-6 cursor-pointer border-transparent hover:border-white/10 transition-all",
                      activeNode === node.code ? "bg-white/[0.04] border-white/20" : "bg-white/[0.01]"
                    )}
                    onClick={() => setActiveNode(node.code)}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-os-md bg-black/40 border border-white/5 flex items-center justify-center font-black text-white/40">
                          {node.code}
                        </div>
                        <div>
                          <div className="font-black text-os-lg">{node.country}</div>
                          <div className="text-os-xs font-bold text-white/30 uppercase tracking-widest">{node.logic}</div>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-os-xs font-black uppercase tracking-widest px-2",
                        node.status === 'verified' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          node.status === 'warning' ? "bg-os-red/10 text-os-red border-os-red/20" :
                            "bg-os-accent/10 text-os-accent border-os-accent/20"
                      )}>
                        {node.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="space-y-1">
                        <div className="text-os-xs font-black text-white/20 uppercase tracking-[0.2em]">Tariff Node</div>
                        <div className="font-bold text-os-sm text-os-accent">{node.duties}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-os-xs font-black text-white/20 uppercase tracking-[0.2em]">Risk Grade</div>
                        <div className="font-bold text-os-sm capitalize">{node.risk}</div>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </section>

            {/* Document Ledger */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-os-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Database className="w-5 h-5 text-os-blue" />
                  Sovereign Document Ledger
                </h2>
              </div>
              <Surface variant="panel" className="bg-white/[0.01] border-white/5 p-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-6 text-os-xs font-black uppercase tracking-[0.3em] text-white/20">Resource</th>
                      <th className="text-left p-6 text-os-xs font-black uppercase tracking-[0.3em] text-white/20">Commit State</th>
                      <th className="text-left p-6 text-os-xs font-black uppercase tracking-[0.3em] text-white/20">Temporal Link</th>
                      <th className="text-right p-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentCompliance.map((doc) => (
                      <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-os-accent/30 transition-all">
                              <FileText className="w-4 h-4 text-white/40" />
                            </div>
                            <span className="font-bold">{doc.name}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <Badge variant="outline" className={cn(
                            "text-os-xs font-black uppercase tracking-[0.2em]",
                            doc.status === 'verified' ? "border-emerald-500/30 text-emerald-500" : "border-os-accent/30 text-os-accent"
                          )}>
                            {doc.status === 'verified' ? 'Hashed / Immutable' : 'Synchronizing'}
                          </Badge>
                        </td>
                        <td className="p-6 text-os-xs font-mono text-white/30 uppercase">{doc.date}</td>
                        <td className="p-6 text-right">
                          <Button variant="ghost" size="sm" className="hover:bg-white/5 text-white/40 hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Surface>
            </section>
          </div>

          {/* Sidebar Intelligence */}
          <div className="lg:col-span-4 space-y-10">

            <section className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <Zap className="w-4 h-4 text-os-accent" />
                <h3 className="text-os-xs font-black uppercase tracking-[0.3em] text-white/50">Prophet Signals</h3>
              </div>
              <div className="space-y-4">
                <CopilotSignal
                  active={true}
                  type="market"
                  label="Tariff Forecast"
                  message="AfCFTA Phase II Protocols detected. Duty reduction of 1.5% likely for processed agricultural nodes by Q3 2026."
                />
                <CopilotSignal
                  active={true}
                  type="warning"
                  label="Regulatory Shift"
                  message="Senegal Customs updating manifest requirements. Ensure all digital hashes are committed before port entry."
                />
                <CopilotSignal
                  active={true}
                  type="secure"
                  label="Integrity Guard"
                  message="Full institutional DNA match detected across all hubs. Escrow velocity increased to 99%."
                />
              </div>
            </section>

            <Surface variant="glass" className="p-8 border-os-accent/20 bg-os-accent/[0.02] space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Fingerprint className="w-12 h-12 text-os-accent" />
              </div>
              <div className="space-y-2">
                <h4 className="text-os-xs font-black uppercase tracking-[0.2em] text-os-accent/60">Compliance DNA</h4>
                <div className="text-3xl font-black">Institutional</div>
              </div>
              <p className="text-os-xs text-white/60 font-medium italic leading-relaxed">
                Your enterprise DNA is currently synchronized with the Pan-African Trade Ledger.
                <span className="text-white"> All nodes are green </span> for immediate cross-border settlement.
              </p>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-os-xs font-black text-white/40 uppercase tracking-widest">
                  <span>Ledger Synchronization</span>
                  <span>100%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-os-accent shadow-[0_0_10px_rgba(212,169,55,0.5)]" />
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
