import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    <Route
      path="/login"
      element={
        <GuestRoute>
          <LoginForm />
        </GuestRoute>
      }
    />

    <Route
      path="/register"
      element={
        <GuestRoute>
          <RegisterForm />
        </GuestRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
