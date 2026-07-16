import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
// =======================================================
// Authentication Loading State
// =======================================================
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  // App চালু হলে বর্তমান user লোড করা
  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      setUser(data.user);
    }
    setLoading(false);
  }

  loadUser();

  // Login / Logout হলে user state update করা
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null);
    setLoading(false);
  });

  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error) {
    setUser(data.user);
  }

  return { data, error };
}

async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

// =======================================================
// Authentication Functions
// User Logout
// =======================================================

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (!error) {
    setUser(null);
  }

  return { error };
}
    
  return (
    <AuthContext.Provider value={{
    user,
    loading,
    login,
    register,
    logout
}}>
      {children}
    </AuthContext.Provider>
  );
}
