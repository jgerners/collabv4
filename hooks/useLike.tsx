// useLike.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface UseLikeProps {
  userId: string;
  postId: string;
  receiverId: string; // Nieuwe property: de eigenaar van de post
}

export function useLike({ userId, postId, receiverId }: UseLikeProps) {
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Haal de huidige like-status en het aantal likes op
  useEffect(() => {
    async function fetchLikeData() {
      setLoading(true);
      setError(null);
      
      // 1. Tel het aantal likes voor de post
      const { count, error: countError } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      if (countError) {
        setError(countError.message);
      } else {
        setLikeCount(count || 0);
      }
      
      // 2. Check of de huidige gebruiker de post al geliked heeft
      const { data, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();
      
      if (!likeError && data) {
        setLiked(true);
      } else {
        setLiked(false);
      }
      setLoading(false);
    }
    
    if (userId && postId) {
      fetchLikeData();
    }
  }, [userId, postId]);

  // Functie om de like-status te toggelen
  async function toggleLike() {
    setError(null);
    if (liked) {
      // Like verwijderen: unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) {
        setError(error.message);
      } else {
        setLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } else {
      // Like toevoegen: like (met receiver_id)
      const { error } = await supabase
        .from('likes')
        .insert([{ user_id: userId, post_id: postId, receiver_id: receiverId }]);
      
      if (error) {
        setError(error.message);
      } else {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    }
  }
  
  return { liked, likeCount, loading, error, toggleLike };
}
