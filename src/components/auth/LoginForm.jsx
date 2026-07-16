// =======================================================
// File: LoginForm.jsx
// Purpose: User Login Form
// =======================================================

import { useState } from "react";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  // =======================================================
  // Form State
  // =======================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

// =======================================================
// Handle Login
// =======================================================

async function handleLogin(e) {
  e.preventDefault();
// Basic Validation
if (!email.trim()) {
  setError("Please enter your email.");
  return;
}

if (!password.trim()) {
  setError("Please enter your password.");
  return;
}

  setError("");
  setLoading(true);

  const { error } = await login(email, password);

if (error) {
  setError(error.message);
  setLoading(false);
  return;
}

navigate("/", { replace: true });

setLoading(false);
}
  return (
    <AuthLayout title="Login to COMA">
      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide Password" : "Show Password"}
          </button>
        </div>

        <br />
        {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>
         {error}
        </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
}