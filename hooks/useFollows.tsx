// useFollows.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface FollowNotification {
  id: string;
  followerName: string;
  followerProfile: string;
  timestamp: number;
}

export const useFollows = (currentUserId: string) => {
  const [follows, setFollows] = useState<FollowNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchFollows() {
    setLoading(true);
    setError(null);

    // Haal de follows op waarbij de huidige gebruiker gevolgd wordt (following_id)
    // Gebruik een join met de profiles-tabel op follower_id om de gegevens van de follower op te halen.
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        follower_id,
        profiles:follower_id (
          username,
          profile_pic
        )
      `)
      .eq('following_id', currentUserId)
      .order('created_at', { ascending: false });
    
    if (error) {
      setError(error.message);
      setFollows([]);
    } else if (data) {
      const transformed: FollowNotification[] = (data as any[]).map((follow) => ({
        id: follow.id,
        followerName: follow.profiles?.username || '',
        followerProfile: follow.profiles?.profile_pic || '',
        timestamp: new Date(follow.created_at).getTime(),
      }));
      setFollows(transformed);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (currentUserId) {
      fetchFollows();
    }
  }, [currentUserId]);

  return { follows, loading, error, refetch: fetchFollows };
};
