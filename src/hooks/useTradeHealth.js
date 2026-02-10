import { useEffect, useState } from "react";
import { fetchTradeHealth } from "@/api/kernelService";

export function useTradeHealth(tradeId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tradeId) return;
    let mounted = true;
    setLoading(true);
    fetchTradeHealth(tradeId)
      .then((res) => {
        if (mounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => mounted && setError(err?.message || "Failed to load trade health"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [tradeId]);

  return { data, loading, error };
}
