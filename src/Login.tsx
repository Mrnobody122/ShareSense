import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const expiresAt = params.get('expiresAt');

    if (token && expiresAt) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authTokenExpires', expiresAt);

      const option = params.get('option');
      const userJson = params.get('user');
      if (userJson) {
        localStorage.setItem('authUser', userJson);
      }

      navigate('/dashboard', { replace: true });
    }

    if (params.get('error')) {
      setError('Google sign-in failed. Please try again.');
    }
  }, [location.search, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Login failed");
      } else {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authTokenExpires", data.expiresAt);
        localStorage.setItem("authUser", JSON.stringify(data.user));
        navigate("/dashboard");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">📈</div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Login to access your sentiment analysis dashboard</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="row">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <Link to="#" style={{ color: "#38bdf8" }}>Forgot password?</Link>
          </div>

          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="oauth-row">or continue with</div>
        <div className="button-group">
          <button
            type="button"
            className="oauth"
            onClick={() => {
              window.location.href = "http://localhost:5000/api/auth/google";
            }}
          >
            G Google
          </button>
          <button
            type="button"
            className="oauth"
            onClick={() => {
              window.location.href = "http://localhost:5000/api/auth/github";
            }}
          >
            🐙 GitHub
          </button>
        </div>

        <p className="toggle-text">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
