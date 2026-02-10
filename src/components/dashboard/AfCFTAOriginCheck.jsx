import React, { useMemo } from 'react';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { checkAfCFTACompliance } from '@/services/afcftaRulesEngine';
import { CheckCircle2, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

export default function AfCFTAOriginCheck({ trade }) {
    const compliance = useMemo(() => {
        if (!trade) return null;
        return checkAfCFTACompliance({
            origin_country: trade.origin_country || 'GH', // Default for demo
            destination_country: trade.destination_country || 'ZA', // Default for demo
            hs_code: trade.hs_code || '1801'
        });
    }, [trade]);

    if (!compliance) return null;

    const isQualified = compliance.qualified;

    return (
        <Surface variant="glass" className={`p-5 border ${isQualified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isQualified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {isQualified ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold uppercase tracking-wide ${isQualified ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isQualified ? 'AfCFTA Compliance Verified' : 'Origin Check Pending'}
                        </h3>
                        <p className="text-xs text-white/60 mt-1 max-w-[280px]">
                            {compliance.message}
                        </p>
                    </div>
                </div>
                <StatusBadge label={compliance.rule_applied?.rule || 'UNK'} tone={isQualified ? 'good' : 'warning'} />
            </div>

            {/* Details Grid */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                    <div className="text-[10px] uppercase text-white/40 mb-1">Rule Applied</div>
                    <div className="text-xs text-white/90 font-medium">{compliance.rule_applied?.description}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase text-white/40 mb-1">Next Step</div>
                    {isQualified ? (
                        <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            Ready for Certificate <CheckCircle2 className="w-3 h-3" />
                        </div>
                    ) : (
                        <div className="text-xs text-amber-400 font-medium flex items-center gap-1 cursor-pointer hover:underline">
                            Upload Declaration <ArrowRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>

            {!isQualified && (
                <div className="mt-4">
                    <Button size="sm" variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Value Declaration
                    </Button>
                </div>
            )}
        </Surface>
    );
}
