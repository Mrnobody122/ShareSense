import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TopNav from "./components/TopNav";
import { usePriceHistory } from "./hooks/usePriceHistory";
import { useFloorsheet } from "./hooks/useFloorsheet";

const priceData = [
  { time: "10:00", price: 175 },
  { time: "11:00", price: 178 },
  { time: "12:00", price: 176 },
  { time: "13:00", price: 180 },
  { time: "14:00", price: 179 },
  { time: "15:00", price: 183 }
];

export default function ShareSentimentDashboard() {
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("RSDC");
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const navigate = useNavigate();

  const { data: priceHistory, loading: priceLoading, error: priceError } = usePriceHistory(symbol, 10);
  const { data: floorsheetData, loading: floorsheetLoading, error: floorsheetError } = useFloorsheet();

  const safePriceHistory = Array.isArray(priceHistory) ? priceHistory : [];
  const safeFloorsheetData = Array.isArray(floorsheetData) ? floorsheetData : [];

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const expiresAt = Number(localStorage.getItem("authTokenExpires"));

    if (!token || !expiresAt || Date.now() > expiresAt) {
      navigate("/");
      return;
    }

    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      try {
        const parsed = JSON.parse(authUser);
        setUser(parsed);
      } catch {
        setUser(null);
      }
    }
  }, [navigate]);

  const logout = React.useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authTokenExpires");
    localStorage.removeItem("authUser");
    setUser(null);
    setAnalysis(null);
    setError("");
    navigate("/");
  }, [navigate]);

  const handleAnalyze = async () => {
    if (!symbol || !symbol.trim()) {
      setError("Please enter a valid symbol.");
      return;
    }

    setAnalysisLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/shares/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ symbol })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to analyze symbol");
        setAnalysis(null);
      } else {
        setAnalysis(data);
        setSentiment(data.sentiment || "N/A");
      }
    } catch (err) {
      setError("Unable to contact analysis API.");
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  } 

  return (
    <div className="dashboard">
      <div className="container">
        <TopNav
          user={user ? { name: user.name } : null}
          onLogout={logout}
          onAnalyzeAsGuest={handleAnalyze}
          hasDashboard={false}
        />

        <div className="flow-steps">
          <div>Step 1: Pick or enter stock symbol</div>
          <div>Step 2: Click Analyze</div>
          <div>Step 3: Review sentiment and risk</div>
        </div>

        {/* Search */}
        {error && <div className="error-message">{error}</div>}
        <div className="search-bar">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
          />
          <button className="btn" onClick={handleAnalyze} disabled={analysisLoading}>
            {analysisLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="card">
            <p className="label">Current Price</p>
            <h2>$185.23</h2>
            <span className="positive">+1.2%</span>
          </div>
          <div className="card">
            <p className="label">Market Cap</p>
            <h2>$2.89T</h2>
            <span className="positive">+0.8%</span>
          </div>
          <div className="card">
            <p className="label">Volume</p>
            <h2>52.3M</h2>
            <span className="positive">+1.1%</span>
          </div>
          <div className="card">
            <p className="label">P/E Ratio</p>
            <h2>29.45</h2>
            <span className="negative">-0.3%</span>
          </div>
        </div>

        {/* Chart & Sentiment */}
        <div className="main-grid">
          <div className="card chart-card">
            <h3>{symbol} Price History</h3>
            {priceLoading ? (
              <p>Loading price data...</p>
            ) : priceError ? (
              <p style={{ color: '#ef4444' }}>Error: {priceError}</p>
            ) : safePriceHistory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={safePriceHistory.slice(-10).map((item, idx) => ({
                    time: idx.toString(),
                    price: item.price || 0
                  }))}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>

                <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1f2937' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Symbol</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safePriceHistory.slice(-10).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                          <td style={{ padding: '8px' }}>{idx + 1}</td>
                          <td style={{ padding: '8px' }}>{item.symbol || symbol}</td>
                          <td style={{ padding: '8px' }}>{item.price ?? "-"}</td>
                          <td style={{ padding: '8px' }}>{item.date || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>No price data available</p>
            )}
          </div>

          <div className="card sentiment-card">
            <h3>Sentiment Analysis</h3>
            <div className="sentiment-score">{sentiment ?? "--"}</div>
            <p className={sentiment && sentiment.toString().toLowerCase().includes("positive") ? "positive" : "negative"}>
              {sentiment ? sentiment : "No data"}
            </p>
            {analysis && (
              <div style={{ marginTop: 12 }}>
                <p><strong>Symbol:</strong> {analysis.symbol || symbol}</p>
                <p><strong>Score:</strong> {(analysis.score ?? 0).toFixed(2)}</p>
                <p><strong>Insight:</strong> {analysis.insight || "No insight returned"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Floorsheet Data */}
        <div className="card">
          <h3>Latest Floorsheet Data</h3>
          {floorsheetLoading ? (
            <p>Loading floorsheet data...</p>
          ) : floorsheetError ? (
            <p style={{ color: '#ef4444' }}>Error: {floorsheetError}</p>
          ) : safeFloorsheetData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Symbol</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Quantity</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Buyer</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {safeFloorsheetData.slice(0, 10).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                      <td style={{ padding: '8px' }}>{item.symbol}</td>
                      <td style={{ padding: '8px' }}>{item.price}</td>
                      <td style={{ padding: '8px' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem' }}>{item.buyerBroker || "N/A"}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem' }}>{item.sellerBroker || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No floorsheet data available</p>
          )}
        </div>

        {/* Insights */}
        <div className="bottom-grid">
          <div className="card">
            <h3>Vulnerability Score</h3>
            <h2 className="positive">32</h2>
            <ul>
              <li>Stable market position</li>
              <li>Positive analyst outlook</li>
              <li>Low debt-to-equity ratio</li>
            </ul>
          </div>

          <div className="card">
            <h3>Market Insights</h3>
            <ul>
              <li><strong>Technical:</strong> Bullish momentum observed</li>
              <li><strong>News:</strong> Positive earnings sentiment</li>
              <li><strong>Risk:</strong> Moderate volatility expected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

}

