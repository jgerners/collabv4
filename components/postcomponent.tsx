import React, { useRef, useState, useEffect } from "react"
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native"
import { Video, ResizeMode, Audio } from "expo-av"
import Slider from "@react-native-community/slider"
import { Svg, Path } from "react-native-svg"

import { useAuth } from "../context/authContext"
import { useLike } from "../hooks/useLike"
import { useSave } from "../hooks/useSave"
import { useFollow } from "../hooks/useFollow"
import { useUserProfile } from "../hooks/useUserProfile"
import { useFonts } from "expo-font"
import { getCachedAudio, setCachedAudio } from "../helpers/audioCache"
import { setCurrentPlayingMedia } from "../PlaybackManager"

import Collab from "./mainbuttons/collab";
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";
import Description from "./mainbuttons/description";
import Title from "./mainbuttons/title";
import ReplayButton from "./mainbuttons/replay";

// ==== DESIGN CONSTANTS ====
const H_MARGIN = 16;        // horizontale margin buitenom
const MEDIA_SIZE = 170;     // media is 170x170 (extra breed)
const INFO_WIDTH = 130;     // info bubble smaller
const BUBBLE_HEIGHT = 170;  // alles even hoog
const BUBBLE_RADIUS = 16;

export interface ArtistTagData {
  id: string
  name: string
  image: string
}

export interface GenreTagData {
  id: string
  name: string
}

export interface PostData {
  id: string
  userId: string
  profileImage: string
  username: string
  display_name: string
  role: string
  media: string | number
  mediaUrl?: string | number
  mediaType?: "image" | "video" | "photo"
  audio?: string | number
  title: string
  description: string
  artistTags?: string[]
  genreTags: string[]
  like_count: number
  save_count: number
  follower_count: number
  timestamp: string
  isLiked: boolean
  isFollowed: boolean
  isSaved: boolean
  isPlaying?: boolean
}

interface PostProps {
  post: PostData
  artistTags: ArtistTagData[]
  genreTags: GenreTagData[]
  isActive: boolean
  feedFocused: boolean
  withinPreloadRange: boolean
  expanded: boolean
  onExpand: () => void
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

const PostComponent: React.FC<PostProps> = ({
  post,
  artistTags,
  genreTags,
  isActive,
  feedFocused,
  withinPreloadRange,
  expanded,
  onExpand
}) => {
  const { user } = useAuth()
  const currentUserId = user?.id
  const { liked, likeCount, toggleLike } = useLike({ userId: currentUserId!, postId: post.id, receiverId: post.userId, initialCount: post.like_count });
  const { saved, toggleSave } = useSave({ userId: currentUserId!, postId: post.id, initialCount: post.save_count });
  const { isFollowing, toggleFollow } = useFollow({ followerId: currentUserId!, followingId: post.userId, initialCount: post.follower_count });
  const { profile } = useUserProfile(post.userId)

  const [fontsLoaded] = useFonts({
    "Manrope": require("../assets/fonts/Manrope-VariableFont_wght.ttf"),
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const videoRef = useRef<Video | null>(null)
  const audioRef = useRef<Audio.Sound | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [animatedTime, setAnimatedTime] = useState(0);

  const awaitOrIgnore = async (fn: () => Promise<any>) => { try { await fn() } catch (error) {} }
  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis)
      setAnimatedTime(status.positionMillis)
      setDuration(status.durationMillis)
    }
  }

  const playAudio = async (reset = true) => {
    setAudioLoading(true)
    try {
      let sound = getCachedAudio(post.id)
      const audioUri = typeof post.audio === "string" ? post.audio : post.audio!.toString()
      if (sound) {
        const status = await sound.getStatusAsync()
        if (!status.isLoaded) {
          const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
          sound = newSound
          setCachedAudio(post.id, sound)
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus)
        } else {
          if (reset) await sound.setPositionAsync(0)
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus)
          await sound.playAsync()
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
        sound = newSound
        setCachedAudio(post.id, sound)
        sound.setOnPlaybackStatusUpdate(updatePlaybackStatus)
      }
      audioRef.current = sound
      setIsPlaying(true)
    } catch (error) { console.error("Fout bij audio:", error) }
    setAudioLoading(false)
  }

  useEffect(() => {
    if (post.mediaType === "video" && videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate(updatePlaybackStatus)
    }
  }, [post.mediaType])

  const hasAutoPlayedRef = useRef(false)
  useEffect(() => {
    const managePlayback = async () => {
      if (isActive && feedFocused) {
        if (post.mediaType === "video" && videoRef.current) {
          await setCurrentPlayingMedia(videoRef.current)
          awaitOrIgnore(() => videoRef.current!.playAsync())
          setIsPlaying(true)
          setManualPaused(false)
        } else if (post.mediaType === "photo" && post.audio) {
          await playAudio(true)
          setManualPaused(false)
        }
        hasAutoPlayedRef.current = true
      } else {
        if (feedFocused) {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.pauseAsync())
            awaitOrIgnore(() => videoRef.current!.setPositionAsync(0))
            setIsPlaying(false)
            setManualPaused(false)
          } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
            awaitOrIgnore(() => audioRef.current!.pauseAsync())
            awaitOrIgnore(() => audioRef.current!.setPositionAsync(0))
            setIsPlaying(false)
            setManualPaused(false)
          }
        } else {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.pauseAsync())
            setIsPlaying(false)
            setManualPaused(false)
          } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
            awaitOrIgnore(() => audioRef.current!.pauseAsync())
            setIsPlaying(false)
            setManualPaused(false)
          }
        }
        hasAutoPlayedRef.current = false
      }
    }
    managePlayback()
  }, [isActive, feedFocused])

  const handleExpandAndPlay = async () => {
    onExpand();
    await handlePlayPause();
  }

  const handlePlayPause = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync()
        setIsPlaying(false)
        setManualPaused(true)
      } else {
        await videoRef.current.playAsync()
        setIsPlaying(true)
        setManualPaused(false)
      }
    } else if (post.mediaType === "photo" && post.audio) {
      if (audioRef.current) {
        if (isPlaying) {
          await audioRef.current.pauseAsync()
          setIsPlaying(false)
          setManualPaused(true)
        } else {
          await audioRef.current.playAsync()
          setIsPlaying(true)
          setManualPaused(false)
        }
      }
    }
  }

  const handleSlidingComplete = async (value: number) => {
    const newPosition = value * duration
    setAnimatedTime(newPosition)
    if (post.mediaType === "video" && videoRef.current) {
      await videoRef.current.setPositionAsync(newPosition)
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      await audioRef.current.setPositionAsync(newPosition)
      const status = await audioRef.current.getStatusAsync()
      if (status.isLoaded && !status.isPlaying) {
        await audioRef.current.playAsync()
        setIsPlaying(true)
      }
    }
  }

  const handleReplay = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      awaitOrIgnore(() => videoRef.current!.setPositionAsync(0))
      awaitOrIgnore(() => videoRef.current!.playAsync())
      setIsPlaying(true)
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      awaitOrIgnore(() => audioRef.current!.setPositionAsync(0))
      awaitOrIgnore(() => audioRef.current!.playAsync())
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      if (post.mediaType === "photo" && post.audio && audioRef.current) {
        awaitOrIgnore(() => audioRef.current!.pauseAsync())
      }
      if (post.mediaType === "video" && videoRef.current) {
        awaitOrIgnore(() => videoRef.current!.pauseAsync())
      }
    }
  }, [])

  useEffect(() => {
    let raf: number | undefined;
    let prev = Date.now();
    function animate() {
      if (isPlaying && duration > 0) {
        const now = performance.now();
        const elapsed = now - prev;
        prev = now;
        setAnimatedTime((prevTime) => {
          let next = prevTime + elapsed;
          return next > duration ? duration : next;
        });
        raf = requestAnimationFrame(animate);
      }
    }
    if (isPlaying) {
      prev = performance.now();
      raf = requestAnimationFrame(animate);
    }
    return () => { if (raf !== undefined) cancelAnimationFrame(raf); };
  }, [isPlaying, duration]);

  return (
    <View style={{ marginBottom: expanded ? 28 : 16, marginHorizontal: H_MARGIN }}>
      <View style={styles.rowPressable}>
        {/* MEDIA BUBBLE */}
        <Pressable
          style={[styles.mediaBubble, { width: MEDIA_SIZE, height: BUBBLE_HEIGHT }]}
          onPress={handleExpandAndPlay}
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
          <TouchableOpacity
            style={styles.playIconOverlay}
            onPress={handlePlayPause}
            activeOpacity={0.7}
          >
            {!isPlaying ? (
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path d="M8 5.14v14l11-7-11-7z" fill="white" />
              </Svg>
            ) : (
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="white" />
              </Svg>
            )}
          </TouchableOpacity>
        </Pressable>
        {/* INFO BUBBLE */}
        <Pressable
          style={[
            styles.infoBubble,
            {
              width: INFO_WIDTH,
              height: BUBBLE_HEIGHT,
              backgroundColor: "#101014",
              justifyContent: "flex-start",
            }
          ]}
          onPress={handleExpandAndPlay}
        >
          <View style={{ flex: 1, justifyContent: "flex-start" }}>
            {/* Username + profielfoto rechts */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Text style={styles.profileUsername} numberOfLines={1} ellipsizeMode="tail">{post.username}</Text>
              <Image source={{ uri: post.profileImage }} style={styles.profilePic} />
            </View>
            {/* Role */}
            <Text style={styles.roleText} numberOfLines={1}>{post.role}</Text>
            {/* Titel */}
            <Title
              title={post.title}
              maxLines={2}
              textStyle={styles.titleText}
            />
            {/* Beschrijving */}
            <Description description={post.description} maxLines={2} textStyle={styles.descriptionText} />
            {/* TAGS */}
            <View style={{ minHeight: 22, marginTop: 2, marginBottom: 8 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsScrollRow}
                style={{ marginBottom: 0 }}
              >
                {post.artistTags?.map((tagId) => {
                  const tag = artistTags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <View key={tag.id} style={styles.artistTagBubble}>
                      <ArtistTag id={tag.id} name={tag.name} image={tag.image} />
                    </View>
                  );
                })}
                {post.genreTags.map((tagId) => {
                  const tag = genreTags.find(t => t.id === tagId);
                  return tag ? (
                    <View key={tag.id} style={styles.tagBubble}>
                      <Text style={{ color: '#fff', fontSize: 9 }}>{tag.name}</Text>
                    </View>
                  ) : null;
                })}
              </ScrollView>
            </View>
            {/* SEEK BAR */}
            <View style={styles.seekbarRow}>
              <Text style={styles.seekbarTimeText}>{formatTime(animatedTime)}</Text>
              <Slider
                style={styles.seekbar}
                minimumValue={0}
                maximumValue={1}
                value={duration ? animatedTime / duration : 0}
                minimumTrackTintColor="#FFF"
                maximumTrackTintColor="#555"
                thumbTintColor="transparent"
                onSlidingComplete={handleSlidingComplete}
              />
              <Text style={styles.seekbarTimeText}>-{formatTime(duration - animatedTime)}</Text>
              <ReplayButton onPress={handleReplay} />
            </View>
          </View>
        </Pressable>
      </View>
      {/* UITKLAPPENDE KNOPPEN */}
      {expanded && (
        <View style={styles.expandedRow}>
          {/* Save knop */}
          <View style={{ width: MEDIA_SIZE, alignItems: "center" }}>
            <TouchableOpacity style={styles.saveButton} onPress={toggleSave} activeOpacity={0.85}>
              <Text style={styles.saveButtonText}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>
          </View>
          {/* Collab knop */}
          <View style={{ width: INFO_WIDTH, alignItems: "center", paddingLeft: 6 }}>
            <Collab senderId={currentUserId!} receiverId={post.userId} postId={post.id} />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  rowPressable: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  mediaBubble: {
    borderRadius: BUBBLE_RADIUS,
    backgroundColor: "#191919",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    position: "relative"
  },
  media: {
    width: "100%",
    height: "100%",
    borderRadius: BUBBLE_RADIUS,
    resizeMode: "cover",
    backgroundColor: "#222",
  },
  playIconOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    zIndex: 5,
    opacity: 0.7,
  },
  infoBubble: {
    borderRadius: BUBBLE_RADIUS,
    padding: 10,
    minHeight: 70,
    backgroundColor: "#101014",
    flex: 1,
    overflow: "hidden"
  },
  profileUsername: {
    color: "#fff",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    marginRight: 8,
    maxWidth: 70
  },
  profilePic: {
    width: 20,
    height: 20,
    borderRadius: 12,
    marginLeft: 7,
  },
  roleText: {
    color: "#bbb",
    fontSize: 10,
    marginBottom: 2,
    fontFamily: "Manrope_400Regular",
  },
  titleText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 15,
  },
  descriptionText: {
    color: "#bcbcbc",
    fontSize: 9.5,
    marginBottom: 3,
  },
  tagsScrollRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 20,
  },
  artistTagBubble: {
    marginRight: 5,
  },
  tagBubble: {
    backgroundColor: "#39393b",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  seekbarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  seekbar: {
    flex: 1,
    marginHorizontal: 5,
    maxWidth: 54,
    minWidth: 35,
    height: 10,
  },
  seekbarTimeText: {
    color: "white",
    fontSize: 9.5,
    fontFamily: "Manrope_400Regular",
    width: 25,
    textAlign: "center",
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    width: "100%",
    paddingHorizontal: 2,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#21212A",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
})

export default PostComponent;
