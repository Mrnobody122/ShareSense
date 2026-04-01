import React from "react";
import "./Dashboard.css";
import "./main.tsx"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const priceData = [
  { time: "10:00", price: 175 },
  { time: "11:00", price: 178 },
  { time: "12:00", price: 176 },
  { time: "13:00", price: 180 },
  { time: "14:00", price: 179 },
  { time: "15:00", price: 183 }
];

export default function ShareSentimentDashboard() {
  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>Share Sentiment Analysis</h1>
          <button className="btn primary">Live Market Data</button>
        </header>

        {/* Search */}
        <div className="search-bar">
          <input type="text" placeholder="Enter stock symbol (e.g., AAPL, TSLA)" />
          <button className="btn">Analyze</button>
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
            <h3>AAPL Price Chart</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={priceData}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card sentiment-card">
            <h3>Sentiment Analysis</h3>
            <div className="sentiment-score">78</div>
            <p className="positive">Positive</p>
          </div>
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

