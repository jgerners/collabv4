import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // Controleer het pad

interface AuthContextType {
  session: any;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);

  // ✅ Haal de huidige sessie op bij opstarten
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("🔵 Initial session:", session);
      setSession(session);
    };

    getSession();

    // ✅ Luister naar veranderingen in de auth-status
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🟡 Auth state changed, new session:", session);
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // ✅ Inloggen
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // ✅ Registreren
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  // ✅ Uitloggen
  const signOut = async () => {
    console.log("🔴 Attempting to sign out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Error signing out:", error);
    } else {
      console.log("✅ User signed out successfully");
      setSession(null); // Dit zou automatisch moeten gebeuren door onAuthStateChange, maar we forceren het.
    }
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut }}>
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
