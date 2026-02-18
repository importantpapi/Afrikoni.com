import { supabase } from '@/api/supabaseClient';

export const AIMatchingService = {
  findMatchingSuppliers: async ({ requirements }) => {
    try {
      // Server-side AI Matching (RPC)
      // Analyzes requirements against verified supplier capabilities via Postgres
      const { data, error } = await supabase.rpc('match_suppliers', {
        requirements: requirements,
        match_limit: 5
      });

      if (error) {
        console.error('AI Matching RPC Error:', error);
        throw error;
      }

      // Map RPC result to UI-friendly format
      const matches = (data || []).map(match => ({
        supplier: {
          id: match.supplier_id,
          company_name: match.company_name,
          description: match.description,
          country: match.country,
          city: match.city,
          logo_url: match.logo_url,
          verified: match.verified
        },
        match_score: Math.round(match.match_score * 100),
        reason: match.reason
      }));

      return { matches };
    } catch (error) {
      // Error logged (kept silent for UI unless critical)
      console.error('AI Service Error:', error);
      throw error;
    }
  }
};

