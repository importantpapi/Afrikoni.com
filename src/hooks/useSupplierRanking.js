/**
 * ✅ PHASE A: Supplier Ranking Hook (ACTIVE)
 * 
 * Trust-driven supplier ranking algorithm
 * 
 * SAFETY GUARANTEES:
 * - New suppliers always visible (just ranked lower)
 * - Missing data = low trust, not broken system
 * - No user ever blocked by trust engine
 * - Graceful degradation on errors
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { 
  ensureTrustFields, 
  isRecommended,
  safeTrustScore 
} from '@/utils/trustSafety';

export function useSupplierRanking(suppliers, searchQuery = null, buyerCountry = null) {
  const [rankedSuppliers, setRankedSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!suppliers || suppliers.length === 0) {
      setRankedSuppliers([]);
      setIsLoading(false);
      return;
    }

    rankSuppliers();
  }, [suppliers, searchQuery, buyerCountry]);

  const rankSuppliers = async () => {
    try {
      setIsLoading(true);

      // ✅ SAFETY: Ensure all suppliers have trust fields with defaults
      const safeSuppliers = suppliers.map(ensureTrustFields).filter(Boolean);

      // Calculate rank score for each supplier
      const suppliersWithScores = await Promise.all(
        safeSuppliers.map(async (supplier, index) => {
          try {
            // ✅ SAFETY: If RPC fails, use trust_score as fallback
            let rankScore = safeTrustScore(supplier);
            let tier = 'B';

            try {
              const { data: score, error } = await supabase
                .rpc('calculate_supplier_rank_score', {
                  company_id_param: supplier.id,
                  search_query: searchQuery,
                  buyer_country: buyerCountry
                });

              if (!error && typeof score === 'number') {
                rankScore = score;
              }

              // Get tier (admin-only visibility)
              const { data: tierData } = await supabase
                .rpc('get_supplier_tier', {
                  company_id_param: supplier.id
                });

              if (tierData && ['A', 'B', 'C'].includes(tierData)) {
                tier = tierData;
              }
            } catch (rpcError) {
              // ✅ SAFETY: RPC errors don't break ranking
              console.warn(`Trust engine RPC failed for supplier ${supplier.id}, using fallback`);
            }

            return {
              ...supplier,
              rank_score: rankScore,
              tier: tier,
              is_recommended: false // Will be set after sorting
            };
          } catch (err) {
            // ✅ SAFETY: Individual supplier errors don't break the list
            console.error('Error processing supplier:', err);
            return {
              ...supplier,
              rank_score: safeTrustScore(supplier),
              tier: 'B',
              is_recommended: false
            };
          }
        })
      );

      // Sort by rank_score (highest first)
      const sorted = suppliersWithScores.sort((a, b) => 
        (b.rank_score || 0) - (a.rank_score || 0)
      );

      // ✅ PHASE A: Mark top suppliers as "Recommended"
      const withRecommendations = sorted.map((supplier, index) => ({
        ...supplier,
        is_recommended: isRecommended(supplier, index)
      }));

      setRankedSuppliers(withRecommendations);
    } catch (error) {
      // ✅ SAFETY: Complete ranking failure = show original list
      console.error('Error ranking suppliers:', error);
      const safeSuppliers = suppliers.map(ensureTrustFields).filter(Boolean);
      setRankedSuppliers(safeSuppliers);
    } finally {
      setIsLoading(false);
    }
  };

  return { rankedSuppliers, isLoading };
}

