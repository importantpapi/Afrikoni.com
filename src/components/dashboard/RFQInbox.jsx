import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  FileText,
  Clock,
  Globe,
  DollarSign,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';

const statusConfig = {
  draft: { label: 'Draft' },
  sent: { label: 'New' },
  viewed: { label: 'Viewed' },
  quoted: { label: 'Quoted' },
  accepted: { label: 'Accepted' },
  expired: { label: 'Expired' },
  cancelled: { label: 'Cancelled' },
};

export function RFQInbox({ rfqs = [], className }) {
  const activeRFQs = useMemo(
    () => rfqs.filter((rfq) => !['expired', 'cancelled', 'accepted'].includes(rfq.status)),
    [rfqs]
  );

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  return (
    <Surface variant="panel" className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between p-5 border-b border-os-stroke">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-os-surface-1 flex items-center justify-center">
            <FileText className="h-5 w-5 text-os-muted" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--os-text-primary)]">RFQ Inbox</h3>
            <p className="text-xs text-os-muted">{activeRFQs.length} active requests</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          View All
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y divide-os-stroke">
        {rfqs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-10 w-10 text-os-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--os-text-primary)]">No RFQs yet</p>
            <p className="text-xs text-os-muted mt-1">New buyer requests will appear here</p>
          </div>
        ) : (
          rfqs.slice(0, 4).map((rfq) => {
            const config = statusConfig[rfq.status] || statusConfig.draft;
            const deadline = formatDeadline(rfq.deadline);
            const isUrgent = deadline === 'Today' || deadline === 'Tomorrow';

            return (
              <div
                key={rfq.id}
                className="p-4 hover:bg-os-surface-1 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[var(--os-text-primary)] truncate">
                        {rfq.productName}
                      </p>
                      <StatusBadge label={config.label} tone="neutral" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-os-muted">
                      <span className="font-medium text-[var(--os-text-primary)]">
                        {rfq.buyerCompany}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {rfq.deliveryCountry}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-os-muted">
                        {rfq.quantity.toLocaleString()} {rfq.unit}
                      </span>
                      {rfq.targetPrice && (
                        <span className="flex items-center gap-1 text-xs text-os-muted">
                          <DollarSign className="h-3 w-3" />
                          {rfq.targetPrice}/{rfq.unit}
                        </span>
                      )}
                      {rfq.quotesReceived > 0 && (
                        <span className="flex items-center gap-1 text-xs text-os-muted">
                          <MessageSquare className="h-3 w-3" />
                          {rfq.quotesReceived} quotes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        isUrgent ? 'text-[var(--os-text-primary)]' : 'text-os-muted'
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {deadline}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {rfqs.length > 4 && (
        <div className="p-3 border-t border-os-stroke bg-os-surface-1">
          <Button variant="ghost" className="w-full text-sm text-os-muted hover:text-[var(--os-text-primary)]">
            View {rfqs.length - 4} more requests
          </Button>
        </div>
      )}
    </Surface>
  );
}
