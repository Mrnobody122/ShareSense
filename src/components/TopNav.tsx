import React from "react";
import { useNavigate } from "react-router-dom";

interface TopNavProps {
  user?: { name: string } | null;
  onLogout: () => void;
  onAnalyzeAsGuest?: () => void;
  hasDashboard?: boolean;
}

export default function TopNav({ user, onLogout, onAnalyzeAsGuest, hasDashboard = true }: TopNavProps) {
  const navigate = useNavigate();

  return (
    <div className="flow-nav">
      <button className="btn" onClick={() => navigate('/')}>Landing</button>
      {hasDashboard && <button className="btn" onClick={() => navigate('/dashboard')}>Dashboard</button>}
      {user ? (
        <span style={{ color: '#a6b5cd' }}>Hello, {user.name}</span>
      ) : (
        onAnalyzeAsGuest && <button className="btn primary" onClick={onAnalyzeAsGuest}>Analyze as Guest</button>
      )}
      <button className="btn" onClick={onLogout}>Logout</button>
    </div>
  );
}
