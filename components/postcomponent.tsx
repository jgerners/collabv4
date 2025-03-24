import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  UIManager,
  Platform,
  LayoutAnimation,
} from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/authContext";
import Slider from "@react-native-community/slider";

import ProfileLink from "./profileLink";
import Like from "./mainbuttons/like";
import Follow from "./mainbuttons/follow";
import PlayPause from "./mainbuttons/play_pause";
import Collab from "./mainbuttons/collab";
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";

// Activeer LayoutAnimation op Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Bereken de schaalfactor op basis van een basisbreedte van 370
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
  onPlayPause: (postId: string) => Promise<void>;
  artistTags: ArtistTagData[];
  genreTags: GenreTagData[];
  isActive: boolean; // Geeft aan of de post via scroll automatisch moet afspelen
}

const PostComponent: React.FC<PostProps> = ({
  post,
  isActive,
  onPlayPause,
  artistTags,
  genreTags,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [liked, setLiked] = useState(post.isLiked);
  const [followed, setFollowed] = useState(post.isFollowed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  // Geeft aan of de gebruiker handmatig gepauzeerd heeft
  const [manualPaused, setManualPaused] = useState(false);

  // Bepaalt of de beschrijving meer dan 2 regels heeft
  const [showSeeMore, setShowSeeMore] = useState(false);

  const videoRef = useRef<Video | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const heartScale = useRef(new Animated.Value(0)).current;

  // Deze state bepaalt of de seekbar zichtbaar is
  const [showSlider, setShowSlider] = useState(false);
  // Een Animated.Value voor de opacity van de seekbar
  const sliderOpacity = useRef(new Animated.Value(0)).current;
  // Houdt de totale duur van de media bij
  const [duration, setDuration] = useState(0);
  // Houdt de huidige positie (in millis) bij
  const [currentTime, setCurrentTime] = useState(0);

  // Handmatige play/pause functie (wanneer de gebruiker tikt)
  const handlePlayPause = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        console.log(`Manually pausing video ${post.id}`);
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
        setManualPaused(true);
      } else {
        console.log(`Manually resuming video ${post.id} from current position`);
        await videoRef.current.playAsync();
        setIsPlaying(true);
        setManualPaused(false);
      }
    } else if (post.mediaType === "photo" && post.audio) {
      if (audioRef.current) {
        if (isPlaying) {
          console.log(`Manually pausing audio for post ${post.id}`);
          try {
            await audioRef.current.pauseAsync();
          } catch (error) {
            console.error("Error pausing audio:", error);
          }
          setIsPlaying(false);
          setManualPaused(true);
        } else {
          console.log(`Manually resuming audio for post ${post.id} from current position`);
          try {
            await audioRef.current.playAsync();
          } catch (error) {
            console.error("Error resuming audio:", error);
          }
          setIsPlaying(true);
          setManualPaused(false);
        }
      }
    }
  };

  // Helper: async wrapper om fouten te negeren
  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      console.error("Ignored error:", error);
    }
  };

  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis);
    }
  };

  // Functie om de seekbar te tonen
  const showSeekbar = () => {
    setShowSlider(true);
    Animated.timing(sliderOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(sliderOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowSlider(false));
    }, 3000);
  };

  // Gebruik een long press om de seekbar te tonen
  const handleMediaPress = () => {
    showSeekbar();
  };

  // Open de beschrijving en laat de container uitbreiden via LayoutAnimation
  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded(!descriptionExpanded);
  };

  // useEffect voor automatische play/pause op basis van scroll (isActive)
  useEffect(() => {
    if (isActive) {
      if (!manualPaused && !isPlaying) {
        if (post.mediaType === "video" && videoRef.current) {
          console.log(`Auto-playing video ${post.id} from beginning`);
          awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
          awaitOrIgnore(() => videoRef.current!.playAsync());
          setIsPlaying(true);
        } else if (post.mediaType === "photo" && post.audio) {
          if (!audioRef.current) {
            const handleAudio = async () => {
              console.log(`Auto-loading and playing audio for post ${post.id} from beginning`);
              try {
                const audioUri = typeof post.audio === "string" ? post.audio : post.audio!.toString();
                const { sound } = await Audio.Sound.createAsync(
                  { uri: audioUri },
                  { shouldPlay: true }
                );
                audioRef.current = sound;
                setIsPlaying(true);
                sound.setOnPlaybackStatusUpdate(updatePlaybackStatus);
              } catch (error) {
                console.error("Error auto-loading audio:", error);
              }
            };
            handleAudio();
          }
        }
      }
    } else {
      if (post.mediaType === "video" && videoRef.current) {
        console.log(`Auto-pausing video ${post.id}`);
        awaitOrIgnore(() => videoRef.current!.pauseAsync());
        awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
        setIsPlaying(false);
      } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
        console.log(`Auto-stopping and unloading audio for post ${post.id}`);
        awaitOrIgnore(() => audioRef.current!.stopAsync());
        awaitOrIgnore(() => audioRef.current!.unloadAsync());
        audioRef.current = null;
        setIsPlaying(false);
      }
      setManualPaused(false);
    }
  }, [isActive, manualPaused, isPlaying, post.mediaType, post.audio, post.id]);

  useEffect(() => {
    if (!isActive && manualPaused) {
      setManualPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (post.mediaType === "video" && videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate(updatePlaybackStatus);
    }
  }, [post.mediaType]);

  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.profileContainer}>
          <ProfileLink userId={post.userId}>
            <Image
              source={{ uri: post.profileImage }}
              style={{
                width: scale * 30,
                height: scale * 30,
                borderRadius: scale * 15,
              }}
            />
          </ProfileLink>
          <ProfileLink userId={post.userId}>
            <Text style={styles.usernameText}>{post.username}</Text>
          </ProfileLink>
        </View>
        <View style={styles.headerButtons}>
          <Like isLiked={liked} onPress={() => setLiked(!liked)} />
          <Follow isFollowed={followed} onPress={() => setFollowed(!followed)} />
        </View>
      </View>

      {/* Media */}
      <Pressable
        onPress={handlePlayPause}
        onLongPress={showSeekbar}
        style={styles.mediaContainer}
      >
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
        <PlayPause isPlaying={isPlaying} onPress={handlePlayPause} />
        <Animated.View
          style={[styles.seekbarContainer, { opacity: sliderOpacity }]}
          pointerEvents="box-none"
          onStartShouldSetResponder={() => true}
        >
          <Slider
            style={{ width: scale * 330, height: scale * 5 }}
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
        </Animated.View>
      </Pressable>

      {/* Post Details */}
      <View style={styles.postDetails}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text
          style={styles.postDescription}
          numberOfLines={descriptionExpanded ? undefined : 2}
        >
          {post.description}
        </Text>
        {/* Deze onzichtbare tekst meet het aantal regels van de volledige beschrijving */}
        <Text
          style={[
            styles.postDescription,
            { position: "absolute", opacity: 0, zIndex: -1 },
          ]}
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

      {/* Tags */}
      <View style={styles.tagsContainer}>
        <View style={styles.artistTagsContainer}>
          {post.artistTags?.map((tagId, index) => {
            const foundTag = artistTags.find((tag) => tag.id === tagId);
            return foundTag ? (
              <View key={foundTag.id} style={{ marginLeft: index === 0 ? 0 : -10 }}>
                <ArtistTag id={foundTag.id} name={foundTag.name} image={foundTag.image} />
              </View>
            ) : null;
          })}
        </View>
        <View style={styles.genreTagsContainer}>
          {post.genreTags?.map((tagId, index) => {
            const foundTag = genreTags.find((tag) => tag.id === tagId);
            return foundTag ? (
              <GenreTag key={foundTag.id} id={foundTag.id} name={foundTag.name} />
            ) : null;
          })}
        </View>
      </View>

      {/* Collab Button */}
      <View style={styles.postActions}>
        {currentUserId ? (
          <Collab senderId={currentUserId} receiverId={post.userId} postId={post.id} />
        ) : (
          <TouchableOpacity style={styles.collabButtonDisabled} disabled={true}>
            <Text style={styles.collabText}>LOGIN TO COLLAB!</Text>
          </TouchableOpacity>
        )}
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
    minHeight: scale * 580, // Gebruik minHeight zodat hij kan uitbreiden
    width: scale * 350,
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
  usernameText: {
    color: "white",
    fontSize: scale * 12,
    fontWeight: "bold",
    marginLeft: scale * 5,
  },
  mediaContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: scale * 10,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  seekbarContainer: {
    position: "absolute",
    bottom: scale * -15,
    left: "50%",
    transform: [{ translateX: -(scale * 330) / 2 }],
    paddingHorizontal: 0,
    paddingVertical: scale * 2,
    borderRadius: scale * 5,
    backgroundColor: "rgba(0, 0, 0, 0)",
  },
  slider: {
    width: "100%",
    height: scale * 5,
  },
  postDetails: {
    marginTop: scale * 10,
    paddingHorizontal: scale * 10,
  },
  postTitle: {
    color: "white",
    fontSize: scale * 18,
    fontWeight: "bold",
    right: scale * 10
  },
  postDescription: {
    color: "gray",
    fontSize: scale * 14,
    marginBottom: scale * 5,
    right: scale * 10
  },
  seeMoreText: {
    color: "white",
    fontSize: scale * 12,
    marginTop: scale * 4,
    right: scale * 10
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale * 10,
    paddingHorizontal: scale * 10,
    top: scale * 35,
    right: scale * 10
  },
  artistTagsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreTagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: scale * 20,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: scale * 10,
    left: scale * 10
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  collabButtonDisabled: {},
  collabText: {},
 
});

export default PostComponent;
