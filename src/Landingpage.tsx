import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TopNav from "./components/TopNav";
import { usePriceHistory } from "./hooks/usePriceHistory";
import { useFloorsheet } from "./hooks/useFloorsheet";

const priceData = [
  { time: "09:00", price: 178 },
  { time: "10:00", price: 180 },
  { time: "11:00", price: 179 },
  { time: "12:00", price: 182 },
  { time: "13:00", price: 184 },
  { time: "14:00", price: 183 },
  { time: "15:00", price: 186 },
];

export default function Landingpage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [error, setError] = useState("");
  const [symbol, setSymbol] = useState("RSDC");
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const navigate = useNavigate();

  const { data: priceHistory, loading: priceLoading, error: priceError } = usePriceHistory(symbol, 10);
  const { data: floorsheetData, loading: floorsheetLoading, error: floorsheetError } = useFloorsheet();

  const safePriceHistory = Array.isArray(priceHistory) ? priceHistory : [];
  const safeFloorsheetData = Array.isArray(floorsheetData) ? floorsheetData : [];

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
    if (!symbol || !symbol.trim()) return;
    setAnalysisLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:5000/api/shares/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Analysis failed");
      } else {
        setAnalysis(data);
      }
    } catch (err) {
      setError("Unable to contact analysis API.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const expiresAt = Number(localStorage.getItem("authTokenExpires"));

    if (!token || !expiresAt || Date.now() > expiresAt) {
      setUser(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Unable to verify session");
          setUser(null);
        } else {
          setUser(data.user);
          localStorage.setItem("authUser", JSON.stringify(data.user));
          localStorage.setItem("authTokenExpires", String(data.expiresAt ?? expiresAt));
        }
      } catch {
        setError("Unable to reach auth server. Check connection.");
        setUser(null);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="dashboard">
      <div className="container">
        {error && <div className="error-message">{error}</div>}
        <header className="header">
          <div>
            <h1>Share Sentiment Analysis</h1>
            <p>Real-time market vulnerability prediction</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <>
                <span style={{ color: '#a6b5cd' }}>Hello, {user.name}</span>
                <button className="btn primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                <button className="btn" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <button className="btn primary" onClick={handleAnalyze}>Analyze as Guest</button>
                <button className="btn" onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </header>

        <TopNav
          user={user}
          onLogout={logout}
          onAnalyzeAsGuest={handleAnalyze}
          hasDashboard={true}
        />

        <div className="flow-steps">
          <div>Step 1: Enter a stock symbol</div>
          <div>Step 2: Click Analyze</div>
          <div>Step 3: View sentiment result</div>
        </div>

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

        {analysis && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3>Analysis Result for {analysis.symbol}</h3>
            <p><strong>Sentiment:</strong> {analysis.sentiment}</p>
            <p><strong>Score:</strong> {(analysis.score ?? 0).toFixed(2)}</p>
            <p><strong>Insight:</strong> {analysis.insight}</p>
            {analysis.warning && <p style={{ color: '#fca5a5' }}>{analysis.warning}</p>}
          </div>
        )}

        <div className="stats-grid">
          <StatCard title="Current Price" value="$185.23" delta="+1.32%" />
          <StatCard title="Market Cap" value="$2.89T" delta="+1.82%" />
          <StatCard title="Volume" value="52.3M" delta="+15.4%" />
          <StatCard title="P/E Ratio" value="29.45" delta="-0.8%" negative />
        </div>

        <div className="main-grid">
          <div className="chart-card">
            <h3>{symbol} Price Chart (Real-time Data)</h3>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {priceLoading ? (
                  <div style={{ color: '#94a3b8' }}>Loading price data...</div>
                ) : priceError ? (
                  <div style={{ color: '#ef4444' }}>Error: {priceError}</div>
                ) : safePriceHistory.length > 0 ? (
                  <LineChart data={safePriceHistory.slice(-10).map((item, idx) => ({
                    time: idx.toString(),
                    price: item.price || 0
                  }))}>
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <div style={{ color: '#94a3b8' }}>No price data available</div>
                )}
              </ResponsiveContainer>
            </div>
            <div style={{ overflowX: 'auto', marginTop: '14px' }}>
              {priceLoading || priceError || priceHistory.length === 0 ? null : (
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
                        <td style={{ padding: '8px' }}>{item.price ?? '-'}</td>
                        <td style={{ padding: '8px' }}>{item.date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="sentiment-card">
            <h3>Sentiment Analysis</h3>
            <div className="sentiment-score">78</div>
            <p className="positive">Positive</p>
            <p style={{ color: '#9ca3af', marginTop: '10px' }}>Strong bullish sentiment detected based on recent market trends.</p>
          </div>
        </div>

        {/* Floorsheet Data */}
        <div className="card">
          <h3>Latest Floorsheet Transactions</h3>
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
                  {safeFloorsheetData.slice(0, 15).map((item, idx) => (
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

        <div className="bottom-grid">
          <div className="card" style={{ padding: '16px' }}>
            <h3>Vulnerability Score</h3>
            <h2 className="positive">32</h2>
            <ul>
              <li>Stable market position</li>
              <li>Positive analyst outlook</li>
              <li>Low debt-to-equity ratio</li>
            </ul>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <h3>Market Insights</h3>
            <ul>
              <li><strong>Technical:</strong> Bullish momentum observed</li>
              <li><strong>News:</strong> Positive earnings sentiment</li>
              <li><strong>Risk:</strong> Moderate volatility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, delta, negative = false }: { title: string; value: string; delta: string; negative?: boolean }) {
  return (
    <div className="card" style={{ padding: '12px' }}>
      <p className="label" style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>{title}</p>
      <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>{value}</h2>
      <span className={negative ? 'negative' : 'positive'}>{delta}</span>
    </div>
  );
}
