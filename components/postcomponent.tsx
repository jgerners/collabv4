// postcomponent.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import Icon from "react-native-vector-icons/Ionicons";

// Importeer de losse componenten
import ProfilePic from "./mainbuttons/profilepic";
import Username from "./mainbuttons/username";
import Follow from "./mainbuttons/follow";
import PlayPause from "./mainbuttons/play_pause";
import Like from "./mainbuttons/like";
import Collab from "./mainbuttons/collab";
import Bookmark from "./mainbuttons/bookmark";
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";

// Importeer de dummy data en maak helperfuncties
import { dummyArtistTags, dummyGenreTags } from "../dummy_data/dummy_tags";
import { useNavigation } from '@react-navigation/native';

/* 
  ProfileLink component:
  - Dit is stap 2 en 3 samen: Het component maakt de profielinformatie klikbaar.
  - Bij een klik navigeert het naar 'UserProfile' en geeft het de userId door.
  - Hier gebruiken we post.username als identifier; vervang dit later eventueel met een echte userId.
*/
interface ProfileLinkProps {
  userId: string;
  children: React.ReactNode;
}

const ProfileLink: React.FC<ProfileLinkProps> = ({ userId, children }) => {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId })}>
      {children}
    </TouchableOpacity>
  );
};

interface PostProps {
  post: {
    id: string;
    userId: string;
    profileImage: string | number;
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
  };
  onPlayPause: (postId: string) => Promise<void>;
}

const DOUBLE_PRESS_DELAY = 300;

const PostComponent: React.FC<PostProps> = ({ post, onPlayPause }) => {
 
  const [liked, setLiked] = useState(post.isLiked);
  const [followed, setFollowed] = useState(post.isFollowed);
  const [saved, setSaved] = useState(post.isSaved);
  const [isPlaying, setIsPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const lastTap = useRef<number | null>(null);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  // Helpers om tagobjecten te vinden via ID
  const getArtistTagById = (id: string) =>
    dummyArtistTags.find((tag) => tag.id === id);
  const getGenreTagById = (id: string) =>
    dummyGenreTags.find((tag) => tag.id === id);

  const handlePlayPause = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } else if (post.mediaType === "image" && post.audio) {
      if (!audioRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          typeof post.audio === "string" ? { uri: post.audio } : post.audio,
          { shouldPlay: true, isLooping: false }
        );
        audioRef.current = sound;
      } else {
        isPlaying
          ? await audioRef.current.pauseAsync()
          : await audioRef.current.playAsync();
      }
    }
    setIsPlaying(!isPlaying);
    onPlayPause(post.id);
  };

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

  const handleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      lastTap.current = null;
      triggerHeartAnimation();
      setLiked(!liked);
    } else {
      lastTap.current = now;
      tapTimeout.current = setTimeout(() => {
        handlePlayPause();
        lastTap.current = null;
        tapTimeout.current = null;
      }, DOUBLE_PRESS_DELAY);
    }
  };

  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.profileContainer}>
          {/* Stap 3: ProfileLink wordt hier gebruikt om te navigeren naar UserProfile */}
          <ProfileLink userId={post.userId}>
            <ProfilePic source={post.profileImage} />
          </ProfileLink>
          <ProfileLink userId={post.userId}>
            <Username username={post.username} />
          </ProfileLink>
        </View>
        {/* Header Buttons: Like en Follow */}
        <View style={styles.headerButtons}>
          <Like isLiked={liked} onPress={() => setLiked(!liked)} />
          <Follow isFollowed={followed} onPress={() => setFollowed(!followed)} />
        </View>
      </View>

      {/* Media */}
      <Pressable onPress={handleTap} style={styles.mediaContainer}>
        {post.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={
              typeof post.media === "string"
                ? { uri: post.media }
                : post.media
            }
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping
          />
        ) : (
          <Image
            source={
              typeof post.media === "string"
                ? { uri: post.media }
                : post.media
            }
            style={styles.media}
          />
        )}
        <PlayPause isPlaying={isPlaying} onPress={handlePlayPause} />
      </Pressable>

      {/* Like Animation */}
      <Animated.View
        style={[
          styles.heartContainer,
          { transform: [{ scale: heartScale }] },
        ]}
      >
        <Icon name="heart" size={50} color="red" />
      </Animated.View>

      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <Icon name="time-outline" size={12} color="white" />
        <Text style={styles.timestampText}> {post.timestamp}</Text>
      </View>

      {/* Post Details: Titel en uitklapbare description */}
      <View style={styles.postDetails}>
        <Text style={styles.postTitle} numberOfLines={2} ellipsizeMode="tail">
          {post.title}
        </Text>
        <Text
          style={styles.postDescription}
          numberOfLines={descriptionExpanded ? undefined : 2}
          ellipsizeMode="tail"
        >
          {post.description}
        </Text>
        <TouchableOpacity onPress={() => setDescriptionExpanded((prev) => !prev)}>
          <Text style={styles.seeMoreText}>
            {descriptionExpanded ? "See less" : "See more"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {post.artistTags?.map((tagId, index) => {
          const foundTag = getArtistTagById(tagId);
          if (!foundTag) return null;
          return (
            <ArtistTag
              key={`artist-${index}`}
              id={foundTag.id}
              name={foundTag.name}
              image={foundTag.image}
            />
          );
        })}
        {post.genreTags?.map((tagId, index) => {
          const foundTag = getGenreTagById(tagId);
          if (!foundTag) return null;
          return (
            <GenreTag
              key={`genre-${index}`}
              id={foundTag.id}
              name={foundTag.name}
            />
          );
        })}
      </View>

      {/* Post Actions: Collab knop rechts onderin */}
      <View style={styles.postActions}>
        <Collab onPress={() => { /* Voeg hier de collab functionaliteit toe */ }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: "#222",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    height: 630,
    width: 370,
    alignSelf: "center",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    top: -5,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagsContainer: {
    borderRadius: 5,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  mediaContainer: {
    width: "100%",
    height: "60%",
    borderRadius: 10,
    overflow: "hidden",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  postDetails: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  postTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  postDescription: {
    color: "gray",
    fontSize: 14,
    marginTop: 5,
  },
  seeMoreText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  timestampText: {
    color: "white",
    fontSize: 12,
    marginLeft: 5,
  },
  heartContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Plaats de knop rechts
    bottom: 33,
  },
});

export default PostComponent;
