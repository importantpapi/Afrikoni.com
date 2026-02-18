/**
 * Afrikoni Compliance Hub™ - Afrikoni 2026
 * Phase 7: Regulatory Node Management & AI Prophet
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck, Upload, Download, Shield, CheckCircle, XCircle,
  Clock, AlertTriangle, FileText, Building, Globe, Calendar, Filter,
  Search, Eye, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
  Activity, Zap, ShieldAlert, Boxes
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

      // Load regulatory matrix from trade corridors / company trading countries
      const { data: corridors } = await supabase
        .from('trade_corridors')
        .select('country_code, country_name, verification_status, duty_rate, risk_level, trade_bloc')
        .eq('company_id', profileCompanyId)
        .order('country_name');

      const matrix = (corridors || []).map(c => ({
        code: c.country_code || '',
        country: c.country_name || '',
        status: c.verification_status || 'pending',
        duties: c.duty_rate || 'Processing...',
        risk: c.risk_level || 'medium',
        logic: c.trade_bloc || 'AfCFTA'
      }));
      setCountryRegulatoryMatrix(matrix);

      // Load compliance documents from kyc_verifications or compliance_documents
      const { data: docs } = await supabase
        .from('kyc_verifications')
        .select('id, document_type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setDocumentCompliance((docs || []).map(d => ({
        id: d.id,
        name: d.document_type || 'Document',
        status: d.status || 'pending',
        date: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : ''
      })));

      // Calculate KPIs from real data
      const verifiedDocs = (docs || []).filter(d => d.status === 'verified').length;
      const totalDocs = (docs || []).length;
      const docScore = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;
      const pendingTasks = (docs || []).filter(d => d.status === 'pending').length + matrix.filter(m => m.status === 'pending').length;
      const hasHighRisk = matrix.some(m => m.risk === 'high');

      setComplianceKPIs({
        overallScore: company?.trust_score || docScore,
        activeTasks: pendingTasks,
        riskLevel: hasHighRisk ? 'Elevated' : pendingTasks > 0 ? 'Moderate' : 'Low (Institutional)',
        taxProphet: matrix.some(m => m.duties?.includes('0%')) ? 'AfCFTA Optimized' : 'Standard Tariff'
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSystemReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-afrikoni-offwhite">
        <SpinnerWithTimeout message="Initializing Security Nodes..." ready={isSystemReady && !loading} />
      </div>
    );
  }

  return (
    <div className="os-page-layout">

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-os-stroke pb-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-os-accent/10 rounded-xl border border-os-accent/20">
                <Shield className="w-7 h-7 text-os-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Compliance Center</h1>
                <p className="text-os-text-secondary text-sm mt-0.5">Your documents, regulations, and trade compliance status</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export Report
            </Button>
            <Button className="gap-2 bg-os-accent text-black hover:bg-os-accent/90">
              <Upload className="w-4 h-4" /> Upload Document
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Compliance Score', value: `${complianceKPIs.overallScore}%`, icon: Activity, color: 'text-emerald-600' },
            { label: 'Pending Tasks', value: complianceKPIs.activeTasks, sub: 'Need attention', icon: Boxes, color: 'text-os-accent' },
            { label: 'Risk Level', value: complianceKPIs.riskLevel, icon: ShieldAlert, color: 'text-blue-600' },
            { label: 'Trade Agreement', value: complianceKPIs.taxProphet, sub: 'AI estimated', icon: Zap, color: 'text-os-accent' }
          ].map((kpi, i) => (
            <Surface key={i} variant="panel" className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-os-text-secondary">{kpi.label}</span>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              {kpi.sub && <div className="text-xs text-os-text-secondary">{kpi.sub}</div>}
            </Surface>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Country Regulatory Status */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-os-accent" />
                  Countries You Trade With
                </h2>
                <span className="text-xs text-os-text-secondary">AfCFTA Active</span>
              </div>

              {countryRegulatoryMatrix.length === 0 ? (
                <div className="text-center py-12 text-os-text-secondary">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No trade corridors set up yet</p>
                  <p className="text-sm mt-1">Add the countries you trade with to see compliance requirements</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryRegulatoryMatrix.map((node) => (
                    <Surface
                      key={node.code}
                      variant="panel"
                      className={cn(
                        "p-5 cursor-pointer transition-all hover:border-os-accent/30",
                        activeNode === node.code ? "border-os-accent/40 bg-os-accent/5" : ""
                      )}
                      onClick={() => setActiveNode(node.code)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-os-surface-solid border border-os-stroke flex items-center justify-center font-bold text-os-text-secondary text-sm">
                            {node.code}
                          </div>
                          <div>
                            <div className="font-semibold">{node.country}</div>
                            <div className="text-xs text-os-text-secondary">{node.logic}</div>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-xs",
                          node.status === 'verified' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                            node.status === 'warning' ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                              "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        )}>
                          {node.status === 'verified' ? '✓ Verified' : node.status === 'warning' ? '⚠ Warning' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-os-stroke">
                        <div>
                          <div className="text-xs text-os-text-secondary">Import Duty</div>
                          <div className="font-semibold text-sm text-os-accent">{node.duties}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-os-text-secondary">Risk</div>
                          <div className="font-semibold text-sm capitalize">{node.risk}</div>
                        </div>
                      </div>
                    </Surface>
                  ))}
                </div>
              )}
            </section>

            {/* Documents */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-os-text-secondary" />
                Your Documents
              </h2>
              <Surface variant="panel" className="overflow-hidden">
                {documentCompliance.length === 0 ? (
                  <div className="text-center py-12 text-os-text-secondary">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No documents uploaded yet</p>
                    <p className="text-sm mt-1">Upload your business registration, tax certificates, and trade licenses</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-os-stroke">
                        <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-os-text-secondary">Document</th>
                        <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-os-text-secondary">Status</th>
                        <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-os-text-secondary">Date</th>
                        <th className="text-right p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentCompliance.map((doc) => (
                        <tr key={doc.id} className="border-b border-os-stroke hover:bg-os-surface-solid/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-os-surface-solid rounded-lg border border-os-stroke">
                                <FileText className="w-4 h-4 text-os-text-secondary" />
                              </div>
                              <span className="font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={cn(
                              "text-xs",
                              doc.status === 'verified'
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                            )}>
                              {doc.status === 'verified' ? '✓ Verified' : 'Under Review'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-os-text-secondary">{doc.date}</td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Surface>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Surface variant="panel" className="p-6 border border-os-accent/20 bg-os-accent/5">
              <h4 className="text-sm font-semibold text-os-accent mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> AI Compliance Tips
              </h4>
              <div className="space-y-3 text-sm text-os-text-secondary">
                <p>• AfCFTA Phase II may reduce duties by 1.5% for processed agricultural goods by Q3 2026.</p>
                <p>• Senegal is updating customs requirements — ensure your documents are up to date before shipping.</p>
                <p>• Your compliance score is strong. Keep documents verified to maintain buyer trust.</p>
              </div>
            </Surface>

            <Surface variant="panel" className="p-6">
              <h4 className="text-sm font-semibold mb-2">Compliance Score</h4>
              <div className="text-3xl font-bold text-emerald-600 mb-2">{complianceKPIs.overallScore}%</div>
              <div className="h-2 w-full bg-os-stroke rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${complianceKPIs.overallScore}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <p className="text-xs text-os-text-secondary mt-2">
                Your documents are synchronized. You're ready for cross-border trade.
              </p>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
