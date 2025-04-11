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
import { usePosts } from "../../hooks/useFeedPosts"; // Aangepaste hook met pagination
// Verwijder de import van useMediaPreload
import { ActivePostProvider, useActivePost } from "../../context/activePostContext";

const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;
const itemLength = scale * 602;

const FeedScreenContent: React.FC = () => {
  const { posts, initialLoading, loadingMore, error, refetch, loadMorePosts } = usePosts();
  const { activePostId, setActivePostId } = useActivePost();
  const { artistTags, loading: artistLoading, error: artistError } = useArtistTags();
  const { genreTags, loading: genreLoading, error: genreError } = useGenreTags();
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  // Bepaal de actieve index zodat we weten welke posts binnen een bepaald bereik vallen
  const activeIndex = posts.findIndex((p) => p.id === activePostId);

  // Stel de eerste post in als actief zodra posts geladen zijn
  useEffect(() => {
    if (posts.length > 0 && activePostId === null) {
      setActivePostId(posts[0].id);
    }
  }, [posts, activePostId, setActivePostId]);

  // Verwijder de preloadAdjacent-useEffect, want preloadlogica is nu overbodig

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[]; changed: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const activeItem = viewableItems[0].item;
        setActivePostId(activeItem.id);
        console.debug("[DEBUG] Active post set via onViewableItemsChanged:", activeItem.id);
      }
    }
  ).current;

  // Handler voor infinite scroll: laad de volgende batch als er bijna het einde is bereikt
  const handleEndReached = () => {
    if (!loadingMore) {
      loadMorePosts();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Full-screen loader voor de initiële load
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Toon foutmelding als er een fout is
  if (error || artistError || genreError) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>
          ❌ Fout bij laden van posts: {error || artistError || genreError}
        </Text>
      </View>
    );
  }

  // Footer component voor load-more indicator (als de gebruiker aan de onderkant komt)
  const renderFooter = () => {
    if (loadingMore && posts.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="white" />
          <Text style={{ color: "white", marginTop: 5 }}>Laden...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Hier blijft de berekening van de preload-range nog staan (bijv. ±4)
          // Je kunt dit behouden als indicator voor de PostComponent, maar geen extra preload logica wordt uitgevoerd
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
              feedFocused={isFocused}
              withinPreloadRange={isWithinPreloadRange}
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
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

const FeedScreen: React.FC = () => {
  return (
    // Als de MediaPreloadProvider niet langer nodig is, kan je deze eventueel ook verwijderen.
    <ActivePostProvider>
      <FeedScreenContent />
    </ActivePostProvider>
  );
};

export default FeedScreen;
