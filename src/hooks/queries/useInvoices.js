import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { getInvoices } from '@/lib/supabaseQueries/invoices';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useInvoices
 * Fetches institutional invoices for the dashboard.
 */
export function useInvoices(filters = {}) {
    const { profileCompanyId, canLoadData, isSystemReady, capabilities } = useDashboardKernel();

    return useQuery({
        queryKey: ['invoices', profileCompanyId, filters],
        queryFn: async () => {
            if (!profileCompanyId) return [];
            const invoiceList = await getInvoices(profileCompanyId, capabilities, filters);
            return invoiceList || [];
        },
        enabled: isSystemReady && canLoadData && !!profileCompanyId,
        staleTime: 30 * 1000,
        // Note: 'invoices' is NOT in lockKeys in queryClient.js yet because it's L4 sensitive,
        // but we can add 'invoice-metadata' if we want persistent counts.
        // For now, following the Security Guardrail (Memory-Only for detailed financials).
    });
}
