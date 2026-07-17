import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
// =======================================================
// Authentication Loading State
// =======================================================
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
// =======================================================
// User Profile State
// =======================================================

const [profile, setProfile] = useState(null);

useEffect(() => {
  // App চালু হলে বর্তমান user লোড করা
  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      setUser(data.user);

      // =======================================================
      // Load User Profile
      // =======================================================

      await loadProfile(data.user.id);
    }

    setLoading(false);
  }

  loadUser();

  // Login / Logout হলে user state update করা
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(async (event, session) => {

  setUser(session?.user ?? null);

  // =======================================================
  // Load Profile After Auth Change
  // =======================================================

  if (session?.user) {
    await loadProfile(session.user.id);
  } else {
    setProfile(null);
  }

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

// User Registration
async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        full_name: fullName,
      },
    },
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
    setProfile(null);
  }

  return { error };
}

// =======================================================
// Load User Profile
// =======================================================

async function loadProfile(userId) {

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }

  setProfile(data);
  return data;
}
    
return (
  <AuthContext.Provider
    value={{
      user,
      profile,
      loading,
      login,
      register,
      logout,
    }}
  >
      {children}
    </AuthContext.Provider>
  );
}
