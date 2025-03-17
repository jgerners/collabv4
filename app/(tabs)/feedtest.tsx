import React, { useRef } from "react";
import { View, FlatList, StyleSheet, Text } from "react-native";
import { Video, Audio } from "expo-av";
import PostComponent from "../../components/postcomponent";
import { useArtistTags } from "../../hooks/useArtistTags";
import { useGenreTags } from "../../hooks/useGenreTags";
import { usePosts } from "../../hooks/useFeedPosts"; // ✅ Correcte import

const FeedScreen: React.FC = () => {
  const { posts, loading, error } = usePosts(); // ✅ Gebruik de hook direct
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const audioRefs = useRef<{ [key: string]: Audio.Sound | null }>({});

  // Haal de tags op
  const { artistTags, loading: artistLoading, error: artistError } = useArtistTags();
  const { genreTags, loading: genreLoading, error: genreError } = useGenreTags();

  

  const handlePlayPause = async (postId: string) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const newPlaying = !post.isPlaying;
        if (newPlaying) {
          if (post.mediaType === "video" && videoRefs.current[postId]) {
            videoRefs.current[postId]?.playAsync();
          } else if (post.mediaType === "photo" && post.audio) {
            if (!audioRefs.current[post.id]) {
              Audio.Sound.createAsync(
                typeof post.audio === "string" ? { uri: post.audio } : post.audio,
                { shouldPlay: true }
              ).then(({ sound }) => {
                audioRefs.current[post.id] = sound;
              });
            } else {
              audioRefs.current[post.id]?.playAsync();
            }
          }
        } else {
          if (post.mediaType === "video" && videoRefs.current[postId]) {
            videoRefs.current[postId]?.pauseAsync();
          } else if (post.mediaType === "photo" && post.audio && audioRefs.current[post.id]) {
            audioRefs.current[post.id]?.pauseAsync();
          }
        }
        return { ...post, isPlaying: newPlaying };
      }
      return post;
    });

    
  };

  if (loading || artistLoading || genreLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>Loading posts...</Text>
      </View>
    );
  }

  if (error || artistError || genreError) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>❌ Fout bij laden van posts: {error || artistError || genreError}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          
          return (
            <PostComponent 
              post={{
                ...item,
                userId: item.userId, // ✅ Fix: Zorg ervoor dat userId niet verdwijnt!
                username: item.username || "Onbekend",  // ✅ Haalt de username correct uit 'profiles'
                profileImage: item.profileImage || "https://via.placeholder.com/50",  // ✅ Profielfoto correct uit 'profiles'
                artistTags: item.artistTags ?? [],
                genreTags: item.genreTags ?? [],
                timestamp: item.timestamp.toString(), // ✅ Zorgt dat timestamp correct wordt weergegeven
              }}
              onPlayPause={handlePlayPause}
              artistTags={artistTags}  
              genreTags={genreTags}    
            />
          );
        }}
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
