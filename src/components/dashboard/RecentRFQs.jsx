import React from 'react';
import { FileText, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';

const rfqs = [
  { id: '1', title: 'Organic Cacao Beans', date: 'Jan 18, 2026', status: 'open' },
  { id: '2', title: 'Shea Butter - Unrefined', date: 'Jan 15, 2026', status: 'open' },
  { id: '3', title: 'Coffee Arabica - Washed', date: 'Jan 10, 2026', status: 'pending' },
];

export function RecentRFQs() {
  return (
    <Surface variant="panel" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-os-muted" />
          <h3 className="text-lg font-semibold text-[var(--os-text-primary)]">Recent RFQs</h3>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {(rfqs || []).map((rfq) => (
          <div
            key={rfq.id}
            className="flex items-center justify-between p-4 rounded-lg bg-os-surface-1 hover:bg-os-surface-2 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-[var(--os-text-primary)] truncate">
                {rfq.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-os-muted">
                <Calendar className="h-3.5 w-3.5" />
                <span>{rfq.date}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Open
            </Button>
          </div>
        ))}

        {(rfqs || []).length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-os-muted mx-auto mb-3" />
            <p className="text-sm text-os-muted">No recent RFQs</p>
          </div>
        )}
      </div>
    </Surface>
  );
}
