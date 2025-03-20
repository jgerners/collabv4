import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null; // Profielgegevens
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<any>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null); // Profiel state
  const [loading, setLoading] = useState(true);

  // Haal de huidige sessie en user op bij opstarten
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ Error fetching session:", error);
      } else {
        console.log("🔵 Initial session:", data.session);
        setSession(data.session);
        setUser(data.session?.user || null);
      }
      setLoading(false);
    };

    getSession();

    // Luister naar veranderingen in de auth-status
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🟡 Auth state changed, new session:", session);
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Haal profielgegevens op uit `profiles`
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ Error fetching profile:", error);
      } else {
        console.log("✅ Profile loaded:", data);
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // Inloggen
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user); // User opslaan na inloggen
    } catch (error) {
      console.error("❌ Error signing in:", error);
      throw error;
    }
  };

  // Registreren
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setUser(data.user); // User opslaan na registreren
    } catch (error) {
      console.error("❌ Error signing up:", error);
      throw error;
    }
  };

  // Uitloggen
  const signOut = async () => {
    console.log("🔴 Attempting to sign out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Error signing out:", error);
      } else {
        console.log("✅ User signed out successfully");
        setSession(null);
        setUser(null);
        setProfile(null); // Profiel resetten na uitloggen
      }
    } catch (error) {
      console.error("❌ Unexpected error signing out:", error);
    }
  };

  // updateProfile functie: werkt de profielgegevens bij in Supabase en in de context
  const updateProfile = async (profileData: Partial<any>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", user.id)
      .select("*")
      .single();
    if (error) {
      console.error("❌ Error updating profile:", error);
      throw error;
    }
    console.log("✅ Profile updated:", data);
    setProfile(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, updateProfile }}>
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
