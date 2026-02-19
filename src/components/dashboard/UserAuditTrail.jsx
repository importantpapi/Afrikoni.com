import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Clock, Shield, Activity, User, Globe, ArrowRight,
    CheckCircle, AlertTriangle, FileText, Search, Filter
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * UserAuditTrail - Simplified, transparent audit log for business owners.
 * Part of the "Calm Mode" initiative to provide institutional-grade transparency.
 */
export default function UserAuditTrail({ limit = 10, compact = false }) {
    const { profileCompanyId, isSystemReady } = useDashboardKernel();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isSystemReady && profileCompanyId) {
            fetchLogs();
        }
    }, [isSystemReady, profileCompanyId]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_log')
                .select('*')
                .or(`actor_company_id.eq.${profileCompanyId},actor_user_id.in.(select id from profiles where company_id = '${profileCompanyId}')`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching user audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        const a = action.toLowerCase();
        if (a.includes('login')) return User;
        if (a.includes('trade') || a.includes('order')) return Activity;
        if (a.includes('payment') || a.includes('wallet')) return Shield;
        if (a.includes('verify') || a.includes('kyc')) return CheckCircle;
        if (a.includes('risk') || a.includes('flag')) return AlertTriangle;
        return FileText;
    };

    const getRiskColor = (risk) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'medium': return 'text-os-accent bg-os-accent/10 border-os-accent/20';
            default: return 'text-os-muted bg-os-muted/5 border-os-muted/10';
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && logs.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-os-stroke/20 animate-pulse rounded-os-md" />
                ))}
            </div>
        );
    }

    if (logs.length === 0 && !loading) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-os-stroke rounded-os-lg">
                <p className="text-os-sm text-os-muted font-medium italic">No audit events recorded for this period.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", compact ? "p-0" : "p-2")}>
            {!compact && (
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search action history..."
                            className="pl-10 h-11 bg-white/5 border-os-stroke/40 focus:border-os-accent/50 rounded-os-md"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {filteredLogs.map((log, i) => {
                    const Icon = getActionIcon(log.action);
                    return (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="group flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-os-stroke/20 rounded-os-md transition-all cursor-default"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 rounded-os-sm bg-os-bg border border-os-stroke/40 flex items-center justify-center group-hover:border-os-accent/30 transition-all">
                                    <Icon className="w-4 h-4 text-os-muted group-hover:text-os-accent transition-colors" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-os-sm font-bold text-os-text-primary group-hover:text-os-accent transition-colors">
                                        {log.action}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-os-muted">
                                        <span>{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                                        <span className="w-1 h-1 rounded-full bg-os-stroke/40" />
                                        <span>{log.entity_type || 'System'}</span>
                                        {log.ip_address && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-os-stroke/40" />
                                                <span className="font-mono opacity-50">{log.ip_address}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Badge className={cn("text-[10px] font-black uppercase tracking-tighter px-2 py-0 border", getRiskColor(log.risk_level))}>
                                    {log.status === 'success' ? 'Verified' : 'Flagged'}
                                </Badge>
                                {!compact && (
                                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4 text-os-muted hover:text-os-accent" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {limit < 50 && logs.length >= limit && (
                <Button variant="ghost" className="w-full text-os-xs font-black uppercase tracking-[0.3em] text-os-accent hover:bg-os-accent/5 mt-4">
                    View Full Immutable History <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            )}
        </div>
    );
}
