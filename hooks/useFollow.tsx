import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface UseFollowProps {
  followerId: string;     // De ingelogde gebruiker (follower)
  followingId: string;    // De gebruiker die gevolgd wordt
  initialCount: number;   // Begin follow count
}

export function useFollow({
  followerId,
  followingId,
  initialCount,
}: UseFollowProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followCount, setFollowCount] = useState<number>(initialCount);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Haal de huidige follow-status op
  useEffect(() => {
    async function fetchFollowStatus() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', followerId)      // Gebruik follower_id
          .eq('following_id', followingId)    // Gebruik following_id
          .single();

        setIsFollowing(!error && !!data);  // Set de follow status
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (followerId && followingId) {
      fetchFollowStatus();
    }
  }, [followerId, followingId]);

  // Toggle functie om te volgen of ontvolgen
  async function toggleFollow() {
    console.log("Calling toggleFollow with", { followerId, followingId }); // Voeg log toe voor debugging
    setError(null);
    setLoading(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc('toggle_follow', {
        p_follower_id: followerId,
        p_following_id: followingId,
      });
  
      if (rpcErr) {
        setError(rpcErr.message);
      } else {
        if (data?.length) {
          const newCount = data[0].new_follow_count;
          setFollowCount(newCount);
          setIsFollowing(prev => !prev);  // Toggle de follow-status
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  

  // Functie om de follow count te formatteren naar "K" notatie
  const formatCount = (count: number) => {
    if (count < 1000) {
      return count.toString(); // Geen verandering nodig voor counts minder dan 1000
    } else if (count < 10000) {
      return (count / 1000).toFixed(1) + 'K'; // Bijv. 7.5K voor counts tussen 1000 en 9999
    } else {
      return (count / 1000).toFixed(0) + 'K'; // Bijv. 10K voor counts vanaf 10000
    }
  };

  return { isFollowing, followCount, loading, error, toggleFollow, formatCount };
}
