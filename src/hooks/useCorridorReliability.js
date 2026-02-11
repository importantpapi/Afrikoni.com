import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useCorridorReliability(originCountry, destinationCountry) {
    const [reliability, setReliability] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!originCountry || !destinationCountry) {
            setLoading(false);
            return;
        }

        const fetchReliability = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from('corridor_reliability')
                .select('*')
                .eq('origin_country', originCountry)
                .eq('destination_country', destinationCountry)
                .maybeSingle();

            if (data) {
                setReliability(data);
            } else {
                // Fallback: Generate a "Default" reliability profile if none exists
                // This ensures the UI always has something to show
                setReliability({
                    reliability_score: 85, // Default good score
                    avg_transit_days: 14,
                    customs_delay_risk: 'low',
                    is_default: true
                });
            }

            setLoading(false);
        };

        fetch();
    }, [originCountry, destinationCountry]);

    return { reliability, loading };
}
