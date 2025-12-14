/**
 * Hook to get notification counts for sidebar badges
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useNotificationCounts(userId, companyId) {
  const [counts, setCounts] = useState({
    messages: 0,
    rfqs: 0,
    approvals: 0
  });

  useEffect(() => {
    // Add null checks before proceeding
    if (!userId || !companyId) {
      setCounts({ messages: 0, rfqs: 0, approvals: 0 });
      return;
    }

    const loadCounts = async () => {
      try {
        // Ensure auth is ready before queries
        const { ensureAuthReady } = await import('@/api/supabaseClient');
        const authReady = await ensureAuthReady();
        if (!authReady) {
          setCounts({ messages: 0, rfqs: 0, approvals: 0 });
          return;
        }
        // Unread messages (with null check and proper error handling)
        let messageCount = 0;
        let messageError = null;
        if (companyId) {
          try {
            const result = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .limit(0)
              .eq('receiver_company_id', companyId)
              .eq('read', false);
            messageCount = result.count || 0;
            messageError = result.error;
          } catch (err) {
            messageError = err;
            console.debug('Error loading message count:', err);
          }
        }

        // Pending RFQs (for suppliers - RFQs they should respond to)
        // Fix: Use proper .or() syntax - need to filter by status first, then use or() for expires_at
        let rfqCount = 0;
        let rfqError = null;
        try {
          const now = new Date().toISOString();
          // Fix: Build query properly - filter status first, then use or() for date conditions
          const rfqQuery = supabase
            .from('rfqs')
            .select('id', { count: 'exact' })
            .limit(0)
            .eq('status', 'open');
          
          // Use or() for expires_at conditions - proper syntax
          const { count, error } = await rfqQuery.or(`expires_at.gte.${encodeURIComponent(now)},expires_at.is.null`);
          rfqCount = count || 0;
          rfqError = error;
        } catch (err) {
          rfqError = err;
          console.debug('Error loading RFQ count:', err);
        }

        // Pending approvals (KYC, product approvals, etc.)
        let approvalCount = 0;
        let approvalError = null;
        if (companyId) {
          try {
            const { count, error } = await supabase
              .from('kyc_verifications')
              .select('id', { count: 'exact' })
              .limit(0)
              .eq('company_id', companyId)
              .eq('status', 'pending');
            approvalCount = count || 0;
            approvalError = error;
          } catch (err) {
            approvalError = err;
            console.debug('Error loading approval count:', err);
          }
        }
        // Only set counts if no errors (table might not exist yet)
        if (!messageError && !rfqError && !approvalError) {
          setCounts({
            messages: messageCount || 0,
            rfqs: rfqCount || 0,
            approvals: approvalCount || 0
          });
        } else {
          // Return default small numbers if tables don't exist
          setCounts({
            messages: 0,
            rfqs: 0,
            approvals: 0
          });
        }
      } catch (error) {
        console.error('Error loading notification counts:', error);
        // Return default small numbers
        setCounts({
          messages: 0,
          rfqs: 0,
          approvals: 0
        });
      }
    };

    loadCounts();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [userId, companyId]);

  return counts;
}

