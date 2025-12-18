/**
 * 🧊 PHASE B: RFQ Matching Hook (DORMANT - ADMIN-ONLY)
 * 
 * Trust-based matching of RFQs to suppliers
 * 
 * STATUS: Implemented but INACTIVE for buyers
 * ACTIVATION: Manual admin override always required
 * 
 * This hook computes match scores and tiers but does NOT:
 * - Auto-select suppliers
 * - Expose scores to buyers
 * - Make autonomous decisions
 * 
 * PURPOSE: Observe matching quality before buyer exposure
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useRFQMatching(rfqId, allSuppliers = []) {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!rfqId || allSuppliers.length === 0) {
      setMatches([]);
      return;
    }

    computeMatches();
  }, [rfqId, allSuppliers]);

  const computeMatches = async () => {
    try {
      setIsLoading(true);

      // Load RFQ details
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError || !rfq) {
        throw new Error('RFQ not found');
      }

      // Compute match scores for each supplier
      const matchResults = await Promise.all(
        allSuppliers.map(async (supplier) => {
          try {
            // Call trust engine RPC
            const { data: matchScore, error } = await supabase
              .rpc('calculate_rfq_match_score', {
                rfq_id_param: rfqId,
                supplier_id_param: supplier.id
              });

            if (error) {
              console.warn(`Match score failed for supplier ${supplier.id}:`, error);
              return {
                ...supplier,
                match_score: 0,
                match_tier: 'C',
                match_confidence: 'low',
                match_reasons: ['Unable to compute match']
              };
            }

            // Compute tier based on score
            let tier = 'C';
            let confidence = 'low';
            if (matchScore >= 80) {
              tier = 'A';
              confidence = 'high';
            } else if (matchScore >= 60) {
              tier = 'B';
              confidence = 'medium';
            }

            // Compute match reasons (for admin visibility)
            const reasons = [];
            if (supplier.verified) reasons.push('Verified supplier');
            if (supplier.country === rfq.preferred_supplier_country) reasons.push('Same country');
            if (supplier.trust_score > 70) reasons.push('High trust score');
            if (supplier.approved_reviews_count > 5) reasons.push('Proven track record');

            return {
              ...supplier,
              match_score: matchScore || 0,
              match_tier: tier,
              match_confidence: confidence,
              match_reasons: reasons
            };
          } catch (err) {
            console.error(`Error matching supplier ${supplier.id}:`, err);
            return {
              ...supplier,
              match_score: 0,
              match_tier: 'C',
              match_confidence: 'low',
              match_reasons: ['Match computation error']
            };
          }
        })
      );

      // Sort by match score (descending)
      const sorted = matchResults.sort((a, b) => b.match_score - a.match_score);

      setMatches(sorted);
    } catch (error) {
      console.error('Error computing RFQ matches:', error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh (for admin after data changes)
  const refresh = () => {
    computeMatches();
  };

  return {
    matches,
    isLoading,
    refresh
  };
}
