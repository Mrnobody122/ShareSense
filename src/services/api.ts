const API_BASE_URLS = {
  priceHistory: "http://localhost:5000/api/shares/external/price-history",
  floorsheet: "http://localhost:5000/api/shares/external/floorsheet",
  fallbackPriceHistory: "https://sharehubnepal.com/data/api/v1/price-history",
  fallbackFloorsheet: "https://chukul.com/api/data/v2/floorsheet/bydate/",
};

export interface PriceHistoryData {
  symbol: string;
  price: number;
  date: string;
  high?: number;
  low?: number;
  change?: number;
}

export interface FloorsheetData {
  symbol: string;
  price: number;
  quantity: number;
  buyerBroker?: string;
  sellerBroker?: string;
  timestamp?: string;
  contractNo?: string;
}

export const fetchPriceHistory = async (symbol: string, pageSize: number = 10): Promise<PriceHistoryData[]> => {
  const localUrl = `${API_BASE_URLS.priceHistory}?pageSize=${pageSize}&symbol=${symbol}`;
  const externalUrl = `${API_BASE_URLS.fallbackPriceHistory}?pageSize=${pageSize}&symbol=${symbol}`;

  for (const url of [localUrl, externalUrl]) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Price history API error: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data.priceHistory)) return data.priceHistory;
      if (Array.isArray(data.history)) return data.history;
      if (Array.isArray(data.items)) return data.items;
      if (data && typeof data === 'object' && data.records && Array.isArray(data.records)) return data.records;
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to fetch price history from ${url}:`, message);
    }
  }

  return [];
};

export const fetchFloorsheet = async (date: string, page: number = 1, size: number = 500): Promise<FloorsheetData[]> => {
  const localUrl = `${API_BASE_URLS.floorsheet}?date=${date}&page=${page}&size=${size}`;
  const externalUrl = `${API_BASE_URLS.fallbackFloorsheet}?date=${date}&page=${page}&size=${size}`;

  for (const url of [localUrl, externalUrl]) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Floorsheet API error: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data.floorsheet)) return data.floorsheet;
      if (Array.isArray(data.items)) return data.items;
      if (data && typeof data === 'object' && data.records && Array.isArray(data.records)) return data.records;
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to fetch floorsheet from ${url}:`, message);
    }
  }

  return [];
};

export const fetchSymbolSuggestions = async (): Promise<string[]> => {
  try {
    const data = await fetchFloorsheet(new Date().toISOString().split('T')[0], 1, 100);
    const symbols = [...new Set(data.map(d => d.symbol))];
    return symbols;
  } catch (error) {
    console.error("Failed to fetch symbol suggestions:", error);
    return [];
  }
};
