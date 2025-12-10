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
    if (!userId || !companyId) return;

    const loadCounts = async () => {
      try {
        // Unread messages
        const { count: messageCount, error: messageError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('read', false);

        // Pending RFQs (for suppliers - RFQs they should respond to)
        const { count: rfqCount, error: rfqError } = await supabase
          .from('rfqs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')
          .gte('deadline', new Date().toISOString());

        // Pending approvals (KYC, product approvals, etc.)
        const { count: approvalCount, error: approvalError } = await supabase
          .from('kyc_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending');

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

