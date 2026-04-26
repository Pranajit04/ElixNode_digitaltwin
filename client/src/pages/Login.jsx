import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import useAppStore from "../store";

function Login() {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [email, setEmail] = useState("pranajitbanerjee2004@gmail.com");
  const [password, setPassword] = useState("elixnode123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card panel" style={{ background: "rgba(10, 18, 33, 0.96)" }}>
        <div className="badge info">ElixNode Operator Access</div>
        <h1 style={{ marginBottom: 8 }}>Login</h1>
        <p className="muted">Use your control-room credentials to open the live industrial twin dashboard.</p>
        <form onSubmit={handleSubmit}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Access Dashboard"}
          </button>
        </form>
        {error ? <p style={{ color: "#ffb8c2", marginBottom: 0 }}>{error}</p> : null}
        <p className="muted">
          Need a new operator account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
