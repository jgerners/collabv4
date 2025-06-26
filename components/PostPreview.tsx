import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import { Svg, Path } from "react-native-svg";
import { BlurView } from "expo-blur";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SharedElement } from 'react-navigation-shared-element'; // <--- Toegevoegd
import type { PostData } from "./postcomponent";

const CARD_MARGIN = 8;
const { width: windowWidth } = Dimensions.get("window");
const cardWidth = (windowWidth - CARD_MARGIN * 3) / 2 - 2 ; // Iets smaller
const cardHeight = cardWidth * 1.74;

type Props = {
  post: PostData;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onPause: (id: string) => void;
  onSeePost: (id: string) => void;
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

export const PostPreview: React.FC<Props> = ({
  post,
  isPlaying,
  onPlay,
  onPause,
  onSeePost,
}) => {
  const videoRef = useRef<Video>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  const isVideo = post.mediaType === "video";

  useEffect(() => {
    let isMounted = true;
    // VIDEO
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.setStatusAsync({ shouldPlay: true, isMuted: false, positionMillis: 0 });
      } else {
        videoRef.current.setStatusAsync({ shouldPlay: true, isMuted: true });
      }
    }
    // AUDIO
    const manageAudio = async () => {
      if (post.mediaType === "photo" && post.audio) {
        if (isPlaying) {
          if (audioRef.current) {
            await audioRef.current.unloadAsync();
            audioRef.current = null;
          }
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: typeof post.audio === "string" ? post.audio : String(post.audio) },
              { shouldPlay: true }
            );
            if (isMounted) audioRef.current = sound;
          } catch {}
        } else {
          if (audioRef.current) {
            await audioRef.current.stopAsync();
            await audioRef.current.unloadAsync();
            audioRef.current = null;
          }
        }
      }
    };
    manageAudio();
    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.stopAsync();
        audioRef.current.unloadAsync();
        audioRef.current = null;
      }
    };
  }, [isPlaying, post.mediaType, post.audio]);

  const handlePress = () => {
    if (isPlaying) {
      onPause(post.id);
    } else {
      onPlay(post.id);
    }
  };

  return (
    <View style={styles.shadowWrapper}>
      <View style={styles.card}>
        <Pressable
          style={{ flex: 1 }}
          onPress={handlePress}
        >
          {/* Media Container */}
          <View style={styles.mediaWrapper}>
            <SharedElement id={`media-${post.id}`}> {/* <--- Nieuw */}
              {isVideo ? (
                <Video
                  ref={videoRef}
                  source={{ uri: post.mediaUrl as string }}
                  style={styles.media}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted={!isPlaying}
                  useNativeControls={false}
                />
              ) : (
                <Image
                  source={{ uri: post.mediaUrl as string }}
                  style={styles.media}
                  resizeMode="cover"
                />
              )}
            </SharedElement>

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />

            {/* Date Badge - alleen wanneer NIET playing */}
            {!isPlaying && (
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{formatDate(post.timestamp)}</Text>
              </View>
            )}

            {/* Play/Pause Button - alleen wanneer NIET playing */}
            {!isPlaying && (
              <View style={styles.centerButton}>
                <TouchableOpacity
                  style={styles.circleButton}
                  activeOpacity={0.77}
                  onPress={handlePress}
                >
                  <MaterialCommunityIcons name="play" size={38} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* See Post - midden onderin met witte outline */}
            {isPlaying && (
              <TouchableOpacity
                style={styles.seePostBubble}
                activeOpacity={0.85}
                onPress={() => onSeePost(post.id)}
              >
                <Text style={styles.seePostText}>See post</Text>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke="#fff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}

            {/* Bottom Info - alleen wanneer NIET playing */}
            {!isPlaying && (
              <View style={styles.bottomInfoOverlay}>
                <View style={styles.bottomBarContent}>
                  <View style={styles.infoCol}>
                    <Text style={styles.roleText}>{post.role}</Text>
                    <Text style={styles.usernameText}>@{post.username}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    marginRight: 0,
    marginBottom: CARD_MARGIN,
    borderRadius: 16,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: "black",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  mediaWrapper: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#161616",
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#161616",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    zIndex: 1,
  },
  dateContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 8,
    opacity: 0,
  },
  dateText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Manrope",
    fontWeight: "600",
    letterSpacing: 0.1,
    opacity: 0,
  },
  centerButton: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -22 }, { translateY: -22 }],
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
    zIndex: 5,
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
    justifyContent: "flex-start",
  },
  roleText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Manrope-Bold",
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  usernameText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontFamily: "Manrope",
    letterSpacing: 0.1,
    fontWeight: "500",
  },
  seePostBubble: {
    position: "absolute",
    left: "50%",
    bottom: 16,
    transform: [{ translateX: -50 }],
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    zIndex: 10,
  },
  seePostText: {
    color: "#fff",
    fontFamily: "Manrope",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 8,
  },
});

export default PostPreview;
