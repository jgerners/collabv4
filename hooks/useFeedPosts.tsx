// usePosts.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Definieer een interface voor je Post (pas dit aan naar jouw dummy data interface)
export interface Post {
  id: string;
  userId: string;
  profileImage: string | number;
  username: string;
  media: string | number;
  mediaUrl: string | number;
  mediaType: 'photo' | 'video';
  audio?: string | number;
  title: string;
  description: string;
  timestamp: number;
  artistTags: string[];
  genreTags: string[];
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
  isPlaying: boolean;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*');
      if (error) {
        console.error("Error fetching posts:", error);
        setError(error.message);
      } else {
        setPosts(data as Post[]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return { posts, loading, error };
};