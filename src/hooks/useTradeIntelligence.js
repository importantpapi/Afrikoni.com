/**
 * Trade Intelligence Hooks
 * React hooks for fetching and managing trade intelligence data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBuyerIntelligence,
  getSupplierIntelligence,
  getSupplierReliability,
  getTradePerformance,
  getCategoryPerformance,
  getConversionFunnel,
  getDemandIntelligence,
  getDemandTrends,
  getSupplyGapInsights,
  getRiskSignals,
  getTrustEvolution,
  getHighRiskCompanies,
  getHighValueDealsNeedingAttention
} from '@/lib/supabaseQueries/intelligence';

// ============================================================================
// 1. BUYER & SUPPLIER INTELLIGENCE HOOKS
// ============================================================================

/**
 * Hook for fetching buyer intelligence data
 */
export function useBuyerIntelligence(companyId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBuyerIntelligence(companyId);
      setData(result);
    } catch (err) {
      console.error('Error fetching buyer intelligence:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching supplier intelligence data
 */
export function useSupplierIntelligence(companyId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSupplierIntelligence(companyId);
      setData(result);
    } catch (err) {
      console.error('Error fetching supplier intelligence:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching supplier reliability score (for RFQ matching)
 */
export function useSupplierReliability(supplierCompanyId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supplierCompanyId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getSupplierReliability(supplierCompanyId);
        setData(result);
      } catch (err) {
        console.error('Error fetching supplier reliability:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierCompanyId]);

  return { data, loading, error };
}

// ============================================================================
// 2. TRADE & REVENUE PERFORMANCE HOOKS
// ============================================================================

/**
 * Hook for fetching trade performance data
 */
export function useTradePerformance(period = 'day', startDate = null, endDate = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTradePerformance(period, startDate, endDate);
      setData(result);
    } catch (err) {
      console.error('Error fetching trade performance:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching category performance data
 */
export function useCategoryPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getCategoryPerformance();
        setData(result);
      } catch (err) {
        console.error('Error fetching category performance:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Hook for fetching conversion funnel metrics
 */
export function useConversionFunnel(startDate = null, endDate = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getConversionFunnel(startDate, endDate);
      setData(result);
    } catch (err) {
      console.error('Error fetching conversion funnel:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// 3. MARKET DEMAND INTELLIGENCE HOOKS
// ============================================================================

/**
 * Hook for fetching demand intelligence data
 */
export function useDemandIntelligence(categoryId = null, showGapsOnly = false) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDemandIntelligence(categoryId, showGapsOnly);
      setData(result);
    } catch (err) {
      console.error('Error fetching demand intelligence:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, showGapsOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching demand trends
 */
export function useDemandTrends(categoryId = null, country = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDemandTrends(categoryId, country);
      setData(result);
    } catch (err) {
      console.error('Error fetching demand trends:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, country]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching supply gap insights
 */
export function useSupplyGapInsights() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getSupplyGapInsights();
        setData(result);
      } catch (err) {
        console.error('Error fetching supply gap insights:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

// ============================================================================
// 4. OPERATIONS, RISK & TRUST CONTROL HOOKS
// ============================================================================

/**
 * Hook for fetching risk signals
 */
export function useRiskSignals(riskLevel = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRiskSignals(riskLevel);
      setData(result);
    } catch (err) {
      console.error('Error fetching risk signals:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [riskLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching trust evolution data
 */
export function useTrustEvolution(companyId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTrustEvolution(companyId);
      setData(result);
    } catch (err) {
      console.error('Error fetching trust evolution:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching high-risk companies
 */
export function useHighRiskCompanies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getHighRiskCompanies();
        setData(result);
      } catch (err) {
        console.error('Error fetching high-risk companies:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Hook for fetching high-value deals needing attention
 */
export function useHighValueDealsNeedingAttention() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getHighValueDealsNeedingAttention();
        setData(result);
      } catch (err) {
        console.error('Error fetching high-value deals:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

