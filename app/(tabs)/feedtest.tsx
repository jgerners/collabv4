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
import PostComponent from "../../components/postcomponent";
import { useArtistTags } from "../../hooks/useArtistTags";
import { useGenreTags } from "../../hooks/useGenreTags";
import { usePosts } from "../../hooks/useFeedPosts";

// Bereken de schaalfactor op basis van een basisbreedte van 370
const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;
const itemLength = scale * 600;

const FeedScreen: React.FC = () => {
  const { posts, loading, error, refetch } = usePosts();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setActivePostId(viewableItems[0].item.id);
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
        renderItem={({ item }) => (
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
          />
        )}
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
    zIndex: 9999,
  },
});

export default FeedScreen;
