import React, { useRef, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Dimensions,
  Image, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  Pressable,
  StyleSheet,
  Animated
} from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import Icon from "react-native-vector-icons/Ionicons";

// Aangepaste interface: artistTags, genreTags en timestamp
interface Post {
  id: string;
  profileImage: string | number;
  username: string;
  media: string | number; // URL of lokaal require()
  mediaType?: "image" | "video";
  audio?: string | number; // optioneel audiobestand (voor image-posts)
  title: string;
  description: string;
  artistTags: string[];
  genreTags: string[];
  timestamp: string; // Wanneer de post is geplaatst (bijv. "5h ago")
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
  isPlaying?: boolean;
}

const samplePosts: Post[] = [
  {
    id: "1",
    profileImage: require('../../assets/dummy_images/tate_profiel.jpg'),
    username: "Tate McRae",
    media: require('../../assets/dummy_images/tate_post.mp4'),
    mediaType: "video",
    title: "I need a full pop production for this guitar demo",
    description: "This is a vocal demo I made. It needs full production and Dua Lipa vibes.",
    artistTags: ["Bruno Mars style", "Dua Lipa style"],
    genreTags: ["Pop", "Dance", "Vocal"],
    timestamp: "2h ago",
    isLiked: false,
    isFollowed: false,
    isSaved: false,
    isPlaying: false,
  },
  {
    id: "2",
    profileImage: require('../../assets/dummy_images/justin_profiel.png'),
    username: "Justin Bieber",
    media: require('../../assets/dummy_images/justin_singing.png'),
    mediaType: "image",
    audio: require('../../assets/dummy_images/justin_audio.mp3'),
    title: "I want an acoustic guitar strum under my vocals",
    description: "This is a home-recorded demo. Let’s make it sound like SZA's Snooze.",
    artistTags: ["SZA style"],
    genreTags: ["Acoustic", "Chill", "Indie"],
    timestamp: "5h ago",
    isLiked: false,
    isFollowed: false,
    isSaved: false,
    isPlaying: false,
  },
  {
    id: "3",
    profileImage: require('../../assets/dummy_images/dua_profielfoto.png'),
    username: "Dua Lipa",
    media: require('../../assets/dummy_images/dua_1.png'),
    mediaType: "image",
    audio: require('../../assets/dummy_images/dua_audio.mp3'),
    title: "I need a synth solo on this track",
    description: "Add a funky synth solo to this finished pop song after the last chorus.",
    artistTags: ["Dua Lipa style", "The Weeknd style", "Daft Punk style"],
    genreTags: ["Electro", "Pop", "R&B"],
    timestamp: "8h ago",
    isLiked: false,
    isFollowed: false,
    isSaved: false,
    isPlaying: false,
  },
  {
    id: "4",
    profileImage: "https://i.scdn.co/image/ab67616100005174e29e618946c50f85a7fc7a55",
    username: "The Weeknd",
    media: "https://via.placeholder.com/300",
    mediaType: "image",
    title: "Looking for a futuristic sound for this track",
    description: "This track needs a retro synthwave sound like Kavinsky of Daft Punk.",
    artistTags: ["The Weeknd style"],
    genreTags: ["Synthwave", "Retro", "Futuristic"],
    timestamp: "1d ago",
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "5",
    profileImage: "https://i.scdn.co/image/ab6761610000517496c2d09e6df6b52bca0f998a",
    username: "Ariana Grande",
    media: "https://via.placeholder.com/300",
    mediaType: "image",
    title: "Need a smooth R&B beat for this vocal idea",
    description: "Something similar to Doja Cat's vibe with a smooth groove.",
    artistTags: ["Doja Cat"],
    genreTags: ["R&B", "Soul", "Smooth"],
    timestamp: "3d ago",
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "6",
    profileImage: "https://i.scdn.co/image/ab67616100005174b5c0a4c8e8b315efc46a8f6f",
    username: "Ed Sheeran",
    media: "https://via.placeholder.com/300",
    mediaType: "image",
    title: "Looking for a live violin recording",
    description: "A beautiful violin accompaniment for this acoustic song.",
    artistTags: ["Ed Sheeran"],
    genreTags: ["Acoustic", "Live", "Classical"],
    timestamp: "5d ago",
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
];

// Mapping van artiest-tags naar lokale afbeeldingen (testdoeleinden)
const tagImages: { [key: string]: any } = {
  "Bruno Mars style": require('../../assets/dummy_images/tags/bruno_tag.jpg'),
  "Dua Lipa style": require('../../assets/dummy_images/tags/dua_tag.png'),
  "SZA style": require('../../assets/dummy_images/tags/sza_tag.png'),
  "The Weeknd style": require('../../assets/dummy_images/tags/theweeknd_tag.jpg'),
  "Daft Punk style": require('../../assets/dummy_images/tags/daft_tag.jpg'),
  "Doja Cat": require('../../assets/dummy_images/tags/doja_tag.png'),
};

const DOUBLE_PRESS_DELAY = 300;

const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const lastTap = useRef<number | null>(null);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  // Animated value voor de hart-animatie
  const heartScale = useRef(new Animated.Value(0)).current;
  // Refs voor video en audio
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
              console.log(`Video post ${postId} started.`);
            } else if (post.mediaType === "image" && post.audio) {
              if (!audioRefs.current[post.id]) {
                const { sound } = await Audio.Sound.createAsync(
                  typeof post.audio === "string" ? { uri: post.audio } : post.audio!,
                  { shouldPlay: true, isLooping: false }
                );
                audioRefs.current[post.id] = sound;
                console.log(`Audio for post ${postId} created and started.`);
              } else {
                await audioRefs.current[post.id]?.playAsync();
                console.log(`Audio for post ${postId} resumed.`);
              }
            }
          } else {
            if (post.mediaType === "video" && videoRefs.current[postId]) {
              await videoRefs.current[postId]?.pauseAsync();
              console.log(`Video post ${postId} paused.`);
            } else if (post.mediaType === "image" && post.audio && audioRefs.current[post.id]) {
              await audioRefs.current[post.id]?.pauseAsync();
              console.log(`Audio for post ${postId} paused.`);
            }
          }
          return { ...post, isPlaying: newPlaying };
        }
        return post;
      })
    );
    setPosts(updatedPosts as Post[]);
  };

  // Functie voor het triggeren van de hart-animatie
  const triggerHeartAnimation = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Combineer single tap (play/pause) en double tap (like)
  const handleTap = (postId: string) => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      lastTap.current = null;
      // Trigger de hart-animatie
      triggerHeartAnimation();
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, isLiked: !post.isLiked } : post
        )
      );
    } else {
      lastTap.current = now;
      tapTimeout.current = setTimeout(() => {
        handlePlayPause(postId);
        lastTap.current = null;
        tapTimeout.current = null;
      }, DOUBLE_PRESS_DELAY);
    }
  };

  // Placeholder functie voor navigatie wanneer op de username wordt gedrukt
  const handleUsernamePress = (postId: string) => {
    console.log(`Navigating to profile of post ${postId}`);
    // Voeg hier later navigatielogica toe, bijvoorbeeld: navigation.navigate('Profile', { postId });
  };

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ paddingTop: 110 }}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            {/* PostHeader: Profielfoto, follow-bubble */}
            <View style={styles.postHeader}>
              <View style={styles.profileContainer}>
                <Image
                  source={typeof item.profileImage === "string" ? { uri: item.profileImage } : item.profileImage}
                  style={styles.profilePic}
                />
                <TouchableOpacity style={styles.followBubble} onPress={() => {
                  setPosts(prevPosts =>
                    prevPosts.map(post =>
                      post.id === item.id ? { ...post, isFollowed: !post.isFollowed } : post
                    )
                  );
                }}>
                  <Text style={styles.followBubbleText}>
                    {item.isFollowed ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={() => {
                  setPosts(prevPosts =>
                    prevPosts.map(post =>
                      post.id === item.id ? { ...post, isSaved: !post.isSaved } : post
                    )
                  );
                }}>
                  <Icon name={item.isSaved ? "bookmark" : "bookmark-outline"} size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.collabButton}>
                  <Text style={styles.collabText}>COLLAB!</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Media met gecombineerde tapdetectie */}
            <View style={styles.mediaContainer}>
              <Pressable onPress={() => handleTap(item.id)}>
                {item.mediaType === "video" ? (
                  <Video
                    ref={ref => { videoRefs.current[item.id] = ref; }}
                    source={typeof item.media === "string" ? { uri: item.media } : item.media!}
                    style={styles.media}
                    resizeMode={"cover" as ResizeMode}
                    shouldPlay={false}
                    isLooping
                  />
                ) : (
                  <Image
                    source={typeof item.media === "string" ? { uri: item.media } : item.media!}
                    style={styles.media}
                  />
                )}
              </Pressable>
              {(item.mediaType === "video" || item.audio) && (
                <TouchableOpacity style={styles.playButton} onPress={() => handlePlayPause(item.id)}>
                  <Icon name={item.isPlaying ? "pause" : "play-outline"} size={30} color="white" />
                </TouchableOpacity>
              )}
              {/* Klikbare username-overlay onderaan links in de media */}
              <Pressable style={styles.usernameOverlay} onPress={() => handleUsernamePress(item.id)}>
                <Text style={styles.usernameOverlayText}>{item.username}</Text>
              </Pressable>
              {/* Geanimeerde hart-overlay */}
              <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
                <Icon name="heart" size={50} color="red" />
              </Animated.View>
            </View>

            {/* Timestamp net onder de media */}
            <View style={styles.timestampContainer}>
              <Icon name="time-outline" size={12} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.timestampText}>Posted {item.timestamp}</Text>
            </View>

            {/* Titel, beschrijving en tags */}
            <View style={styles.postDetails}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postDescription}>{item.description}</Text>
              {/* Artist Tags */}
              <View style={styles.tagsContainer}>
                {item.artistTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    {tagImages[tag] && (
                      <Image source={tagImages[tag]} style={styles.tagImage} />
                    )}
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              {/* Genre Tags */}
              <View style={styles.tagsContainer}>
                {item.genreTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Like en See More */}
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => {
                setPosts(prevPosts =>
                  prevPosts.map(post =>
                    post.id === item.id ? { ...post, isLiked: !post.isLiked } : post
                  )
                );
              }} style={styles.likeButton}>
                <Icon name={item.isLiked ? "heart" : "heart-outline"} size={25} color={item.isLiked ? "red" : "white"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.seeMoreButton}>
                <Text style={styles.seeMoreText}>See more ↓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: 720,
          offset: 720 * index,
          index,
        })}
        snapToInterval={720}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(25, 25, 25)",
    paddingTop: 0,
  },
  postContainer: {
    backgroundColor: "transparent",
    borderRadius: 15,
    margin: 10,
    height: 700,
    
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 25,
    top: 3
  },
  followBubble: {
    backgroundColor: "purple",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    bottom: -3,
    right: 12,
  },
  followBubbleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "transparent",
    padding: 0,
    marginRight: 8,
    bottom: -3,
    right: -10,
  },
  collabButton: {
    backgroundColor: "purple",
    paddingVertical: 2,
    paddingHorizontal: 20,
    right: -5,
    borderRadius: 6,
    bottom: -3,
  },
  collabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  mediaContainer: {
    position: "relative",
    alignItems: "center",
    marginVertical: 15,
    
  },
  media: {
    width: 430,
    height: 430,
    borderRadius: 0

  },
  playButton: {
    position: "absolute",
    top: "45%",
    left: "45%",
  },
  usernameOverlay: {
    position: "absolute",
    bottom: 8,
    left: -3,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  usernameOverlayText: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  timestampContainer: {
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    left: 0
  },
  timestampText: {
    fontSize: 10,
    color: "gray",
  },
  postDetails: {
    alignSelf: "flex-start",
    marginLeft: -8,
    marginTop: 10,
    width: "90%",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "white",
    left: 10
  },
  postDescription: {
    fontSize: 12,
    color: "gray",
    marginVertical: 8,
    left: 10
  },
  tagsContainer: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
    left: 10,

  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 2,
    borderRadius: 6,
    marginRight: 6,
    flex: 1,
    justifyContent: "center",
  },
  tagImage: {
    width: 16,
    height: 16,
    marginRight: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: "white",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingHorizontal: 50,
    paddingVertical: 5,
  },
  likeButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
    bottom: 15
  },
  seeMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    bottom: 15
  },
  seeMoreText: {
    fontSize: 16,
    color: "white",
  },
  heartContainer: {
    position: "absolute",
    top: "40%",
    left: "40%",
  },
});

export default FeedScreen;
