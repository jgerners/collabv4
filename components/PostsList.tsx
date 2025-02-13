import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import Post from './Post';

interface PostType {
  id: number | string;
  user_id: string;
  content: string;
}

export default function PostsList() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setError(null); // Reset error state before fetching

      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser ();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError('No user logged in.');
        setLoading(false);
        return;
      }

      // Fetch posts where the user_id matches the current user's id
      const { data, error: fetchError } = await supabase
        .from('Post')
        .select('*')
        .eq('user_id', user.id); // Keep this if you want to fetch only the current user's posts

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPosts(data as PostType[]);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      {posts.map((post) => (
        <Post key={post.id} content={post.content} userId={post.user_id} />
      ))}
    </View>
  );
}