import React, { useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Video, Audio } from "expo-av";
import PostComponent from "../../components/postcomponent";
import { useArtistTags } from "../../hooks/useArtistTags";
import { useGenreTags } from "../../hooks/useGenreTags";
import { usePosts } from "../../hooks/useFeedPosts";

// Bereken de schaalfactor op basis van een basisbreedte van 370
const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;
// De originele postbubble is 630 hoog met een marginBottom van 20 (totaal 650)
const itemLength = scale * 600;

const FeedScreen: React.FC = () => {
  // Voeg hier eventueel de refetch functie toe
  const { posts, loading, error, refetch } = usePosts();
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const audioRefs = useRef<{ [key: string]: Audio.Sound | null }>({});
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80, // Als 80% van het item zichtbaar is, beschouwen we het als actief
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        // Kies het eerste item als actief (pas logica aan indien nodig)
        setActivePostId(viewableItems[0].item.id);
      }
    }
  ).current;

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(); // Zorg dat de hook usePosts een refetch functie teruggeeft
    setRefreshing(false);
  };

  if (loading || artistLoading || genreLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (error || artistError || genreError) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>
          ❌ Fout bij laden van posts: {error || artistError || genreError}
        </Text>
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
                userId: item.userId,
                username: item.username || "Onbekend",
                profileImage: item.profileImage || "https://via.placeholder.com/50",
                artistTags: item.artistTags ?? [],
                genreTags: item.genreTags ?? [],
                timestamp: item.timestamp.toString(),
              }}
              isActive={activePostId === item.id}
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
          length: itemLength,
          offset: itemLength * index,
          index,
        })}
        snapToInterval={itemLength}
        ListHeaderComponent={<View style={{ height: scale * 125 }} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    left: 0,
    right: 0,
    height: scale * 350,
    position: "absolute",
    zIndex: 9999, // Zorgt dat de overlay boven andere content komt
  },
});

export default FeedScreen;
