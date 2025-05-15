// FeedScreen.tsx
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
import { setCachedAudio } from "../../helpers/audioCache";
import FeedHeader from "../../headers/FeedHeader"; // Jouw nieuwe header component

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
// Één item = volledige device-hoogte
const itemLength = 780;

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
  const [activeTab, setActiveTab] = useState(1); // 0=Friends,1=Feed,2=Filters

  const isFocused = useIsFocused();
  const preloadedPosts = useRef<{ [key: string]: boolean }>({});
  const flatListRef = useRef<FlatList>(null);

  // Preload media
  useEffect(() => {
    posts.forEach((post) => {
      if (!preloadedPosts.current[post.id]) {
        preloadedPosts.current[post.id] = false;
        if (post.mediaType === "video" && post.mediaUrl) {
          fetch(post.mediaUrl.toString())
            .then(() => (preloadedPosts.current[post.id] = true))
            .catch(() => (preloadedPosts.current[post.id] = false));
        } else if (post.mediaType === "photo" && post.audio) {
          Audio.Sound.createAsync(
            { uri: typeof post.audio === "string" ? post.audio : post.audio!.toString() },
            { shouldPlay: false }
          )
            .then(({ sound }) => {
              preloadedPosts.current[post.id] = true;
              setCachedAudio(post.id, sound);
            })
            .catch(() => (preloadedPosts.current[post.id] = false));
        } else {
          preloadedPosts.current[post.id] = true;
        }
      }
    });
  }, [posts]);

  // Stel eerste post in als actief
  useEffect(() => {
    if (posts.length > 0 && activePostId === null) {
      setActivePostId(posts[0].id);
    }
  }, [posts, activePostId]);

  const activeIndex = posts.findIndex((p) => p.id === activePostId);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setActivePostId(viewableItems[0].item.id);
      }
    }
  ).current;

  const handleEndReached = () => {
    if (!loadingMore) loadMorePosts();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const onMomentumScrollEnd = ({ nativeEvent }: any) => {
    const offsetY = nativeEvent.contentOffset.y;
    console.log("Scroll offset:", offsetY);
    const index = Math.round(offsetY / itemLength);
    console.log("Current index:", index);
  };

  // initial loading
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // foutmelding
  if (error || artistError || genreError) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>
          ❌ Fout bij laden: {error || artistError || genreError}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <FeedHeader onTabChange={setActiveTab} />

      {/* CONTENT TABS */}
      <View style={styles.tabWrapper}>
        {/* Friends */}
        <View style={[styles.tabContent, { display: activeTab === 0 ? "flex" : "none" }]}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Friends-pagina komt hier</Text>
          </View>
        </View>

        {/* Feed */}
        <View style={[styles.tabContent, { display: activeTab === 1 ? "flex" : "none" }]}>
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
          timestamp: item.timestamp.toString(),
          like_count: item.like_count,
          save_count: item.save_count,
          follower_count: item.follower_count,
          isLiked: item.isLiked,
          isSaved: item.isSaved,
          isFollowed: item.isFollowed,
        }}
        isActive={activePostId === item.id}
        artistTags={artistTags}
        genreTags={genreTags}
        feedFocused={isFocused && activeTab === 1}
        withinPreloadRange={isWithinPreloadRange}
      />
    );
  }}
  decelerationRate={0.9935} // Adjusted for smoother scrolling
  snapToAlignment="start"
  showsVerticalScrollIndicator={false}
  getItemLayout={(_, idx) => ({ length: itemLength, offset: itemLength * idx, index: idx })}
  snapToInterval={itemLength}
  pagingEnabled
  disableIntervalMomentum
  onViewableItemsChanged={onViewableItemsChanged}
  viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.1}
  ListFooterComponent={
    loadingMore ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="white" />
        <Text style={{ color: "white", marginTop: 5 }}>Laden...</Text>
      </View>
    ) : null
  }
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  onMomentumScrollEnd={onMomentumScrollEnd} // Attach the handler here
 
  
/>
        </View>

        {/* Filters */}
        <View style={[styles.tabContent, { display: activeTab === 2 ? "flex" : "none" }]}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Filters-pagina komt hier</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  footer: { paddingVertical: 20, alignItems: "center" },

  // wrapper rondom alle tab-content
  tabWrapper: { flex: 1}, 

  tabContent: {
    flex: 1,

  },

  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#888", fontSize: 18 },
});

const FeedScreen: React.FC = () => (
  <ActivePostProvider>
    <FeedScreenContent />
  </ActivePostProvider>
);

export default FeedScreen;
