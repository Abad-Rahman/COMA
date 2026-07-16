// =======================================================
// File: LoginForm.jsx
// Purpose: User Login Form
// =======================================================

import { useState } from "react";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../../hooks/useAuth";

export default function LoginForm() {
  // =======================================================
  // Form State
  // =======================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

// =======================================================
// Handle Login
// =======================================================

async function handleLogin(e) {
  e.preventDefault();

  const { error } = await login(email, password);

  if (error) {
    alert(error.message);
  }
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <br />

        <button type="submit">
          Login
        </button>
      </form>
    </AuthLayout>
  );
}