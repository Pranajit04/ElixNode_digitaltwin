import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../services/auth";
import useAppStore from "../store";

function Register() {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      await register(form.get("name"), form.get("email"), form.get("password"));
      const user = await login(form.get("email"), form.get("password"));
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card panel">
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <input name="name" type="text" placeholder="Full name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Register</button>
        </form>
        {error ? <p className="muted" style={{ color: "#fca5a5" }}>{error}</p> : null}
        <p className="muted">
          Already registered? <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
