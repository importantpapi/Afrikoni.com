import React, { useMemo, useState } from 'react';
import { mockRFQs } from '@/lib/trade-kernel';
import {
  Search,
  Plus,
  Clock,
  Globe,
  DollarSign,
  MessageSquare,
  Send,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft' },
  sent: { label: 'New' },
  viewed: { label: 'Viewed' },
  quoted: { label: 'Quoted' },
  accepted: { label: 'Accepted' },
  expired: { label: 'Expired' },
  cancelled: { label: 'Cancelled' },
};

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'New' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
];

export default function RFQs() {
  const [search, setSearch] = useState('');
  const [showQuickRFQ, setShowQuickRFQ] = useState(false);
  const [quickRFQText, setQuickRFQText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const formatDeadline = (deadline) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days}d left`;
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return mockRFQs.filter((rfq) => {
      const matchesSearch =
        rfq.productName.toLowerCase().includes(term) ||
        rfq.buyerCompany.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const handleGenerateRFQ = () => {
    setAiProcessing(true);
    setTimeout(() => {
      setAiResult({
        product: 'Organic Shea Butter',
        qty: '20 MT',
        specs: ['Food-grade certified', 'Unrefined', 'Cold-pressed', 'Organic certified'],
        hsCode: '1515.90',
        suppliers: 7,
      });
      setAiProcessing(false);
    }, 1200);
  };

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="os-label">Trade OS Intake</div>
            <h1 className="os-title mt-2">RFQs & Inquiries</h1>
            <p className="text-sm text-os-muted">
              {filtered.length} active requests for quotation
            </p>
          </div>
          <Button
            className="bg-[var(--os-text-primary)] text-[var(--os-bg)] hover:opacity-90 font-semibold"
            onClick={() => {
              setShowQuickRFQ((prev) => !prev);
              setAiResult(null);
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Quick RFQ
          </Button>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center bg-os-surface-1 rounded-lg p-1 border border-os-stroke">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  statusFilter === tab.key
                    ? 'bg-os-surface-0 text-[var(--os-text-primary)]'
                    : 'text-os-muted hover:text-[var(--os-text-primary)]'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] min-w-[18px] text-center',
                    statusFilter === tab.key ? 'bg-os-surface-1' : 'bg-os-surface-0'
                  )}
                >
                  {tab.key === 'all'
                    ? mockRFQs.length
                    : mockRFQs.filter((r) => r.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-os-muted" />
            <Input
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Surface>

      {showQuickRFQ && (
        <Surface variant="panel" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-os-surface-1 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-os-muted" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--os-text-primary)]">AI-Powered Quick RFQ</h3>
              <p className="text-xs text-os-muted">Describe what you need in plain language — the kernel structures it.</p>
            </div>
          </div>
          <Textarea
            placeholder='e.g. "I need 20 tons of organic shea butter delivered to Hamburg by March 2026"'
            value={quickRFQText}
            onChange={(e) => setQuickRFQText(e.target.value)}
            className="min-h-[90px] mb-3"
          />

          {aiResult && (
            <div className="mb-4 p-4 rounded-lg bg-os-surface-1 border border-os-stroke animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-os-muted" />
                <span className="text-sm font-medium text-[var(--os-text-primary)]">AI Structured RFQ Preview</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-os-muted uppercase">Product</p>
                  <p className="text-sm font-medium text-[var(--os-text-primary)]">{aiResult.product}</p>
                </div>
                <div>
                  <p className="text-[10px] text-os-muted uppercase">Quantity</p>
                  <p className="text-sm font-medium text-[var(--os-text-primary)]">{aiResult.qty}</p>
                </div>
                <div>
                  <p className="text-[10px] text-os-muted uppercase">HS Code</p>
                  <p className="text-sm font-medium text-[var(--os-text-primary)] font-mono">{aiResult.hsCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-os-muted uppercase">Matched Suppliers</p>
                  <p className="text-sm font-medium text-[var(--os-text-primary)]">{aiResult.suppliers} found</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {aiResult.specs.map((spec) => (
                  <span key={spec} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-os-surface-0 border border-os-stroke">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-os-muted">
              AI auto-fills: specs, HS codes, compliance requirements, supplier matches
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowQuickRFQ(false); setAiResult(null); }}>
                Cancel
              </Button>
              {aiResult ? (
                <Button size="sm" className="gap-2">
                  <Send className="h-3 w-3" /> Send to {aiResult.suppliers} Suppliers
                </Button>
              ) : (
                <Button size="sm" className="gap-2" onClick={handleGenerateRFQ} disabled={aiProcessing || !quickRFQText}>
                  {aiProcessing ? (
                    <><span className="animate-spin h-3 w-3 border-2 border-[var(--os-text-primary)]/30 border-t-[var(--os-text-primary)] rounded-full" /> Processing...</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Generate RFQ</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Surface>
      )}

      <div className="space-y-3">
        {filtered.map((rfq) => {
          const config = statusConfig[rfq.status] || statusConfig.draft;
          const deadline = formatDeadline(rfq.deadline);
          const isUrgent = deadline === 'Today' || deadline === 'Tomorrow';

          return (
            <Surface key={rfq.id} variant="panel" className="group p-5 hover:bg-os-surface-2 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-[var(--os-text-primary)]">{rfq.productName}</h3>
                    <StatusBadge label={config.label} tone="neutral" />
                    {isUrgent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-os-surface-0 border border-os-stroke">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-os-muted">
                    <span className="font-medium text-[var(--os-text-primary)]">{rfq.buyerCompany}</span>
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{rfq.deliveryCountry}</span>
                    <span className="tabular-nums">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
                    {rfq.targetPrice && (
                      <span className="flex items-center gap-1 tabular-nums"><DollarSign className="h-3 w-3" />{rfq.targetPrice}/{rfq.unit}</span>
                    )}
                    {rfq.quotesReceived > 0 && (
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{rfq.quotesReceived} quotes</span>
                    )}
                  </div>
                  {rfq.requirements && (
                    <p className="text-xs text-os-muted mt-2 line-clamp-1">{rfq.requirements}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={cn('flex items-center gap-1 text-xs font-medium tabular-nums', isUrgent ? 'text-[var(--os-text-primary)]' : 'text-os-muted')}>
                    <Clock className="h-3 w-3" /> {deadline}
                  </span>
                  <Button variant="outline" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Respond <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
