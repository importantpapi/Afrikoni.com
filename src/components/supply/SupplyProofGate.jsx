/**
 * SupplyProofGate — Afrikoni Supply Truth Engine
 *
 * Blocks a product from going public until the seller uploads
 * at least one proof of real supply.  Simple, fast, WhatsApp-friendly.
 *
 * Usage:
 *   <SupplyProofGate productId={id} companyId={cid} onVerified={() => refetch()} />
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Clock, Video, FileText,
  ImagePlus, Upload, CheckCircle2, AlertTriangle, RefreshCw,
  ChevronRight, Warehouse, X
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

// ─── Proof type config ────────────────────────────────────────────────────
const PROOF_TYPES = [
  {
    key: 'video',
    label: 'Stock Video',
    icon: Video,
    hint: '10–30 sec video showing your actual goods',
    accept: 'video/*',
    maxSizeMB: 50,
    badge: 'Best',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    expires_days: 14,
  },
  {
    key: 'photos',
    label: 'Stock Photos',
    icon: ImagePlus,
    hint: 'At least 3 clear photos of goods / warehouse',
    accept: 'image/*',
    maxSizeMB: 10,
    badge: 'Good',
    badgeColor: 'bg-blue-100 text-blue-700',
    expires_days: 14,
    multiple: true,
  },
  {
    key: 'invoice',
    label: 'Supplier Invoice / PO',
    icon: FileText,
    hint: 'Recent invoice or purchase order from your supplier',
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSizeMB: 10,
    badge: 'Good',
    badgeColor: 'bg-blue-100 text-blue-700',
    expires_days: 30,
  },
  {
    key: 'facility',
    label: 'Facility / Warehouse',
    icon: Warehouse,
    hint: 'Photo of your storage facility or factory floor',
    accept: 'image/*',
    maxSizeMB: 10,
    badge: null,
    badgeColor: '',
    expires_days: 60,
  },
];

// ─── Days until expiry ────────────────────────────────────────────────────
function daysUntil(isoDate) {
  if (!isoDate) return null;
  const diff = new Date(isoDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Status pill ──────────────────────────────────────────────────────────
export function SupplyTruthBadge({ status, expiresAt, score, compact = false }) {
  const days = daysUntil(expiresAt);
  const expiringSoon = days !== null && days <= 3;

  const map = {
    verified: {
      icon: ShieldCheck,
      label: compact ? 'Verified' : `Supply Verified${expiringSoon ? ` · ${days}d left` : ''}`,
      className: expiringSoon
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    pending_proof: {
      icon: ShieldAlert,
      label: compact ? 'Needs Proof' : 'Needs Supply Proof',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    ai_review: {
      icon: Clock,
      label: compact ? 'In Review' : 'Proof Under Review',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    expired: {
      icon: AlertTriangle,
      label: compact ? 'Proof Expired' : 'Supply Proof Expired',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
    unverified: {
      icon: ShieldAlert,
      label: compact ? 'Unverified' : 'No Supply Proof',
      className: 'bg-stone-100 text-stone-600 border-stone-200',
    },
    flagged: {
      icon: AlertTriangle,
      label: compact ? 'Flagged' : 'Supply Flagged',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const cfg = map[status] || map.unverified;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
      {status === 'verified' && score > 0 && !compact && (
        <span className="ml-1 opacity-60">· {score}/100</span>
      )}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function SupplyProofGate({ productId, companyId, productName, onVerified }) {
  const [proof, setProof] = useState(null);   // latest accepted proof
  const [status, setStatus] = useState(null); // supply_truth_status
  const [score, setScore] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const fileRef = useRef();

  // Load current proof state
  const loadProof = async () => {
    setLoading(true);
    try {
      // Load latest accepted proof
      const { data: proofData } = await supabase
        .from('supply_proofs')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Load product truth status
      const { data: product } = await supabase
        .from('products')
        .select('supply_truth_status, supply_truth_score, supply_proof_expires_at')
        .eq('id', productId)
        .single();

      setProof(proofData);
      if (product) {
        setStatus(product.supply_truth_status || 'unverified');
        setScore(product.supply_truth_score || 0);
        setExpiresAt(product.supply_proof_expires_at);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProof(); }, [productId]);

  // ── Upload flow ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const cfg = PROOF_TYPES.find(t => t.key === selectedType);
    const maxBytes = (cfg?.maxSizeMB || 10) * 1024 * 1024;
    const oversized = selected.filter(f => f.size > maxBytes);

    if (oversized.length) {
      toast.error(`File too large. Max ${cfg?.maxSizeMB}MB per file.`);
      return;
    }
    setFiles(selected);
  };

  const uploadProof = async () => {
    if (!selectedType || !files.length) {
      toast.error('Choose a proof type and upload at least one file.');
      return;
    }
    setUploading(true);

    try {
      const paths = [];

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `supply-proofs/${companyId}/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, file, { upsert: false });

        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);
        paths.push({ path, url: publicUrl, name: file.name, size: file.size });
      }

      const cfg = PROOF_TYPES.find(t => t.key === selectedType);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (cfg?.expires_days || 14));

      // Insert proof record
      const { error: insertErr } = await supabase
        .from('supply_proofs')
        .insert({
          product_id: productId,
          company_id: companyId,
          proof_type: selectedType,
          storage_paths: paths,
          status: 'pending',  // Pending = awaiting review
          expires_at: expiresAt.toISOString(),
        });

      if (insertErr) throw insertErr;

      // Update product truth status to ai_review
      await supabase
        .from('products')
        .update({
          supply_truth_status: 'ai_review',
          supply_proof_expires_at: expiresAt.toISOString(),
        })
        .eq('id', productId);

      // For now: auto-accept for verified suppliers (manual override later)
      // In production this would call supply_proof_analyze edge function
      await autoAcceptIfVerifiedSupplier();

      toast.success('Supply proof submitted. Your listing will be activated shortly.');
      setOpen(false);
      setFiles([]);
      setSelectedType(null);
      await loadProof();
      onVerified?.();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Auto-accept for already-verified companies (grace path)
  // In production, replace with AI analysis edge function call
  const autoAcceptIfVerifiedSupplier = async () => {
    const { data: company } = await supabase
      .from('companies')
      .select('verified, verification_status')
      .eq('id', companyId)
      .single();

    if (company?.verified || company?.verification_status === 'verified') {
      // Verified company — auto-accept, score = 70 (proof present, company verified)
      await supabase
        .from('supply_proofs')
        .update({ status: 'accepted', authenticity_score: 70 })
        .eq('product_id', productId)
        .eq('status', 'pending');

      await supabase
        .from('products')
        .update({
          supply_truth_status: 'verified',
          supply_truth_score: 70,
          last_stock_confirmed_at: new Date().toISOString(),
        })
        .eq('id', productId);

      // Take inventory snapshot
      const { data: prod } = await supabase
        .from('products')
        .select('supply_ability_qty, stock_type, warehouse_city')
        .eq('id', productId)
        .single();

      if (prod) {
        await supabase.from('inventory_snapshots').insert({
          product_id: productId,
          company_id: companyId,
          quantity_available: prod.supply_ability_qty,
          stock_type: prod.stock_type || 'in_stock',
          warehouse_city: prod.warehouse_city,
          update_method: 'manual',
          confidence: 70,
        });
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-6 w-32 bg-stone-100 animate-pulse rounded-full" />
    );
  }

  const days = daysUntil(expiresAt);
  const expiringSoon = days !== null && days <= 3 && status === 'verified';
  const needsAction = ['unverified', 'expired', 'flagged'].includes(status) || expiringSoon;

  return (
    <>
      {/* ── Inline badge + action trigger ── */}
      <div className="flex items-center gap-2">
        <SupplyTruthBadge status={status} expiresAt={expiresAt} score={score} />
        {needsAction && (
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-os-accent underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {status === 'verified' && expiringSoon ? 'Renew proof' : 'Upload proof →'}
          </button>
        )}
        {status === 'ai_review' && (
          <span className="text-xs text-blue-600">Under review…</span>
        )}
        {status === 'verified' && !expiringSoon && (
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Upload drawer ── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
                <div>
                  <h2 className="font-semibold text-stone-800">Prove Your Supply</h2>
                  <p className="text-xs text-stone-500 mt-0.5 truncate max-w-xs">
                    {productName || 'This product'}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-5 mt-4">
                {/* Why this matters */}
                <div className="bg-os-accent/5 border border-os-accent/20 rounded-xl p-3">
                  <p className="text-xs text-stone-600">
                    <span className="font-semibold text-stone-800">Why?</span>{' '}
                    Buyers on Afrikoni only see products with verified supply.
                    One upload → your listing goes live. Takes 2 minutes.
                  </p>
                </div>

                {/* Proof type selector */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Choose proof type
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PROOF_TYPES.map(type => {
                      const Icon = type.icon;
                      const selected = selectedType === type.key;
                      return (
                        <button
                          key={type.key}
                          onClick={() => {
                            setSelectedType(type.key);
                            setFiles([]);
                            if (fileRef.current) fileRef.current.value = '';
                          }}
                          className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all
                            ${selected
                              ? 'border-os-accent bg-os-accent/5 ring-1 ring-os-accent'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                            }`}
                        >
                          {type.badge && (
                            <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${type.badgeColor}`}>
                              {type.badge}
                            </span>
                          )}
                          <Icon className={`w-4 h-4 ${selected ? 'text-os-accent' : 'text-stone-400'}`} />
                          <span className="text-xs font-medium text-stone-700">{type.label}</span>
                          <span className="text-[10px] text-stone-400 leading-tight">{type.hint}</span>
                          <span className="text-[10px] text-stone-400">
                            Valid {type.expires_days} days
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File upload area */}
                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept={PROOF_TYPES.find(t => t.key === selectedType)?.accept}
                      multiple={PROOF_TYPES.find(t => t.key === selectedType)?.multiple}
                      onChange={handleFileChange}
                    />
                    {files.length === 0 ? (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-stone-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-os-accent hover:bg-os-accent/5 transition-all"
                      >
                        <Upload className="w-6 h-6 text-stone-400" />
                        <span className="text-sm text-stone-600">Click to choose file</span>
                        <span className="text-xs text-stone-400">
                          Max {PROOF_TYPES.find(t => t.key === selectedType)?.maxSizeMB}MB
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-xs text-stone-700 truncate flex-1">{f.name}</span>
                            <span className="text-[10px] text-stone-400">
                              {(f.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="text-xs text-stone-400 hover:text-stone-600 underline"
                        >
                          Change file
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Submit */}
                <Button
                  onClick={uploadProof}
                  disabled={uploading || !selectedType || !files.length}
                  className="w-full bg-os-accent hover:bg-os-accent/90 text-white"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Uploading…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Submit Proof → Activate Listing
                    </span>
                  )}
                </Button>

                <p className="text-[10px] text-stone-400 text-center">
                  Proof is reviewed automatically. Verified companies go live instantly.
                  Unverified companies are reviewed within 24h.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
