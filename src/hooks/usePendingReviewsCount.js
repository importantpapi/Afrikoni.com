/**
 * Hook to fetch and subscribe to pending reviews count (for admin badge)
 * Uses RLS-safe function and optimized real-time subscription
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function usePendingReviewsCount() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingCount();

    // ✅ HARDENED: Subscribe only to relevant changes
    // Only trigger on: UPDATE events where status becomes 'pending'
    const subscription = supabase
      .channel('pending_reviews_badge')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reviews',
          filter: 'status=eq.pending' // Only new pending reviews
        },
        () => {
          loadPendingCount();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reviews',
          filter: 'status=eq.approved' // When pending becomes approved
        },
        () => {
          loadPendingCount();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reviews',
          filter: 'status=eq.rejected' // When pending becomes rejected
        },
        () => {
          loadPendingCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      // ✅ HARDENED: Use RLS-safe function instead of direct query
      const { data, error } = await supabase
        .rpc('get_pending_reviews_count');

      if (error) {
        console.error('Error loading pending reviews count:', error);
        setPendingCount(0);
        return;
      }

      setPendingCount(data || 0);
    } catch (error) {
      console.error('Unexpected error loading pending count:', error);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  return { pendingCount, isLoading, refresh: loadPendingCount };
}

