import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Wallet, Truck, AlertTriangle, Sparkles, Globe, Target, TerminalSquare } from 'lucide-react';
import { Surface } from './Surface';
import { StatusBadge } from './StatusBadge';
import { OSDrawer } from './OSDrawer';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { useKernelEventStream } from '@/hooks/useKernelEventStream';
import { useAuth } from '@/contexts/AuthProvider';

const ACTION_LABELS: Record<string, string> = {
  add_title: 'Add trade title',
  add_description: 'Add trade description',
  add_quantity: 'Add quantity and units',
  select_quote: 'Select a supplier quote',
  generate_contract: 'Generate contract draft',
  sign_contract: 'Sign contract',
  fund_escrow: 'Fund escrow milestone',
  add_hs_code: 'Add HS code',
  upload_compliance_docs: 'Upload compliance documents',
  confirm_delivery: 'Confirm delivery',
  accept_delivery: 'Accept delivery',
  resolve_escrow: 'Resolve escrow dispute',
  await_supplier_quotes: 'Await supplier quotes',
  compliance_case_pending: 'Resolve compliance case',
  compliance_case_error: 'Retry compliance case',
};

const EVENT_GROUP_LABELS: Record<string, string> = {
  automation_triggered: 'Automation',
  transition_attempt: 'Transition attempt',
  state_transition: 'State change',
};

function normalizeRequiredActions(value?: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

export function TradeKernelHUD() {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { events, timeline } = useKernelEventStream({
    companyId: profile?.company_id || null,
    limit: 12,
  });
  const {
    trustScore,
    kycStatus,
    escrowLockedValue,
    pipelineValue,
    shipmentsInTransit,
    afcftaReady,
    riskLevel,
    loading,
  } = useTradeKernelState();

  const riskTone = riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success';
  const escrowDisplay = `$${(escrowLockedValue / 1000).toFixed(1)}K`;
  const pipelineDisplay = `$${(pipelineValue / 1000).toFixed(1)}K`;

  const signals = useMemo(
    () => [
      { label: 'Trust Score', value: trustScore, icon: ShieldCheck },
      { label: 'KYC Status', value: kycStatus === 'verified' ? 'Verified' : 'Pending', icon: Sparkles },
      { label: 'Escrow Locked', value: escrowDisplay, icon: Wallet },
      { label: 'Active Pipeline', value: pipelineDisplay, icon: Activity },
      { label: 'Transit', value: `${shipmentsInTransit} shipments`, icon: Truck },
      { label: 'AfCFTA Readiness', value: afcftaReady ? 'Ready' : 'In Progress', icon: Globe },
    ],
    [trustScore, kycStatus, escrowDisplay, pipelineDisplay, shipmentsInTransit, afcftaReady]
  );

  const kernelBlocks = useMemo(() => {
    return events
      .filter((event) => event.decision === 'BLOCK')
      .slice(0, 3)
      .map((event) => ({
        id: event.id,
        label: EVENT_GROUP_LABELS[event.event_type] || event.event_type?.replace(/_/g, ' ') || 'Kernel block',
        reason: event.reason_code || 'Kernel blocked transition',
        required: normalizeRequiredActions(event.required_actions),
      }));
  }, [events]);

  const upcomingActions = useMemo(() => {
    const actions = new Map<string, string>();
    events.forEach((event) => {
      normalizeRequiredActions(event.required_actions).forEach((action) => {
        if (!actions.has(action)) {
          actions.set(action, ACTION_LABELS[action] || action.replace(/_/g, ' '));
        }
      });
    });
    return Array.from(actions.entries()).slice(0, 3).map(([key, label]) => ({ key, label }));
  }, [events]);

  const automationEvents = useMemo(() => {
    return timeline
      .filter((item) => item.type === 'automation_triggered')
      .slice(0, 3);
  }, [timeline]);

  const auditLog = useMemo(() => {
    return timeline
      .filter((item) => ['state_transition', 'transition_attempt'].includes(item.type))
      .slice(0, 4);
  }, [timeline]);

  return (
    <>
      <div className="hidden xl:block fixed right-5 top-[104px] w-[320px] z-30">
        <Surface variant="glass" className="p-4 os-stagger">
          <div className="flex items-center justify-between">
            <div className="os-label">World State</div>
            <StatusBadge label={riskLevel.toUpperCase()} tone={riskTone} />
          </div>

          <div className="mt-4 space-y-3">
            {signals.map(signal => (
              <div key={signal.label} className="flex items-center justify-between text-os-sm">
                <div className="flex items-center gap-2 text-os-muted">
                  <signal.icon className="h-4 w-4 text-os-gold/80" />
                  <span className="text-os-xs uppercase tracking-[0.2em]">{signal.label}</span>
                </div>
                <span className="text-os-sm font-semibold">
                  {loading ? '...' : signal.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-os-muted text-os-xs uppercase tracking-[0.22em]">
              <TerminalSquare className="h-4 w-4 text-os-gold" />
              Kernel Console
            </div>

            <div className="space-y-2 text-os-sm">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Active Blocks</div>
              {kernelBlocks.length === 0 && (
                <div className="text-os-xs text-os-muted">No active blocks</div>
              )}
              {kernelBlocks.map((block) => (
                <div key={block.id} className="flex flex-col gap-1">
                  <span className="text-os-sm font-semibold">{block.label}</span>
                  <span className="text-os-xs text-os-muted">{block.reason}</span>
                  {block.required.length > 0 && (
                    <span className="text-os-xs text-os-muted">
                      Required: {block.required.slice(0, 2).map((action) => ACTION_LABELS[action] || action).join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 text-os-sm">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Upcoming Triggers</div>
              {upcomingActions.length === 0 && (
                <div className="text-os-xs text-os-muted">No pending triggers</div>
              )}
              {upcomingActions.map((action) => (
                <div key={action.key} className="flex items-center justify-between">
                  <span>{action.label}</span>
                  <span className="text-os-xs text-os-muted">Kernel</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-os-sm">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Auto-Actions</div>
              {automationEvents.length === 0 && (
                <div className="text-os-xs text-os-muted">No automations fired</div>
              )}
              {automationEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <span>{event.label}</span>
                  <span className="text-os-xs text-os-muted">{event.time}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-os-sm">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Transition Audit</div>
              {auditLog.length === 0 && (
                <div className="text-os-xs text-os-muted">No transitions logged</div>
              )}
              {auditLog.map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <span>{event.label}</span>
                  <span className="text-os-xs text-os-muted">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </div>

      <button
        className="xl:hidden fixed bottom-6 right-6 z-40 os-panel-soft px-4 py-3 text-os-sm font-semibold os-glow-hover"
        onClick={() => setOpen(true)}
      >
        Open Trade HUD
      </button>

      <OSDrawer open={open} onClose={() => setOpen(false)} title="Trade Kernel">
        <div className="space-y-4">
          {signals.map(signal => (
            <div key={signal.label} className="flex items-center justify-between text-os-sm">
              <div className="flex items-center gap-2 text-os-muted">
                <signal.icon className="h-4 w-4 text-os-gold/80" />
                <span className="text-os-xs uppercase tracking-[0.2em]">{signal.label}</span>
              </div>
              <span className="text-os-sm font-semibold">
                {loading ? '...' : signal.value}
              </span>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-os-muted text-os-xs uppercase tracking-[0.22em]">
              <AlertTriangle className="h-4 w-4 text-os-amber" />
              Risk Level: {riskLevel.toUpperCase()}
            </div>
            <p className="text-os-sm text-os-muted">
              Risk reflects open disputes and unresolved compliance gaps.
            </p>

            <div className="space-y-2">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Active Blocks</div>
              {kernelBlocks.length === 0 && (
                <div className="text-os-xs text-os-muted">No active blocks</div>
              )}
              {kernelBlocks.map((block) => (
                <div key={block.id} className="text-os-sm">
                  <div className="font-semibold">{block.label}</div>
                  <div className="text-os-xs text-os-muted">{block.reason}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Upcoming Triggers</div>
              {upcomingActions.length === 0 && (
                <div className="text-os-xs text-os-muted">No pending triggers</div>
              )}
              {upcomingActions.map((action) => (
                <div key={action.key} className="flex items-center justify-between text-os-sm">
                  <span>{action.label}</span>
                  <span className="text-os-xs text-os-muted">Kernel</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-os-xs uppercase tracking-[0.2em] text-os-muted">Transition Audit</div>
              {auditLog.length === 0 && (
                <div className="text-os-xs text-os-muted">No transitions logged</div>
              )}
              {auditLog.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-os-sm">
                  <span>{event.label}</span>
                  <span className="text-os-xs text-os-muted">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </OSDrawer>
    </>
  );
}
