import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  UIManager,
  Platform,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import { useAuth } from "../context/authContext";
import Slider from "@react-native-community/slider";
// Verwijder useMediaPreload want we schakelen preload-logica uit
import { setCurrentPlayingAudio, stopCurrentAudio } from "../PlaybackManager";

import ProfileLink from "./profileLink";
import Like from "./mainbuttons/like";
import Follow from "./mainbuttons/follow";
import PlayPause from "./mainbuttons/play_pause";
import Collab from "./mainbuttons/collab";
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";
import ReplayButton from "./mainbuttons/replay"; // ReplayButton als los component
import SaveButton from "./mainbuttons/save";

// Activeer LayoutAnimation op Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;

export interface ArtistTagData {
  id: string;
  name: string;
  image: string;
}

export interface GenreTagData {
  id: string;
  name: string;
}

export interface PostData {
  id: string;
  userId: string;
  profileImage: string;
  username: string;
  display_name: string;
  role: string;
  media: string | number;
  mediaUrl?: string | number;
  mediaType?: "image" | "video" | "photo";
  audio?: string | number;
  title: string;
  description: string;
  artistTags?: string[];
  genreTags: string[];
  timestamp: string;
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
  isPlaying?: boolean;
}

interface PostProps {
  post: PostData;
  artistTags: ArtistTagData[];
  genreTags: GenreTagData[];
  isActive: boolean;    // Geeft aan of de post automatisch moet afspelen
  feedFocused: boolean; // Geeft aan of de feed in focus is
  withinPreloadRange: boolean; // Deze prop blijft beschikbaar als indicator, maar wordt hier niet meer actief gebruikt
}

const PostComponent: React.FC<PostProps> = ({
  post,
  isActive,
  artistTags,
  genreTags,
  feedFocused,
  withinPreloadRange,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [isPlaying, setIsPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const toggleAnim = useRef(new Animated.Value(0)).current;
  const [artistExpanded, setArtistExpanded] = useState(false);

  const expandArtistTags = () => {
    if (!artistExpanded) {
      Animated.timing(toggleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setArtistExpanded(true);
    }
  };

  const collapseArtistTags = () => {
    if (artistExpanded) {
      Animated.timing(toggleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setArtistExpanded(false);
    }
  };

  const videoRef = useRef<Video | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  // Verwijder getPreloadedAudio, want we laden audio direct

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      // Eventueel logging toevoegen
    }
  };

  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis);
    }
  };

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded(!descriptionExpanded);
  };

  const retryPlayAudio = async (sound: Audio.Sound, retries: number = 3): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
          return;
        }
      } catch (error) {
        // Retry indien nodig
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  const playAudio = async (sound: Audio.Sound) => {
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.playAsync();
      } else {
        await retryPlayAudio(sound);
      }
    } catch (error) {
      // Foutafhandeling
    }
  };

  useEffect(() => {
    if (post.mediaType === "video" && videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate(updatePlaybackStatus);
    }
  }, [post.mediaType]);

  // Automatische afspeel-/pauze-logica voor audio en video (zonder extra preload)
  useEffect(() => {
    const managePlayback = async () => {
      if (isActive && feedFocused) {
        if (!manualPaused) {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.playAsync());
            setIsPlaying(true);
          } else if (post.mediaType === "photo" && post.audio) {
            setAudioLoading(true);
            // Direct audio laden via createAsync, geen cache meer ophalen
            const playDirectly = async () => {
              try {
                const audioUri = typeof post.audio === "string" ? post.audio : post.audio!.toString();
                const { sound } = await Audio.Sound.createAsync(
                  { uri: audioUri },
                  { shouldPlay: true }
                );
                audioRef.current = sound;
                // Stel de globale audio in zodat andere instanties stoppen
                await setCurrentPlayingAudio(sound);
                setIsPlaying(true);
                sound.setOnPlaybackStatusUpdate(updatePlaybackStatus);
              } catch (error) {
                console.error("Fout bij het laden van audio:", error);
              }
              setAudioLoading(false);
            };
            playDirectly();
          }
        }
      } else {
        if (post.mediaType === "video" && videoRef.current) {
          awaitOrIgnore(() => videoRef.current!.pauseAsync());
          awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
          setIsPlaying(false);
        } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
          // Bij niet-actief, stoppen en unloaden (geen onderscheid meer op preload-range)
          awaitOrIgnore(() => audioRef.current!.stopAsync());
          awaitOrIgnore(() => audioRef.current!.unloadAsync());
          audioRef.current = null;
          setIsPlaying(false);
          await stopCurrentAudio();
        }
      }
    };

    managePlayback();
  }, [isActive, feedFocused, manualPaused, /* verwijder withinPreloadRange indien niet meer nodig */]);

  // Handmatige play/pause functie
  const handlePlayPause = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
        setManualPaused(true);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
        setManualPaused(false);
      }
    } else if (post.mediaType === "photo" && post.audio) {
      if (audioRef.current) {
        if (isPlaying) {
          try {
            await audioRef.current.pauseAsync();
          } catch (error) {}
          setIsPlaying(false);
          setManualPaused(true);
        } else {
          try {
            await audioRef.current.playAsync();
          } catch (error) {}
          setIsPlaying(true);
          setManualPaused(false);
        }
      }
    }
  };

  // Replay functie: reset positie en speel opnieuw
  const handleReplay = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
      awaitOrIgnore(() => videoRef.current!.playAsync());
      setIsPlaying(true);
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      awaitOrIgnore(() => audioRef.current!.setPositionAsync(0));
      awaitOrIgnore(() => audioRef.current!.playAsync());
      setIsPlaying(true);
    }
  };

  // Cleanup: zorg dat bij unmount de audio stopt
  useEffect(() => {
    return () => {
      if (post.mediaType === "photo" && post.audio && audioRef.current) {
        awaitOrIgnore(() => audioRef.current!.stopAsync());
        awaitOrIgnore(() => audioRef.current!.setPositionAsync(0));
        audioRef.current = null;
        stopCurrentAudio();
      }
      if (post.mediaType === "video" && videoRef.current) {
        awaitOrIgnore(() => videoRef.current!.pauseAsync());
        awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
      }
    };
  }, []);

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.profileContainer}>
          <ProfileLink userId={post.userId}>
            <Image
              source={{ uri: post.profileImage }}
              style={{ width: scale * 30, height: scale * 30, borderRadius: scale * 15 }}
            />
          </ProfileLink>
          <ProfileLink userId={post.userId}>
            <View style={styles.userInfo}>
              <Text style={styles.usernameText}>{post.username}</Text>
              <Text style={styles.displayNameText}>
                {post.display_name} <Text style={styles.dot}>•</Text> {post.role}
              </Text>
            </View>
          </ProfileLink>
        </View>
        <View style={styles.headerTags}>
          <TouchableOpacity onPress={expandArtistTags}>
            <View style={styles.artistTagsContainerHeader}>
              {post.artistTags?.map((tagId, index) => {
                const foundTag = artistTags.find((tag) => tag.id === tagId);
                if (!foundTag) return null;
                const animatedMargin = index === 0 ? 0 : toggleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 5],
                });
                return (
                  <Animated.View key={foundTag.id} style={{ marginLeft: animatedMargin }}>
                    <ArtistTag
                      id={foundTag.id}
                      name={foundTag.name}
                      image={foundTag.image}
                      disableModuleOpen={!artistExpanded}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={collapseArtistTags}>
            <View style={styles.genreTagsContainerHeader}>
              {post.genreTags?.map((tagId, index) => {
                const foundTag = genreTags.find((tag) => tag.id === tagId);
                if (!foundTag) return null;
                const animatedMargin = index === 0 ? 0 : toggleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, -20],
                });
                return (
                  <Animated.View key={foundTag.id} style={{ marginLeft: animatedMargin }}>
                    <GenreTag id={foundTag.id} name={foundTag.name} />
                  </Animated.View>
                );
              })}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Pressable onPress={handlePlayPause} style={styles.mediaContainer}>
        {post.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: post.mediaUrl as string }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping
            useNativeControls={false}
          />
        ) : (
          <Image source={{ uri: post.mediaUrl as string }} style={styles.media} />
        )}

    

        <View style={styles.controlsContainer}>
          <View style={styles.playButtonContainer}>
            <PlayPause isPlaying={isPlaying} onPress={handlePlayPause} />
          </View>
          <View style={styles.seekbarContainer}>
            <Slider
              style={{ width: scale * 200, height: scale * 20 }}
              minimumValue={0}
              maximumValue={1}
              value={duration ? currentTime / duration : 0}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              thumbTintColor="#FFFFFF00"
              onSlidingComplete={async (value: number) => {
                const newPosition = value * duration;
                if (post.mediaType === "video" && videoRef.current) {
                  await videoRef.current.setPositionAsync(newPosition);
                } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
                  await audioRef.current.setPositionAsync(newPosition);
                  const status = await audioRef.current.getStatusAsync();
                  if (status.isLoaded && !status.isPlaying) {
                    await audioRef.current.playAsync();
                    setIsPlaying(true);
                  }
                }
              }}
            />
          </View>
          <ReplayButton onPress={handleReplay} />
        </View>
        <View style={styles.infoOverlay}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text
            style={[styles.postDescription, { marginBottom: descriptionExpanded ? 10 : 0 }]}
            numberOfLines={descriptionExpanded ? undefined : 2}
          >
            {post.description}
          </Text>
          <Text
            style={[styles.postDescription, styles.hiddenText]}
            onTextLayout={(e) => {
              if (e.nativeEvent.lines.length > 2 && !showSeeMore) {
                setShowSeeMore(true);
              }
            }}
          >
            {post.description}
          </Text>
          {showSeeMore && (
            <TouchableOpacity onPress={toggleDescription}>
              <Text style={styles.seeMoreText}>
                {descriptionExpanded ? "See less" : "See more"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>

      <View style={styles.bottomContainer}>
        <View style={styles.leftButtons}>
          {currentUserId && (
            <View style={styles.buttonWrapper}>
              <Like postId={post.id} userId={currentUserId} receiverId={post.userId} />
            </View>
          )}
          {currentUserId && (
            <View style={styles.buttonWrapper}>
              <SaveButton postId={post.id} userId={currentUserId} />
            </View>
          )}
          {currentUserId && (
            <View style={styles.buttonWrapper}>
              <Follow followerId={currentUserId} followingId={post.userId} />
            </View>
          )}
        </View>
        <View style={styles.rightButtons}>
          {currentUserId ? (
            <Collab senderId={currentUserId} receiverId={post.userId} postId={post.id} />
          ) : (
            <TouchableOpacity style={styles.collabButtonDisabled} disabled={true}>
              <Text style={styles.collabText}>LOGIN TO COLLAB!</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: "#121212",
    borderRadius: scale * 20,
    padding: scale * 10,
    marginBottom: scale * 20,
    minHeight: scale * 580,
    width: scale * 365,
    alignSelf: "center",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale * 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: scale * 5,
  },
  usernameText: {
    color: "white",
    fontSize: scale * 12,
    fontWeight: "bold",
  },
  displayNameText: {
    color: "white",
    fontSize: scale * 10,
  },
  dot: {
    marginHorizontal: scale * 3,
  },
  headerTags: {
    flexDirection: "row",
    alignItems: "center",
  },
  artistTagsContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreTagsContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: scale * 5,
  },
  mediaContainer: {
    width: scale * 345,
    borderRadius: scale * 10,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: scale * 10,
    height: scale * 463,
    alignSelf: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
 
  controlsContainer: {
    position: "absolute",
    bottom: scale * 2,
    left: scale * 10,
    right: scale * 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playButtonContainer: {
    width: scale * 30,
    height: scale * 30,
    justifyContent: "center",
    alignItems: "center",
    bottom: scale * 10,
    right: 8,
  },
  seekbarContainer: {
    width: scale * 200,
  },
  placeholder: {
    width: scale * 40,
    height: scale * 40,
  },
  infoOverlay: {
    position: "absolute",
    bottom: scale * 45,
    left: scale * 10,
    right: scale * 10,
    backgroundColor: "rgba(0,0,0,0.0)",
    borderRadius: scale * 5,
    padding: scale * 10,
  },
  postTitle: {
    color: "white",
    fontSize: scale * 16,
    fontWeight: "bold",
    marginBottom: scale * 5,
  },
  postDescription: {
    color: "white",
    fontSize: scale * 14,
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
  seeMoreText: {
    color: "#fff",
    fontSize: scale * 12,
    marginTop: scale * 4,
    textDecorationLine: "underline",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale * 10,
    paddingHorizontal: scale * 10,
  },
  bottomButtons: {
    flexDirection: "row",
    alignItems: "center",
    right: scale * 12,
  },
  leftButtons: {
    flexDirection: "row",
    alignItems: "center",
    right: scale * 15,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    left: scale * 10,
  },
  buttonWrapper: {
    margin: scale * 3,
  },
  postActions: {
    left: scale * 18,
  },
  collabButtonDisabled: {},
  collabText: {},
});

export default PostComponent;
