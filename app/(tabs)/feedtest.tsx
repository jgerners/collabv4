import React, { useRef, useState, useEffect, useMemo } from "react"
import { View, StyleSheet, Text, RefreshControl, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, Animated, Keyboard } from "react-native"
import { useIsFocused } from "@react-navigation/native"
import PostComponent from "../../components/postcomponent"
import { useArtistTags } from "../../hooks/useArtistTags"
import { useGenreTags } from "../../hooks/useGenreTags"
import { usePosts } from "../../hooks/useFeedPosts"
import { ActivePostProvider } from "../../context/activePostContext"
import { Audio } from "expo-av"
import { setCachedAudio } from "../../helpers/audioCache"
import FeedHeader from "../../headers/FeedHeader"
import ForYouRack from "../../components/ForYouRack"
import { insertForYouRacks, FeedItem } from "../../helpers/InsertForYouRacks"
import type { ForYouPostData } from '../../components/ForYouRack'
import FeedSearchModal from "../../components/FeedSearchModal"

type FeedScreenContentProps = {
  setFeedBarVisible?: (visible: boolean) => void;
};

const itemLength = 780

const FeedScreenContent: React.FC<FeedScreenContentProps> = ({ setFeedBarVisible }) => {
  const { posts, initialLoading, loadingMore, error, refetch, loadMorePosts } = usePosts()
  const { artistTags, loading: artistLoading, error: artistError } = useArtistTags()
  const { genreTags, loading: genreLoading, error: genreError } = useGenreTags()

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState(1)
  const preloadedPosts = useRef<{ [key: string]: boolean }>({})
  const flatListRef = useRef<Animated.FlatList<any>>(null)
  const lastOffset = useRef(0)

  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])

  // Search overlay state
  const [search, setSearch] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const filtersActive = selectedGenres.length > 0 || selectedArtists.length > 0;

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleSelectGenre = (id: string) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const handleSelectArtist = (id: string) => {
    setSelectedArtists(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  // Stap 1: Eerst filteren op genres/artists (zoals altijd)
  const filteredPosts = useMemo(() =>
    posts.filter(post => {
      const genreMatch =
        selectedGenres.length === 0 ||
        selectedGenres.some(genreId => post.genreTags?.includes(genreId))
      const artistMatch =
        selectedArtists.length === 0 ||
        selectedArtists.some(artistId => post.artistTags?.includes(artistId))
      return genreMatch && artistMatch
    }),
    [posts, selectedGenres, selectedArtists]
  )

  // Stap 2: Zoekfilter toepassen over die filteredPosts
  const searchedPosts = useMemo(() => {
    if (!search.trim()) return filteredPosts;
    const searchTerm = search.trim().toLowerCase();

  return filteredPosts.filter(post => {
    const inTitle = post.title?.toLowerCase().includes(searchTerm);
    const inUsername = post.username?.toLowerCase().includes(searchTerm);
    const inRole = post.role?.toLowerCase().includes(searchTerm);

    const genreNames = (post.genreTags || [])
      .map(id => genreTags.find(tag => tag.id === id)?.name?.toLowerCase() || "")
      .filter(Boolean);
    const inGenreTags = genreNames.some(name => name.includes(searchTerm));

    const artistNames = (post.artistTags || [])
      .map(id => artistTags.find(tag => tag.id === id)?.name?.toLowerCase() || "")
      .filter(Boolean);
    const inArtistTags = artistNames.some(name => name.includes(searchTerm));

    return inTitle || inUsername || inRole || inGenreTags || inArtistTags;
  });
}, [search, filteredPosts, genreTags, artistTags]);

  // Daarna: racks injecteren ALS er geen filters zijn, anders alleen posts tonen
  const feedItems: FeedItem[] = useMemo(() => {
    const baseItems = searchedPosts.map(p => ({ ...p, timestamp: p.timestamp.toString() }))
     if (filtersActive || search.trim()) {
      return baseItems.map(post => ({ type: "post", post }))
    } else {
      return insertForYouRacks(baseItems, artistTags)
    }
  }, [searchedPosts, filtersActive, artistTags])

  useEffect(() => {
    posts.forEach((post) => {
      if (!preloadedPosts.current[post.id]) {
        preloadedPosts.current[post.id] = false
        if (post.mediaType === "video" && post.mediaUrl) {
          fetch(post.mediaUrl.toString())
            .then(() => (preloadedPosts.current[post.id] = true))
            .catch(() => (preloadedPosts.current[post.id] = false))
        } else if (post.mediaType === "photo" && post.audio) {
          Audio.Sound.createAsync(
            { uri: typeof post.audio === "string" ? post.audio : post.audio!.toString() },
            { shouldPlay: false },
          )
            .then(({ sound }) => {
              preloadedPosts.current[post.id] = true
              setCachedAudio(post.id, sound)
            })
            .catch(() => (preloadedPosts.current[post.id] = false))
        } else {
          preloadedPosts.current[post.id] = true
        }
      }
    })
  }, [posts])

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    // eventueel auto-set expandedPostId
  }).current

  const handleEndReached = () => {
    if (!loadingMore) loadMorePosts()
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const onMomentumScrollEnd = ({ nativeEvent }: any) => {
    // custom snap/scroll gedrag indien gewenst
  }

  const handleForYouRackPress = (post: ForYouPostData) => {
    if (post.artistId) {
      setSelectedArtists([post.artistId]);
      setSelectedGenres([]);
    } else if (post.genreId) {
      setSelectedGenres([post.genreId]);
      setSelectedArtists([]);
    }
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleFeedScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!setFeedBarVisible) return;
    const offset = event.nativeEvent.contentOffset.y;
    if (offset > lastOffset.current && offset > 20) {
      setFeedBarVisible(false);
    } else if (offset < lastOffset.current) {
      setFeedBarVisible(true);
    }
    lastOffset.current = offset;
  };

  const handleSubmitSearch = () => {
    const trimmed = search.trim()
    if (trimmed && !recentSearches.includes(trimmed)) {
      setRecentSearches([trimmed, ...recentSearches].slice(0, 10))
    }
    setSearchFocused(false)
    Keyboard.dismiss()
  }

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="white" />
      </View>
    )
  }

  if (error || artistError || genreError) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>❌ Fout bij laden: {error || artistError || genreError}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Feed Header */}
      <FeedHeader
        allGenres={genreTags}
        allArtists={artistTags}
        selectedGenres={selectedGenres}
        selectedArtists={selectedArtists}
        onSelectGenre={handleSelectGenre}
        onSelectArtist={handleSelectArtist}
        search={search}
        setSearch={setSearch}
        onSearchFocus={() => {
          setSearch("")
          setSearchFocused(true)
        }}
      />

      {/* SEARCH MODAL */}
      <FeedSearchModal
        visible={searchFocused}
        search={search}
        setSearch={setSearch}
        onRequestClose={() => setSearchFocused(false)}
        recentSearches={recentSearches}
        setRecentSearches={setRecentSearches}
        onSubmit={handleSubmitSearch}
      />

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
          <Animated.FlatList
            ref={flatListRef}
            data={feedItems}
            keyExtractor={item =>
              item.type === "post" ? item.post.id : item.rackId
            }
            renderItem={({ item, index }) => {
              const activePostIndex = feedItems.findIndex(
                (feedItem) => feedItem.type === "post" && feedItem.post.id === expandedPostId
              )
              const isAfterActivePost = activePostIndex !== -1 && index > activePostIndex

              if (item.type === "post") {
                const { post } = item
                const animatedMargin = index === 0
                  ? scrollY.interpolate({
                      inputRange: [0, 24],
                      outputRange: [16, 0],
                      extrapolate: "clamp",
                    })
                  : 0

                return (
                  <Animated.View style={{ marginTop: animatedMargin }}>
                    <PostComponent
                      post={{
                        ...post,
                        timestamp: post.timestamp.toString(),
                        like_count: post.like_count,
                        save_count: post.save_count,
                        follower_count: post.follower_count,
                        isLiked: post.isLiked,
                        isSaved: post.isSaved,
                        isFollowed: post.isFollowed,
                      }}
                      artistTags={artistTags}
                      genreTags={genreTags}
                      activePostId={expandedPostId}
                      setActivePostId={setExpandedPostId}
                      isAfterActivePost={isAfterActivePost}
                    />
                  </Animated.View>
                )
              } else if (item.type === "rack") {
                return (
                  <ForYouRack
                    title={item.title}
                    subtitle={item.subtitle}
                    posts={item.rackPosts}
                    onPressPost={handleForYouRackPress}
                    isAfterActivePost={isAfterActivePost}
                  />
                )
              }
              return null
            }}
            showsVerticalScrollIndicator={false}
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
            onMomentumScrollEnd={onMomentumScrollEnd}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              {
                useNativeDriver: false,
                listener: activeTab === 1 ? handleFeedScroll : undefined,
              }
            )}
            scrollEventThrottle={16}
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0C0C0C" },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  footer: { paddingVertical: 20, alignItems: "center" },
  tabWrapper: { flex: 1 },
  tabContent: { flex: 1 },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#888", fontSize: 18 },
})

// Let op: props doorgeven!
const FeedScreen: React.FC<FeedScreenContentProps> = (props) => (
  <ActivePostProvider>
    <FeedScreenContent {...props} />
  </ActivePostProvider>
)

export default FeedScreen
