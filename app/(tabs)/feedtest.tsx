import React, { useRef, useState } from "react";
import { 
  View, 
  FlatList, 
  Animated,
  StyleSheet
} from "react-native";
import { Video, Audio } from "expo-av";
import users from "../../dummy_data/dummy_id";
import PostComponent from "../../components/postcomponent";

interface Post {
  id: string;
  userId: string ;
  profileImage: string | number;
  username: string;
  media: string | number;
  mediaUrl: string | number;
  mediaType: "photo" | "video";
  audio?: string | number;
  title: string;
  description: string;
  timestamp: number;
  artistTags?: string[];
  genreTags: string[];
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
  isPlaying?: boolean;
}

const extractPosts = (): Post[] => {
  return users.flatMap(user => 
    user.posts.map(post => ({
      id: post.id,
      userId: user.userId,  
      profileImage: user.userProfile,
      username: user.userName,
      media: post.mediaUrl, 
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      audio: post.audioUrl,
      title: post.title,
      description: post.description,
      artistTags: post.artistTags ?? [],
      genreTags: post.genreTags || [],
      timestamp: post.timestamp,
      isLiked: false,
      isFollowed: false,
      isSaved: false,
      isPlaying: false
    }))
  );
};

const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(extractPosts());
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const audioRefs = useRef<{ [key: string]: Audio.Sound | null }>({});

  const handlePlayPause = async (postId: string) => {
    const updatedPosts = await Promise.all(
      posts.map(async post => {
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

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostComponent 
            post={{
              ...item,
              timestamp: item.timestamp.toString(),
              artistTags: item.artistTags ?? [],
              genreTags: item.genreTags ?? []
            }}
            onPlayPause={handlePlayPause}
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
