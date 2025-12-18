/**
 * 🧊 PHASE C: Deal Prioritization Hook (INACTIVE - OPS LAYER)
 * 
 * Prioritizes assisted deals in admin queue based on risk + value
 * 
 * STATUS: Implemented but NOT OPERATIONALIZED
 * ACTIVATION: Only when real deal flow justifies it
 * 
 * This hook computes priority scores but does NOT:
 * - Enforce SLAs
 * - Block deals
 * - Make autonomous decisions
 * 
 * PURPOSE: Risk control signal for human ops team
 * USE CASE: Sort admin deal queue, flag high-risk deals
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useDealPrioritization(deals = []) {
  const [prioritizedDeals, setPrioritizedDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deals.length === 0) {
      setPrioritizedDeals([]);
      return;
    }

    computePriorities();
  }, [deals]);

  const computePriorities = async () => {
    try {
      setIsLoading(true);

      // Compute priority score for each deal
      const dealResults = await Promise.all(
        deals.map(async (deal) => {
          try {
            // Call trust engine RPC for priority calculation
            const { data: priorityScore, error } = await supabase
              .rpc('calculate_deal_priority_score', {
                order_id_param: deal.id
              });

            if (error) {
              console.warn(`Priority score failed for deal ${deal.id}:`, error);
              return {
                ...deal,
                priority_score: 0,
                priority_tier: 'low',
                risk_flags: [],
                requires_extra_verification: false
              };
            }

            // Determine priority tier
            let tier = 'low';
            let riskFlags = [];
            let requiresExtra = false;

            if (priorityScore >= 80) {
              tier = 'critical';
              requiresExtra = true;
            } else if (priorityScore >= 60) {
              tier = 'high';
            } else if (priorityScore >= 40) {
              tier = 'medium';
            }

            // Compute risk flags (for ops team)
            if (deal.buyer_trust_score < 40) {
              riskFlags.push('Low buyer trust');
              requiresExtra = true;
            }
            if (deal.seller_trust_score < 40) {
              riskFlags.push('Low seller trust');
              requiresExtra = true;
            }
            if (deal.total_value > 50000) {
              riskFlags.push('High value transaction');
              requiresExtra = true;
            }
            if (deal.has_disputes) {
              riskFlags.push('Previous disputes');
              requiresExtra = true;
            }
            if (deal.cross_border && deal.total_value > 10000) {
              riskFlags.push('High-value cross-border');
              requiresExtra = true;
            }

            return {
              ...deal,
              priority_score: priorityScore || 0,
              priority_tier: tier,
              risk_flags: riskFlags,
              requires_extra_verification: requiresExtra
            };
          } catch (err) {
            console.error(`Error prioritizing deal ${deal.id}:`, err);
            return {
              ...deal,
              priority_score: 0,
              priority_tier: 'low',
              risk_flags: ['Priority computation error'],
              requires_extra_verification: false
            };
          }
        })
      );

      // Sort by priority score (descending)
      const sorted = dealResults.sort((a, b) => b.priority_score - a.priority_score);

      setPrioritizedDeals(sorted);
    } catch (error) {
      console.error('Error computing deal priorities:', error);
      setPrioritizedDeals(deals); // Fallback: return unsorted
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh
  const refresh = () => {
    computePriorities();
  };

  return {
    prioritizedDeals,
    isLoading,
    refresh
  };
}

