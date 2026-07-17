// =======================================================
// File: RegisterForm.jsx
// Purpose: User Registration Form
// =======================================================

import { useState } from "react";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  // =======================================================
  // Form State
  // =======================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Authentication
  const { register } = useAuth();
  // Navigation
  const navigate = useNavigate();
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

// =======================================================
// Handle Registration
// =======================================================
async function handleRegister(e) {
  e.preventDefault();

  setError("");

  // -------------------------------------------------------
  // Basic Validation
  // -------------------------------------------------------

  if (!name.trim()) {
    setError("Please enter your full name.");
    return;
  }

  if (!email.trim()) {
    setError("Please enter your email.");
    return;
  }

  if (!password.trim()) {
    setError("Please enter your password.");
    return;
  }

  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);

  const { error } = await register(
    email,
    password,
    name
  );

  if (error) {
    setError(error.message);
    setLoading(false);
    return;
  }

  // =======================================================
  // Registration Success
  // =======================================================

  navigate("/login", { replace: true });

  setLoading(false);
}

  return (
    <AuthLayout title="Create your COMA account">
      <form onSubmit={handleRegister}>
        <div>
          <label>Full Name</label>
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <br />

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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>Confirm Password</label>
          <br />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <br />
        {/* error message */}
        {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>
            {error}
        </p>
        )}
        {/* Submit Button */}
        <button type="submit" disabled={loading}>
        {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}