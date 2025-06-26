import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useArtistTags } from "../../hooks/useArtistTags";
import { useGenreTags } from "../../hooks/useGenreTags";
import { usePosts } from "../../hooks/useFeedPosts";
import { ActivePostProvider } from "../../context/activePostContext";
import { Audio } from "expo-av";
import { setCachedAudio } from "../../helpers/audioCache";
import FeedHeader from "../../headers/FeedHeader";
import PostPreview from "../../components/PostPreview";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../routes';
import MasonryList from "@react-native-seoul/masonry-list";
import type { PostData, ArtistTagData, GenreTagData } from '../../components/postcomponent';

type Post = PostData;

const { width: windowWidth } = Dimensions.get("window");
const CARD_MARGIN = 7;
const CARD_COLUMNS = 2;
const CARD_WIDTH = (windowWidth - CARD_MARGIN * (CARD_COLUMNS + 1)) / CARD_COLUMNS;

type NavigationProp = StackNavigationProp<RootStackParamList>;

const FeedScreenContent: React.FC = () => {
  const {
    posts,
    initialLoading,
    loadingMore,
    error,
    refetch,
    loadMorePosts,
  } = usePosts();

  // HIER DESTRUCTURE JE JE TAGS!
  const { artistTags: allArtistTags = [], error: artistError } = useArtistTags();
  const { genreTags: allGenreTags = [], error: genreError } = useGenreTags();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // Preload
  const preloadedPosts = useRef<{ [key: string]: boolean }>({});
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

  // Loading & error
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
          ❌ Fout bij laden: {error || artistError || genreError}
        </Text>
      </View>
    );
  }

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePlay = (id: string) => setPlayingId(id);
  const handlePause = (id: string) => {
    if (playingId === id) setPlayingId(null);
  };

  // DIT IS JE NIEUWE handleSeePost!
  const handleSeePost = (
    post: PostData,
    artistTags: ArtistTagData[],
    genreTags: GenreTagData[]
  ) => {
    navigation.navigate("PostDetail", {
      postId: post.id,
      post,
      artistTags,
      genreTags,
    });
  };

  return (
    <View style={styles.container}>
      <FeedHeader onTabChange={setActiveTab} />
      <View style={styles.tabWrapper}>
        {/* Friends-tab */}
        <View style={[styles.tabContent, { display: activeTab === 0 ? "flex" : "none" }]}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Friends-pagina komt hier</Text>
          </View>
        </View>
        {/* Feed-tab: MASONRY */}
        <View style={[styles.tabContent, { display: activeTab === 1 ? "flex" : "none" }]}>
          <MasonryList
            showsVerticalScrollIndicator={false}
            data={posts}
            keyExtractor={(item) => (item as Post).id}
            numColumns={2}
            style={{ backgroundColor: "black" }}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
            renderItem={({ item, i }) => {
              const post = item as PostData;
              const isLeftCol = i % 2 === 0;

              // Per post juiste tags!
              const artistTagsForPost = allArtistTags.filter(tag =>
                post.artistTags?.includes(tag.id)
              );
              const genreTagsForPost = allGenreTags.filter(tag =>
                post.genreTags?.includes(tag.id)
              );

              return (
                <View
                  style={{
                    width: CARD_WIDTH,
                    marginBottom: CARD_MARGIN,
                    marginLeft: isLeftCol ? CARD_MARGIN : CARD_MARGIN / 2,
                    marginRight: isLeftCol ? CARD_MARGIN / 2 : CARD_MARGIN,
                  }}
                >
                  <PostPreview
                    post={{
                      ...post,
                      timestamp: post.timestamp.toString(),
                    } as PostData}
                    isPlaying={playingId === post.id}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeePost={() => handleSeePost(
                      post,
                      artistTagsForPost,
                      genreTagsForPost
                    )}
                  />
                </View>
              );
            }}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.12}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={{ color: "white", marginTop: 5 }}>Laden...</Text>
                </View>
              ) : null
            }
          />
        </View>
        {/* Filters-tab */}
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
  tabWrapper: { flex: 1 },
  tabContent: { flex: 1 },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#888", fontSize: 18 },
});

const FeedScreen: React.FC = () => (
  <ActivePostProvider>
    <FeedScreenContent />
  </ActivePostProvider>
);

export default FeedScreen;
