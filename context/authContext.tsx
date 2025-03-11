import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Session } from "@supabase/supabase-js"; // ✅ Gebruik het juiste type voor sessies

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Voorkomt dat de app raar flikkert bij opstarten

  // ✅ Haal de huidige sessie op bij opstarten
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ Error fetching session:", error);
      } else {
        console.log("🔵 Initial session:", data.session);
        setSession(data.session);
      }
      setLoading(false);
    };

    getSession();

    // ✅ Luister naar veranderingen in de auth-status
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🟡 Auth state changed, new session:", session);
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Inloggen
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error signing in:", error);
      throw error;
    }
  };

  // ✅ Registreren
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error signing up:", error);
      throw error;
    }
  };

  // ✅ Uitloggen
  const signOut = async () => {
    console.log("🔴 Attempting to sign out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Error signing out:", error);
      } else {
        console.log("✅ User signed out successfully");
        setSession(null);
      }
    } catch (error) {
      console.error("❌ Unexpected error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
