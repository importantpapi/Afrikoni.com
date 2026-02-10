import { useEffect, useState } from "react";
import { fetchTradeCopilot } from "@/api/kernelService";

export function useTradeCopilot() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchTradeCopilot()
      .then((res) => {
        if (mounted) {
          setActions(res.actions || []);
          setError(null);
        }
      })
      .catch((err) => mounted && setError(err?.message || "Copilot unavailable"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return { actions, loading, error };
}
