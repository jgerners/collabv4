import React, { useRef, useState, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/authContext";

import ProfileLink from "./profileLink";
import Like from "./mainbuttons/like";
import Follow from "./mainbuttons/follow";
import PlayPause from "./mainbuttons/play_pause";
import Collab from "./mainbuttons/collab";
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

  const videoRef = useRef<Video | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const heartScale = useRef(new Animated.Value(0)).current;

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
    // We roepen hier niet onPlayPause meer aan, zodat de lokale state niet overschreven wordt.
  };

  // Helper: async wrapper om fouten te negeren
  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      console.error("Ignored error:", error);
    }
  };

  // useEffect voor automatische play/pause op basis van scroll (isActive)
  // We checken nu ook of de media al speelt (isPlaying) voordat we de media resetten.
  useEffect(() => {
    if (isActive) {
      // Alleen auto-play als er geen handmatige pauze is en de media nog niet speelt
      if (!manualPaused && !isPlaying) {
        if (post.mediaType === "video" && videoRef.current) {
          console.log(`Auto-playing video ${post.id} from beginning`);
          awaitOrIgnore(() => videoRef.current!.setPositionAsync(0));
          awaitOrIgnore(() => videoRef.current!.playAsync());
          setIsPlaying(true);
        } else if (post.mediaType === "photo" && post.audio) {
          const handleAudio = async () => {
            if (audioRef.current) {
              console.log(`Auto-restarting audio for post ${post.id} from beginning`);
              try {
                await audioRef.current.setPositionAsync(0);
                await audioRef.current.playAsync();
                setIsPlaying(true);
              } catch (error) {
                console.error("Error restarting audio:", error);
              }
            } else {
              console.log(`Auto-loading and playing audio for post ${post.id} from beginning`);
              try {
                const audioUri =
                  typeof post.audio === "string" ? post.audio : post.audio!.toString();
                const { sound } = await Audio.Sound.createAsync(
                  { uri: audioUri },
                  { shouldPlay: true }
                );
                audioRef.current = sound;
                setIsPlaying(true);
                sound.setOnPlaybackStatusUpdate((status) => {
                  console.log(`Playback status for post ${post.id}:`, status);
                });
              } catch (error) {
                console.error("Error auto-loading audio:", error);
              }
            }
          };
          handleAudio();
        }
      }
    } else {
      // Post is niet actief: pauzeer en reset de media, en reset de handmatige pauze
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

  // Als de post inactief wordt, reset de handmatige override zodat bij terugkomen auto-play mogelijk is
  useEffect(() => {
    if (!isActive && manualPaused) {
      setManualPaused(false);
    }
  }, [isActive]);

  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.profileContainer}>
          <ProfileLink userId={post.userId}>
            <Image 
              source={{ uri: post.profileImage }} 
              style={{ width: 30, height: 30, borderRadius: 15 }} 
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
      <Pressable onPress={handlePlayPause} style={styles.mediaContainer}>
        {post.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: post.mediaUrl as string }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false} // Wordt via logica geregeld
            isLooping
            useNativeControls
          />
        ) : (
          <Image source={{ uri: post.mediaUrl as string }} style={styles.media} />
        )}
        {/* Geef hier een no-op mee voor onPress zodat PlayPause voldoet aan de types */}
        <PlayPause isPlaying={isPlaying} onPress={() => {}} />
      </Pressable>

      {/* Post Details */}
      <View style={styles.postDetails}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postDescription} numberOfLines={descriptionExpanded ? undefined : 2}>
          {post.description}
        </Text>
        <TouchableOpacity onPress={() => setDescriptionExpanded(!descriptionExpanded)}>
          <Text style={styles.seeMoreText}>
            {descriptionExpanded ? "See less" : "See more"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {post.artistTags?.map((tagId, index) => {
          const foundTag = artistTags.find((tag) => tag.id === tagId);
          return foundTag ? (
            <ArtistTag key={index} id={foundTag.id} name={foundTag.name} image={foundTag.image} />
          ) : null;
        })}
        {post.genreTags?.map((tagId, index) => {
          const foundTag = genreTags.find((tag) => tag.id === tagId);
          return foundTag ? <GenreTag key={index} id={foundTag.id} name={foundTag.name} /> : null;
        })}
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
  usernameText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  mediaContainer: {
    width: "100%",
    aspectRatio: 1,
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  collabButtonDisabled: {},
  collabText: {},
});

export default PostComponent;
