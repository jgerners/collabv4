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
import { setCurrentPlayingMedia, stopCurrentMedia } from "../PlaybackManager";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";


// Importeer de audio cache helper
import { getCachedAudio, setCachedAudio } from "../helpers/audioCache";

import ProfileLink from "./profileLink";
import Like from "./mainbuttons/like";
import Follow from "./mainbuttons/follow";
import PlayPause from "./mainbuttons/play_pause";
import Collab from "./mainbuttons/collab";
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";
import ReplayButton from "./mainbuttons/replay";
import SaveButton from "./mainbuttons/save";
import Timestamp from "./mainbuttons/timestamp";

// Activeer LayoutAnimation op Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
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
  isActive: boolean; // Geeft aan of de post automatisch moet afspelen
  feedFocused: boolean; // Geeft aan of de feed in focus is
  withinPreloadRange: boolean; // Indicator, maar niet meer actief gebruikt
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

  // Deze ref zorgt ervoor dat auto-play slechts één keer per activatie gebeurt
  const hasAutoPlayedRef = useRef(false);

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

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      // Eventuele logging
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

  const retryPlayAudio = async (
    sound: Audio.Sound,
    retries: number = 3
  ): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
          return;
        }
      } catch (error) {}
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  // Aangepaste playAudio-functie met optionele parameter "reset"
  // reset = true: positie naar 0 zetten (auto-play), reset = false: huidige positie behouden
  const playAudio = async (reset: boolean = true) => {
    setAudioLoading(true);
    try {
      let sound = getCachedAudio(post.id);
      const audioUri =
        typeof post.audio === "string" ? post.audio : post.audio!.toString();
      if (sound) {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );
          sound = newSound;
          setCachedAudio(post.id, sound);
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus);
        } else {
          if (reset) {
            await sound.setPositionAsync(0);
          }
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus);
          await sound.playAsync();
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        sound = newSound;
        setCachedAudio(post.id, sound);
        sound.setOnPlaybackStatusUpdate(updatePlaybackStatus);
      }
      audioRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error("Fout bij het laden van audio:", error);
    }
    setAudioLoading(false);
  };

  useEffect(() => {
    if (post.mediaType === "video" && videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate(updatePlaybackStatus);
    }
  }, [post.mediaType]);

  // Auto-play effect
  useEffect(() => {
    const managePlayback = async () => {
      if (isActive && feedFocused) {
        if (post.mediaType === "video" && videoRef.current) {
          await setCurrentPlayingMedia(videoRef.current);
          awaitOrIgnore(() => videoRef.current!.playAsync());
          setIsPlaying(true);
        } else if (post.mediaType === "photo" && post.audio) {
          let sound = getCachedAudio(post.id);
          if (sound) {
            const status = await sound.getStatusAsync();
            const shouldReset = status.isLoaded
              ? status.positionMillis === 0
              : true;
            await playAudio(shouldReset);
          } else {
            await playAudio(true);
          }
        }
        hasAutoPlayedRef.current = true;
      } else {
        if (feedFocused) {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.pauseAsync());
            awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
            setIsPlaying(false);
          } else if (
            post.mediaType === "photo" &&
            post.audio &&
            audioRef.current
          ) {
            awaitOrIgnore(() => audioRef.current!.pauseAsync());
            awaitOrIgnore(() => audioRef.current!.setPositionAsync(0));
            setIsPlaying(false);
          }
        } else {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.pauseAsync());
            setIsPlaying(false);
          } else if (
            post.mediaType === "photo" &&
            post.audio &&
            audioRef.current
          ) {
            awaitOrIgnore(() => audioRef.current!.pauseAsync());
            setIsPlaying(false);
          }
        }
        hasAutoPlayedRef.current = false;
      }
    };

    managePlayback();
  }, [isActive, feedFocused]);

  // Handmatige play/pause
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
          await audioRef.current.pauseAsync();
          setIsPlaying(false);
          setManualPaused(true);
        } else {
          await audioRef.current.playAsync();
          setIsPlaying(true);
          setManualPaused(false);
        }
      }
    }
  };

  // Seekbar-handler
  const handleSlidingComplete = async (value: number) => {
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
  };

  // Replay
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (post.mediaType === "photo" && post.audio && audioRef.current) {
        awaitOrIgnore(() => audioRef.current!.pauseAsync());
      }
      if (post.mediaType === "video" && videoRef.current) {
        awaitOrIgnore(() => videoRef.current!.pauseAsync());
      }
    };
  }, []);

  // Log de hoogte van de post zodra deze is gerenderd
  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    console.log("Post height:", height);
  };

  return (
    <View style={styles.fullScreen}>
      {/* fullscreen background (media + blur) */}
      {post.mediaType === "video" ? (
        <Video
          source={{ uri: post.mediaUrl as string }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
        />
      ) : (
        <Image
          source={{ uri: post.mediaUrl as string }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <BlurView 
      intensity={30} 
      tint="dark" 
      style={{ position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: scale * 158,      // <-- hier stop de blur
        borderTopLeftRadius: scale * 20,
        borderTopRightRadius: scale * 20,
        zIndex: 0,
      }}
      />

      {/* ───── fade van blur naar zwart ───── */}
   <LinearGradient
     colors={["transparent", "#121212"]}
     locations={[0.5, 0.8]}   
     style={StyleSheet.absoluteFill}
   />
    
       <View style={styles.blackBottom} />
      

      {/* jouw bestaande post-container */}
      <View style={styles.postContainer} onLayout={handleLayout}>
        <Pressable onPress={handlePlayPause} style={styles.mediaContainer}>
          {/* media */}
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
            <Image
              source={{ uri: post.mediaUrl as string }}
              style={styles.media}
            />
          )}

          {/* header overlay */}
          <View style={styles.postHeaderOverlay}>
            <View style={styles.profileContainer}>
              <ProfileLink userId={post.userId}>
                <Image
                  source={{ uri: post.profileImage }}
                  style={{
                    width: scale * 25,
                    height: scale * 25,
                    borderRadius: scale * 15,
                  }}
                />
              </ProfileLink>
              <ProfileLink userId={post.userId}>
                <View style={styles.userInfo}>
                  <Text style={styles.usernameText}>{post.username}</Text>
                  <Text style={styles.displayNameText}>
                    {post.display_name} <Text style={styles.dot}>•</Text>{" "}
                    {post.role}
                  </Text>
                </View>
              </ProfileLink>
            </View>
            <View style={styles.headerTags}>
              <TouchableOpacity onPress={expandArtistTags}>
                <View style={styles.artistTagsContainerHeader}>
                  {post.artistTags?.map((tagId, index) => {
                    const foundTag = artistTags.find((t) => t.id === tagId);
                    if (!foundTag) return null;
                    const animatedMargin =
                      index === 0
                        ? 0
                        : toggleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0],
                          });
                    return (
                      <Animated.View
                        key={foundTag.id}
                        style={{ marginLeft: animatedMargin }}
                      >
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
                    const foundTag = genreTags.find((t) => t.id === tagId);
                    if (!foundTag) return null;
                    const animatedMargin =
                      index === 0
                        ? 0
                        : toggleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [2, -20],
                          });
                    return (
                      <Animated.View
                        key={foundTag.id}
                        style={{ marginLeft: animatedMargin }}
                      >
                        <GenreTag id={foundTag.id} name={foundTag.name} />
                      </Animated.View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.headerDivider} />
          </View>

          {/* controls */}
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
                onSlidingComplete={handleSlidingComplete}
              />
            </View>
            <ReplayButton onPress={handleReplay} />
          </View>

          {/* info overlay */}
          <View style={styles.infoOverlay}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text
              style={[
                styles.postDescription,
                { marginBottom: descriptionExpanded ? 10 : 0 },
              ]}
              numberOfLines={descriptionExpanded ? undefined : 2}
            >
              {post.description}
            </Text>
            <Text
              style={[styles.postDescription, styles.hiddenText]}
              onTextLayout={(e) => {
                if (e.nativeEvent.lines.length > 2 && !showSeeMore)
                  setShowSeeMore(true);
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

          {/* action buttons */}
          {currentUserId && (
            <>
              <TouchableOpacity
                style={[styles.iconButton, styles.likeButton]}
                onPress={() => {}}
              >
                <Like
                  postId={post.id}
                  userId={currentUserId}
                  receiverId={post.userId}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.saveButton]}
                onPress={() => {}}
              >
                <SaveButton postId={post.id} userId={currentUserId} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.followButton]}
                onPress={() => {}}
              >
                <Follow
                  followerId={currentUserId}
                  followingId={post.userId}
                />
              </TouchableOpacity>
            </>
          )}
        </Pressable>

        {/* timestamp */}
        <View style={styles.timestampContainer}>
          <Timestamp timestamp={post.timestamp} />
        </View>

        {/* collab button */}
        <View style={styles.collabContainer}>
          {currentUserId ? (
            <Collab
              senderId={currentUserId}
              receiverId={post.userId}
              postId={post.id}
            />
          ) : (
            <TouchableOpacity style={styles.collabDisabled} disabled>
              <Text style={styles.collabText}>LOGIN TO COLLAB!</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    position: "relative",
    width: windowWidth,
    height: windowHeight,
    backgroundColor: "#000",
  },
  blackBottom: {
  position: "absolute",
  top: scale * 800,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#121212",
  zIndex: 0,  // onder je postContainer (die zIndex 2 heeft)
  },

  postContainer: {
    backgroundColor: "transparant",
    borderRadius: scale * 15,
    padding: scale * 10,
    marginBottom: scale * 20,
    height: scale * 620,
    width: scale * 365,
    alignSelf: "center",
    transform: [{ translateY: +110 }],
    

  },
  postHeaderOverlay: {
    position: "absolute",
    marginTop: 5,
    width: "100%",
    height: scale * 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale * 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  blurBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: scale * 42,
    borderTopLeftRadius: scale * 10,
    borderTopRightRadius: scale * 10,
    borderBottomLeftRadius: scale * 10,
    borderBottomRightRadius: scale * 10,
    overflow: "hidden",
    zIndex: 0,
  },
  headerDivider: {
    position: "absolute",
    bottom: -6,
    left: scale * 10,
    right: scale * 10,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(255,255,255,0.6)",
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
    width: scale * 340,
    borderRadius: scale * 10,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: scale * 10,
    height: scale * 530,
    alignSelf: "center",
    position: "relative",
   
    
  },
  media: {
    width: "100%",
    height: "100%",
    position: "relative",
    zIndex: 0,
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
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  postDescription: {
    color: "white",
    fontSize: scale * 14,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
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
  timestampContainer: {
    marginVertical: scale * 5,
    alignItems: "center",
    bottom: scale * 8,
    opacity: 0,
  },
  actionButtonsOverlay: {
    position: "absolute",
    right: scale * 10,
    top: "50%",
    transform: [{ translateY: -((scale * 30 * 3 + scale * 8 * 2) / 2) }],
    flexDirection: "column",
    alignItems: "center",
    zIndex: 2,
  },
  iconButton: {
    marginVertical: scale * 50,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  likeButton: {
    top: scale * 170,
    right: scale * 10,
  },
  saveButton: {
    top: scale * 220,
    right: scale * 10,
  },
  followButton: {
    top: scale * 265,
    right: scale * 5,
  },
  collabContainer: {
    alignItems: "center",
    marginBottom: scale * 10,
  },
  collabDisabled: {
    opacity: 0.5,
  },
  collabText: {
    color: "#fff",
  },
  buttonWrapper: {
    margin: scale * 3,
  },
  postActions: {
    left: scale * 18,
  },
});

export default PostComponent;