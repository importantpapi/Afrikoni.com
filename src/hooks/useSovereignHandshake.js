import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

/**
 * useSovereignHandshake
 * 
 * The Parallel Boot Orchestrator.
 * Hydrates institutional metadata (L1-L3) while Auth is still resolving.
 */
export function useSovereignHandshake() {
    const { authReady, profile } = useAuth();
    const { ready: kernelReady } = useCapability();
    const queryClient = useQueryClient();
    const [isPrimed, setIsPrimed] = useState(false);

    // 1. PRIME: The "Eternal Disposition"
    // Immediately check if we have persisted state for UI shell
    useEffect(() => {
        const cachedCaps = queryClient.getQueryData(['capabilities']);
        if (cachedCaps) {
            console.log('[SovereignHandshake] ⚡ UI Primed from Persistent Cache');
            setIsPrimed(true);
        }
    }, [queryClient]);

    // 2. PARALLEL PREFETCH: The "Institutional Packet"
    // Fire requests as soon as minimal identity is known, don't wait for Provider cascade
    useEffect(() => {
        if (authReady && profile?.company_id) {
            const companyId = profile.company_id;

            // Prefetch L1-L3 Metadata in parallel
            const institutionalPacket = [
                queryClient.prefetchQuery({
                    queryKey: ['capabilities', companyId],
                    queryFn: async () => {
                        const { data } = await supabase.from('company_capabilities').select('*').eq('company_id', companyId).single();
                        return data;
                    },
                    staleTime: 60 * 1000
                }),
                queryClient.prefetchQuery({
                    queryKey: ['counts', companyId],
                    queryFn: async () => {
                        const { count } = await supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('buyer_company_id', companyId);
                        return { rfqs: count };
                    }
                })
            ];

            Promise.all(institutionalPacket).then(() => {
                console.log('[SovereignHandshake] ✅ Institutional Packet Synchronized');
                setIsPrimed(true);
            });
        }
    }, [authReady, profile?.company_id, queryClient]);

    const handshakeStatus = useMemo(() => {
        if (!authReady) return "RESOLVING_IDENTITY";
        if (!kernelReady && !isPrimed) return "HYDRATING_KERNEL";
        return "READY";
    }, [authReady, kernelReady, isPrimed]);

    return {
        isPrimed,
        handshakeStatus,
        isSystemReady: kernelReady || isPrimed
    };
}
