import { useState, useEffect } from "react";
import { fetchPriceHistory, PriceHistoryData } from "../services/api";

export const usePriceHistory = (symbol: string, pageSize: number = 10) => {
  const [data, setData] = useState<PriceHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPriceHistory(symbol, pageSize);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load price history");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [symbol, pageSize]);

  return { data, loading, error };
};
