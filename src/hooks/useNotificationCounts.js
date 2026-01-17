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

        // ✅ FOUNDATION FIX: Pending RFQs (for suppliers - RFQs they should respond to)
        // Fix: Use proper .or() syntax to avoid 400 errors
        let rfqCount = 0;
        let rfqError = null;
        try {
          const now = new Date().toISOString();
          // ✅ FIX: Build query properly - filter status first, then use or() for date conditions
          let rfqQuery = supabase
            .from('rfqs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open');
          
          // ✅ FIX: Use .or() with proper syntax - check if expires_at is null OR >= now
          rfqQuery = rfqQuery.or(`expires_at.is.null,expires_at.gte.${now}`);
          
          const { count, error } = await rfqQuery;
          rfqCount = count || 0;
          rfqError = error;
          
          if (rfqError) {
            console.debug('Error loading RFQ count:', rfqError);
            // Don't throw - just log and continue with 0 count
            rfqError = null; // Reset to allow other counts to load
          }
        } catch (err) {
          rfqError = err;
          console.debug('Error loading RFQ count:', err);
          // Don't throw - just log and continue
          rfqError = null; // Reset to allow other counts to load
        }

        // ✅ FOUNDATION FIX: Pending approvals (KYC, product approvals, etc.)
        // Table should exist after migration - handle gracefully if not
        let approvalCount = 0;
        let approvalError = null;
        if (companyId) {
          try {
            const { count, error } = await supabase
              .from('kyc_verifications')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', companyId)
              .eq('status', 'pending');
            approvalCount = count || 0;
            approvalError = error;
            
            // ✅ FIX: If table doesn't exist (404), just return 0 count
            if (approvalError && (approvalError.code === 'PGRST116' || approvalError.message?.includes('does not exist'))) {
              console.debug('KYC verifications table not found - returning 0 count');
              approvalError = null; // Reset to allow other counts to load
              approvalCount = 0;
            }
          } catch (err) {
            approvalError = err;
            console.debug('Error loading approval count:', err);
            // Don't throw - just log and continue
            approvalError = null; // Reset to allow other counts to load
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

