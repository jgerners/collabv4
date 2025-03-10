import React, { useRef, useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Text } from "react-native";
import { Video, Audio } from "expo-av";
import PostComponent from "../../components/postcomponent";
import { supabase } from "../../supabaseClient";
import { useArtistTags } from "../../hooks/useArtistTags";
import { useGenreTags } from "../../hooks/useGenreTags";

interface Post {
  id: string;
  userId: string;
  profileImage: string | number;
  username: string;
  media: string | number;
  mediaUrl: string | number;
  mediaType: "photo" | "video";
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

const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const audioRefs = useRef<{ [key: string]: Audio.Sound | null }>({});

  // Gebruik de aparte hooks voor artist- en genretags
  const { artistTags, loading: artistLoading, error: artistError } = useArtistTags();
  const { genreTags, loading: genreLoading, error: genreError } = useGenreTags();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from("posts").select("*");
      if (error) {
        console.error("Error fetching posts:", error);
      } else if (data) {
        setPosts(data as Post[]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const handlePlayPause = async (postId: string) => {
    const updatedPosts = await Promise.all(
      posts.map(async (post) => {
        if (post.id === postId) {
          const newPlaying = !post.isPlaying;
          if (newPlaying) {
            if (post.mediaType === "video" && videoRefs.current[postId]) {
              await videoRefs.current[postId]?.playAsync();
            } else if (post.mediaType === "photo" && post.audio) {
              if (!audioRefs.current[post.id]) {
                const { sound } = await Audio.Sound.createAsync(
                  typeof post.audio === "string" ? { uri: post.audio } : post.audio,
                  { shouldPlay: true }
                );
                audioRefs.current[post.id] = sound;
              } else {
                await audioRefs.current[post.id]?.playAsync();
              }
            }
          } else {
            if (post.mediaType === "video" && videoRefs.current[postId]) {
              await videoRefs.current[postId]?.pauseAsync();
            } else if (post.mediaType === "photo" && post.audio && audioRefs.current[post.id]) {
              await audioRefs.current[post.id]?.pauseAsync();
            }
          }
          return { ...post, isPlaying: newPlaying };
        }
        return post;
      })
    );
    setPosts(updatedPosts as Post[]);
  };

  if (loading || artistLoading || genreLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>Loading posts...</Text>
      </View>
    );
  }

  if (artistError || genreError) {
    console.error("Error loading tags:", artistError || genreError);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostComponent 
            post={{
              ...item,
              artistTags: item.artistTags ?? [],
              genreTags: item.genreTags ?? [],
              timestamp: item.timestamp.toString(),
            }}
            onPlayPause={handlePlayPause}
            artistTags={artistTags}  // Geef de artist-tagdata mee
            genreTags={genreTags}    // Geef de genre-tagdata mee
          />
        )}
        decelerationRate="fast"
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: 630,
          offset: 630 * index,
          index,
        })}
        snapToInterval={650}
        ListHeaderComponent={<View style={{ height: 125 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(25, 25, 25)",
  },
});

export default FeedScreen;
