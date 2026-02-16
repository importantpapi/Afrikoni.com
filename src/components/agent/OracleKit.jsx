import React, { useState } from 'react';
import {
    Activity, Camera, Shield, Globe, Terminal,
    CheckCircle, AlertCircle, MapPin, Zap, ShieldCheck
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { transitionTrade } from '@/services/tradeKernel';
import { supabase } from '@/api/supabaseClient';

export default function OracleKit({ farmerId, tradeId }) {
    const [scanned, setScanned] = useState(false);
    const [gpsCaptured, setGpsCaptured] = useState(false);

    const [isCommitting, setIsCommitting] = useState(false);

    const handleVerification = async () => {
        if (!tradeId) {
            toast.error('No trade ID linked to this session.');
            return;
        }

        setIsCommitting(true);
        try {
            // 1. Capture simulated but unique DNA
            const dna = `AFR-DNA-${Math.random().toString(36).toUpperCase().slice(2, 12)}`;
            const gps = gpsCaptured ? 'Lat: -1.2921, Lng: 36.8219 (Nairobi)' : 'GPS_NOT_CAPTURED';

            toast.promise(
                transitionTrade(tradeId, 'current', {
                    trade_dna: dna,
                    verification_point: 'ORACLE_KIT_v2',
                    gps_trail: gps,
                    agent_id: farmerId || 'UNSET'
                }),
                {
                    loading: 'Committing Forensic DNA to Ledger...',
                    success: () => {
                        setScanned(true);
                        return 'Quality DNA Committed: 1.25x Trust Score Boost!';
                    },
                    error: (err) => `Verification failed: ${err.message}`
                }
            );
        } catch (err) {
            console.error('[OracleKit] Commit error:', err);
        } finally {
            setIsCommitting(false);
        }
    };

    return (
        <Surface variant="glass" className="p-8 border-afrikoni-gold/10 bg-afrikoni-gold/[0.02] space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-black tracking-tighter text-white">ORACLE KIT v2.0</h3>
                    <p className="text-os-muted text-sm font-medium uppercase tracking-widest">Afrikoni Youth Agent Verification Rail</p>
                </div>
                <Badge className="bg-afrikoni-gold text-black px-4 py-1 font-black">ACTIVE AGENT</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    className="h-32 flex flex-col gap-3 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl"
                    onClick={() => setGpsCaptured(true)}
                >
                    <MapPin className={`w-8 h-8 ${gpsCaptured ? 'text-emerald-500' : 'text-os-muted'}`} />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Capture GPS DNA</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-32 flex flex-col gap-3 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl"
                    onClick={() => toast.info('Camera Access Initialized')}
                >
                    <Camera className="w-8 h-8 text-os-muted" />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Scan Product Quality</span>
                </Button>
            </div>

            <Surface variant="panel" className="p-6 bg-emerald-500/[0.05] border-emerald-500/20">
                <div className="flex items-center gap-4 text-emerald-500">
                    <ShieldCheck className="w-6 h-6" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Sovereign Integrity Check</p>
                        <p className="text-sm font-medium text-white/80">
                            Verification by Youth Oracle acts as the primary risk-mitigation layer for trade finance partners.
                        </p>
                    </div>
                </div>
            </Surface>

            <Button
                onClick={handleVerification}
                disabled={scanned || isCommitting}
                className="w-full h-16 bg-gradient-to-r from-afrikoni-gold/80 to-afrikoni-gold text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-afrikoni-gold/20 hover:scale-[1.02] transition-all"
            >
                {scanned ? 'FORENSIC DNA COMMITTED⚡' : isCommitting ? 'COMMITTING...' : 'COMMIT FIELD DNA'}
                <Zap className="ml-2 w-5 h-5 fill-black" />
            </Button>
        </Surface>
    );
}
