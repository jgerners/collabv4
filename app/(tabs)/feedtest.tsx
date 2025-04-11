import React, { useRef, useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import PostComponent from "../../components/postcomponent";
import { useArtistTags } from "../../hooks/useArtistTags";
import { useGenreTags } from "../../hooks/useGenreTags";
import { usePosts } from "../../hooks/useFeedPosts";
import { MediaPreloadProvider, useMediaPreload } from "../../context/MediaPreloadContext";
import { PostData } from "../../components/postcomponent";
import { ActivePostProvider, useActivePost } from "../../context/activePostContext";

const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;
const itemLength = scale * 602;

const FeedScreenContent: React.FC = () => {
  const { posts, loading, error, refetch } = usePosts();
  const { activePostId, setActivePostId } = useActivePost();
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { preloadAdjacent } = useMediaPreload();
  const activeIndex = posts.findIndex((p) => p.id === activePostId);

  useEffect(() => {
    if (activeIndex !== -1) {
      // Stel een debounce in van bijvoorbeeld 300 milliseconden.
      const debounceTimeout = setTimeout(() => {
        // Converteer iedere post zodat timestamp een string is
        const convertedPosts: PostData[] = posts.map((p) => ({
          ...p,
          timestamp: p.timestamp.toString(),
        }));
        preloadAdjacent(convertedPosts, activeIndex);
      }, 300);
      // Als de afhankelijkheden veranderen, wordt de timeout gecleared.
      return () => clearTimeout(debounceTimeout);
    }
  }, [activeIndex, posts, preloadAdjacent]);

  // Stel de eerste post in als actief wanneer posts geladen zijn
  useEffect(() => {
    if (posts.length > 0 && activePostId === null) {
      setActivePostId(posts[0].id);
    }
  }, [posts, activePostId, setActivePostId]);

  // Viewability voor FlatList (optioneel)
  const viewabilityConfig = { itemVisiblePercentThreshold: 70 };
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[]; changed: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const activeItem = viewableItems[0].item;
        setActivePostId(activeItem.id);
        console.debug("[DEBUG] Active post set via onViewableItemsChanged:", activeItem.id);
      }
    }
  ).current;

  const { artistTags, loading: artistLoading, error: artistError } = useArtistTags();
  const { genreTags, loading: genreLoading, error: genreError } = useGenreTags();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
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
        renderItem={({ item, index }) => {
          // Bepaal de preload-range. Hier is gekozen voor een window van ±4 posts.
          const isWithinPreloadRange = Math.abs(index - activeIndex) <= 4;
          return (
            <PostComponent 
              post={{
                ...item,
                userId: item.userId,
                username: item.username || "Onbekend",
                display_name: item.display_name,
                role: item.role,
                profileImage: item.profileImage || "https://via.placeholder.com/50",
                artistTags: item.artistTags ?? [],
                genreTags: item.genreTags ?? [],
                timestamp: item.timestamp.toString(),
              }}
              isActive={activePostId === item.id}
              artistTags={artistTags}  
              genreTags={genreTags}
              feedFocused={isFocused}  // bestaande prop
              withinPreloadRange={isWithinPreloadRange}  // nieuwe prop
            />
          );
        }}
        decelerationRate={0.2}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: itemLength,
          offset: itemLength * index,
          index,
        })}
        snapToInterval={itemLength}
        pagingEnabled
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
  container: { flex: 1, backgroundColor: "#121212" },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    top: 0,
    left: 0,
    right: 0,
    height: scale * 350,
    position: "absolute",
    zIndex: 9999,
  },
});

const FeedScreen: React.FC = () => {
  return (
    <MediaPreloadProvider>
      <ActivePostProvider>
        <FeedScreenContent />
      </ActivePostProvider>
    </MediaPreloadProvider>
  );
};

export default FeedScreen;
