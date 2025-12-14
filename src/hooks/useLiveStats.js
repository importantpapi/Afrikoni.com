/**
 * Hook to fetch live marketplace statistics
 * Returns real-time data for suppliers active today and RFQs submitted this week
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useLiveStats() {
  const [stats, setStats] = useState({
    suppliersActiveToday: 0,
    rfqsSubmittedThisWeek: 0,
    isLoading: true
  });

  useEffect(() => {
    loadStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Calculate start of week (7 days ago)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      const weekAgoISO = weekAgo.toISOString();

      // Get suppliers active today
      // Active suppliers = companies with role 'seller' or 'hybrid' that have:
      // 1. Active products (best indicator), OR
      // 2. Recent quotes submitted today, OR  
      // 3. Company updated/created today
      
      let activeSuppliers = 0;
      
      try {
        // Method 1: Get unique supplier IDs from active products
        const { data: activeProducts, error: productsError } = await supabase
          .from('products')
          .select('company_id, supplier_id')
          .eq('status', 'active')
          .limit(1000); // Limit to avoid performance issues
        
        if (!productsError && activeProducts && activeProducts.length > 0) {
          // Get unique supplier company IDs
          const supplierIds = new Set();
          activeProducts.forEach(p => {
            if (p.supplier_id) supplierIds.add(p.supplier_id);
            if (p.company_id) supplierIds.add(p.company_id);
          });
          
          // Verify these are actually suppliers
          if (supplierIds.size > 0) {
            const { data: suppliers } = await supabase
              .from('companies')
              .select('id')
              .in('id', Array.from(supplierIds))
              .in('role', ['seller', 'hybrid']);
            
            activeSuppliers = suppliers?.length || 0;
          }
        }
        
        // Method 2: If no active products, count suppliers who submitted quotes today
        if (activeSuppliers === 0) {
          const { data: quotesToday } = await supabase
            .from('quotes')
            .select('supplier_company_id')
            .gte('created_at', todayISO);
          
          if (quotesToday && quotesToday.length > 0) {
            const supplierIdsFromQuotes = new Set(
              quotesToday
                .map(q => q.supplier_company_id)
                .filter(Boolean)
            );
            
            if (supplierIdsFromQuotes.size > 0) {
              const { data: suppliers } = await supabase
                .from('companies')
                .select('id')
                .in('id', Array.from(supplierIdsFromQuotes))
                .in('role', ['seller', 'hybrid']);
              
              activeSuppliers = suppliers?.length || 0;
            }
          }
        }
        
        // Method 3: Fallback - count suppliers with recent activity (updated today or created today)
        if (activeSuppliers === 0) {
          const { count: fallbackCount } = await supabase
            .from('companies')
            .select('id', { count: 'exact' })
            .in('role', ['seller', 'hybrid'])
            .or(`updated_at.gte.${todayISO},created_at.gte.${todayISO}`);
          
          activeSuppliers = fallbackCount || 0;
        }
      } catch (supplierError) {
        console.error('Error calculating active suppliers:', supplierError);
        // Use a simple count as last resort (all suppliers)
        try {
          const { count: simpleCount } = await supabase
            .from('companies')
            .select('id', { count: 'exact' })
            .in('role', ['seller', 'hybrid']);
          
          activeSuppliers = simpleCount || 0;
        } catch (e) {
          activeSuppliers = 0;
        }
      }

      // Get RFQs submitted this week
      const { count: rfqsCount, error: rfqsError } = await supabase
        .from('rfqs')
        .select('id', { count: 'exact' })
        .gte('created_at', weekAgoISO);

      if (rfqsError) {
        console.error('Error loading RFQ stats:', rfqsError);
      }

      setStats({
        suppliersActiveToday: activeSuppliers || 0,
        rfqsSubmittedThisWeek: rfqsCount || 0,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading live stats:', error);
      // Set defaults on error
      setStats({
        suppliersActiveToday: 0,
        rfqsSubmittedThisWeek: 0,
        isLoading: false
      });
    }
  };

  return stats;
}

