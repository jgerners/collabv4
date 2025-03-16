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
import { useNavigation } from "@react-navigation/native";

import ProfilePic from "./mainbuttons/profilepic";
import Username from "./mainbuttons/username";
import Follow from "./mainbuttons/follow";
import PlayPause from "./mainbuttons/play_pause";
import Like from "./mainbuttons/like";
import Collab from "./mainbuttons/collab";
import Bookmark from "./mainbuttons/bookmark";
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";

export interface ArtistTagData {
  id: string;
  name: string;
  image: string;
}

export interface GenreTagData {
  id: string;
  name: string;
}

interface PostData {
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
}

const DOUBLE_PRESS_DELAY = 300;

const ProfileLink: React.FC<{ userId: string; children: React.ReactNode }> = ({ userId, children }) => {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity onPress={() => navigation.navigate("UserProfile", { userId })}>
      {children}
    </TouchableOpacity>
  );
};

const PostComponent: React.FC<PostProps> = ({ post, onPlayPause, artistTags, genreTags }) => {
  const [liked, setLiked] = useState(post.isLiked);
  const [followed, setFollowed] = useState(post.isFollowed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const lastTap = useRef<number | null>(null);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  const getArtistTagById = (id: string) => artistTags.find((tag) => tag.id === id);
  const getGenreTagById = (id: string) => genreTags.find((tag) => tag.id === id);

  const handlePlayPause = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      isPlaying ? await videoRef.current.pauseAsync() : await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
    onPlayPause(post.id);
  };

  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.profileContainer}>
          <ProfileLink userId={post.userId}>
            <Image source={{ uri: post.profileImage }} style={styles.profileImage} />
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
      <Pressable onPress={handlePlayPause} style={styles.mediaContainer}>
        {post.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: post.mediaUrl as string }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping
            useNativeControls
          />
        ) : (
          <Image source={{ uri: post.mediaUrl as string }} style={styles.media} />
        )}
        <PlayPause isPlaying={isPlaying} onPress={handlePlayPause} />
      </Pressable>

      {/* Post Details */}
      <View style={styles.postDetails}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postDescription} numberOfLines={descriptionExpanded ? undefined : 2}>
          {post.description}
        </Text>
        <TouchableOpacity onPress={() => setDescriptionExpanded(!descriptionExpanded)}>
          <Text style={styles.seeMoreText}>{descriptionExpanded ? "See less" : "See more"}</Text>
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {post.artistTags?.map((tagId, index) => {
          const foundTag = getArtistTagById(tagId);
          return foundTag ? <ArtistTag key={index} id={foundTag.id} name={foundTag.name} image={foundTag.image} /> : null;
        })}
        {post.genreTags?.map((tagId, index) => {
          const foundTag = getGenreTagById(tagId);
          return foundTag ? <GenreTag key={index} id={foundTag.id} name={foundTag.name} /> : null;
        })}
      </View>

      {/* Collab Button */}
      <View style={styles.postActions}>
        <Collab onPress={() => {}} />
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
    marginBottom: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  usernameText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  mediaContainer: {
    width: "100%",
    aspectRatio: 1, // ✅ Zorgt ervoor dat de hoogte altijd gelijk is aan de breedte (vierkant)
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    marginBottom: 5,
  },
  seeMoreText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  headerButtons: {  // ✅ Dit was eerder niet gedefinieerd
    flexDirection: "row",
    alignItems: "center",
  },
});

export default PostComponent;
