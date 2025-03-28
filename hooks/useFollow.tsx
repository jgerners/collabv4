// useFollow.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface UseFollowProps {
  followerId: string;  // De ingelogde gebruiker
  followingId: string; // De gebruiker die gevolgd wordt
}

export function useFollow({ followerId, followingId }: UseFollowProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Haal de huidige follow-status op
  useEffect(() => {
    async function fetchFollowStatus() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error) {
        // Als er geen record gevonden wordt, betekent dat dat de gebruiker niet gevolgd wordt
        setIsFollowing(false);
      } else if (data) {
        setIsFollowing(true);
      }
      setLoading(false);
    }
    if (followerId && followingId) {
      fetchFollowStatus();
    }
  }, [followerId, followingId]);

  // Toggle functie om te volgen of ontvolgen
  async function toggleFollow() {
    setError(null);
    if (isFollowing) {
      // Ontvolg de gebruiker
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      if (error) {
        setError(error.message);
      } else {
        setIsFollowing(false);
      }
    } else {
      // Volg de gebruiker
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: followerId, following_id: followingId }]);
      if (error) {
        setError(error.message);
      } else {
        setIsFollowing(true);
      }
    }
  }

  return { isFollowing, loading, error, toggleFollow };
}
