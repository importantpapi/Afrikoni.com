import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

export function useVerification(companyId) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Basics, 2: Evidence, 3: Confirm, 4: Success
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [extractedData, setExtractedData] = useState(null);

    const startVerification = async (data) => {
        try {
            setLoading(true);
            setError(null);

            const { business_name, country } = data;

            const { error: fnError } = await supabase.functions.invoke('verify_start', {
                body: { company_id: companyId, business_name, country }
            });

            if (fnError) throw fnError;

            setProgress(20);
            setStep(2);
        } catch (err) {
            console.error('Verification start failed:', err);
            setError(err.message);
            toast.error('Failed to start verification. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const extractFromEvidence = async (file, url) => {
        try {
            setLoading(true);
            setError(null);

            const payload = { company_id: companyId };
            if (url) payload.url = url;
            if (file) payload.file = true; // Mock file upload

            const { data, error: fnError } = await supabase.functions.invoke('verify_extract', {
                body: payload
            });

            if (fnError) throw fnError;

            setExtractedData(data.ai_fields);
            setProgress(70);
            setStep(3);
            toast.success('AI Data Extraction Complete');
        } catch (err) {
            console.error('Extraction failed:', err);
            setError(err.message);
            toast.error('AI Extraction failed. Please fill manually.');
        } finally {
            setLoading(false);
        }
    };

    const finalizeVerification = async (confirmedFields) => {
        try {
            setLoading(true);
            setError(null);

            const { error: fnError } = await supabase.functions.invoke('verify_finalize', {
                body: { company_id: companyId, confirmed_fields: confirmedFields }
            });

            if (fnError) throw fnError;

            setProgress(100);
            setStep(4);
            toast.success('You are now Verified!');
        } catch (err) {
            console.error('Finalization failed:', err);
            setError(err.message);
            toast.error('Failed to complete verification.');
        } finally {
            setLoading(false);
        }
    };

    return {
        step,
        setStep,
        progress,
        loading,
        error,
        extractedData,
        startVerification,
        extractFromEvidence,
        finalizeVerification
    };
}
