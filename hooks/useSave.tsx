// hooks/useSave.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface UseSaveProps {
  userId: string;
  postId: string;
  initialCount: number;        // initiele teller uit posts.save_count
}

export function useSave({
  userId,
  postId,
  initialCount,
}: UseSaveProps) {
  const [saved, setSaved]       = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(initialCount);
  const [loading, setLoading]   = useState<boolean>(true);
  const [error, setError]       = useState<string | null>(null);

  // Alleen de save-status (bool) ophalen
  useEffect(() => {
    async function fetchSaveStatus() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();
        setSaved(!err && !!data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (userId && postId) fetchSaveStatus();
  }, [userId, postId]);

  // Toggle via RPC
  async function toggleSave() {
    setError(null);
    setLoading(true);
    const { data, error: rpcErr } = await supabase.rpc('toggle_save', {
      p_post_id: postId,
      p_user_id: userId,
    });
    setLoading(false);
    if (rpcErr) {
      setError(rpcErr.message);
    } else if (data?.length) {
      const newCount = data[0].new_save_count;
      setSaveCount(newCount);
      setSaved(prev => !prev);
    }
  }
    // Functie om de save count te formatteren naar "K" notatie
    const formatCount = (count: number) => {
        if (count < 1000) {
          return count.toString(); // Geen verandering nodig voor counts minder dan 1000
        } else if (count < 10000) {
          return (count / 1000).toFixed(1) + 'K'; // Bijv. 7.5K voor counts tussen 1000 en 9999
        } else {
          return (count / 1000).toFixed(0) + 'K'; // Bijv. 10K voor counts vanaf 10000
        }
      };
    

  return { saved, saveCount, loading, error, toggleSave, formatCount };
}

// Helper om later opgeslagen posts van een gebruiker op te halen
export async function fetchSavedPostsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map((row: any) => row.post_id);
}
