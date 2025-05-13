// hooks/useLike.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface UseLikeProps {
  userId: string;
  postId: string;
  receiverId: string;
  initialCount: number;        // ❗️ zorg dat dit erin staat
}

export function useLike({
  userId,
  postId,
  receiverId,
  initialCount,               // ❗️ en hier destructuren
}: UseLikeProps) {
  const [liked, setLiked]         = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(initialCount); // start met initialCount
  const [loading, setLoading]     = useState<boolean>(true);
  const [error, setError]         = useState<string | null>(null);

  // Alleen de like-boolean ophalen, niet de count
  useEffect(() => {
    async function fetchLikeStatus() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: likeErr } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();
        setLiked(!likeErr && !!data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (userId && postId) {
      fetchLikeStatus();
    }
  }, [userId, postId]);

  // De RPC toggle
  async function toggleLike() {
    setError(null);
    setLoading(true);
    const { data, error: rpcErr } = await supabase.rpc('toggle_like', {
      p_post_id: postId,
      p_user_id: userId,
    });
    setLoading(false);
    if (rpcErr) {
      setError(rpcErr.message);
    } else if (data?.length) {
      const newCount = data[0].new_like_count;
      setLikeCount(newCount);
      setLiked(prev => !prev);
    }
  }
  // Functie om de like count te formatteren naar "K" notatie
  const formatCount = (count: number) => {
    if (count < 1000) {
      return count.toString(); // Geen verandering nodig voor counts minder dan 1000
    } else if (count < 10000) {
      return (count / 1000).toFixed(1) + 'K'; // Bijv. 7.5K voor counts tussen 1000 en 9999
    } else {
      return (count / 1000).toFixed(0) + 'K'; // Bijv. 10K voor counts vanaf 10000
    }
  };

  return { liked, likeCount, loading, error, toggleLike, formatCount };
}
