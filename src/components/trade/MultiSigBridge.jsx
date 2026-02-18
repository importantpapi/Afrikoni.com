import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Lock, User, CheckCircle, Fingerprint } from 'lucide-react';
import { checkConsensus, requestConsensus } from '@/services/tradeKernel';
import { Surface } from '@/components/system/Surface';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Button } from '@/components/shared/ui/button';
import { toast } from 'sonner';

export default function MultiSigBridge({ tradeId, status }) {
    const { capabilities } = useDashboardKernel();
    const [consensus, setConsensus] = useState({
        buyerSigned: false,
        sellerSigned: false,
        logisticsSigned: false,
        aiSigned: false,
        consensusReached: false,
        signatures: []
    });

    useEffect(() => {
        if (!tradeId) return;

        // Initial check
        updateConsensus();

        // Subscribe to trade changes for real-time consensus updates
        // In production, we'd use a more specific subscription or event stream
        const interval = setInterval(updateConsensus, 3000);
        return () => clearInterval(interval);
    }, [tradeId]);

    async function updateConsensus() {
        const data = await checkConsensus(tradeId);
        setConsensus(data);
    }

    async function handleSign(party) {
        try {
            const result = await requestConsensus(tradeId, party);
            if (result.success) {
                toast.success(`${party} consensus recorded in ledger.`);
                updateConsensus();
            }
        } catch (err) {
            toast.error(`Failed to sign ${party} consensus.`);
        }
    }

    const keys = [
        {
            id: 'ai',
            label: 'AI Sentinel',
            status: 'Doc Verified',
            icon: ShieldCheck,
            signed: consensus.aiSigned,
            color: 'amber'
        },
        {
            id: 'logistics',
            label: 'Logistics',
            status: 'GPS Verified',
            icon: Truck,
            signed: consensus.logisticsSigned,
            color: 'blue'
        },
        {
            id: 'buyer',
            label: 'Buyer Key',
            status: 'Final Sig',
            icon: User,
            signed: consensus.buyerSigned,
            color: 'emerald'
        }
    ];

    return (
        <Surface variant="panel" className="mb-6 p-5 border border-white/5 bg-black/40">
            <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className={`w-4 h-4 ${consensus.consensusReached ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={`text-os-xs font-bold uppercase tracking-[0.2em] ${consensus.consensusReached ? 'text-emerald-400' : 'text-gray-400'}`}>
                    3-Party Trade Approval
                </span>
            </div>

            <div className="flex justify-between items-center gap-3">
                {keys.map((key) => (
                    <div
                        key={key.id}
                        className={`flex flex-col items-center gap-2 flex-1 p-3 rounded-os-md border transition-all duration-500 group ${key.signed
                            ? `bg-${key.color}-500/10 border-${key.color}-500/30 scale-105`
                            : 'bg-white/5 border-white/5 opacity-50 grayscale'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${key.signed ? `bg-${key.color}-500/20 text-${key.color}-500` : 'bg-white/10 text-gray-400'
                            }`}>
                            <key.icon className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className={`text-os-xs font-bold uppercase tracking-wider ${key.signed ? `text-${key.color}-500` : 'text-gray-400'}`}>
                                {key.label}
                            </p>
                            <p className="text-os-xs text-gray-500 mt-0.5">{key.status}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${key.signed
                            ? `bg-${key.color}-500 shadow-[0_0_12px_rgba(var(--${key.color}-500-rgb),0.8)]`
                            : 'bg-gray-700'
                            }`} />

                        {!key.signed && (
                            <Button
                                variant="ghost"
                                size="xs"
                                className="mt-2 text-os-xs h-5 px-2 border border-white/10 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleSign(key.id.toUpperCase())}
                            >
                                Request
                            </Button>
                        )}

                        {!key.signed && key.id === 'buyer' && capabilities?.can_buy && (
                            <Button
                                variant="outline"
                                size="xs"
                                className="mt-2 text-os-xs h-5 px-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                onClick={() => handleSign('BUYER')}
                            >
                                Sign Now
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <p className="text-os-xs text-gray-400 leading-relaxed font-mono">
                    {consensus.consensusReached
                        ? "All parties approved. Funds can now be released to the supplier."
                        : "Waiting for all parties to approve before funds are released."}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                    {consensus.signatures.map((sig, i) => (
                        <div key={i} className="text-os-xs font-mono text-emerald-500/40 bg-emerald-500/5 px-1.5 py-0.5 rounded uppercase">
                            {sig.substring(0, 12)}...
                        </div>
                    ))}
                </div>
            </div>
        </Surface>
    );
}
