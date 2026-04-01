import { useState, useEffect } from "react";
import { fetchFloorsheet, FloorsheetData } from "../services/api";

export const useFloorsheet = (date?: string, page: number = 1, size: number = 500) => {
  const [data, setData] = useState<FloorsheetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = date || new Date().toISOString().split('T')[0];
        const result = await fetchFloorsheet(today, page, size);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load floorsheet data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [date, page, size]);

  return { data, loading, error };
};
