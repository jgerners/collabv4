// useLikes.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Like {
  id: string;
  userName: string;
  userProfile: string;
  media: string; // Hier gebruiken we het media-veld
  timestamp: number;
}

export const useLikes = (currentUserId: string) => {
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLikes() {
    setLoading(true);
    setError(null);
    
    // We gebruiken nu een join met zowel de profiles als de posts-tabel.
    const { data, error } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        user_id,
        posts:post_id (
          media
        ),
        profiles:user_id (
          username,
          profile_pic
        )
      `)
      .eq('receiver_id', currentUserId)
      .order('created_at', { ascending: false });
    
    if (error) {
      setError(error.message);
      setLikes([]);
    } else if (data) {
      // Transformeer de data zodat deze overeenkomt met de Like interface.
      const transformedLikes: Like[] = (data as any[]).map((like) => ({
        id: like.id,
        userName: like.profiles?.username || '',
        userProfile: like.profiles?.profile_pic || '',
        media: like.posts?.media || '',  // Haal media op uit de posts-relatie
        timestamp: new Date(like.created_at).getTime(),
      }));
      setLikes(transformedLikes);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (currentUserId) {
      fetchLikes();
    }
  }, [currentUserId]);

  return { likes, loading, error, refetch: fetchLikes };
};
