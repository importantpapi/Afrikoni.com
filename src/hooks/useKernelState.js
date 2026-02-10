import { useEffect, useState } from "react";
import { fetchKernelState } from "@/api/kernelService";

export function useKernelState() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchKernelState()
      .then((res) => {
        if (mounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => mounted && setError(err?.message || "Failed to load kernel state"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return { data, loading, error };
}
