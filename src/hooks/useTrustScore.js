import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { TrustEngineService } from '@/services/TrustEngineService';

export function useTrustScore(companyId) {
    const [trustData, setTrustData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        let subscription;

        const fetchTrust = async () => {
            setLoading(true);
            // 1. Try to get existing score
            let data = await TrustEngineService.getCompanyTrustProfile(companyId);

            // 2. If no score exists, calculate it on the fly (and save it)
            if (!data) {
                try {
                    data = await TrustEngineService.updateCompanyTrustScore(companyId);
                } catch (e) {
                    console.error("Failed to init trust score", e);
                }
            }

            setTrustData(data);
            setLoading(false);
        };

        fetchTrust();

        // 3. Realtime subscription
        subscription = supabase
            .channel(`trust-score-${companyId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'trust_scores',
                filter: `company_id=eq.${companyId}`
            }, (payload) => {
                setTrustData(payload.new);
            })
            .subscribe();

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [companyId]);

    return { trustData, loading };
}
