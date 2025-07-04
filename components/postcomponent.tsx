"use client"

import React, { useRef, useEffect } from "react"
import { View, Text, Image, Pressable, StyleSheet, TouchableOpacity, ScrollView, Modal, Vibration, Animated, Easing } from "react-native"
import { Video, ResizeMode, Audio } from "expo-av"
import Slider from "@react-native-community/slider"
import { Play, Pause, Bookmark } from "lucide-react-native"
import { useAuth } from "../context/authContext"
import { useLike } from "../hooks/useLike"
import { useSave } from "../hooks/useSave"
import { useFollow } from "../hooks/useFollow"
import { useUserProfile } from "../hooks/useUserProfile"
import { useFonts } from "expo-font"
import { getCachedAudio, setCachedAudio } from "../helpers/audioCache"
import { setCurrentPlayingMedia } from "../PlaybackManager"
import Collab from "./mainbuttons/collab"
import ArtistTag from "./mainbuttons/tags/artist_tags"
import Title from "./mainbuttons/title"
import ReplayButton from "./mainbuttons/replay"
import { BlurView } from "expo-blur" // <-- Blur import

const H_MARGIN = 16
const MEDIA_SIZE = 140
const INFO_WIDTH = 235
const BUBBLE_HEIGHT = 140
const BUBBLE_RADIUS = 12

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
  activePostId: string | null
  setActivePostId: (id: string | null) => void
  isAfterActivePost?: boolean
  activePostChanged?: boolean
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
  activePostId,
  setActivePostId,
  isAfterActivePost = false,
  activePostChanged = false,
}) => {
  const { user } = useAuth()
  const currentUserId = user?.id
  const { liked, likeCount, toggleLike } = useLike({
    userId: currentUserId!,
    postId: post.id,
    receiverId: post.userId,
    initialCount: post.like_count,
  })
  const { saved, toggleSave } = useSave({ userId: currentUserId!, postId: post.id, initialCount: post.save_count })
  const { isFollowing, toggleFollow } = useFollow({
    followerId: currentUserId!,
    followingId: post.userId,
    initialCount: post.follower_count,
  })
  const { profile } = useUserProfile(post.userId)
  const [fontsLoaded] = useFonts({
    Manrope: require("../assets/fonts/Manrope-VariableFont_wght.ttf"),
  })

  const isActive = activePostId === post.id
  // Eén ref en state voor de actieve media (werkt voor bubble en modal)
  const videoRef = useRef<Video | null>(null)
  const audioRef = useRef<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [audioLoading, setAudioLoading] = React.useState(false)
  const [duration, setDuration] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [animatedTime, setAnimatedTime] = React.useState(0)

  // Modal state
  const [isMediaModalOpen, setMediaModalOpen] = React.useState(false)

  // Animatie waardes
  const ANIMATION_DURATION = 300
  const ANIMATION_EASING = Easing.bezier(0.25, 0.46, 0.45, 0.94)
  const EXIT_DURATION = 250
  const EXIT_EASING = Easing.bezier(0.55, 0.06, 0.68, 0.19)

  const slideAnimation = useRef(new Animated.Value(0)).current
  const opacityAnimation = useRef(new Animated.Value(0)).current
  const pushDownAnimation = useRef(new Animated.Value(0)).current

  // Slide bubble state
  const [currentSlide, setCurrentSlide] = React.useState(0)

  useEffect(() => {
    if (isAfterActivePost) {
      Animated.timing(pushDownAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(pushDownAnimation, {
        toValue: 0,
        duration: EXIT_DURATION,
        easing: EXIT_EASING,
        useNativeDriver: true,
      }).start()
    }
  }, [isAfterActivePost])

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: ANIMATION_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: ANIMATION_DURATION + 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: EXIT_DURATION,
          easing: EXIT_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0,
          duration: EXIT_DURATION - 50,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isActive])

  useEffect(() => {
    const playMedia = async () => {
      if (post.mediaType === "video" && videoRef.current) {
        await setCurrentPlayingMedia(videoRef.current)
        await videoRef.current.playAsync()
        setIsPlaying(true)
      } else if (post.mediaType === "photo" && post.audio) {
        setAudioLoading(true)
        let sound = getCachedAudio(post.id)
        const audioUri = typeof post.audio === "string" ? post.audio : post.audio!.toString()
        if (sound) {
          const status = await sound.getStatusAsync()
          if (!status.isLoaded) {
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
            sound = newSound
            setCachedAudio(post.id, sound)
          } else {
            await sound.setPositionAsync(0)
          }
          await sound.playAsync()
        } else {
          const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
          sound = newSound
          setCachedAudio(post.id, sound)
        }
        audioRef.current = sound
        setIsPlaying(true)
        setAudioLoading(false)
      }
    }

    const pauseMedia = async () => {
      if (post.mediaType === "video" && videoRef.current) {
        await videoRef.current.pauseAsync()
        setIsPlaying(false)
      } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
        await audioRef.current.pauseAsync()
        setIsPlaying(false)
      }
    }

    if (isActive) {
      playMedia()
    } else {
      pauseMedia()
    }
  }, [isActive])

  useEffect(() => {
    if (post.mediaType === "video" && videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis)
          setAnimatedTime(status.positionMillis)
          setDuration(status.durationMillis)
          setIsPlaying(!!status.isPlaying)
        }
      })
    }

    if (post.mediaType === "photo" && audioRef.current) {
      audioRef.current.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis)
          setAnimatedTime(status.positionMillis)
          setDuration(status.durationMillis)
          setIsPlaying(!!status.isPlaying)
        }
      })
    }
  }, [post.mediaType])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pauseAsync()
      }
      if (videoRef.current) {
        videoRef.current.pauseAsync()
      }
    }
  }, [])

  const handleSlidingComplete = async (value: number) => {
    const newPosition = value * duration
    setAnimatedTime(newPosition)
    if (post.mediaType === "video" && videoRef.current) {
      await videoRef.current.setPositionAsync(newPosition)
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      await audioRef.current.setPositionAsync(newPosition)
    }
  }

  const handleReplay = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      await videoRef.current.setPositionAsync(0)
      await videoRef.current.playAsync()
      setIsPlaying(true)
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      await audioRef.current.setPositionAsync(0)
      await audioRef.current.playAsync()
      setIsPlaying(true)
    }
  }

  const handleMediaBubblePress = () => {
    if (isActive) {
      setActivePostId(null)
    } else {
      setActivePostId(post.id)
    }
  }

  // Long press handlers voor tril + modal
  const longPressTimeout = useRef<number | null>(null)
  const handleMediaBubblePressIn = () => {
    longPressTimeout.current = setTimeout(() => {
      Vibration.vibrate(30)
      setMediaModalOpen(true)
    }, 600) as unknown as number
  }
  const handleMediaBubblePressOut = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
  }

  // Reset slide als de post sluit
  useEffect(() => {
    if (!isActive) setCurrentSlide(0)
  }, [isActive])

  // Slide click handler
  const handleInfoBubblePress = () => {
    setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
  }

  // Render media: bubble of modal (nooit tegelijk video!)
  const renderMedia = (isModal = false) => {
    const style = isModal ? styles.modalMedia : styles.media
    if (post.mediaType === "video") {
      return (
        <Video
          ref={videoRef}
          source={{ uri: post.mediaUrl as string }}
          style={style}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          useNativeControls={false}
        />
      )
    } else {
      return (
        <Image
          source={{ uri: post.mediaUrl as string }}
          style={style}
        />
      )
    }
  }

  // Seekbar apart renderen
  const renderModalSeekbar = () => (
    <View style={styles.seekbarModalRow} pointerEvents="box-none">
      <Text style={styles.seekbarTimeText}>{formatTime(animatedTime)}</Text>
      <Slider
        style={{ flex: 1, marginHorizontal: 8 }}
        minimumValue={0}
        maximumValue={1}
        value={duration ? animatedTime / duration : 0}
        minimumTrackTintColor="#FFF"
        maximumTrackTintColor="#555"
        thumbTintColor="#fff"
        onSlidingComplete={handleSlidingComplete}
      />
      <Text style={styles.seekbarTimeText}>-{formatTime(duration - animatedTime)}</Text>
      <ReplayButton onPress={handleReplay} />
    </View>
  )

  // MODAL SLUITEN: buiten media/seekbar klikken
  const modalPressHandler = (evt: any) => {
    // Only close if the target is the overlay (not a child)
    if (evt.target === evt.currentTarget) setMediaModalOpen(false)
  }

  return (
    <>
      <Animated.View
        style={{
          marginHorizontal: H_MARGIN,
          marginBottom: 30,
          transform: [
            {
              translateY: pushDownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
            },
          ],
        }}
      >
        <View style={styles.rowPressable}>
          {/* MEDIA BUBBLE (alleen als modal niet open is) */}
          {!isMediaModalOpen && (
            <Pressable
              style={[styles.mediaBubble, { width: MEDIA_SIZE, height: BUBBLE_HEIGHT }]}
              onPress={handleMediaBubblePress}
              onPressIn={handleMediaBubblePressIn}
              onPressOut={handleMediaBubblePressOut}
            >
              {renderMedia()}
              <View style={styles.playIconOverlay}>
                {!isActive ? <Play size={30} color="white" fill="white" /> : <Pause size={30} color="white" fill="white" />}
              </View>
            </Pressable>
          )}

          {/* INFO BUBBLE (2 slides, click only) */}
          <Pressable
            style={[
              styles.infoBubble,
              {
                width: INFO_WIDTH,
                height: BUBBLE_HEIGHT,
                justifyContent: "flex-start",
                paddingBottom: 18,
                overflow: "hidden",
              },
            ]}
            onPress={handleInfoBubblePress}
          >
            <Animated.View
              style={{
                flexDirection: "row",
                width: INFO_WIDTH * 2,
                height: "100%",
                transform: [
                  {
                    translateX: currentSlide === 0 ? 0 : -INFO_WIDTH,
                  },
                ],
                transitionDuration: "200ms",
              }}
            >
              {/* SLIDE 1 */}
              <View style={{ width: INFO_WIDTH, justifyContent: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                  <Text style={styles.profileUsername} numberOfLines={1} ellipsizeMode="tail">
                    {post.username}
                  </Text>
                  <Text
                    style={{
                      color: "#888",
                      fontSize: 10,
                      fontFamily: "Jost_600SemiBold",
                      marginLeft: 7,
                    }}
                  >
                    {post.role}
                  </Text>
                </View>
                <Title title={post.title} maxLines={2} textStyle={styles.titleText} />
                <View style={{ minHeight: 22, marginTop: 2, marginBottom: 8 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagsScrollRow}
                    style={{ marginBottom: 0 }}
                  >
                    {(post.artistTags || []).map((tagId) => {
                      const tag = artistTags.find((t) => t.id === tagId)
                      if (!tag) return null
                      return (
                        <View key={tag.id} style={styles.artistTagBubble}>
                          <ArtistTag id={tag.id} name={tag.name} image={tag.image} />
                        </View>
                      )
                    })}
                    {(post.genreTags || []).map((tagId) => {
                      const tag = genreTags.find((t) => t.id === tagId)
                      return tag ? (
                        <View key={tag.id} style={styles.tagBubble}>
                          <Text style={{ color: "#fff", fontSize: 9 }}>{tag.name}</Text>
                        </View>
                      ) : null
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* SLIDE 2 - Clean version zonder profile */}
              <View
                style={{
                  width: INFO_WIDTH,
                  justifyContent: "flex-start",
                  paddingLeft: 0,
                  paddingRight: 10,
                  paddingTop: 8,
                }}
              >
                {/* Beschrijving - 3 regels */}
                <Text
                  style={{
                    ...styles.descriptionText,
                    opacity: 1,
                    marginBottom: 12,
                    fontSize: 10,
                    lineHeight: 14,
                  }}
                  numberOfLines={3}
                >
                  {post.description}
                </Text>
                {/* Seekbar is hier hidden */}
                <View style={[styles.seekbarRow, { opacity: 0, marginTop: 4, width: "100%" }]} />
              </View>
            </Animated.View>

            {/* INDICATORS */}
            <View
              style={{
                position: "absolute",
                bottom: 5,
                left: 0,
                width: "100%",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                pointerEvents: "none",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: currentSlide === 0 ? "#fff" : "#454555",
                  marginHorizontal: 2,
                  opacity: 0.9,
                }}
              />
              <View
                style={{
                  width: 16,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: currentSlide === 1 ? "#fff" : "#454555",
                  marginHorizontal: 2,
                  opacity: 0.9,
                }}
              />
            </View>
          </Pressable>
        </View>

        {/* UITKLAPPENDE KNOPPEN */}
        <Animated.View
          style={[
            styles.expandedRow,
            {
              opacity: opacityAnimation,
              transform: [
                {
                  translateY: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={isActive ? "auto" : "none"}
        >
          {/* Save knop */}
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={toggleSave} activeOpacity={0.85}>
              <Bookmark
                size={18}
                color={saved ? "#48f" : "#fff"}
                style={{ marginRight: 7 }}
                fill={saved ? "#48f" : "none"}
              />
              <Text style={styles.saveButtonText}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>
          </View>

          {/* Collab knop */}
          <View style={{ width: INFO_WIDTH, alignItems: "center" }}>
            <Collab senderId={currentUserId!} receiverId={post.userId} postId={post.id} width={INFO_WIDTH} />
          </View>
        </Animated.View>
      </Animated.View>

      {/* MODAL */}
      <Modal
  visible={isMediaModalOpen}
  animationType="fade"
  transparent={true}
  onRequestClose={() => setMediaModalOpen(false)}
>
  <Pressable
    style={styles.modalOverlay}
    onPress={() => setMediaModalOpen(false)}
  >
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.modalContent} pointerEvents="box-none">
      {/* MEDIA */}
      <Pressable
        style={styles.mediaContainer}
        pointerEvents="box-only"
        onPress={(e) => e.stopPropagation && e.stopPropagation()}
      >
        {renderMedia(true)}
      </Pressable>
      {/* SEEKBAR */}
      <Pressable
        style={styles.seekbarModalContainer}
        pointerEvents="box-only"
        onPress={(e) => e.stopPropagation && e.stopPropagation()}
      >
        {renderModalSeekbar()}
      </Pressable>
    </View>
  </Pressable>
</Modal>

    </>
  )
}

const styles = StyleSheet.create({
  rowPressable: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  mediaBubble: {
    borderRadius: 15,
    backgroundColor: "#191919",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    position: "relative",
    marginLeft: 10,
  },
  media: {
    width: MEDIA_SIZE,
    height: BUBBLE_HEIGHT,
    borderRadius: BUBBLE_RADIUS,
    resizeMode: "cover",
    backgroundColor: "#222",
  },
  modalMedia: {
    width: 350,
    height: 500,
    borderRadius: 18,
    alignSelf: "center",
    backgroundColor: "#222",
    marginBottom: 10,
  },
  playIconOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  infoBubble: {
    borderRadius: 15,
    padding: 10,
    minHeight: 70,
    backgroundColor: "#16141A",
    overflow: "hidden",
    opacity: 1,
  },
  profileUsername: {
    color: "#fff",
    fontFamily: "Jost_800ExtraBold",
    fontSize: 15,
    marginRight: 8,
    maxWidth: 70,
  },
  titleText: {
    color: "#fff",
    fontFamily: "Jost_600SemiBold",
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 15,
  },
  descriptionText: {
    color: "#bcbcbc",
    fontFamily: "Jost_400Regular",
    fontSize: 9.5,
    marginBottom: 3,
    opacity: 0,
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
    width: "100%",
    opacity: 1,
  },
  seekbar: {
    flex: 1,
    marginHorizontal: 8,
  },
  seekbarTimeText: {
    color: "white",
    fontSize: 9.5,
    fontFamily: "Jost_300Light",
    width: 25,
    textAlign: "center",
  },
  expandedRow: {
    position: "absolute",
    top: BUBBLE_HEIGHT + 10,
    left: 10,
    right: H_MARGIN,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  saveButtonContainer: {
    width: MEDIA_SIZE,
    marginRight: 8,
  },
  collabButtonContainer: {
    width: INFO_WIDTH,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#16141A",
    borderRadius: 15,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    flexDirection: "row",
  },
  saveButtonText: {
    color: "#fff",
    fontFamily: "Jost_700Bold",
    fontSize: 12,
  },

  // MODAL styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    // Geen achtergrondkleur, geen padding
  },
  mediaContainer: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
  },
  seekbarModalContainer: {
    width: 340,
    alignItems: "center",
    marginTop: 0,
  },
  seekbarModalRow: {
    flexDirection: "row",
    alignItems: "center",
    width: 340,
    opacity: 1,
    marginTop: 0,
  },
})

export default PostComponent
