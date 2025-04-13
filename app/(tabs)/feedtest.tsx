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
import { usePosts } from "../../hooks/useFeedPosts"; // De hook met batch loading (PAGE_SIZE = 20)
import { ActivePostProvider, useActivePost } from "../../context/activePostContext";
import { Audio } from "expo-av";
// Importeer de cache helper
import { setCachedAudio } from "../../helpers/audioCache";

const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;
// Zorg ervoor dat itemLength de volledige hoogte van een post vertegenwoordigt
const itemLength = scale * 640;

const FeedScreenContent: React.FC = () => {
  const {
    posts,
    initialLoading,
    loadingMore,
    error,
    refetch,
    loadMorePosts,
  } = usePosts();
  const { activePostId, setActivePostId } = useActivePost();
  const {
    artistTags,
    loading: artistLoading,
    error: artistError,
  } = useArtistTags();
  const {
    genreTags,
    loading: genreLoading,
    error: genreError,
  } = useGenreTags();
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  // Ref om bij te houden welke posts al gepreloaded zijn
  const preloadedPosts = useRef<{ [key: string]: boolean }>({});

  // FlatList ref zodat we programatisch kunnen scrollen
  const flatListRef = useRef<FlatList>(null);

  const activeIndex = posts.findIndex((p) => p.id === activePostId);

  useEffect(() => {
    if (posts.length > 0 && activePostId === null) {
      setActivePostId(posts[0].id);
    }
  }, [posts, activePostId, setActivePostId]);

  // Preload media en sla audio in de cache op
  useEffect(() => {
    posts.forEach((post) => {
      if (!preloadedPosts.current[post.id]) {
        preloadedPosts.current[post.id] = false;

        if (post.mediaType === "video" && post.mediaUrl) {
          fetch(post.mediaUrl.toString())
            .then(() => {
              console.log(
                `Video media succesvol voorgepreloaded voor post ${post.id}`
              );
              preloadedPosts.current[post.id] = true;
            })
            .catch((err) => {
              console.error(
                "Fout bij preloading video voor post",
                post.id,
                err
              );
              preloadedPosts.current[post.id] = false;
            });
        } else if (post.mediaType === "photo" && post.audio) {
          Audio.Sound.createAsync(
            {
              uri:
                typeof post.audio === "string"
                  ? post.audio
                  : post.audio!.toString(),
            },
            { shouldPlay: false }
          )
            .then(({ sound }) => {
              console.log(
                `Audio succesvol voorgepreloaded voor post ${post.id}`
              );
              preloadedPosts.current[post.id] = true;
              // Sla de geladen audio op in de cache
              setCachedAudio(post.id, sound);
            })
            .catch((err) => {
              console.error(
                "Fout bij preloading audio voor post",
                post.id,
                err
              );
              preloadedPosts.current[post.id] = false;
            });
        } else {
          preloadedPosts.current[post.id] = true;
        }
      }
    });
  }, [posts]);

  const viewabilityConfig = { itemVisiblePercentThreshold: 70 };
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[]; changed: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const activeItem = viewableItems[0].item;
        setActivePostId(activeItem.id);
        console.debug(
          "[DEBUG] Active post set via onViewableItemsChanged:",
          activeItem.id
        );
      }
    }
  ).current;

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

  // Handler voor het nauwkeurig snappen naar de dichtstbijzijnde post
  const onMomentumScrollEnd = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemLength);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: index * itemLength,
        animated: true,
      });
    }
  };

  if (initialLoading) {
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
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isWithinPreloadRange = Math.abs(index - activeIndex) <= 4;
          return (
            <PostComponent
              post={{
                ...item,
                userId: item.userId,
                username: item.username || "Onbekend",
                display_name: item.display_name,
                role: item.role,
                profileImage:
                  item.profileImage || "https://via.placeholder.com/50",
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
        decelerationRate="fast" // Kan helpen voor consistente scrolling
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: itemLength,
          offset: itemLength * index,
          index,
        })}
        snapToInterval={itemLength}
        pagingEnabled
        disableIntervalMomentum={true}  // Deze prop zorgt ervoor dat maar 1 post per keer wordt gescrold
        ListHeaderComponent={<View style={{ height: scale * 125 }} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
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
    <ActivePostProvider>
      <FeedScreenContent />
    </ActivePostProvider>
  );
};

export default FeedScreen;
