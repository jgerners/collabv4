"use client"

import React, { useRef, useEffect } from "react"
import { View, Text, Image, Pressable, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from "react-native"
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
import Title from "./mainbuttons/title"    // <--- de nieuwe marquee bubble!
import ReplayButton from "./mainbuttons/replay"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from 'expo-haptics'
import PlayingIndicator from "./PlayingIndicator"

// 🟢  HIERONDER PROFILELINK IMPORTEER JE TOE  
import ProfileLink from "./profileLink"

const H_MARGIN = 16
const MEDIA_SIZE = 160
const INFO_WIDTH = 230
const BUBBLE_HEIGHT = 160
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
  const [showArtistDropdown, setShowArtistDropdown] = React.useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = React.useState(false)

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      setMediaModalOpen(true)
    }, 200)
  }
  const handleMediaBubblePressOut = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
  }

  useEffect(() => {
    if (!isActive) setCurrentSlide(0)
  }, [isActive])

  const handleInfoBubblePress = () => {
    setCurrentSlide((prev) => (prev === 0 ? 1 : 0))
  }

  // --- Media BUBBLE (links) ---
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

  // --- Blurred media als infobubble background (altijd stilstaand, geen controls) ---
  const renderBlurredMediaBg = () => {
    if (!post.mediaUrl) return null
    if (post.mediaType === "video") {
      return (
        <Video
          source={{ uri: post.mediaUrl as string }}
          style={styles.infoMediaBg}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          useNativeControls={false}
          isMuted={true}
          positionMillis={0}
        />
      )
    } else {
      return (
        <Image
          source={{ uri: post.mediaUrl as string }}
          style={styles.infoMediaBg}
        />
      )
    }
  }

  // --- Modal seekbar ---
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

  // --- Titel max breedte ---
  const TITLE_MAX_WIDTH = INFO_WIDTH * 0.8

  return (
    <>
      <Animated.View
        style={{
          marginHorizontal: H_MARGIN,
          marginBottom: 20,
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
          {/* MEDIA BUBBLE (links) */}
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

          {/* INFO BUBBLE (rechts) */}
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
            {/* BLURRED MEDIA BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
              {renderBlurredMediaBg()}
              <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.infoBubbleOverlay} />
            </View>
            
            {/* PLAYING INDICATOR - Rechtsboven (alleen op slide 1) */}
            {isActive && currentSlide === 0 && (
              <View style={styles.playingIndicatorContainer}>
                <PlayingIndicator isPlaying={isActive} size={10} color="#ffffff" />
              </View>
            )}
            {/* CONTENT OVERLAY */}
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
              <View style={styles.infoBubbleContent}>
                {/* Username + profielfoto naast elkaar */}
                <ProfileLink userId={post.userId}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 1 }}>
                    <Text
                      style={styles.profileUsername}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {post.username}
                    </Text>
                    <Image
                      source={{ uri: post.profileImage }}
                      style={styles.profileImage}
                    />
                  </View>
                </ProfileLink>
                <Text style={styles.profileRole} numberOfLines={1}>
                  {post.role}
                </Text>
                {/* Title max 80% breed: GEEN VIEW MEER! */}
                <Title
                  title={post.title}
                  style={{ width: TITLE_MAX_WIDTH }}
                  textStyle={styles.titleText}
                />
                {/* TAG BUBBLES (Apple-like glass buttons) */}
                <View style={styles.tagBubblesRow}>
                  {/* Artist bubble */}
                  <Pressable
                    style={styles.tagBubble}
                    onPress={() => {
                      setShowArtistDropdown((v) => !v)
                      setShowGenreDropdown(false)
                    }}
                  >
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.tagBubbleContent}>
                      <View style={styles.tagBubbleAvatars}>
                        {(post.artistTags || []).slice(0, 3).map((tagId, i) => {
                          const tag = artistTags.find((t) => t.id === tagId)
                          if (!tag) return null
                          return (
                            <Image key={tag.id} source={{ uri: tag.image }} style={[styles.smallAvatar, { marginLeft: i === 0 ? 0 : -8 }]} />
                          )
                        })}
                      </View>
                      <Text style={styles.tagTitle}>Artist <Text style={styles.tagSub}>tags</Text></Text>
                    </View>
                  </Pressable>

                  {/* Genre bubble */}
                  <Pressable
                    style={styles.tagBubble}
                    onPress={() => {
                      setShowGenreDropdown((v) => !v)
                      setShowArtistDropdown(false)
                    }}
                  >
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.tagBubbleContent}>
                      <View style={styles.tagBubbleAvatars}>
                        <View style={styles.musicIconCircle}><Ionicons name="musical-notes" size={12} color="#fff" /></View>
                        <View style={[styles.musicIconCircle, { marginLeft: -8 }]}><Ionicons name="disc" size={12} color="#fff" /></View>
                        <View style={[styles.musicIconCircle, { marginLeft: -8 }]}><Ionicons name="radio" size={12} color="#fff" /></View>
                      </View>
                      <Text style={styles.tagTitle}>Genre <Text style={styles.tagSub}>tags</Text></Text>
                    </View>
                  </Pressable>
                </View>

                {/* DROPDOWNS */}
                {showArtistDropdown && (
                  <View style={[styles.dropdown, { top: -10, transform: [{ translateY: -120 }] }]}> 
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={{ padding: 8 }}>
                      {artistTags.map((t) => (
                        <View key={t.id} style={styles.dropdownRow}>
                          <Image source={{ uri: t.image }} style={styles.dropdownAvatar} />
                          <Text style={styles.dropdownText}>{t.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {showGenreDropdown && (
                  <View style={[styles.dropdown, { top: -10, transform: [{ translateY: -120 }] }]}> 
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={{ padding: 8 }}>
                      {genreTags.map((t) => (
                        <View key={t.id} style={styles.dropdownRow}>
                          <View style={styles.dropdownIconCircle}><Ionicons name="musical-note" size={14} color="#fff" /></View>
                          <Text style={styles.dropdownText}>{t.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              {/* SLIDE 2 - Beschrijving */}
              <View style={styles.infoBubbleContentRight}>
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
                <View style={[styles.seekbarRow, { opacity: 0, marginTop: 4, width: "100%" }]} />
              </View>
            </Animated.View>
            {/* SLIDER INDICATORS */}
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
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: currentSlide === 0 ? "#fff" : "#454555",
                  marginHorizontal: 2,
                  opacity: 0.9,
                }}
              />
              <View
                style={{
                  width: 5,
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
    marginLeft: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
  },
  mediaBubbleModal: {},
  media: {
    width: MEDIA_SIZE,
    height: BUBBLE_HEIGHT,
    borderRadius: BUBBLE_RADIUS,
    resizeMode: "cover",
    backgroundColor: "#222",
  },
  modalMedia: {
    width: 340,
    height: 340,
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
  // --- INFObubble met blurred media background
  infoBubble: {
    borderRadius: 15,
    padding: 10,
    minHeight: 70,
    backgroundColor: "rgba(18,17,22,0.5)",
    overflow: "visible",
    opacity: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
    position: "relative",
    justifyContent: "flex-start",
  },
  infoMediaBg: {
    width: INFO_WIDTH,
    height: BUBBLE_HEIGHT,
    borderRadius: 15,
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 1,
  },
  infoBubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,20,0.60)",
    borderRadius: 15,
  },
  playingIndicatorContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  infoBubbleContent: {
    width: INFO_WIDTH,
    justifyContent: "flex-start",
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  infoBubbleContentRight: {
    width: INFO_WIDTH,
    justifyContent: "flex-start",
    paddingLeft: 0,
    paddingRight: 10,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  // New tag bubbles
  tagBubblesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 1,
  },
  tagBubble: {
    flex: 1,
    minWidth: 0,
    height: 22,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: "rgba(20,20,24,0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tagBubbleContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    gap: 5,
  },
  tagBubbleAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAvatar: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagTitle: {
    color: "#fff",
    fontFamily: "Jost_700Bold",
    fontSize: 9,
  },
  tagSub: {
    color: "#ffffff",
    opacity: 0.7,
    fontFamily: "Jost_300Light",
    fontSize: 8,
  },
  musicIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2A2A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 50,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  dropdownAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  dropdownText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Jost_400Regular",
  },
  dropdownIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  profileUsername: {
    color: "#fff",
    fontFamily: "Jost_600SemiBold",
    fontSize: 15,
    marginRight: 7,
    maxWidth: 90,
    marginBottom: 0,
    marginLeft: 5,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
  },
  profileImage: {
    width: 15,
    height: 15,
    borderRadius: 10,
    marginLeft: 5,
    marginBottom: 0,
    transform: [{ translateY: 1 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
    opacity: 0,
  },
  profileRole: {
    color: "#bcbcbc",
    fontFamily: "Jost_600SemiBold",
    fontSize: 10,
    marginTop: -1,
    maxWidth: 90,
    opacity: 0.8,
    marginBottom: 3,
    marginLeft: 5,
  },
  titleText: {
    color: "#fff",
    fontFamily: "Jost_300Light",
    fontSize: 12,
    marginLeft: 5,
  },
  descriptionText: {
    color: "#bcbcbc",
    fontFamily: "Jost_400Regular",
    fontSize: 9.5,
    marginBottom: 3,
  },
  // --- Tags row ---
  tagsCombinedRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
    position: "relative",
    height: 32,
    marginTop: 4,
    marginLeft: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 7,
  },
  tagsOverlapContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    height: 32,
    minWidth: 10,
  },
  artistTagBubbleOverlap: {
    position: "absolute",
    top: 0,
  },
  genreTagsInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 25,
    marginLeft: 0,
    transform: [
      { translateY: -5 },
      { translateX: -15 },
    ],
  },
  genreTagBubbleInline: {
    backgroundColor: "transparent",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
    borderWidth: 0.5,
    borderColor: "white",
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
    left: 5,
    right: H_MARGIN,
    flexDirection: "row",
    alignItems: "flex-start",
    
  },
  saveButtonContainer: {
    width: MEDIA_SIZE,
    marginRight: 5,
    transform: [{ translateX: -5 }],
  },
  collabButtonContainer: {
    width: INFO_WIDTH,
   
    
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#16141A",
    borderRadius: 10,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  modalContent: {},
  mediaContainer: {},
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
