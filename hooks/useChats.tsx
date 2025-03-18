// hooks/useChats.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export interface Chat {
  id: string;
  user_a: string;
  user_b: string;
  request_id?: string;
  created_at: string;
}

export const useChats = (currentUserId: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      // Gebruik .or() om te zoeken op beide kolommen
      .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setChats(data as Chat[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      fetchChats();
    }
  }, [currentUserId]);

  // Optioneel: realtime abonnement voor nieuwe chats
  useEffect(() => {
    const subscription = supabase
      .channel("chats_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `user_a=eq.${currentUserId} or user_b=eq.${currentUserId}`,
        },
        (payload: any) => {
          // Voeg de nieuwe chat toe aan de lijst
          setChats((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId]);

  return { chats, loading, error, refetch: fetchChats };
};
