// =======================================================
// File: useAuth.js
// Purpose: Custom Hook for Authentication Context
// =======================================================

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// =======================================================
// Authentication Hook
// =======================================================

export function useAuth() {
  return useContext(AuthContext);
}