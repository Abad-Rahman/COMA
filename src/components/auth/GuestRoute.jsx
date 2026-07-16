// =======================================================
// File: GuestRoute.jsx
// Purpose: Prevent logged-in users from accessing
// Login and Register pages
// =======================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}